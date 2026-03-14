# Telegram Bot Implementation

## Goal
Build a local Telegram bot backend to receive messages from users in the console, and allow the admin to instantly type and send replies back to the user right from the terminal.

## Architecture & Tech Stack
- **Language/Environment**: Node.js
- **Libraries**:
  - `node-telegram-bot-api` (for Telegram API interaction)
  - `dotenv` (to manage environment variables)
- **Built-in modules**:
  - `readline` (to handle standard input/output from the terminal)

## How the Application Communicates with the Bot
There are two primary ways a backend can communicate with Telegram's servers:

1. **Long Polling (`polling: true`)**:
   - The Node.js application continuously makes HTTP GET requests to the Telegram API servers asking, "Are there any new messages?"
   - If there are no messages, Telegram holds the connection open for a short time (hence "long" polling) before responding empty.
   - If a message arrives, Telegram immediately sends the data back to Node.js.
   - We will use this method because it is the easiest to develop locally on your computer. It requires no public IP address or special firewall rules, as your computer is doing the requesting.

2. **Webhooks**:
   - Instead, you tell Telegram: "Whenever you receive a message for my bot, send an HTTP POST request to *this specific URL*."
   - This approach is more efficient for production environments but requires your Node.js app to be accessible from the public internet (usually requiring a service like Ngrok for local development or deploying to a cloud server).

For this project, we will use **Long Polling** via the `node-telegram-bot-api` library.

## Components Breakdown

1. **`package.json`**:
   - Manages project dependencies and basic metadata.
2. **`.env`**:
   - Stores the secret Telegram Bot Token securely.
   - Requires adding `BOT_TOKEN=` inside.
3. **`index.js`**:
   - The main executable file.
   - Initializes the bot instance with the token from `.env`.
   - Listens on the `message` event from the bot to show incoming chats.
   - Tracks the `chatId` of the most recent sender.
   - Sets up a `readline` interface on `process.stdin` to listen for typed console input.
   - When the Enter key is pressed in the console, sends the entered text back to the tracked `chatId`.

## macOS Compatibility (New)
The system will detect the host platform and adjust behavior accordingly:
1. **Sensitive Directories**: Switch between Windows (`C:\Windows`) and macOS (`/System`, `/Library`, `/var`) paths automatically.
2. **System Roots**: Support `/` and `/Volumes` on macOS while keeping drive letter support for Windows.
3. **Zipping**: Use the native `zip -r` command on macOS instead of `tar.exe`.
4. **Path Normalization**: Ensure consistent handling of path separators across platforms.

## Updated Dependencies
- `fast-glob`: For efficient file searching.
- `@google/genai`: For LLM integration.
- `dotenv`: For environment variable management.
- `systeminformation`: For basic hardware stats.

## System Information Gathering Workflow (Proposed)
A multi-step, safety-aware workflow for handling system diagnostics and command execution.

### 1. Intent Detection
A new intent `SYSTEM_INFO` is added to the agent's classifier. This intent is triggered when users ask about battery, RAM, CPU usage, storage, network details, or active processes.

### 2. Multi-Step Execution Flow
To ensure safety, the system info workflow follows a structured interaction:
- **Phase 1: Suggestion**: The LLM suggests up to 5 relevant CLI commands based on the user's query. Each suggestion includes a description and a severity score (1-5).
- **Phase 2: Selection**: The user selects a command by its number (1-5).
- **Phase 3: Confirmation**: The bot displays the selected command's details and severity, asking the user for explicit confirmation (e.g., "yes/no", "ha/nahi").
- **Phase 4: Execution**: Only upon confirmation is the command executed natively.

### 3. Severity Scale Reference
| Score | Label | Examples | Meaning |
|-------|-------|----------|---------|
| 1 | Safe | `pmset -g batt`, `uptime` | Read-only, no side effects. |
| 2 | Low Risk | `vm_stat`, `ps aux` | Informational but detailed. |
| 3 | Moderate | `netstat`, `ifconfig` | Network/process introspection. |
| 4 | High Risk | `kill PID`, `diskutil list` | Affects running processes. |
| 5 | Dangerous | `kill -9`, `diskutil erase` | Potentially destructive. |

### 4. Implementation Details
- **Command Suggestion**: Handled by a specialized skill and a dedicated tool that uses the LLM to provide platform-specific command options.
- **State Management**: The main message handler (`index.js`) maintains a `pendingConfirmations` state machine to track the conversation status.
- **Safe Executor**: A dedicated bridge executes confirmed commands with timeouts and basic logging.
