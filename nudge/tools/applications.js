const { exec, execSync } = require('child_process');
const { startRemoteDesktop } = require('./remotedesktop');
const os = require('os');

function openApplication(appName) {
    return new Promise((resolve) => {
        if (!appName || appName.trim().length === 0) {
            resolve('Error: No application name provided.');
            return;
        }

        const trimmed = appName.trim();

        const handleSuccess = async (launchedName) => {
            try {
                const rdResult = await startRemoteDesktop();
                resolve(rdResult.message || `Remote desktop started. URL: ${rdResult.url}`);
            } catch (err) {
                resolve(`App launched but failed to start remote desktop: ${err.message}`);
            }
        };

        if (trimmed.includes('\\') || trimmed.includes('/')) {
            const command = `start "" "${trimmed}"`;
            exec(command, (error) => {
                if (error) {
                    resolve(`Failed to open application at path '${trimmed}'. Error: ${error.message}`);
                } else {
                    handleSuccess(trimmed);
                }
            });
            return;
        }

        const startCommand = `start "" "${trimmed}"`;
        exec(startCommand, (startError) => {
            if (!startError) {
                handleSuccess(trimmed);
                return;
            }

            console.log(`[App] 'start' command failed for '${trimmed}', trying Get-StartApps lookup...`);

            const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
$apps = Get-StartApps | Where-Object { $_.Name -like '*${trimmed.replace(/'/g, "''")}*' }
if ($apps -and @($apps).Count -gt 0) {
    $app = @($apps)[0]
    Start-Process explorer.exe -ArgumentList "shell:AppsFolder\\$($app.AppId)"
    Write-Output "SUCCESS:$($app.Name)"
} else {
    Write-Output "NOTFOUND"
}
`;
            const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

            exec(`powershell.exe -NoProfile -EncodedCommand ${encoded}`, { timeout: 15000 }, (psError, psStdout) => {
                const output = (psStdout || '').trim();

                if (output.startsWith('SUCCESS:')) {
                    const launchedName = output.replace('SUCCESS:', '');
                    handleSuccess(launchedName);
                    return;
                }

                resolve(
                    `Failed to open '${trimmed}'. It is not found in PATH or installed applications. ` +
                    `Please check the app name or provide the full executable path.`
                );
            });
        });
    });
}

module.exports = { openApplication };