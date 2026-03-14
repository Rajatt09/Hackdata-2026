const figlet = require("figlet")
const gradient = require("gradient-string")

function showBanner() {

  const text = figlet.textSync("NUDGE", {
    horizontalLayout: "default"
  })

  console.log(gradient.pastel.multiline(text))
  console.log("⚡ Local AI automation agent\n")

}

module.exports = showBanner