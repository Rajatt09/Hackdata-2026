const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const os = require('os');

const SENSITIVE_DIRECTORIES = os.platform() === 'win32'
    ? [
        'C:\\Windows',
        'C:\\ProgramData',
        'C:\\Users\\Default',
        'C:\\System Volume Information',
        'C:\\$Recycle.Bin',
        path.join(os.homedir(), 'AppData'),
        path.join(os.homedir(), '.ssh'),
        path.join(os.homedir(), '.aws'),
        path.join(os.homedir(), '.bash_history')
    ]
    : [
        '/System',
        '/Library',
        '/usr/sbin',
        '/usr/bin',
        '/private',
        '/var',
        path.join(os.homedir(), 'Library'),
        path.join(os.homedir(), '.ssh'),
        path.join(os.homedir(), '.aws'),
        path.join(os.homedir(), '.bash_history')
    ];

const GLOBAL_IGNORED_PATTERNS = os.platform() === 'win32'
    ? [
        '**/node_modules/**',
        '**/.git/**',
        '**/.vscode/**',
        '**/AppData/**',
        '**/$Recycle.Bin/**',
        '**/Windows/**',
        '**/ProgramData/**',
        '**/Program Files/**',
        '**/Program Files (x86)/**',
        '**/System Volume Information/**'
    ]
    : [
        '**/node_modules/**',
        '**/.git/**',
        '**/.vscode/**',
        '**/Library/**',
        '**/System/**',
        '**/tmp/**',
        '**/temp/**'
    ];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function normalizePath(p) {
    if (!p) return '';
    let normalized = p.trim().replace(/\\/g, '/');
    
    if (os.platform() === 'darwin') {
        const volPrefix = '/Volumes/Macintosh HD';
        if (normalized.startsWith(volPrefix)) {
            normalized = normalized.substring(volPrefix.length);
        } else if (normalized.startsWith(volPrefix.substring(1))) {
            normalized = normalized.substring(volPrefix.length - 1);
        }
        if (normalized === '') normalized = '/';
    }

    let resolved = path.resolve(normalized);

    if (!fs.existsSync(resolved) && !path.isAbsolute(normalized)) {
        const homeResolved = path.join(os.homedir(), normalized);
        if (fs.existsSync(homeResolved)) {
            resolved = homeResolved;
        }
    }

    return resolved;
}

function getSystemRoots() {
    if (os.platform() === 'win32') {
        const drives = [];
        for (let i = 65; i <= 90; i++) {
            const drive = String.fromCharCode(i) + ':\\';
            try {
                if (fs.existsSync(drive)) drives.push(drive);
            } catch (e) { }
        }
        return drives.length > 0 ? drives : ['C:\\'];
    }

    const roots = ['/'];
    try {
        if (fs.existsSync('/Volumes')) {
            const volumes = fs.readdirSync('/Volumes');
            volumes.forEach(v => {
                const vPath = path.join('/Volumes', v);
                try {
                    if (fs.lstatSync(vPath).isSymbolicLink()) {
                        const target = fs.readlinkSync(vPath);
                        if (target === '/') return;
                    }
                    if (fs.lstatSync(vPath).isDirectory()) {
                        roots.push(vPath);
                    }
                } catch (e) { }
            });
        }
    } catch (e) { }
    return roots;
}

function isPathSensitive(requestedPath) {
    const normalizedRequest = path.resolve(requestedPath).toLowerCase();
    return SENSITIVE_DIRECTORIES.some(sensitivePath => {
        const normalizedSensitive = path.resolve(sensitivePath).toLowerCase();
        return normalizedRequest.startsWith(normalizedSensitive);
    });
}


async function listFiles(folderName) {
    try {
        if (!folderName || folderName.trim() === '') {
            return 'Error: Please provide a folder name or sub-path to search for.';
        }

        const normalizedInput = folderName.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

        const absolutePath = normalizePath(folderName);
        if (fs.existsSync(absolutePath) && fs.lstatSync(absolutePath).isDirectory()) {
            console.log(`[listFiles] Input is a valid absolute path: ${absolutePath}`);
            if (isPathSensitive(absolutePath)) {
                return `Access Denied: The path '${absolutePath}' is in a sensitive area. Privacy concerns prevent access.`;
            }
            
            let finalPath = absolutePath;
            try {
                finalPath = fs.realpathSync(absolutePath);
            } catch (e) {}
            
            const files = fs.readdirSync(absolutePath).map(file => {
                const filePath = path.join(absolutePath, file);
                try {
                    return { name: file, mtime: fs.statSync(filePath).mtimeMs };
                } catch (e) {
                    return { name: file, mtime: 0 };
                }
            });
            
            files.sort((a, b) => b.mtime - a.mtime);
            const sortedFileNames = files.map(f => f.name);

            if (sortedFileNames.length === 0) return `Directory is empty: ${absolutePath}`;
            return `Contents of ${absolutePath} (Newest first):\n${sortedFileNames.join('\n')}`;
        }

        const rootsToSearch = getSystemRoots();
        let allFoundPaths = [];

        const blockedRootFolders = os.platform() === 'win32'
            ? ['windows', 'program files', 'program files (x86)', 'programdata', 'system volume information', '$recycle.bin']
            : ['system', 'library', 'var', 'private', 'usr', 'bin', 'sbin', 'dev', 'net', 'home', 'users'];

        for (const root of rootsToSearch) {
            let safeBase = root.replace(/\\/g, '/').replace(/\/$/, '');
            if (safeBase.length === 2 && safeBase[1] === ':') safeBase += '/';
            if (safeBase === '') safeBase = '/';

            let patternsToSearch = [];

            try {
                if (safeBase.endsWith(':/') || safeBase === '/') {
                    const topLevelItems = fs.readdirSync(safeBase, { withFileTypes: true });
                    for (const item of topLevelItems) {
                        if (item.isDirectory()) {
                            if (!blockedRootFolders.includes(item.name.toLowerCase())) {
                               
                                patternsToSearch.push(`${safeBase}${item.name}/**/${normalizedInput}`);
                            }
                        }
                    }
                    const homeDir = os.homedir().replace(/\\/g, '/');
                    patternsToSearch.push(`${homeDir}/**/${normalizedInput}`);
                } else {
                    patternsToSearch.push(`${safeBase}/**/${normalizedInput}`);
                }
            } catch (fsErr) {
                patternsToSearch.push(`${safeBase}/**/${normalizedInput}`);
            }

            console.log(`[listFiles] Searching ${patternsToSearch.length} patterns for path ending in '${normalizedInput}'...`);

            const entries = await fg(patternsToSearch, {
                dot: false,
                ignore: GLOBAL_IGNORED_PATTERNS,
                caseSensitiveMatch: false,
                suppressErrors: true,
                absolute: true,
                onlyDirectories: true,
                deep: 8
            });

            allFoundPaths.push(...entries);
        }

        const safePathsSet = new Set();
        allFoundPaths.forEach(p => {
            try {
                const realP = fs.realpathSync(p);
                const normalizedP = path.normalize(realP);
                if (!isPathSensitive(normalizedP)) {
                    safePathsSet.add(normalizedP);
                }
            } catch (e) {
                const normalizedP = path.normalize(p);
                if (!isPathSensitive(normalizedP)) {
                    safePathsSet.add(normalizedP);
                }
            }
        });

        const safePaths = Array.from(safePathsSet);

        const pathsWithTime = safePaths.map(p => {
            try {
                return { path: p, mtime: fs.statSync(p).mtimeMs };
            } catch (e) {
                return { path: p, mtime: 0 };
            }
        });
        pathsWithTime.sort((a, b) => b.mtime - a.mtime);
        const sortedSafePaths = pathsWithTime.map(p => p.path);

        if (sortedSafePaths.length === 0) {
            return `No folders found matching '${normalizedInput}'.`;
        }

        if (sortedSafePaths.length === 1) {
            const folderPath = sortedSafePaths[0];
            const files = fs.readdirSync(folderPath).map(file => {
                const filePath = path.join(folderPath, file);
                try {
                    return { name: file, mtime: fs.statSync(filePath).mtimeMs };
                } catch (e) {
                    return { name: file, mtime: 0 };
                }
            });
            
            files.sort((a, b) => b.mtime - a.mtime);
            const sortedFileNames = files.map(f => f.name);

            if (sortedFileNames.length === 0) return `Directory is empty: ${folderPath}`;
            return `Contents of ${folderPath} (Newest first):\n${sortedFileNames.join('\n')}`;
        }

        const displayLimit = 30;
        const displayPaths = sortedSafePaths.slice(0, displayLimit);
        let summaryText = `I found ${sortedSafePaths.length} folders mapping to '${normalizedInput}' (Ordered by most recently updated).`;
        
        if (sortedSafePaths.length > displayLimit) {
            summaryText += ` Showing the top ${displayLimit}. Please provide the exact absolute path from the list below to view its contents.`;
        } else {
            summaryText += ` Please select the folder you want to open by providing its absolute path.`;
        }

        return {
            __isRawDataResponse: true,
            paths: displayPaths,
            text: summaryText,
            totalCount: sortedSafePaths.length
        };
    } catch (err) {
        return `Failed to search for folders: ${err.message}`;
    }
}

async function sendFile(filePath) {
    try {
        const fullPath = normalizePath(filePath);

        if (isPathSensitive(fullPath)) {
            return `Access Denied: The path '${fullPath}' is in a sensitive area. Privacy concerns prevent downloading.`;
        }

        if (!fs.existsSync(fullPath)) return `File or Directory not found: ${fullPath}`;

        let finalPath = fullPath;
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            return await zipFolder(filePath);
        }

        const finalStats = fs.statSync(finalPath);
        if (finalStats.size > MAX_FILE_SIZE) {
            const sizeInMB = (finalStats.size / (1024 * 1024)).toFixed(2);
            return `Error: Size is too large for Telegram (${sizeInMB} MB). Max is 50 MB.`;
        }

        return {
            __isFileResponse: true,
            filePath: finalPath,
            fileName: path.basename(finalPath),
            __isTempFile: false
        };
    } catch (err) {
        return `Error accessing path: ${err.message}`;
    }
}

async function zipFolder(folderPath) {
    try {
        if (!folderPath || folderPath.trim() === '') {
            return 'Error: Please provide a folder name or path to zip.';
        }

        const directPath = normalizePath(folderPath);
        if (fs.existsSync(directPath) && fs.lstatSync(directPath).isDirectory()) {
            if (isPathSensitive(directPath)) {
                return `Access Denied: The path '${directPath}' is in a sensitive area.`;
            }
            return _createZip(directPath);
        }

        const normalizedInput = folderPath.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
        const rootsToSearch = getSystemRoots();
        let allFoundPaths = [];

        const blockedRootFolders = os.platform() === 'win32'
            ? ['windows', 'program files', 'program files (x86)', 'programdata', 'system volume information', '$recycle.bin']
            : ['system', 'library', 'var', 'private', 'usr', 'bin', 'sbin', 'dev', 'net', 'home', 'users'];

        for (const root of rootsToSearch) {
            let safeBase = root.replace(/\\/g, '/').replace(/\/$/, '');
            if (safeBase.length === 2 && safeBase[1] === ':') safeBase += '/';
            if (safeBase === '') safeBase = '/';

            let patternsToSearch = [];
            try {
                if (safeBase.endsWith(':/') || safeBase === '/') {
                    const topLevelItems = fs.readdirSync(safeBase, { withFileTypes: true });
                    for (const item of topLevelItems) {
                        if (item.isDirectory() && !blockedRootFolders.includes(item.name.toLowerCase())) {
                            patternsToSearch.push(`${safeBase}${item.name}/**/${normalizedInput}`);
                        }
                    }
                    const homeDir = os.homedir().replace(/\\/g, '/');
                    patternsToSearch.push(`${homeDir}/**/${normalizedInput}`);
                } else {
                    patternsToSearch.push(`${safeBase}/**/${normalizedInput}`);
                }
            } catch (fsErr) {
                patternsToSearch.push(`${safeBase}/**/${normalizedInput}`);
            }

            const entries = await fg(patternsToSearch, {
                dot: false,
                ignore: GLOBAL_IGNORED_PATTERNS,
                caseSensitiveMatch: false,
                suppressErrors: true,
                absolute: true,
                onlyDirectories: true,
                deep: 8
            });
            allFoundPaths.push(...entries);
        }

        const safePathsSet = new Set();
        allFoundPaths.forEach(p => {
            try {
                const realP = fs.realpathSync(p);
                if (!isPathSensitive(path.normalize(realP))) safePathsSet.add(path.normalize(realP));
            } catch (e) {
                const np = path.normalize(p);
                if (!isPathSensitive(np)) safePathsSet.add(np);
            }
        });

        const safePaths = Array.from(safePathsSet);
        const sorted = safePaths.map(p => {
            try { return { path: p, mtime: fs.statSync(p).mtimeMs }; }
            catch (e) { return { path: p, mtime: 0 }; }
        }).sort((a, b) => b.mtime - a.mtime).map(p => p.path);

        if (sorted.length === 0) {
            return `No folders found matching '${normalizedInput}'.`;
        }

        if (sorted.length === 1) {
            return _createZip(sorted[0]);
        }

        const displayLimit = 30;
        const displayPaths = sorted.slice(0, displayLimit);
        let summaryText = `I found ${sorted.length} folders matching '${normalizedInput}' (ordered by most recently updated).`;
        if (sorted.length > displayLimit) {
            summaryText += ` Showing the top ${displayLimit}. Please provide the exact absolute path to zip.`;
        } else {
            summaryText += ` Please select the folder you want to zip by providing its absolute path.`;
        }

        return {
            __isRawDataResponse: true,
            paths: displayPaths,
            text: summaryText,
            totalCount: sorted.length
        };
    } catch (err) {
        return `Error in zipFolder: ${err.message}`;
    }
}

function _createZip(fullPath) {
    const tempDir = os.tmpdir();
    const zipFileName = `${path.basename(fullPath)}_${Date.now()}.zip`;
    const zipPath = path.join(tempDir, zipFileName);

    const exec = require('child_process').execSync;
    if (os.platform() === 'win32') {
        exec(`tar.exe -a -c -f "${zipPath}" -C "${path.dirname(fullPath)}" "${path.basename(fullPath)}"`);
    } else {
        exec(`zip -r "${zipPath}" "${path.basename(fullPath)}"`, {
            cwd: path.dirname(fullPath)
        });
    }

    const zipStats = fs.statSync(zipPath);
    if (zipStats.size > MAX_FILE_SIZE) {
        const sizeInMB = (zipStats.size / (1024 * 1024)).toFixed(2);
        fs.unlinkSync(zipPath);
        return `Error: The zipped folder is too large for Telegram (${sizeInMB} MB). Max is 50 MB.`;
    }

    return {
        __isFileResponse: true,
        filePath: zipPath,
        fileName: zipFileName,
        __isTempFile: true
    };
}


async function findFilesByName(fileName, searchRoot = null) {
    try {
        let rootsToSearch = searchRoot ? [normalizePath(searchRoot)] : getSystemRoots();

        if (searchRoot && isPathSensitive(rootsToSearch[0])) {
            return `Access Denied: Searching inside '${rootsToSearch[0]}' accesses sensitive areas. Privacy concerns prevent access.`;
        }

        let allFoundPaths = [];

        const blockedRootFolders = os.platform() === 'win32'
            ? ['windows', 'program files', 'program files (x86)', 'programdata', 'system volume information', '$recycle.bin']
            : ['system', 'library', 'var', 'private', 'usr', 'bin', 'sbin', 'dev', 'net', 'home', 'users'];

        for (const root of rootsToSearch) {
            let safeBase = root.replace(/\\/g, '/').replace(/\/$/, '');
            if (safeBase.length === 2 && safeBase[1] === ':') safeBase += '/';
            if (safeBase === '') safeBase = '/';

            let patternsToSearch = [];

            try {
                if (safeBase.endsWith(':/') || safeBase === '/') {
                    const topLevelItems = fs.readdirSync(safeBase, { withFileTypes: true });
                    for (const item of topLevelItems) {
                        if (item.isDirectory()) {
                            if (!blockedRootFolders.includes(item.name.toLowerCase())) {
                                patternsToSearch.push(`${safeBase}${item.name}/**/*${fileName}*`);
                            }
                        }
                    }
                    if (!searchRoot) {
                        const homeDir = os.homedir().replace(/\\/g, '/');
                        patternsToSearch.push(`${homeDir}/**/*${fileName}*`);
                    }
                } else {
                    patternsToSearch.push(`${safeBase}/**/*${fileName}*`);
                }
            } catch (fsErr) {
                patternsToSearch.push(`${safeBase}/**/*${fileName}*`);
            }

            console.log(`[Search] Executing ${patternsToSearch.length} safe patterns in ${safeBase}...`);

            const entries = await fg(patternsToSearch, {
                dot: false,
                ignore: GLOBAL_IGNORED_PATTERNS,
                caseSensitiveMatch: false,
                suppressErrors: true,
                absolute: true,
                onlyFiles: false,
                deep: 8
            });

            allFoundPaths.push(...entries);
        }

        let safePaths = [];
        let sensitiveCount = 0;

        for (const p of allFoundPaths) {
            const normalized = path.normalize(p);
            if (isPathSensitive(normalized)) {
                sensitiveCount++;
            } else {
                safePaths.push(normalized);
            }
        }

        if (safePaths.length === 0 && sensitiveCount > 0) {
            return JSON.stringify({
                error: `Privacy Block: Found match(es) for '${fileName}', but they are located inside sensitive system directories. Access is denied.`
            });
        }

        const responseData = { results: safePaths };

        if (safePaths.length > 30) {
            responseData.warning = `Found ${safePaths.length} safe files. Showing top 30 to save space.`;
            responseData.results = safePaths.slice(0, 30);
        }

        if (safePaths.length === 0) {
            return JSON.stringify({ error: `No files found matching '${fileName}'.` });
        }

        if (sensitiveCount > 0) {
            responseData.warning = (responseData.warning ? responseData.warning + " " : "") +
                `Also hid ${sensitiveCount} match(es) located in sensitive system directories.`;
        }

        return JSON.stringify(responseData);
    } catch (err) {
        return `Error searching for file: ${err.message}`;
    }
}
module.exports = { listFiles, sendFile, zipFolder, findFilesByName };