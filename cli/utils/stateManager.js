const fs = require("fs")
const path = require("path")

const statePath = path.join(__dirname, "..", "state.json")

function getState() {

  if (!fs.existsSync(statePath)) {
    return {
      running: false,
      model: null,
      startedAt: null
    }
  }

  const data = fs.readFileSync(statePath, "utf8")
  return JSON.parse(data)

}

function updateState(newState) {

  const currentState = getState()

  const updatedState = {
    ...currentState,
    ...newState
  }

  fs.writeFileSync(
    statePath,
    JSON.stringify(updatedState, null, 2)
  )

}

module.exports = {
  getState,
  updateState
}