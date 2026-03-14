// const { loadConfig } = require("../config/configManager")

// module.exports = function status() {

//   const config = loadConfig()

//   if (!config) {
//     console.log("Not initialized")
//     return
//   }

//   console.log(`
// Status

// Active: ${config.active}
// Bot: ${config.bot}
// Model: ${config.model}
// `)
// }

//Mock version

const loadUI = require("../utils/ui")
const delay = require("../utils/delay")
const { getState } = require("../utils/stateManager")
require("dotenv").config()

module.exports = async function status() {

  const { chalk, ora } = await loadUI()

  const spinner = ora("Checking agent status...").start()

  await delay(800)

  const state = getState()

  spinner.stop()

  if (state.running) {
    console.log(chalk.green("● Nudge Agent: RUNNING"))
    console.log(chalk.gray(`Model: ${state.model}`))
  } else {
    console.log(chalk.yellow("● Nudge Agent: STOPPED"))
    console.log(chalk.gray(`Model: ${state.model || process.env.NUDGE_MODEL}`))
  }

  console.log(chalk.gray(`Started At: ${state.startedAt || "N/A"}`))

}