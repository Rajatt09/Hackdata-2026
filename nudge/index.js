require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require("fs");

const { processMessage, refurbishResponse } = require('./ai/agent');
const { runSysTerminalCommands } = require('./tools/sysinfo');

const token = process.env.BOT_TOKEN;
const allowedChatsStr = process.env.ALLOWED_CHAT_IDS || '';

const allowedChats = allowedChatsStr
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);

if (!token) {
    console.error("Error: BOT_TOKEN is not set in the .env file.");
    process.exit(1);
}
// yo
const bot = new TelegramBot(token, { polling: true });

// In-memory chat history per chat (keyed by chatId)
const chatHistories = new Map();

// Pending system commands awaiting inline keyboard confirmation (keyed by chatId)
const pendingCommands = new Map();

/* ---------------- FILE SENDER ---------------- */

async function sendFileToTelegram(bot, chatId, fileInfo) {

    if (!fileInfo || !fileInfo.__isFileResponse) return;

    const stream = fs.createReadStream(fileInfo.filePath);

    await bot.sendDocument(chatId, stream, {
        caption: `📁 File: ${fileInfo.fileName}`
    });

    console.log(`[Sent] File: ${fileInfo.fileName}`);

    if (fileInfo.__isTempFile) {
        fs.unlinkSync(fileInfo.filePath);
    }
}

/* ---------------- MAIN MESSAGE HANDLER ---------------- */

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || msg.from.username || "Unknown User";

    console.log(`\n--- [Telegram] New Message from ${name} (${chatId}) ---`);
    console.log(`[Message] "${msg.text || '[Non-text message]'}"`);

    if (!msg.text) {
        console.log(`[Info] Skipping processing: No text content in message.`);
        return;
    }

    // Authorization check omitted as per existing code...

    bot.sendChatAction(chatId, 'typing').catch(() => { });

    try {
        console.log(`[Step 1] Retrieving chat history...`);
        // Get or create chat history for this chat
        if (!chatHistories.has(chatId)) {
            console.log(`[History] Creating new history for chatId: ${chatId}`);
            chatHistories.set(chatId, []);
        }
        const history = chatHistories.get(chatId);
        console.log(`[History] Current history length: ${history.length}`);

        console.log(`[Step 2] Passing message to AI Agent...`);
        const result = await processMessage(msg.text, history);

        console.log(`[Step 3] Agent processing finished. Result type: ${typeof result}`);
        if (!result) {
            console.warn(`[Warning] Agent returned an empty result.`);
            return;
        }

        /* -------- PENDING COMMAND CONFIRMATION (Inline Keyboard) -------- */

        if (result.pendingCommand) {
            const cmd = result.pendingCommand;
            console.log(`[SysCmd] Pending command detected: "${cmd.command}"`);

            // Store the command for this chat
            pendingCommands.set(chatId, cmd);

            const confirmText =
                `Command: ${cmd.command}\n` +
                `Description: ${cmd.description}\n\n` +
                `Do you want to execute this command?`;

            await bot.sendMessage(chatId, confirmText, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Yes, Execute', callback_data: 'syscmd_yes' },
                            { text: '❌ No, Cancel', callback_data: 'syscmd_no' }
                        ]
                    ]
                }
            });
            console.log(`[SysCmd] Inline keyboard sent. Waiting for user confirmation.`);

            // Update history and return early — don't send any other text/files yet
            history.push({ role: 'user', text: msg.text });
            history.push({ role: 'bot', text: `[Awaiting confirmation] ${cmd.command}` });
            while (history.length > 20) history.shift();
            return;
        }

        /* -------- SEND TEXT -------- */

        if (result.text) {
            console.log(`[Telegram] Sending text response (length: ${result.text.length})...`);
            await bot.sendMessage(chatId, result.text);
            console.log("[Telegram] Text response sent successfully.");
        }

        /* -------- SEND FILES -------- */

        if (Array.isArray(result.files) && result.files.length > 0) {
            console.log(`[Telegram] Sending ${result.files.length} file(s)...`);
            for (const file of result.files) {
                await sendFileToTelegram(bot, chatId, file);
            }
            console.log("[Telegram] All files sent.");
        }

        /* -------- UPDATE CHAT HISTORY -------- */

        console.log(`[Step 4] Updating chat history...`);
        // Store the user message and bot response in history
        history.push({ role: 'user', text: msg.text });
        if (result.text) {
            history.push({ role: 'bot', text: result.text });
        }

        // Keep only the last 20 messages to avoid memory bloat
        while (history.length > 20) {
            history.shift();
        }
        console.log(`[History] Updated. New length: ${history.length}`);
        console.log(`--- [Telegram] Message handling completed for ${chatId} ---\n`);

    } catch (error) {
        console.error(`[CRITICAL ERROR] Failed to handle message for ${chatId}:`, error);

        bot.sendMessage(
            chatId,
            `❌ System Error:\n${error.message}`
        ).catch(console.error);
    }

});

/* ---------------- CHUNKED MESSAGE SENDER ---------------- */

async function sendMessageChunks(chatId, text) {
    const MAX_LENGTH = 4000;
    if (text.length <= MAX_LENGTH) {
        await bot.sendMessage(chatId, text);
        return;
    }

    console.log(`[Telegram] Message too long (${text.length}), sending in chunks...`);
    for (let i = 0; i < text.length; i += MAX_LENGTH) {
        const chunk = text.substring(i, i + MAX_LENGTH);
        await bot.sendMessage(chatId, chunk);
    }
}

/* ---------- INLINE KEYBOARD CALLBACK HANDLER ---------- */

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    console.log(`\n--- [Callback] Received: "${data}" from chatId: ${chatId} ---`);

    // Acknowledge the button press immediately (removes loading spinner)
    await bot.answerCallbackQuery(callbackQuery.id);

    if (data === 'syscmd_yes') {
        const cmd = pendingCommands.get(chatId);

        if (!cmd) {
            await bot.sendMessage(chatId, 'No pending command found. Please start a new request.');
            return;
        }

        console.log(`[SysCmd] User confirmed. Executing: "${cmd.command}"`);
        pendingCommands.delete(chatId);

        await bot.sendChatAction(chatId, 'typing').catch(() => {});

        try {
            const output = await runSysTerminalCommands(cmd.command);
            console.log(`[SysCmd] Execution complete. Output length: ${output.length}`);
            
            // Send raw output in chunks (no refurbishment as requested)
            const header = `Result for: \`${cmd.command}\`\n\n`;
            await sendMessageChunks(chatId, header + output);
        } catch (err) {
            console.error(`[SysCmd] Execution failed:`, err.message);
            await bot.sendMessage(chatId, `Command failed: ${err.message}`);
        }

    } else if (data === 'syscmd_no') {
        console.log(`[SysCmd] User declined. Clearing pending command.`);
        pendingCommands.delete(chatId);
        await bot.sendMessage(chatId, 'Command cancelled. Is there anything else I can help you with?');
    }
});

console.log("Nudge bot backend is running...");
console.log("Waiting for messages from authorized Telegram users...");