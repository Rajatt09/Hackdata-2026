// const { loadConfig, saveConfig } = require("../config/configManager")

// module.exports = function stop() {

//   const config = loadConfig()

//   config.active = false

//   saveConfig(config)

//   console.log("Automation stopped")
// }

//Mock version

const loadUI = require("../utils/ui")
const delay = require("../utils/delay")
const { updateState } = require("../utils/stateManager")

module.exports = async function stop() {

  const { chalk, ora } = await loadUI()

  const spinner = ora("Stopping Nudge agent...").start()

  await delay(700)
  spinner.text = "Closing sessions..."

  await delay(700)

  updateState({
    running: false,
    startedAt: null
  })

  spinner.succeed(chalk.yellow("Nudge agent stopped"))

}