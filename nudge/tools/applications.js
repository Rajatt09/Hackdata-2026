const { exec, execSync } = require('child_process');
const { startRemoteDesktop } = require('./remotedesktop');
const os = require('os');

/**
 * Attempts to open an application on the host Windows laptop.
 * Uses a multi-strategy approach to find and launch apps:
 *
 *   Strategy 1: Windows `start` command (works for PATH apps like chrome, notepad, calc)
 *   Strategy 2: PowerShell `Get-StartApps` lookup + `shell:AppsFolder` launch
 *               (works for ALL installed apps: UWP/Store apps, Squirrel-installed apps,
 *                user-installed desktop apps like Telegram, WhatsApp, Obsidian, Discord, etc.)
 *   Strategy 3: Direct path launch (if the user provides a full .exe path)
 *
 * @param {string} appName The name of the application to open (e.g., "chrome", "telegram", "whatsapp").
 * @returns {Promise<string>} Result message.
 */
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
                // Return just the message text as requested
                resolve(rdResult.message || `Remote desktop started. URL: ${rdResult.url}`);
            } catch (err) {
                resolve(`App launched but failed to start remote desktop: ${err.message}`);
            }
        };

        // If the user provided a full path (e.g., "C:\...\app.exe"), launch it directly
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

        // Strategy 1: Try the simple `start` command first (fast, works for PATH apps)
        const startCommand = `start "" "${trimmed}"`;
        exec(startCommand, (startError) => {
            if (!startError) {
                handleSuccess(trimmed);
                return;
            }

            console.log(`[App] 'start' command failed for '${trimmed}', trying Get-StartApps lookup...`);

            // Strategy 2: Search the Windows Start Menu apps database via PowerShell.
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