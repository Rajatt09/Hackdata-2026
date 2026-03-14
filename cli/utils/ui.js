async function loadUI() {

  const chalk = (await import("chalk")).default
  const ora = (await import("ora")).default

  return { chalk, ora }

}

module.exports = loadUI