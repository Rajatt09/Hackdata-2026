const loadUI = require("../utils/ui");
const delay = require("../utils/delay");
const { updateState, getState } = require("../utils/stateManager");
const { execSync } = require("child_process");

module.exports = async function stop() {
  const { chalk, ora } = await loadUI();
  const state = getState();

  if (!state || !state.running) {
    console.log(chalk.yellow("⚠ Nudge agent is not currently running."));
    return;
  }

  const spinner = ora("Stopping Nudge agent...").start();

  try {
    if (state.pid) {
      spinner.text = `Stopping background process (PID: ${state.pid})...`;
      
      try {
        if (process.platform === "win32") {
          execSync(`taskkill /pid ${state.pid} /f /t`, { stdio: "ignore" });
        } else {
          process.kill(state.pid, "SIGTERM");
        }
      } catch (killError) {
        spinner.text = "Process already terminated, cleaning up...";
      }
    }

    await delay(800);
    spinner.text = "Closing sessions and clearing state...";

    updateState({
      running: false,
      startedAt: null,
      pid: null
    });

    await delay(500);
    spinner.succeed(chalk.yellow("Nudge agent stopped successfully"));

  } catch (error) {
    spinner.fail(chalk.red("Failed to stop Nudge agent cleanly"));
    console.error(chalk.red(`Error: ${error.message}`));
  }
};