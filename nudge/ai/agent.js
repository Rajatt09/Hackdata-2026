require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { toolsMapping, toolSchemas } = require('../tools/registry');

// Initialize the Google Gen AI SDK.
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

// Define the response schema for strict JSON output
const responseSchema = {
    type: "object",
    properties: {
        chat_reasoning: {
            type: "string",
            description: "50-60 word internal reasoning explaining the thought process."
        },
        isIntentCaptured: {
            type: "boolean",
            description: "True if intent was successfully identified."
        },
        intentName: {
            type: "string",
            enum: ["GREETING", "GET_FILES", "SYSTEM_INFO", "OTHER"],
            description: "The name of the identified intent."
        },
        isRequirementsNeeded: {
            type: "boolean",
            description: "True if clarification or missing arguments are needed."
        },
        list_requirements_needed: {
            type: "object",
            description: "Missing field names and their descriptions."
        },
        toolCallsrequired: {
            type: "object",
            properties: {
                functionCalls: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            args: { type: "object" }
                        },
                        required: ["name", "args"]
                    }
                }
            },
            required: ["functionCalls"]
        },
        user_response_message: {
            type: "string",
            description: "Direct, professional message for the user."
        }
    },
    required: ["chat_reasoning", "isIntentCaptured", "intentName", "isRequirementsNeeded", "toolCallsrequired", "user_response_message"]
};

const fs = require('fs');
// ... (rest of imports)
const path = require('path');
const fileSystemSkill = fs.readFileSync(path.join(__dirname, 'skills', 'fileSystemSkill.md'), 'utf-8');
const systemInfoSkill = fs.readFileSync(path.join(__dirname, 'skills', 'systemInfoSkill.md'), 'utf-8');
const greetingSkill = fs.readFileSync(path.join(__dirname, 'skills', 'greeting_skill.md'), 'utf-8');
const unhandledQuerySkill = fs.readFileSync(path.join(__dirname, 'skills', 'unhandled_query.md'), 'utf-8');

const skillsMap = {
    'GET_FILES': { name: 'File System & Privacy', content: fileSystemSkill },
    'SYSTEM_INFO': { name: 'System Information & Diagnostics', content: systemInfoSkill },
    'GREETING': { name: 'Greeting', content: greetingSkill },
    'OTHER': { name: 'Unhandled Query', content: unhandledQuerySkill }
};

// Set of sysinfo tool names for conditional skill/intent passing
const sysinfoToolNames = new Set([
    'getSystemInfo', 'getBatteryStatus', 'getCPUUsage', 'getMemoryUsage',
    'getNetworkInfo', 'getPublicIP', 'getRunningProcesses', 'getDiskUsage',
    'getTemperature', 'getActiveUsers', 'runSysTerminalCommands'
]);

const systemPrompt = fs.readFileSync(path.join(__dirname, 'systemPrompt.md'), 'utf-8');

// The system prompt contains placeholders like ${FILE_SYSTEM_SKILL_CONTENT}
const systemInstruction = systemPrompt
    .replace('${FILE_SYSTEM_SKILL_CONTENT}', fileSystemSkill)
    .replace('${TOOL_SCHEMAS}', JSON.stringify(toolSchemas, null, 2))
    .replace('${GREETING_SKILL_CONTENT}', greetingSkill)
    .replace('${UNHANDLED_QUERY_SKILL_CONTENT}', unhandledQuerySkill)
    .replace('${SYSTEM_INFO_SKILL_CONTENT}', systemInfoSkill);


/**
 * Processes a natural language message from the user, calls appropriate tools,
 * and returns a response string or a file object.
 * @param {string} userMessage The text message from the user.
 * @param {Array} chatHistory Optional array of {role, text} objects representing past conversation.
 * @returns {Promise<string|object>} The text to reply with, or a file object to send.
 */
async function processMessage(userMessage, chatHistory = []) {
    console.log(`\n--- [Agent] Starting processMessage ---`);
    console.log(`[Input] User: "${userMessage}" | History Size: ${chatHistory.length}`);

    try {
        // Format chat history as "user: ... / bot: ..." for context
        let historyText = '';
        if (chatHistory.length > 0) {
            historyText = chatHistory
                .map(entry => `${entry.role}: ${entry.text}`)
                .join('\n');
            historyText = `\n\nChat History (for reference):\n${historyText}\n\n`;
        }

        const messageWithHistory = historyText
            ? `${historyText}Current message: ${userMessage}`
            : userMessage;

        let fullContents = [{ role: 'user', parts: [{ text: messageWithHistory }] }];

        console.log(`[Step 1] Requesting Tool Selection from Gemini...`);
        // response will be:
        // which tools to call and what arguments to pass to them
        let response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: fullContents,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ functionDeclarations: toolSchemas }]
            }
        });

        console.log("[Step 1] Gemini Response (Raw):", JSON.stringify(response, null, 2));

        //--------------------------------------------------------

        const parts = response?.candidates?.[0]?.content?.parts || [];
        console.log(`Parts: ${parts}`)
        const rawTextResponse = parts.filter(p => p.text).map(p => p.text).join('\n');

        let jsonResponse = null;
        let toolText = "";

        if (rawTextResponse) {
            console.log(`[Step 1] LLM Response (String):\n${rawTextResponse}`);
            try {
                // Since we can't use responseMimeType with tools, we must clean backticks manually
                const cleanedText = rawTextResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                jsonResponse = JSON.parse(cleanedText);
                console.log("[Step 1] Successfully parsed structured JSON response.");

                if (jsonResponse.chat_reasoning) {
                    console.log(`[AI Reasoning] ${jsonResponse.chat_reasoning}`);
                }

                if (jsonResponse.user_response_message) {
                    toolText = jsonResponse.user_response_message;
                }
            } catch (e) {
                console.log("[Step 1] Response is not structured JSON or failed to parse.");
                // Check if it looks like raw JSON meant for tools
                if (rawTextResponse.includes('"functionCalls"') || rawTextResponse.includes('"{')) {
                    console.log("[Step 1] Raw text appears to be tool JSON. Not using as friendly text.");
                    toolText = "";
                } else {
                    toolText = rawTextResponse;
                }
            }
        }
        console.log(`[Step 1] Tool Text: ${toolText}`);
        let functionCalls = parts
            .filter(p => p.functionCall)
            .map(p => p.functionCall);
        console.log(`[Step 2] Function Calls: ${functionCalls}`);
        // Merge tool calls from the JSON schema if present
        if (jsonResponse?.toolCallsrequired?.functionCalls) {
            console.log(`[Step 1] Found ${jsonResponse.toolCallsrequired.functionCalls.length} tool calls in JSON.`);
            functionCalls = [...functionCalls, ...jsonResponse.toolCallsrequired.functionCalls];
        }

        console.log(`[Step 2] Tools to execute: ${functionCalls.length}`);

        let collectedFiles = [];
        let supplementalRawData = [];
        let pendingCommand = null; // For runSysTerminalCommands confirmation flow
        let sysinfoToolsCalled = false; // Track if any sysinfo tools were called

        for (const call of functionCalls) {
            const functionName = call.name;
            const args = call.args || {};

            if (sysinfoToolNames.has(functionName)) {
                sysinfoToolsCalled = true;
            }

            console.log(`[AI] Executing tool: ${functionName}`, args);

            // Intercept runSysTerminalCommands — do NOT execute directly.
            // Hand it back to index.js for inline keyboard confirmation.
            if (functionName === 'runSysTerminalCommands') {
                console.log(`[AI] Intercepted runSysTerminalCommands. Storing for confirmation.`);
                pendingCommand = {
                    command: args.command || Object.values(args)[0],
                    description: toolText || 'System terminal command',
                    originalQuery: userMessage
                };
                continue; // Skip execution, move to next tool call if any
            }

            let result;

            try {
                if (!toolsMapping[functionName]) {
                    throw new Error(`Unknown tool '${functionName}'`);
                }

                result = await toolsMapping[functionName](...Object.values(args));
                console.log(`[AI] Tool '${functionName}' result received.`);
            } catch (err) {
                console.error(`[AI] Tool '${functionName}' FAILED:`, err.message);
                result = `Tool execution failed: ${err.message}`;
            }

            // Collect files
            if (result?.__isFileResponse) {
                collectedFiles.push(result);
            }

            // Collect text
            if (typeof result === "string") {
                toolText += (toolText ? "\n\n" : "") + result;
            }

            if (result?.text) {
                toolText += (toolText ? "\n\n" : "") + result.text;
            }

            if (result?.files) {
                collectedFiles.push(...result.files);
            }

            if (result?.__isRawDataResponse && result?.paths) {
                supplementalRawData.push(result.paths.join('\n'));
            }
        }

        if (functionCalls.length > 0) {
            console.log(`[Step 2] All tools executed. Compiled text length: ${toolText.length}`);
        } else if (!jsonResponse) {
            console.log(`[Step 2] No tools were called and no JSON response found. Using raw text parts.`);
            // Fallback for cases where LLM didn't follow the JSON format but sent text anyway
            const textParts = parts.filter(p => p.text).map(p => p.text).join('\n');
            if (textParts) {
                toolText = textParts;
                console.log(`[Step 2] Direct text response found: "${toolText}"`);
            }
        }

        //--------------------------------------------------
        console.log(`[Step 2] Final tool text: ${toolText}`);
        // gemini 2 calling - sending text for refurbishing the response
        let finalFriendlyText = toolText || "Task processed successfully.";


        // Re-append raw data that bypassed refurbishment
        if (supplementalRawData.length > 0) {
            finalFriendlyText += "\n\n" + supplementalRawData.join('\n\n');
        }

        console.log(`[Step 3] Final Friendly Text: "${finalFriendlyText}"`);

        //---------------------------------------------------------

        // now res + text will be send from here 
        // in format :
        // {text: "text", files: [full path of file1, full path of file2, ...]}

        console.log(`--- [Agent] processMessage Completed Successfully ---\n`);
        return {
            text: finalFriendlyText,
            files: collectedFiles,   // this files should be an array of full paths of files to be sent
            pendingCommand: pendingCommand  // if set, index.js should show confirmation keyboard
        };


    } catch (error) {
        console.error('[CRITICAL ERROR] processMessage broke:', error);
        return `Sorry, I encountered an AI error: ${error.message}`;
    }
}

/**
 * Takes raw tool output and rewrites it in the bot's persona based on the skill guidelines.
 * @param {string} toolText Raw text from tool output or agent.
 * @param {string} intentName The name of the intent/skill to use for context.
 * @param {string} userMessage The original user message for context.
 * @returns {Promise<string>} The refurbished/friendly response.
 */


module.exports = { processMessage };
