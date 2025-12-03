// Syntax highlighting utility

import { highlight } from 'cli-highlight';

// Language detection by extension
const extensionToLanguage: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.json': 'json',
  '.md': 'markdown',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.py': 'python',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin',
  '.swift': 'swift',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.php': 'php',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.ps1': 'powershell',
  '.sql': 'sql',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.toml': 'ini',
  '.ini': 'ini',
  '.xml': 'xml',
  '.svg': 'xml',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.dockerfile': 'dockerfile',
  '.makefile': 'makefile',
  '.mk': 'makefile',
  '.lua': 'lua',
  '.r': 'r',
  '.pl': 'perl',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.erl': 'erlang',
  '.hs': 'haskell',
  '.clj': 'clojure',
  '.scala': 'scala',
  '.vim': 'vim',
  '.diff': 'diff',
  '.patch': 'diff',
};

// Get language from filename
export function getLanguage(filename: string): string | undefined {
  const lowerName = filename.toLowerCase();
  
  // Check special filenames
  if (lowerName === 'dockerfile') return 'dockerfile';
  if (lowerName === 'makefile') return 'makefile';
  if (lowerName === '.gitignore') return 'ini';
  if (lowerName === '.env') return 'ini';
  if (lowerName === '.editorconfig') return 'ini';
  
  // Check extension
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return undefined;
  
  const ext = filename.slice(lastDot).toLowerCase();
  return extensionToLanguage[ext];
}

// Highlight code with syntax highlighting
export function highlightCode(code: string, filename: string): string {
  const language = getLanguage(filename);
  
  if (!language) {
    return code;
  }
  
  try {
    return highlight(code, {
      language,
      ignoreIllegals: true,
    });
  } catch {
    // If highlighting fails, return plain text
    return code;
  }
}

// Add line numbers to code
export function addLineNumbers(code: string, startLine: number = 1): string {
  const lines = code.split('\n');
  const maxLineNum = startLine + lines.length - 1;
  const padLength = String(maxLineNum).length;
  
  return lines
    .map((line, index) => {
      const lineNum = String(startLine + index).padStart(padLength, ' ');
      return `\x1b[90m${lineNum} │\x1b[0m ${line}`;
    })
    .join('\n');
}
