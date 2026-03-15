const { spawn } = require("child_process");
const path = require("path");
const loadUI = require("../utils/ui");
const delay = require("../utils/delay");
const { updateState, getState } = require("../utils/stateManager"); // Import getState

module.exports = async function start() {
  const { chalk, ora } = await loadUI();
  
  // 1. Signature Check: Check if agent is already running
  const state = getState();
  if (state && state.running) {
    console.log(chalk.yellow(`⚠ Nudge agent is already running (Started at: ${state.startedAt})`));
    console.log(chalk.gray("Run `nudge stop` if you want to restart it."));
    return; // Exit early
  }

  const spinner = ora("Starting Nudge agent...").start();

  await delay(700);
  spinner.text = "Loading configuration...";
  await delay(700);
  spinner.text = "Connecting to model...";
  await delay(1000);
  spinner.text = "Initializing tools...";

  try {
    const nudgePath = path.join(process.cwd(), "../nudge");

    const child = spawn("npm", ["run", "dev"], {
      cwd: nudgePath,
      stdio: "inherit", 
      shell: true
    });

    let hasFailed = false;

    // Listen for immediate crashes (like your DLL error)
    child.on('exit', (code) => {
      // code 0 is normal exit, null happens if it was killed manually
      if (code !== 0 && code !== null) {
        hasFailed = true;
        // Check if spinner is still spinning before calling fail
        if (spinner.isSpinning) {
          spinner.fail(chalk.red(`Nudge agent failed to start (Exit code: ${code})`));
        }
        updateState({ running: false, pid: null, startedAt: null });
      }
    });

    child.on('error', (err) => {
      hasFailed = true;
      spinner.fail(chalk.red("Failed to launch dev server process"));
      console.error(err);
    });

    // Wait a moment to see if the process stays alive/crashes
    await delay(2000); 

    if (!hasFailed) {
      updateState({
        running: true,
        startedAt: new Date().toISOString(),
        pid: child.pid
      });

      spinner.succeed(chalk.green("Nudge agent started"));
      console.log(chalk.blue("ℹ Dev server is running in the background..."));
    }

  } catch (error) {
    spinner.fail(chalk.red("An unexpected error occurred"));
    console.error(error);
  }
};