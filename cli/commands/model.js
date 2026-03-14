// const readline = require("readline")
// const updateEnv = require("../utils/updateEnv")

// module.exports = function model() {

//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
//   })

//   rl.question("Enter new model: ", (model) => {

//     updateEnv("NUDGE_MODEL", model)

//     console.log("Model updated")

//     rl.close()

//   })

// }

//Mock version

const prompts = require("prompts")
const loadUI = require("../utils/ui")

const models = require("../data/models.json")
const { updateEnv } = require("../utils/envManager")

module.exports = async function model() {

  const { chalk, ora } = await loadUI()

  const modelChoices = models.models.map((model) => ({
    title: `${model.id} (${model.provider})`,
    value: model.id
  }))

  const response = await prompts({
    type: "select",
    name: "model",
    message: "Select a new model",
    choices: modelChoices
  })

  const spinner = ora("Updating model...").start()

  try {

    updateEnv("NUDGE_MODEL", response.model)

    spinner.succeed(chalk.green("Model updated"))

  } catch {

    spinner.fail(chalk.red("Failed to update model"))

  }

}