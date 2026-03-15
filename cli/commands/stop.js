const loadUI = require("../utils/ui");
const delay = require("../utils/delay");
const { updateState, getState } = require("../utils/stateManager");
const { execSync } = require("child_process");

module.exports = async function stop() {
  const { chalk, ora } = await loadUI();
  const state = getState();

  // 1. Check if the agent is even running in the state
  if (!state || !state.running) {
    console.log(chalk.yellow("⚠ Nudge agent is not currently running."));
    return;
  }

  const spinner = ora("Stopping Nudge agent...").start();

  try {
    if (state.pid) {
      spinner.text = `Stopping background process (PID: ${state.pid})...`;
      
      try {
        // 2. Attempt to kill the process group
        if (process.platform === "win32") {
          // On Windows, /T kills child processes as well (like the actual Node app)
          execSync(`taskkill /pid ${state.pid} /f /t`, { stdio: "ignore" });
        } else {
          // On Mac/Linux, we use SIGTERM. 
          // Note: If you used a process group, you'd use -state.pid
          process.kill(state.pid, "SIGTERM");
        }
      } catch (killError) {
        // If the process is already gone, we just continue to clean up the state
        spinner.text = "Process already terminated, cleaning up...";
      }
    }

    await delay(800);
    spinner.text = "Closing sessions and clearing state...";

    // 3. Reset the state
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