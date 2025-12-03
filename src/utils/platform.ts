// Platform-specific utilities

import { exec, spawn } from 'child_process';
import os from 'os';
import path from 'path';

// Platform detection
export const isWindows = process.platform === 'win32';
export const isMac = process.platform === 'darwin';
export const isLinux = process.platform === 'linux';

// Get default shell
export function getDefaultShell(): string {
  if (isWindows) {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/bash';
}

// Get config directory
export function getConfigDir(): string {
  if (isWindows) {
    return path.join(process.env.APPDATA || os.homedir(), 'navit');
  }
  return path.join(os.homedir(), '.config', 'navit');
}

// Open file with system default application
export async function openWithDefault(filePath: string): Promise<void> {
  // Dynamic import for open (ESM module)
  const openModule = await import('open');
  await openModule.default(filePath);
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<void> {
  const clipboardy = await import('clipboardy');
  await clipboardy.default.write(text);
}

// Open terminal in directory
export function openTerminalInDir(dirPath: string): void {
  if (isWindows) {
    spawn('cmd.exe', [], {
      cwd: dirPath,
      detached: true,
      stdio: 'ignore',
    }).unref();
  } else if (isMac) {
    exec(`open -a Terminal "${dirPath}"`);
  } else {
    // Try common Linux terminals
    const terminals = [
      'gnome-terminal',
      'konsole',
      'xfce4-terminal',
      'xterm',
    ];
    
    for (const term of terminals) {
      try {
        spawn(term, ['--working-directory', dirPath], {
          detached: true,
          stdio: 'ignore',
        }).unref();
        return;
      } catch {
        continue;
      }
    }
  }
}

// Get path separator
export function getPathSeparator(): string {
  return path.sep;
}

// Normalize path for display
export function normalizePath(filePath: string): string {
  // Replace home directory with ~
  const home = os.homedir();
  if (filePath.startsWith(home)) {
    return '~' + filePath.slice(home.length);
  }
  return filePath;
}

// Get parent directory
export function getParentDir(dirPath: string): string {
  const parent = path.dirname(dirPath);
  // On Windows, handle root like C:\
  if (parent === dirPath) return dirPath;
  return parent;
}

// Check if path is root
export function isRoot(dirPath: string): boolean {
  if (isWindows) {
    // Windows root is like C:\ or D:\
    return /^[A-Z]:\\$/i.test(dirPath);
  }
  return dirPath === '/';
}

// Get list of root drives (Windows)
export async function getRootDrives(): Promise<string[]> {
  if (!isWindows) {
    return ['/'];
  }
  
  return new Promise((resolve) => {
    exec('wmic logicaldisk get name', (error, stdout) => {
      if (error) {
        resolve(['C:\\']);
        return;
      }
      
      const drives = stdout
        .split('\n')
        .map(line => line.trim())
        .filter(line => /^[A-Z]:$/.test(line))
        .map(drive => drive + '\\');
      
      resolve(drives.length > 0 ? drives : ['C:\\']);
    });
  });
}
