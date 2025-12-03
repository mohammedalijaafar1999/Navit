#!/usr/bin/env node

// Navit - Terminal File Explorer
// CLI Entry Point

import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { resolvePath } from './utils/fileSystem.js';
import fs from 'fs';

// Parse command line arguments
const args = process.argv.slice(2);

// Help text
const helpText = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███╗   ██╗ █████╗ ██╗   ██╗██╗████████╗                    ║
║   ████╗  ██║██╔══██╗██║   ██║██║╚══██╔══╝                    ║
║   ██╔██╗ ██║███████║██║   ██║██║   ██║                       ║
║   ██║╚██╗██║██╔══██║╚██╗ ██╔╝██║   ██║                       ║
║   ██║ ╚████║██║  ██║ ╚████╔╝ ██║   ██║                       ║
║   ╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝  ╚═╝   ╚═╝                       ║
║                                                               ║
║   A Terminal User Interface File Explorer                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Usage: navit [path] [options]

Arguments:
  path              Starting directory (default: current directory)

Options:
  -h, --help        Show this help message
  -v, --version     Show version number

Keyboard Shortcuts:
  j/k or ↑/↓        Navigate up/down
  h or Backspace    Go to parent directory
  l or Enter        Open folder / Preview file
  o                 Open file with system app
  /                 Filter current directory
  :                 Command palette
  ?                 Show help
  .                 Toggle hidden files
  Space             Toggle file selection
  Ctrl+C            Copy selected files
  Ctrl+X            Cut selected files
  Ctrl+V            Paste files
  Delete            Delete selected files
  y                 Copy path to clipboard
  g                 Go to bookmark
  B                 Add bookmark
  q                 Quit

Commands (press : to open):
  :cd <path>        Change directory
  :mkdir <name>     Create directory
  :touch <name>     Create file
  :rename <name>    Rename selected file
  :set <key> <val>  Change configuration
  :bookmark add <n> Add bookmark
  :help             Show help
  :quit             Exit navit

Configuration:
  Config file location:
    Windows:  %APPDATA%\\navit\\config.json
    Linux:    ~/.config/navit/config.json
    macOS:    ~/.config/navit/config.json

  Local config: .navit.json in any directory

For more information, visit: https://github.com/navit/navit
`;

const version = '1.0.0';

// Handle --help
if (args.includes('-h') || args.includes('--help')) {
  console.log(helpText);
  process.exit(0);
}

// Handle --version
if (args.includes('-v') || args.includes('--version')) {
  console.log(`navit v${version}`);
  process.exit(0);
}

// Get starting path
let startPath = process.cwd();

// Find path argument (first non-flag argument)
for (const arg of args) {
  if (!arg.startsWith('-')) {
    startPath = resolvePath(arg);
    break;
  }
}

// Validate path
try {
  const stats = fs.statSync(startPath);
  if (!stats.isDirectory()) {
    console.error(`Error: '${startPath}' is not a directory`);
    process.exit(1);
  }
} catch (err) {
  console.error(`Error: Cannot access '${startPath}'`);
  process.exit(1);
}

// Enable full screen mode
process.stdout.write('\x1b[?1049h'); // Enter alternate screen
process.stdout.write('\x1b[?25l');   // Hide cursor

// Cleanup on exit
export const cleanup = () => {
  process.stdout.write('\x1b[?25h');   // Show cursor
  process.stdout.write('\x1b[?1049l'); // Exit alternate screen
};

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

// Render the app
render(<App startPath={startPath} />);
