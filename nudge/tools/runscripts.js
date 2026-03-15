const { exec } = require('child_process');

function executeScript(command) {
    return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
            let output = '';
            if (stdout) output += `STDOUT:\n${stdout}\n`;
            if (stderr) output += `STDERR:\n${stderr}\n`;
            if (error) {
                output += `ERROR:\n${error.message}`;
                resolve(`Script execution failed.\n\n${output}`);
                return;
            }
            if (!output) output = 'Script executed successfully with no output.';
            resolve(`Script execution completed.\n\n${output}`);
        });
    });
}

module.exports = { executeScript };