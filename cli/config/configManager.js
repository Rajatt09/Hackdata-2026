const fs = require("fs")
const os = require("os")
const path = require("path")

const configDir = path.join(os.homedir(), ".nudge")
const configFile = path.join(configDir, "config.json")

function saveConfig(config) {

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir)
  }

  fs.writeFileSync(configFile, JSON.stringify(config, null, 2))

}

function loadConfig() {

  if (!fs.existsSync(configFile)) return null

  return JSON.parse(fs.readFileSync(configFile))

}

module.exports = { saveConfig, loadConfig }