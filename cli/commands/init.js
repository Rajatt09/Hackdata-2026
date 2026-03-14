// const readline = require("readline")
// const updateEnv = require("../utils/updateEnv")

// module.exports = function init() {

//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
//   })

//   rl.question("Enter API Key: ", (apiKey) => {

//     rl.question("Select Model (gpt-4 / claude / gemini): ", (model) => {

//       updateEnv("NUDGE_API_KEY", apiKey)
//       updateEnv("NUDGE_MODEL", model)

//       console.log("Environment configured successfully")

//       rl.close()
//     })

//   })

// }

//Mock version
const prompts = require("prompts")
const loadUI = require("../utils/ui")

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

    updateEnv("NUDGE_MODEL", response.model)
    updateEnv("NUDGE_API_KEY", response.apiKey)

    spinner.succeed(chalk.green("Configuration saved"))

    console.log(
      chalk.gray(`Model selected: ${response.model}`)
    )

  } catch (error) {

    spinner.fail(chalk.red("Failed to save configuration"))

  }

}