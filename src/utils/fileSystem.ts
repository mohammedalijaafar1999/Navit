// File system utilities for Navit

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { simpleGit, SimpleGit, StatusResult } from 'simple-git';
import type { IconMode, ThemeColors } from '../config.js';

// File entry interface
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSymlink: boolean;
  isHidden: boolean;
  size?: number;
  modified?: Date;
  created?: Date;
  permissions?: string;
  owner?: string;
  extension?: string;
  gitStatus?: GitStatus;
}

// Git status types
export type GitStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'staged' | 'clean';

// Git info for a directory
export interface GitInfo {
  isRepo: boolean;
  branch?: string;
  status?: Map<string, GitStatus>;
  isClean?: boolean;
}

// Icon sets
const nerdIcons: Record<string, string> = {
  // Folders
  folder: '',
  folderOpen: '',
  folderGit: '',
  folderNode: '',
  folderSrc: '',
  
  // Files
  file: '',
  fileCode: '',
  fileConfig: '',
  fileData: '',
  fileBinary: '',
  
  // Extensions
  '.ts': '',
  '.tsx': '',
  '.js': '',
  '.jsx': '',
  '.json': '',
  '.md': '',
  '.html': '',
  '.css': '',
  '.scss': '',
  '.py': '',
  '.rb': '',
  '.go': '',
  '.rs': '',
  '.java': '',
  '.c': '',
  '.cpp': '',
  '.h': '',
  '.sh': '',
  '.bash': '',
  '.zsh': '',
  '.ps1': '',
  '.yml': '',
  '.yaml': '',
  '.toml': '',
  '.xml': '',
  '.svg': '',
  '.png': '',
  '.jpg': '',
  '.jpeg': '',
  '.gif': '',
  '.ico': '',
  '.mp3': '',
  '.mp4': '',
  '.avi': '',
  '.mov': '',
  '.zip': '',
  '.tar': '',
  '.gz': '',
  '.rar': '',
  '.7z': '',
  '.pdf': '',
  '.doc': '',
  '.docx': '',
  '.xls': '',
  '.xlsx': '',
  '.ppt': '',
  '.pptx': '',
  '.txt': '',
  '.log': '',
  '.lock': '',
  '.env': '',
  '.gitignore': '',
  '.dockerignore': '',
  'Dockerfile': '',
  'docker-compose.yml': '',
  'package.json': '',
  'package-lock.json': '',
  'tsconfig.json': '',
  'webpack.config.js': '',
  'vite.config.ts': '',
  'README.md': '',
  'LICENSE': '',
};

const unicodeIcons: Record<string, string> = {
  folder: '📁',
  folderOpen: '📂',
  file: '📄',
  fileCode: '📝',
  fileConfig: '⚙️',
  fileData: '📊',
  fileBinary: '💾',
  symlink: '🔗',
};

const asciiIcons: Record<string, string> = {
  folder: '[D]',
  folderOpen: '[D]',
  file: '[F]',
  symlink: '[L]',
};

// Get icon for file/folder
export function getIcon(entry: FileEntry, iconMode: IconMode, isOpen = false): string {
  if (iconMode === 'none') return '';
  
  if (entry.isSymlink) {
    if (iconMode === 'ascii') return asciiIcons.symlink;
    return unicodeIcons.symlink;
  }
  
  if (entry.isDirectory) {
    if (iconMode === 'nerd') {
      // Special folder icons
      if (entry.name === '.git') return nerdIcons.folderGit;
      if (entry.name === 'node_modules') return nerdIcons.folderNode;
      if (entry.name === 'src') return nerdIcons.folderSrc;
      return isOpen ? nerdIcons.folderOpen : nerdIcons.folder;
    }
    if (iconMode === 'unicode') return isOpen ? unicodeIcons.folderOpen : unicodeIcons.folder;
    return asciiIcons.folder;
  }
  
  // Files
  if (iconMode === 'nerd') {
    // Check by filename first
    if (nerdIcons[entry.name]) return nerdIcons[entry.name];
    // Then by extension
    if (entry.extension && nerdIcons[entry.extension]) return nerdIcons[entry.extension];
    return nerdIcons.file;
  }
  
  if (iconMode === 'unicode') {
    // Categorize by extension
    const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h'];
    const dataExts = ['.json', '.yml', '.yaml', '.xml', '.toml', '.csv'];
    
    if (entry.extension && codeExts.includes(entry.extension)) return unicodeIcons.fileCode;
    if (entry.extension && dataExts.includes(entry.extension)) return unicodeIcons.fileData;
    return unicodeIcons.file;
  }
  
  return asciiIcons.file;
}

// Get color for file based on theme
export function getFileColor(entry: FileEntry, theme: ThemeColors): string {
  // Git status takes priority
  if (entry.gitStatus) {
    switch (entry.gitStatus) {
      case 'modified': return theme.gitModified;
      case 'added':
      case 'staged': return theme.gitAdded;
      case 'deleted': return theme.gitDeleted;
      case 'renamed': return theme.gitRenamed;
      case 'untracked': return theme.gitUntracked;
    }
  }
  
  if (entry.isSymlink) return theme.symlink;
  if (entry.isHidden) return theme.hidden;
  if (entry.isDirectory) return theme.directory;
  
  // Color by extension category
  const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.cs', '.php', '.swift', '.kt'];
  const dataExts = ['.json', '.yml', '.yaml', '.xml', '.toml', '.csv', '.sql'];
  const mediaExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.mp3', '.mp4', '.avi', '.mov', '.wav', '.webp'];
  const archiveExts = ['.zip', '.tar', '.gz', '.rar', '.7z', '.bz2'];
  const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.rtf'];
  
  if (entry.extension) {
    if (codeExts.includes(entry.extension)) return theme.code;
    if (dataExts.includes(entry.extension)) return theme.data;
    if (mediaExts.includes(entry.extension)) return theme.media;
    if (archiveExts.includes(entry.extension)) return theme.archive;
    if (docExts.includes(entry.extension)) return theme.document;
  }
  
  return theme.file;
}

// Check if file is hidden
function isHidden(name: string, filePath: string): boolean {
  // Unix-style hidden (starts with dot)
  if (name.startsWith('.')) return true;
  
  // Windows hidden attribute
  if (process.platform === 'win32') {
    try {
      // We could check attributes here, but for performance we'll just use dot prefix
      // Real Windows hidden check would require native module or child_process
    } catch {
      // Ignore
    }
  }
  
  return false;
}

// Convert permissions to string
function formatPermissions(mode: number): string {
  const types = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
  const owner = types[(mode >> 6) & 7];
  const group = types[(mode >> 3) & 7];
  const other = types[mode & 7];
  return `${owner}${group}${other}`;
}

// Read directory entries
export async function readDirectory(
  dirPath: string,
  showHidden: boolean = false
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const hidden = isHidden(item.name, fullPath);
      
      // Skip hidden files if not showing them
      if (hidden && !showHidden) continue;
      
      try {
        const stats = await fs.stat(fullPath);
        const lstat = await fs.lstat(fullPath);
        
        entries.push({
          name: item.name,
          path: fullPath,
          isDirectory: item.isDirectory(),
          isSymlink: lstat.isSymbolicLink(),
          isHidden: hidden,
          size: item.isFile() ? stats.size : undefined,
          modified: stats.mtime,
          created: stats.birthtime,
          permissions: formatPermissions(stats.mode),
          extension: item.isFile() ? path.extname(item.name).toLowerCase() : undefined,
        });
      } catch {
        // File might be inaccessible, add with minimal info
        entries.push({
          name: item.name,
          path: fullPath,
          isDirectory: item.isDirectory(),
          isSymlink: false,
          isHidden: hidden,
        });
      }
    }
  } catch (err) {
    throw new Error(`Cannot read directory: ${dirPath}`);
  }
  
  // Sort: directories first, then alphabetically
  return entries.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

// Get file preview content
export async function getFilePreview(
  filePath: string,
  maxSize: number = 1024 * 1024
): Promise<{ content: string; isBinary: boolean; truncated: boolean }> {
  try {
    const stats = await fs.stat(filePath);
    
    if (stats.size > maxSize) {
      // Read only first maxSize bytes
      const handle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(maxSize);
      await handle.read(buffer, 0, maxSize, 0);
      await handle.close();
      
      const content = buffer.toString('utf-8');
      const isBinary = isBinaryContent(buffer);
      
      return { content: isBinary ? '' : content, isBinary, truncated: true };
    }
    
    const buffer = await fs.readFile(filePath);
    const isBinary = isBinaryContent(buffer);
    
    return {
      content: isBinary ? '' : buffer.toString('utf-8'),
      isBinary,
      truncated: false,
    };
  } catch (err) {
    return { content: '', isBinary: false, truncated: false };
  }
}

// Check if content is binary
function isBinaryContent(buffer: Buffer): boolean {
  // Check for null bytes or high concentration of non-printable chars
  const checkLength = Math.min(buffer.length, 8000);
  let nonPrintable = 0;
  
  for (let i = 0; i < checkLength; i++) {
    const byte = buffer[i];
    // Null byte is a strong indicator of binary
    if (byte === 0) return true;
    // Count non-printable, non-whitespace chars
    if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
      nonPrintable++;
    }
  }
  
  // If more than 10% non-printable, consider it binary
  return nonPrintable / checkLength > 0.1;
}

// Get git info for directory
export async function getGitInfo(dirPath: string): Promise<GitInfo> {
  try {
    const git: SimpleGit = simpleGit(dirPath);
    
    // Check if it's a git repo
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return { isRepo: false };
    }
    
    // Get current branch
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
    
    // Get status
    const status: StatusResult = await git.status();
    const statusMap = new Map<string, GitStatus>();
    
    // Modified files
    status.modified.forEach(f => statusMap.set(path.basename(f), 'modified'));
    status.created.forEach(f => statusMap.set(path.basename(f), 'added'));
    status.deleted.forEach(f => statusMap.set(path.basename(f), 'deleted'));
    status.renamed.forEach(f => statusMap.set(path.basename(f.to), 'renamed'));
    status.not_added.forEach(f => statusMap.set(path.basename(f), 'untracked'));
    status.staged.forEach(f => statusMap.set(path.basename(f), 'staged'));
    
    return {
      isRepo: true,
      branch: branch.trim(),
      status: statusMap,
      isClean: status.isClean(),
    };
  } catch {
    return { isRepo: false };
  }
}

// Format file size
export function formatSize(bytes?: number): string {
  if (bytes === undefined) return '-';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

// Format date
export function formatDate(date?: Date): string {
  if (!date) return '-';
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } else if (days < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } else if (days < 365) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

// File operations
export async function copyFile(src: string, dest: string): Promise<void> {
  const stats = await fs.stat(src);
  if (stats.isDirectory()) {
    await fs.cp(src, dest, { recursive: true });
  } else {
    await fs.copyFile(src, dest);
  }
}

export async function moveFile(src: string, dest: string): Promise<void> {
  await fs.rename(src, dest);
}

export async function deleteFile(filePath: string): Promise<void> {
  const stats = await fs.stat(filePath);
  if (stats.isDirectory()) {
    await fs.rm(filePath, { recursive: true });
  } else {
    await fs.unlink(filePath);
  }
}

export async function createDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function createFile(filePath: string, content: string = ''): Promise<void> {
  await fs.writeFile(filePath, content);
}

export async function renameFile(oldPath: string, newPath: string): Promise<void> {
  await fs.rename(oldPath, newPath);
}

// Check if path exists
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Get file stats
export async function getStats(filePath: string) {
  return fs.stat(filePath);
}

// Resolve path with home directory support
export function resolvePath(inputPath: string): string {
  if (inputPath.startsWith('~')) {
    return path.join(os.homedir(), inputPath.slice(1));
  }
  return path.resolve(inputPath);
}
