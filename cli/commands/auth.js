// const readline = require("readline")
// const updateEnv = require("../utils/updateEnv")

// module.exports = function auth() {

//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout
//   })

//   rl.question("Enter new API key: ", (key) => {

//     updateEnv("NUDGE_API_KEY", key)

//     console.log("API key updated")

//     rl.close()

//   })

// }

//Mock version

const prompts = require("prompts")
const loadUI = require("../utils/ui")

const { updateEnv } = require("../utils/envManager")

module.exports = async function auth() {

  const { chalk, ora } = await loadUI()

  const response = await prompts({
    type: "password",
    name: "apiKey",
    message: "Enter new API key"
  })

  const spinner = ora("Updating API key...").start()

  try {

    updateEnv("NUDGE_API_KEY", response.apiKey)

    spinner.succeed("API key updated")

  } catch {

    spinner.fail(chalk.red("Failed to update API key"))

  }

}