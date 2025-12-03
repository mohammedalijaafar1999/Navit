// Navit - Terminal File Explorer
// Configuration Types and Defaults

import Conf from 'conf';
import os from 'os';
import path from 'path';
import * as fs from 'fs';

// Icon display modes
export type IconMode = 'nerd' | 'unicode' | 'ascii' | 'none';

// Available themes
export type ThemeName = 'default' | 'dark' | 'light' | 'dracula' | 'nord';

// Keybinding configuration
export interface KeyBindings {
  up: string[];
  down: string[];
  parent: string[];
  open: string[];
  preview: string[];
  openExternal: string[];
  search: string[];
  deepSearch: string[];
  command: string[];
  help: string[];
  toggleHidden: string[];
  copy: string[];
  cut: string[];
  paste: string[];
  delete: string[];
  select: string[];
  selectAll: string[];
  quit: string[];
  refresh: string[];
  terminal: string[];
  copyPath: string[];
  bookmark: string[];
  goToBookmark: string[];
  newFile: string[];
  newFolder: string[];
  rename: string[];
  home: string[];
  pageUp: string[];
  pageDown: string[];
}

// Preview configuration
export interface PreviewConfig {
  maxFileSize: number;       // Max file size to preview in bytes
  syntaxHighlight: boolean;  // Enable syntax highlighting
  wrapLines: boolean;        // Wrap long lines
  showLineNumbers: boolean;  // Show line numbers
}

// Theme colors
export interface ThemeColors {
  // File types
  directory: string;
  file: string;
  executable: string;
  symlink: string;
  hidden: string;
  
  // Git status
  gitModified: string;
  gitAdded: string;
  gitDeleted: string;
  gitUntracked: string;
  gitRenamed: string;
  
  // UI elements
  border: string;
  selected: string;
  cursor: string;
  headerBg: string;
  headerFg: string;
  statusBar: string;
  preview: string;
  
  // File extensions
  code: string;
  data: string;
  media: string;
  archive: string;
  document: string;
}

// Column options
export type ColumnType = 'name' | 'size' | 'modified' | 'created' | 'permissions' | 'owner' | 'type' | 'git';

// Main configuration interface
export interface NavitConfig {
  // Display
  icons: IconMode;
  theme: ThemeName;
  showHidden: boolean;
  columns: ColumnType[];
  
  // Behavior
  exitToCwd: boolean;
  confirmDelete: boolean;
  followSymlinks: boolean;
  
  // Preview
  preview: PreviewConfig;
  
  // Keybindings
  keybindings: KeyBindings;
  
  // Bookmarks
  bookmarks: Record<string, string>;
  
  // Custom themes
  customThemes?: Record<string, ThemeColors>;
  
  // Shell configuration
  shell?: string;
}

// Default keybindings
export const defaultKeybindings: KeyBindings = {
  up: ['k', 'up'],
  down: ['j', 'down'],
  parent: ['h', 'backspace'],
  open: ['l', 'return'],
  preview: ['return'],
  openExternal: ['o'],
  search: ['/'],
  deepSearch: ['ctrl+f'],
  command: [':'],
  help: ['?'],
  toggleHidden: ['.', 'ctrl+h'],
  copy: ['ctrl+c'],
  cut: ['ctrl+x'],
  paste: ['ctrl+v'],
  delete: ['delete', 'ctrl+d'],
  select: [' '],
  selectAll: ['ctrl+a'],
  quit: ['q', 'ctrl+q'],
  refresh: ['ctrl+r'],
  terminal: ['ctrl+t'],
  copyPath: ['y'],
  bookmark: ['b'],
  goToBookmark: ['g'],
  newFile: ['n'],
  newFolder: ['shift+n'],
  rename: ['shift+r'],
  home: ['~'],
  pageUp: ['pageup'],
  pageDown: ['pagedown'],
};

// Default theme colors
export const defaultTheme: ThemeColors = {
  directory: '#569CD6',     // Blue
  file: '#D4D4D4',          // Light gray
  executable: '#4EC9B0',    // Teal
  symlink: '#C586C0',       // Purple
  hidden: '#6A6A6A',        // Dark gray
  
  gitModified: '#E2C08D',   // Yellow
  gitAdded: '#89D185',      // Green
  gitDeleted: '#F14C4C',    // Red
  gitUntracked: '#6A6A6A',  // Gray
  gitRenamed: '#C586C0',    // Purple
  
  border: '#3C3C3C',
  selected: '#264F78',
  cursor: '#094771',
  headerBg: '#007ACC',
  headerFg: '#FFFFFF',
  statusBar: '#007ACC',
  preview: '#1E1E1E',
  
  code: '#DCDCAA',          // Yellow
  data: '#CE9178',          // Orange
  media: '#C586C0',         // Purple
  archive: '#D16969',       // Red
  document: '#4FC1FF',      // Cyan
};

// Theme presets
export const themes: Record<ThemeName, ThemeColors> = {
  default: defaultTheme,
  dark: defaultTheme,
  light: {
    ...defaultTheme,
    directory: '#0000FF',
    file: '#000000',
    border: '#CCCCCC',
    selected: '#ADD6FF',
    cursor: '#0078D4',
    headerBg: '#0078D4',
    preview: '#FFFFFF',
  },
  dracula: {
    ...defaultTheme,
    directory: '#BD93F9',
    file: '#F8F8F2',
    executable: '#50FA7B',
    symlink: '#FF79C6',
    hidden: '#6272A4',
    gitModified: '#FFB86C',
    gitAdded: '#50FA7B',
    gitDeleted: '#FF5555',
    border: '#44475A',
    selected: '#44475A',
    cursor: '#6272A4',
    headerBg: '#6272A4',
    statusBar: '#44475A',
    preview: '#282A36',
  },
  nord: {
    ...defaultTheme,
    directory: '#81A1C1',
    file: '#ECEFF4',
    executable: '#A3BE8C',
    symlink: '#B48EAD',
    hidden: '#4C566A',
    gitModified: '#EBCB8B',
    gitAdded: '#A3BE8C',
    gitDeleted: '#BF616A',
    border: '#3B4252',
    selected: '#434C5E',
    cursor: '#4C566A',
    headerBg: '#5E81AC',
    statusBar: '#3B4252',
    preview: '#2E3440',
  },
};

// Default configuration
export const defaultConfig: NavitConfig = {
  icons: 'unicode',
  theme: 'default',
  showHidden: false,
  columns: ['name', 'size', 'modified'],
  exitToCwd: true,
  confirmDelete: true,
  followSymlinks: true,
  preview: {
    maxFileSize: 1024 * 1024,  // 1MB
    syntaxHighlight: true,
    wrapLines: false,
    showLineNumbers: true,
  },
  keybindings: defaultKeybindings,
  bookmarks: {
    home: os.homedir(),
  },
};

// Config store
const config = new Conf<NavitConfig>({
  projectName: 'navit',
  defaults: defaultConfig,
  schema: {
    icons: {
      type: 'string',
      enum: ['nerd', 'unicode', 'ascii', 'none'],
    },
    theme: {
      type: 'string',
    },
    showHidden: {
      type: 'boolean',
    },
    exitToCwd: {
      type: 'boolean',
    },
    confirmDelete: {
      type: 'boolean',
    },
    columns: {
      type: 'array',
      items: { type: 'string' },
    },
    followSymlinks: {
      type: 'boolean',
    },
    preview: {
      type: 'object',
    },
    keybindings: {
      type: 'object',
    },
    bookmarks: {
      type: 'object',
    },
  } as const,
});

// Get merged config (global + local if exists)
export function getConfig(localPath?: string): NavitConfig {
  const globalConfig = config.store;
  
  if (localPath) {
    const localConfigPath = path.join(localPath, '.navit.json');
    try {
      if (fs.existsSync(localConfigPath)) {
        const localConfig = JSON.parse(fs.readFileSync(localConfigPath, 'utf-8'));
        return { ...globalConfig, ...localConfig };
      }
    } catch {
      // Ignore local config errors
    }
  }
  
  return globalConfig;
}

// Update config
export function setConfig<K extends keyof NavitConfig>(key: K, value: NavitConfig[K]): void {
  config.set(key, value);
}

// Get theme colors
export function getTheme(themeName: ThemeName, customThemes?: Record<string, ThemeColors>): ThemeColors {
  if (customThemes?.[themeName]) {
    return customThemes[themeName];
  }
  return themes[themeName] || themes.default;
}

export { config };
