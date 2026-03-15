const prompts = require("prompts");
const loadUI = require("../utils/ui");
const models = require("../data/models.json");
const { updateEnv } = require("../utils/envManager");

module.exports = async function model() {
  const { chalk, ora } = await loadUI();

  // Map choices from your JSON data
  const modelChoices = models.models.map((m) => ({
    title: `${m.id} ${chalk.gray(`(${m.provider})`)}`,
    value: m.id
  }));

  const response = await prompts({
    type: "select",
    name: "model",
    message: "Select a new model to use:",
    choices: modelChoices,
    initial: 0
  });

  // Handle case where user cancels the prompt (Ctrl+C)
  if (!response.model) {
    console.log(chalk.yellow("\nModel update cancelled."));
    return;
  }

  const spinner = ora("Updating configuration...").start();

  try {
    // We update both the runtime and the .env file
    // Ensure the key matches what your 'start' script or 'nudge' folder expects
    updateEnv("MODEL_NAME", response.model);
    // updateEnv("NUDGE_MODEL", response.model);

    await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
    
    spinner.succeed(chalk.green(`Successfully switched to ${response.model}`));

  } catch (error) {
    spinner.fail(chalk.red("Failed to update model configuration"));
    console.error(chalk.red(error.message));
  }
};