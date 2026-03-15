const prompts = require("prompts");
const loadUI = require("../utils/ui");
const models = require("../data/models.json");
const { updateEnv } = require("../utils/envManager");

module.exports = async function model() {
  const { chalk, ora } = await loadUI();

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

  if (!response.model) {
    console.log(chalk.yellow("\nModel update cancelled."));
    return;
  }

  const spinner = ora("Updating configuration...").start();

  try {
    updateEnv("MODEL_NAME", response.model);

    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    spinner.succeed(chalk.green(`Successfully switched to ${response.model}`));

  } catch (error) {
    spinner.fail(chalk.red("Failed to update model configuration"));
    console.error(chalk.red(error.message));
  }
};