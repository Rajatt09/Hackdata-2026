const fs = require("fs")
const path = require("path")

const envPath = path.join(__dirname, "../../nudge", ".env")

function ensureEnvFile() {

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, "")
  }

}

function updateEnv(key, value) {

  let envContent = ""

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8")
  }

  const regex = new RegExp(`^${key}=.*`, "m")

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`)
  } else {
    envContent += `\n${key}=${value}`
  }

  fs.writeFileSync(envPath, envContent.trim() + "\n")

}

module.exports = {
  ensureEnvFile,
  updateEnv
}