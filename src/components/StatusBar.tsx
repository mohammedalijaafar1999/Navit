// Status bar component - shows keybindings and status info

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { useAppState } from '../state/AppState.js';
import { formatKeybinding } from '../utils/keybindings.js';

export function StatusBar() {
  const { state } = useAppState();
  const { 
    mode, 
    theme, 
    config,
    filteredEntries, 
    selectedIndex,
    selectedFiles,
    message,
    error,
    clipboard,
    terminalOpen,
  } = state;
  
  const kb = config.keybindings;
  
  // Mode-specific hints with configurable keybindings
  const getHints = useMemo(() => {
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
        // Build hints from keybindings
        const navKey = formatKeybinding(kb.down.slice(0, 1)) + '/' + formatKeybinding(kb.up.slice(0, 1));
        const openKey = formatKeybinding(kb.open.slice(0, 1));
        const searchKey = formatKeybinding(kb.search);
        const cmdKey = formatKeybinding(kb.command);
        const helpKey = formatKeybinding(kb.help);
        const quitKey = formatKeybinding(kb.quit.slice(0, 1));
        const termKey = formatKeybinding(kb.terminal);
        
        let hints = `${navKey}:nav │ ${openKey}:open │ ${searchKey}:search │ ${cmdKey}:cmd │ ${helpKey}:help │ ${quitKey}:quit`;
        if (terminalOpen) {
          hints = `${termKey}:terminal │ ` + hints;
        }
        return hints;
    }
  }, [mode, kb, terminalOpen]);
  
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
// Left side: hints or message
      <Box flexGrow={1}>
        {error ? (
          <Text color="#F14C4C">⚠ {error}</Text>
        ) : message ? (
          <Text color={theme.gitAdded}>✓ {message}</Text>
        ) : (
          <Text color={theme.file} dimColor>{getHints}</Text>
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
