const prompts = require("prompts");
const loadUI = require("../utils/ui");
const { updateEnv } = require("../utils/envManager");

module.exports = async function auth() {
  const { chalk, ora } = await loadUI();

  const response = await prompts({
    type: "password",
    name: "token",
    message: `Enter new ${chalk.cyan("Auth Token")} (API Key or Bot Token):`,
    validate: value => value.length < 5 ? "Token is too short to be valid" : true
  });

  // Handle Ctrl+C / Cancel
  if (!response.token) {
    console.log(chalk.yellow("\nAuth update cancelled."));
    return;
  }

  const spinner = ora("Updating authentication credentials...").start();

  try {
    // We update the primary keys used by the agent
    // Based on your init.js, you used GEMINI_API_KEY and BOT_TOKEN
    updateEnv("GEMINI_API_KEY", response.token);
    // updateEnv("NUDGE_API_KEY", response.token); // Keeping this for backward compatibility

    // If this is specifically for the Telegram/Discord bot token:
    // updateEnv("BOT_TOKEN", response.token);

    await new Promise(resolve => setTimeout(resolve, 600)); // Smooth UX delay
    
    spinner.succeed(chalk.green("Authentication token updated successfully"));
    console.log(chalk.gray("Note: You may need to restart the agent for changes to take effect."));

  } catch (error) {
    spinner.fail(chalk.red("Failed to update authentication token"));
    console.error(chalk.red(error.message));
  }
};