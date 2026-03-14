const { exec } = require('child_process');
const si = require('systeminformation');
const os = require('os');
const https = require('https');

/**
 * Converts a data object/array into clean, human-readable text for Telegram.
 * @param {any} data - The data to format.
 * @param {number} indent - Current indentation level.
 * @returns {string} Formatted text string.
 */
function formatDataToText(data, indent = 0) {
    const prefix = '  '.repeat(indent);

    if (data === null || data === undefined) return `${prefix}N/A`;
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
        return `${prefix}${data}`;
    }

    if (Array.isArray(data)) {
        if (data.length === 0) return `${prefix}(empty)`;
        return data.map((item, i) => {
            if (typeof item === 'object' && item !== null) {
                return `${prefix}${i + 1}.\n${formatDataToText(item, indent + 1)}`;
            }
            return `${prefix}${i + 1}. ${item}`;
        }).join('\n');
    }

    if (typeof data === 'object') {
        return Object.entries(data)
            .filter(([, v]) => v !== '' && v !== null && v !== undefined)
            .map(([key, value]) => {
                const label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
                if (typeof value === 'object' && value !== null) {
                    return `${prefix}${label}:\n${formatDataToText(value, indent + 1)}`;
                }
                return `${prefix}${label}: ${value}`;
            }).join('\n');
    }

    return `${prefix}${String(data)}`;
}

/**
 * Executes a system/terminal command safely with a timeout.
 * The actual execution is gated behind an inline-keyboard confirmation in index.js.
 *
 * @param {string} command - The exact CLI command to execute.
 * @returns {Promise<string>} The stdout/stderr output of the command.
 */
function runSysTerminalCommands(command) {
    return new Promise((resolve) => {
        const TIMEOUT_MS = 15000; // 15-second safety timeout

        exec(command, { timeout: TIMEOUT_MS }, (error, stdout, stderr) => {
            let output = '';

            if (stdout) output += stdout.trim();
            if (stderr) output += (output ? '\n' : '') + `STDERR: ${stderr.trim()}`;

            if (error) {
                if (error.killed) {
                    resolve(`Command timed out after ${TIMEOUT_MS / 1000} seconds.`);
                    return;
                }
                output += (output ? '\n' : '') + `ERROR: ${error.message}`;
                resolve(`Command execution failed.\n\n${output}`);
                return;
            }

            if (!output) output = 'Command executed successfully with no output.';
            resolve(output);
        });
    });
}

function getSystemInfo() {
    return {
        __isRawDataResponse: true,
        text: 'System Information retrieved.',
        paths: [formatDataToText({
            hostname: os.hostname(),
            platform: os.platform(),
            architecture: os.arch(),
            uptime_seconds: os.uptime(),
            cpu_model: os.cpus()[0].model,
            cpu_cores: os.cpus().length,
            total_memory_gb: (os.totalmem() / 1e9).toFixed(2),
            free_memory_gb: (os.freemem() / 1e9).toFixed(2)
        })]
    };
}

async function getBatteryStatus() {
    try {
        const battery = await si.battery();
        return {
            __isRawDataResponse: true,
            text: 'Battery status retrieved.',
            paths: [formatDataToText({
                percent: battery.percent + '%',
                is_charging: battery.isCharging ? 'Yes' : 'No',
                ac_connected: battery.acConnected ? 'Yes' : 'No',
                time_remaining_min: battery.timeRemaining !== -1 ? battery.timeRemaining + ' min' : 'N/A',
                cycle_count: battery.cycleCount || 'N/A',
                max_capacity: battery.maxCapacity ? battery.maxCapacity + '%' : 'N/A'
            })]
        };
    } catch (e) {
        return { error: e.message };
    }
}

async function getCPUUsage() {
    try {
        const load = await si.currentLoad();
        return {
            __isRawDataResponse: true,
            text: 'CPU usage retrieved.',
            paths: [formatDataToText({
                cpu_usage_percent: load.currentLoad.toFixed(2)
            })]
        };
    } catch (e) {
        return { error: e.message };
    }
}

async function getMemoryUsage() {
    try {
        const mem = await si.mem();
        return {
            __isRawDataResponse: true,
            text: 'Memory usage retrieved.',
            paths: [formatDataToText({
                total_gb: (mem.total / 1e9).toFixed(2),
                used_gb: (mem.active / 1e9).toFixed(2),
                free_gb: (mem.free / 1e9).toFixed(2)
            })]
        };
    } catch (e) {
        return { error: e.message };
    }
}

async function getNetworkInfo() {
    try {
        const interfaces = await si.networkInterfaces();
        const activeInterfaces = (Array.isArray(interfaces) ? interfaces : [interfaces])
            .filter(iface => iface.ip4 || iface.ip6)
            .map(iface => ({
                name: iface.iface,
                type: iface.type,
                ip4: iface.ip4 || 'N/A',
                ip6: iface.ip6 || 'N/A',
                mac: iface.mac || 'N/A',
                speed: iface.speed ? iface.speed + ' Mbps' : 'N/A'
            }));
        return {
            __isRawDataResponse: true,
            text: 'Network information retrieved.',
            paths: [formatDataToText(activeInterfaces)]
        };
    } catch (e) {
        return { error: e.message };
    }
}

function getPublicIP() {
    return new Promise((resolve) => {
        https.get("https://api.ipify.org", res => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve({
                __isRawDataResponse: true,
                text: 'Public IP retrieved.',
                paths: [formatDataToText({ ip: data })]
            }));
        }).on("error", err => resolve({ error: `Failed to get IP: ${err.message}` }));
    });
}

async function getRunningProcesses() {
    try {
        const processes = await si.processes();
        const top10 = processes.list
            .sort((a, b) => b.cpu - a.cpu)
            .slice(0, 10)
            .map(p => ({
                name: p.name,
                cpu: p.cpu.toFixed(1) + '%',
                memory: (p.mem || 0).toFixed(1) + '%',
                pid: p.pid
            }));
        return {
            __isRawDataResponse: true,
            text: 'Top 10 running processes (by CPU usage):',
            paths: [formatDataToText(top10)]
        };
    } catch (e) {
        return { error: e.message };
    }
}

async function getDiskUsage() {
    try {
        const disks = await si.fsSize();
        const formatted = (Array.isArray(disks) ? disks : [disks]).map(d => ({
            mount: d.mount,
            type: d.type,
            size_gb: (d.size / 1e9).toFixed(2) + ' GB',
            used_gb: (d.used / 1e9).toFixed(2) + ' GB',
            available_gb: ((d.size - d.used) / 1e9).toFixed(2) + ' GB',
            use_percent: d.use.toFixed(1) + '%'
        }));
        return {
            __isRawDataResponse: true,
            text: 'Disk usage retrieved.',
            paths: [formatDataToText(formatted)]
        };
    } catch (e) {
        return { error: e.message };
    }
}

async function getTemperature() {
    try {
        const temp = await si.cpuTemperature();
        return {
            __isRawDataResponse: true,
            text: 'CPU Temperature retrieved.',
            paths: [formatDataToText({
                main: temp.main !== null ? temp.main + ' °C' : 'Not available (macOS limitation)',
                max: temp.max !== null ? temp.max + ' °C' : 'N/A'
            })]
        };
    } catch (e) {
        return { error: e.message };
    }
}

async function getActiveUsers() {
    try {
        const users = await si.users();
        const formatted = (Array.isArray(users) ? users : [users]).map(u => ({
            user: u.user,
            terminal: u.tty || 'N/A',
            login_date: u.date || 'N/A',
            login_time: u.time || 'N/A'
        }));
        return {
            __isRawDataResponse: true,
            text: 'Active users retrieved.',
            paths: [formatDataToText(formatted)]
        };
    } catch (e) {
        return { error: e.message };
    }
}

module.exports = { 
    runSysTerminalCommands,
    getSystemInfo,
    getBatteryStatus,
    getCPUUsage,
    getMemoryUsage,
    getNetworkInfo,
    getPublicIP,
    getRunningProcesses,
    getDiskUsage,
    getTemperature,
    getActiveUsers
};
