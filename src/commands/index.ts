// Command handler for the command palette

import path from 'path';
import os from 'os';
import { AppState } from '../state/AppState.js';
import { 
  createDirectory, 
  createFile, 
  renameFile, 
  resolvePath,
  exists 
} from '../utils/fileSystem.js';
import { setConfig } from '../config.js';
import { copyToClipboard, openWithDefault, openTerminalInDir } from '../utils/platform.js';

// Command definition
interface Command {
  name: string;
  aliases: string[];
  description: string;
  action: (args: string[], context: CommandContext) => Promise<CommandResult>;
}

// Command execution context
interface CommandContext {
  state: AppState;
  dispatch: React.Dispatch<any>;
  navigate: (path: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// Command result
interface CommandResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Available commands
const commands: Command[] = [
  {
    name: 'quit',
    aliases: ['q', 'exit'],
    description: 'Exit navit',
    action: async () => {
      process.exit(0);
    },
  },
  {
    name: 'cd',
    aliases: ['goto', 'go'],
    description: 'Change directory',
    action: async (args, context) => {
      const targetPath = args.join(' ').trim();
      if (!targetPath) {
        return { success: false, error: 'Usage: :cd <path>' };
      }
      
      const resolved = resolvePath(targetPath);
      if (await exists(resolved)) {
        await context.navigate(resolved);
        return { success: true, message: `Changed to ${resolved}` };
      }
      return { success: false, error: `Path not found: ${resolved}` };
    },
  },
  {
    name: 'mkdir',
    aliases: ['md', 'newdir'],
    description: 'Create new directory',
    action: async (args, context) => {
      const name = args.join(' ').trim();
      if (!name) {
        return { success: false, error: 'Usage: :mkdir <name>' };
      }
      
      const newPath = path.join(context.state.currentPath, name);
      if (await exists(newPath)) {
        return { success: false, error: 'Directory already exists' };
      }
      
      await createDirectory(newPath);
      await context.refresh();
      return { success: true, message: `Created directory: ${name}` };
    },
  },
  {
    name: 'touch',
    aliases: ['new', 'newfile', 'create'],
    description: 'Create new file',
    action: async (args, context) => {
      const name = args.join(' ').trim();
      if (!name) {
        return { success: false, error: 'Usage: :touch <name>' };
      }
      
      const newPath = path.join(context.state.currentPath, name);
      if (await exists(newPath)) {
        return { success: false, error: 'File already exists' };
      }
      
      await createFile(newPath);
      await context.refresh();
      return { success: true, message: `Created file: ${name}` };
    },
  },
  {
    name: 'rename',
    aliases: ['mv', 'ren'],
    description: 'Rename selected file',
    action: async (args, context) => {
      const newName = args.join(' ').trim();
      if (!newName) {
        return { success: false, error: 'Usage: :rename <new-name>' };
      }
      
      const selected = context.state.filteredEntries[context.state.selectedIndex];
      if (!selected) {
        return { success: false, error: 'No file selected' };
      }
      
      const newPath = path.join(context.state.currentPath, newName);
      if (await exists(newPath)) {
        return { success: false, error: 'A file with that name already exists' };
      }
      
      await renameFile(selected.path, newPath);
      await context.refresh();
      return { success: true, message: `Renamed to: ${newName}` };
    },
  },
  {
    name: 'bookmark',
    aliases: ['bm'],
    description: 'Manage bookmarks',
    action: async (args, context) => {
      const [subcommand, ...rest] = args;
      const name = rest.join(' ').trim();
      
      switch (subcommand) {
        case 'add':
          if (!name) {
            return { success: false, error: 'Usage: :bookmark add <name>' };
          }
          const newBookmarks = {
            ...context.state.config.bookmarks,
            [name]: context.state.currentPath,
          };
          setConfig('bookmarks', newBookmarks);
          context.dispatch({ 
            type: 'SET_CONFIG', 
            config: { bookmarks: newBookmarks } 
          });
          return { success: true, message: `Added bookmark: ${name}` };
        
        case 'remove':
        case 'delete':
        case 'rm':
          if (!name) {
            return { success: false, error: 'Usage: :bookmark remove <name>' };
          }
          const updated = { ...context.state.config.bookmarks };
          if (!updated[name]) {
            return { success: false, error: `Bookmark not found: ${name}` };
          }
          delete updated[name];
          setConfig('bookmarks', updated);
          context.dispatch({ type: 'SET_CONFIG', config: { bookmarks: updated } });
          return { success: true, message: `Removed bookmark: ${name}` };
        
        case 'list':
          const bookmarks = Object.entries(context.state.config.bookmarks);
          if (bookmarks.length === 0) {
            return { success: true, message: 'No bookmarks saved' };
          }
          const list = bookmarks.map(([n, p]) => `${n}: ${p}`).join('\n');
          return { success: true, message: `Bookmarks:\n${list}` };
        
        default:
          return { 
            success: false, 
            error: 'Usage: :bookmark <add|remove|list> [name]' 
          };
      }
    },
  },
  {
    name: 'set',
    aliases: ['config'],
    description: 'Change configuration',
    action: async (args, context) => {
      const [key, ...valueArr] = args;
      const value = valueArr.join(' ').trim();
      
      if (!key) {
        return { success: false, error: 'Usage: :set <key> <value>' };
      }
      
      switch (key) {
        case 'icons':
          if (!['nerd', 'unicode', 'ascii', 'none'].includes(value)) {
            return { success: false, error: 'Icons: nerd, unicode, ascii, none' };
          }
          setConfig('icons', value as any);
          context.dispatch({ type: 'SET_CONFIG', config: { icons: value as any } });
          return { success: true, message: `Icons set to: ${value}` };
        
        case 'theme':
          if (!['default', 'dark', 'light', 'dracula', 'nord'].includes(value)) {
            return { success: false, error: 'Themes: default, dark, light, dracula, nord' };
          }
          setConfig('theme', value as any);
          context.dispatch({ type: 'SET_CONFIG', config: { theme: value as any } });
          return { success: true, message: `Theme set to: ${value}` };
        
        case 'hidden':
          const showHidden = value === 'true' || value === 'on' || value === '1';
          setConfig('showHidden', showHidden);
          context.dispatch({ type: 'SET_CONFIG', config: { showHidden } });
          await context.refresh();
          return { success: true, message: `Hidden files: ${showHidden ? 'shown' : 'hidden'}` };
        
        default:
          return { success: false, error: `Unknown setting: ${key}` };
      }
    },
  },
  {
    name: 'shell',
    aliases: ['terminal', 'term'],
    description: 'Open terminal',
    action: async (args, context) => {
      context.dispatch({ type: 'TOGGLE_TERMINAL' });
      return { success: true, message: 'Terminal toggled' };
    },
  },
  {
    name: 'open',
    aliases: ['o', 'run'],
    description: 'Open file with system app',
    action: async (args, context) => {
      const selected = context.state.filteredEntries[context.state.selectedIndex];
      if (!selected) {
        return { success: false, error: 'No file selected' };
      }
      
      await openWithDefault(selected.path);
      return { success: true, message: `Opened: ${selected.name}` };
    },
  },
  {
    name: 'yank',
    aliases: ['copy-path', 'cp'],
    description: 'Copy path to clipboard',
    action: async (args, context) => {
      const selected = context.state.filteredEntries[context.state.selectedIndex];
      if (!selected) {
        return { success: false, error: 'No file selected' };
      }
      
      await copyToClipboard(selected.path);
      return { success: true, message: 'Path copied to clipboard' };
    },
  },
  {
    name: 'refresh',
    aliases: ['reload', 'r'],
    description: 'Refresh directory',
    action: async (args, context) => {
      await context.refresh();
      return { success: true, message: 'Directory refreshed' };
    },
  },
  {
    name: 'home',
    aliases: ['~'],
    description: 'Go to home directory',
    action: async (args, context) => {
      await context.navigate(os.homedir());
      return { success: true };
    },
  },
  {
    name: 'help',
    aliases: ['h', '?'],
    description: 'Show help',
    action: async (args, context) => {
      context.dispatch({ type: 'SET_MODE', mode: 'help' });
      return { success: true };
    },
  },
];

// Parse and execute command
export async function executeCommand(
  input: string,
  context: CommandContext
): Promise<CommandResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return { success: false, error: 'No command entered' };
  }
  
  const parts = trimmed.split(/\s+/);
  const cmdName = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  // Find matching command
  const command = commands.find(
    cmd => cmd.name === cmdName || cmd.aliases.includes(cmdName)
  );
  
  if (!command) {
    return { success: false, error: `Unknown command: ${cmdName}` };
  }
  
  try {
    return await command.action(args, context);
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Command failed' 
    };
  }
}

// Get command suggestions for autocomplete
export function getCommandSuggestions(input: string): string[] {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return commands.map(c => c.name);
  }
  
  return commands
    .filter(cmd => 
      cmd.name.startsWith(trimmed) || 
      cmd.aliases.some(a => a.startsWith(trimmed))
    )
    .map(c => c.name);
}

// Get all commands for help
export function getAllCommands(): { name: string; description: string }[] {
  return commands.map(c => ({
    name: c.name,
    description: c.description,
  }));
}
