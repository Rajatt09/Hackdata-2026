
const prompts = require("prompts")
const { execSync } = require("child_process");
const loadUI = require("../utils/ui")
const path = require("path");

const models = require("../data/models.json")
const { ensureEnvFile, updateEnv } = require("../utils/envManager")

module.exports = async function init() {

  const { chalk, ora } = await loadUI()

  const modelChoices = models.models.map((model) => ({
    title: `${model.id} (${model.provider})`,
    value: model.id
  }))

  const response = await prompts([
    {
      type: "select",
      name: "model",
      message: "Select a model",
      choices: modelChoices
    },
    {
      type: "password",
      name: "apiKey",
      message: "Enter API key"
    }
  ])

  const spinner = ora("Saving configuration...").start()

  try {

    ensureEnvFile()

    updateEnv("MODEL_NAME", response.model.toString())
    updateEnv("GEMINI_API_KEY", response.apiKey)
    updateEnv("BOT_TOKEN","8106580399:AAHwyLR1OzF8ZZX4ZJtHYGZUBY_LjpTu4k0"
)

    const nudgePath = path.join(__dirname, "../../nudge");
    
    execSync("npm install", { 
      cwd: nudgePath, 
      stdio: "inherit" 
    });

    spinner.succeed(chalk.green("Configuration saved"))

    console.log(
      chalk.gray(`Model selected: ${response.model}`)
    )

  } catch (error) {

    console.log(error)
    spinner.fail(chalk.red("Failed to save configuration"))

  }

}