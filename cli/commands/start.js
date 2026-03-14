// const { loadConfig, saveConfig } = require("../config/configManager")

// module.exports = function start() {

//   const config = loadConfig()

//   if (!config) {
//     console.log("Run `nudge init` first")
//     return
//   }

//   config.active = true
//   saveConfig(config)

//   console.log("Automation activated")
// }

//Mock version

const loadUI = require("../utils/ui")
const delay = require("../utils/delay")
const { updateState } = require("../utils/stateManager")

module.exports = async function start() {

  const { chalk, ora } = await loadUI()

  const spinner = ora("Starting Nudge agent...").start()

  await delay(700)
  spinner.text = "Loading configuration..."

  await delay(700)
  spinner.text = "Connecting to model..."

  await delay(1000)
  spinner.text = "Initializing tools..."

  await delay(700)

  updateState({
    running: true,
    startedAt: new Date().toISOString()
  })

  spinner.succeed(chalk.green("Nudge agent started"))

}