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

  if (!response.token) {
    console.log(chalk.yellow("\nAuth update cancelled."));
    return;
  }

  const spinner = ora("Updating authentication credentials...").start();

  try {
    updateEnv("GEMINI_API_KEY", response.token);

    await new Promise(resolve => setTimeout(resolve, 600)); 
    
    spinner.succeed(chalk.green("Authentication token updated successfully"));
    console.log(chalk.gray("Note: You may need to restart the agent for changes to take effect."));

  } catch (error) {
    spinner.fail(chalk.red("Failed to update authentication token"));
    console.error(chalk.red(error.message));
  }
};