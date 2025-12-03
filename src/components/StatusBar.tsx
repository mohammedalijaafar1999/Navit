// Status bar component - shows keybindings and status info

import React from 'react';
import { Box, Text } from 'ink';
import { useAppState } from '../state/AppState.js';

export function StatusBar() {
  const { state } = useAppState();
  const { 
    mode, 
    theme, 
    filteredEntries, 
    selectedIndex,
    selectedFiles,
    message,
    error,
    clipboard,
  } = state;
  
  // Mode-specific hints
  const getHints = () => {
    switch (mode) {
      case 'search':
        return 'Type to filter │ Enter: confirm │ Esc: cancel';
      case 'command':
        return 'Type command │ Tab: autocomplete │ Enter: run │ Esc: cancel';
      case 'confirm':
        return 'y: confirm │ n/Esc: cancel';
      case 'input':
        return 'Enter: confirm │ Esc: cancel';
      case 'help':
        return 'Press any key to close';
      case 'bookmarks':
        return 'Enter: go │ d: delete │ Esc: cancel';
      default:
        return 'j/k:nav │ Enter:open │ /:search │ ::cmd │ ?:help │ q:quit';
    }
  };
  
  // File count and selection info
  const fileInfo = () => {
    const total = filteredEntries.length;
    const current = selectedIndex + 1;
    const selected = selectedFiles.size;
    
    let info = `${current}/${total}`;
    if (selected > 0) {
      info += ` (${selected} selected)`;
    }
    return info;
  };
  
  // Clipboard indicator
  const clipboardInfo = () => {
    if (!clipboard) return null;
    const op = clipboard.operation === 'copy' ? '📋' : '✂️';
    return `${op} ${clipboard.files.length} file(s)`;
  };
  
  return (
    <Box
      borderStyle="single"
      borderColor={theme.border}
      paddingX={1}
      flexDirection="row"
      justifyContent="space-between"
    >
      {/* Left side: hints or message */}
      <Box flexGrow={1}>
        {error ? (
          <Text color="#F14C4C">⚠ {error}</Text>
        ) : message ? (
          <Text color={theme.gitAdded}>✓ {message}</Text>
        ) : (
          <Text color={theme.file} dimColor>{getHints()}</Text>
        )}
      </Box>
      
      {/* Right side: file info and clipboard */}
      <Box>
        {clipboardInfo() && (
          <Text color={theme.gitModified}>
            {clipboardInfo()}{' │ '}
          </Text>
        )}
        <Text color={theme.file}>{fileInfo()}</Text>
      </Box>
    </Box>
  );
}
