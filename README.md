# Nudge
> Your system, one nudge away.

Nudge is a lightweight, globally accessible GenAI system automation layer. Operating as an AI-powered CLI via a secure remote interface, Nudge allows you to manage files, monitor diagnostics, and execute local commands using natural language—all without the overhead of heavy remote desktop clients.

---

## The Problem
Managing a remote machine traditionally means wrestling with bulky remote desktop software, configuring complex SSH tunnels, or memorizing rigid CLI syntax. Developers need a frictionless way to interact with their systems on the go.

Nudge solves this by turning natural language into instant system execution. While most AI tools achieve this by sending your private system state and file contents to the cloud, Nudge completely rethinks the pipeline. It uses the LLM strictly as a cognitive router to understand your intent, ensuring your actual system data, files, and core outputs never leave your machine.

---

## How It Works: Skills and Tools
To achieve zero-data-leakage automation, Nudge's architecture cleanly separates its contextual awareness from its execution layer:

* **Skills:** During the initial interaction, Nudge provides the LLM with a predefined set of Skills. This sets the context so the AI understands its broader capabilities and what it can help you achieve.
* **Tools:** These are the physical code snippets, shell scripts, and native OS binaries that execute locally on your host machine.

### The Execution Flow:
1. You send a natural language command via Telegram (e.g., "Find my budget.xlsx and send it to me").
2. The LLM analyzes your intent and matches it against the available Tools.
3. The LLM returns a structured JSON payload dictating exactly which Tool to use, along with the required parameters.
4. Nudge securely calls the local Tool to perform the task natively on your machine.

### The Privacy Bridge:
Once the Tool executes, Nudge intercepts the output. Sensitive user data, such as the actual files and folder contents, are strictly isolated and never shared with the AI. Only the basic execution status or remaining non-sensitive text is sent back to the LLM to be rephrased into a conversational, user-friendly response.

Finally, Nudge combines the LLM's natural language response with your actual secure files and sends the complete package back to your Telegram interface.

---

## Key Features
* **Lightweight Architecture:** Nudge runs silently in the background with minimal overhead, replacing resource-heavy desktop clients with a streamlined, text-first interface.
* **Globally Accessible Remote CLI:** Interact with your desktop environment from anywhere. Fetch configuration files, check RAM usage, or manage processes instantly from your mobile device.
* **Absolute Data Privacy:** The LLM only ever sees execution metadata and status texts. Your actual files, folder contents, and personal data remain strictly on your local machine and are routed directly to your secure chat.
* **Guardrailed Execution:** Commands are categorized by severity. Destructive terminal commands (Severity 4 & 5) are intercepted and require explicit manual confirmation before execution.
* **Strict Access Control:** Nudge rigorously validates requests against an `ALLOWED_CHAT_IDS` environment variable, silently dropping any unauthorized requests at the edge.

---

## Installation & Quick Start
Choose between our automated CLI installation (recommended) or setting up manually from the source code.

### Option A: Automated Installation (Recommended)
The Nudge CLI is the fastest way to get your automation layer running. It handles dependencies, global path routing, and secure local credential storage automatically.

#### 1. One-Line Install
Run the following script to fetch and install the Nudge CLI:

```bash
❯ curl -sL [https://raw.githubusercontent.com/Rajatt09/Hackdata-2026/main/install.sh](https://raw.githubusercontent.com/Rajatt09/Hackdata-2026/main/install.sh) | bash

● Fetching Nudge automation layer...
✔ Download complete.
● Configuring local environment...
✔ Nudge CLI installed successfully!
❯ Run `nudge init` to configure your agent.

```

#### 2. Initialize the Agent
Set up your environment. Security Note: Your API keys and Telegram credentials are encrypted and stored strictly on your local machine. Nudge's privacy-first architecture guarantees your credentials never leave your local vault.

```bash
❯ nudge init

? Select your Cognitive Router (LLM): Gemini Flash
? Enter your LLM API Key: *************************
? Enter your Telegram Bot Token: *************************
? Enter Allowed Chat IDs (comma-separated): 123456789
✔ Credentials stored securely in local vault.
```

#### 3. Start the Service
Launch the local agent to begin listening for remote commands.

```bash
❯ nudge start

● Initializing system agent...
● Loading Tools and Skills metadata...
✔ Nudge Automation Layer is active and listening securely.
```

## Command Reference

| Command | Description |
| :--- | :--- |
| `nudge init` | Setup wizard for LLM selection and secure local API key storage. |
| `nudge start` | Starts the local agent and remote listener. |
| `nudge status` | Checks system uptime, active LLM model, and agent health. |
| `nudge stop` | Gracefully shuts down the agent and terminates listeners. |
| `nudge model` | Hot-swap your active Cognitive Router (e.g., switch to a different LLM). |
| `nudge auth` | Update your Telegram tokens or allowed Chat IDs locally. |

### Option B: Manual Installation (From Source)
If you prefer to run Nudge locally for development or manual configuration, you can clone the repository directly.

#### 1. Clone the repository:
```bash
git clone [https://github.com/Rajatt09/Hackdata-2026.git](https://github.com/Rajatt09/Hackdata-2026.git) nudge
cd nudge
```

#### 2. Install dependencies:
```bash
npm i
```

#### 3. Configure your environment variables:
Create a .env file in the root directory and add your unique bot credentials and API keys:

```bash
BOT_TOKEN=your_telegram_bot_token_here
GEMINI_API_KEY=your_google_gemini_api_key_here
```

#### 4. Start the development server:

```bash
npm run dev
```

If you find Nudge helpful, consider giving the repository a star. Happy automating!