require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { toolsMapping, toolSchemas } = require('../tools/registry');

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

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
const path = require('path');
const fileSystemSkill = fs.readFileSync(path.join(__dirname, 'skills', 'fileSystemSkill.md'), 'utf-8');
const systemInfoSkill = fs.readFileSync(path.join(__dirname, 'skills', 'systemInfoSkill.md'), 'utf-8');
const greetingSkill = fs.readFileSync(path.join(__dirname, 'skills', 'greeting_skill.md'), 'utf-8');
const unhandledQuerySkill = fs.readFileSync(path.join(__dirname, 'skills', 'unhandled_query.md'), 'utf-8');
const browserAutomationSkill = fs.readFileSync(path.join(__dirname, 'skills', 'browser_automationSkill.md'), 'utf-8');

const skillsMap = {
    'GET_FILES': { name: 'File System & Privacy', content: fileSystemSkill },
    'SYSTEM_INFO': { name: 'System Information & Diagnostics', content: systemInfoSkill },
    'GREETING': { name: 'Greeting', content: greetingSkill },
    'BROWSER_AUTOMATION': { name: 'Browser Automation', content: browserAutomationSkill },
    'OTHER': { name: 'Unhandled Query', content: unhandledQuerySkill }
};

const sysinfoToolNames = new Set([
    'getSystemInfo', 'getBatteryStatus', 'getCPUUsage', 'getMemoryUsage',
    'getNetworkInfo', 'getPublicIP', 'getRunningProcesses', 'getDiskUsage',
    'getTemperature', 'getActiveUsers', 'runSysTerminalCommands'
]);

const systemPrompt = fs.readFileSync(path.join(__dirname, 'systemPrompt.md'), 'utf-8');

const systemInstruction = systemPrompt
    .replace('${FILE_SYSTEM_SKILL_CONTENT}', fileSystemSkill)
    .replace('${TOOL_SCHEMAS}', JSON.stringify(toolSchemas, null, 2))
    .replace('${GREETING_SKILL_CONTENT}', greetingSkill)
    .replace('${UNHANDLED_QUERY_SKILL_CONTENT}', unhandledQuerySkill)
    .replace('${SYSTEM_INFO_SKILL_CONTENT}', systemInfoSkill)
    .replace('${BROWSER_AUTOMATION_SKILL_CONTENT}', browserAutomationSkill);


async function processMessage(userMessage, chatHistory = []) {
    console.log(`\n--- [Agent] Starting processMessage ---`);
    console.log(`[Input] User: "${userMessage}" | History Size: ${chatHistory.length}`);

    try {
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

        let response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: fullContents,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ functionDeclarations: toolSchemas }]
            }
        });

        console.log("[Step 1] Gemini Response (Raw):", JSON.stringify(response, null, 2));

        const parts = response?.candidates?.[0]?.content?.parts || [];
        console.log(`Parts: ${parts}`)
        const rawTextResponse = parts.filter(p => p.text).map(p => p.text).join('\n');

        let jsonResponse = null;
        let toolText = "";

        if (rawTextResponse) {
            console.log(`[Step 1] LLM Response (String):\n${rawTextResponse}`);
            try {

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
        
        if (jsonResponse?.toolCallsrequired?.functionCalls) {
            console.log(`[Step 1] Found ${jsonResponse.toolCallsrequired.functionCalls.length} tool calls in JSON.`);
            functionCalls = [...functionCalls, ...jsonResponse.toolCallsrequired.functionCalls];
        }

        console.log(`[Step 2] Tools to execute: ${functionCalls.length}`);

        let collectedFiles = [];
        let supplementalRawData = [];
        let pendingCommand = null; 
        let sysinfoToolsCalled = false; 

        for (const call of functionCalls) {
            const functionName = call.name;
            const args = call.args || {};

            if (sysinfoToolNames.has(functionName)) {
                sysinfoToolsCalled = true;
            }

            console.log(`[AI] Executing tool: ${functionName}`, args);

            if (functionName === 'runSysTerminalCommands') {
                console.log(`[AI] Intercepted runSysTerminalCommands. Storing for confirmation.`);
                pendingCommand = {
                    command: args.command || Object.values(args)[0],
                    description: toolText || 'System terminal command',
                    originalQuery: userMessage
                };
                continue; 
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

            if (result?.__isFileResponse) {
                collectedFiles.push(result);
            }

            if (typeof result === "string") {
                toolText += (toolText ? "\n\n" : "") + result;
            }

            if (result?.text) {
                toolText += (toolText ? "\n\n" : "") + result.text;
            }

            if (result?.message) {
                toolText += (toolText ? "\n\n" : "") + result.message;
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
   
            const textParts = parts.filter(p => p.text).map(p => p.text).join('\n');
            if (textParts) {
                toolText = textParts;
                console.log(`[Step 2] Direct text response found: "${toolText}"`);
            }
        }

        console.log(`[Step 2] Final tool text: ${toolText}`);
        let finalFriendlyText = toolText || "Task processed successfully.";


        if (supplementalRawData.length > 0) {
            finalFriendlyText += "\n\n" + supplementalRawData.join('\n\n');
        }

        if (jsonResponse?.intentName === 'BROWSER_AUTOMATION') {
            let appName = 'browser';
            if (functionCalls && functionCalls.length > 0) {
                const openAppCall = functionCalls.find(c => c.name === 'openApplication');
                if (openAppCall && openAppCall.args && openAppCall.args.appName) {
                    appName = openAppCall.args.appName;
                }
            }
            finalFriendlyText += `\n\nyour app ${appName} has been opened. for screen sharing please use startRemoteDesktop`;
        }

        console.log(`[Step 3] Final Friendly Text: "${finalFriendlyText}"`);

        console.log(`--- [Agent] processMessage Completed Successfully ---\n`);
        return {
            text: finalFriendlyText,
            files: collectedFiles,  
            pendingCommand: pendingCommand  
        };


    } catch (error) {
        console.error('[CRITICAL ERROR] processMessage broke:', error);
        return `Sorry, I encountered an AI error: ${error.message}`;
    }
}

module.exports = { processMessage };
