const fs = require("fs")
const path = require("path")

const envPath = path.join(__dirname, "../../nudge", ".env")

function updateEnv(key, value) {

  let env = ""

  if (fs.existsSync(envPath)) {
    env = fs.readFileSync(envPath, "utf8")
  }

  const regex = new RegExp(`^${key}=.*`, "m")

  if (env.match(regex)) {
    env = env.replace(regex, `${key}=${value}`)
  } else {
    env += `\n${key}=${value}`
  }

  fs.writeFileSync(envPath, env)
}

module.exports = updateEnv