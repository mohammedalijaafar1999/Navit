// Header component - shows current path and git info

import React from 'react';
import { Box, Text } from 'ink';
import { useAppState } from '../state/AppState.js';
import { normalizePath } from '../utils/platform.js';
import { getIcon } from '../utils/fileSystem.js';

export function Header() {
  const { state } = useAppState();
  const { currentPath, gitInfo, theme, config, mode, searchQuery } = state;
  
  // Format path for display
  const displayPath = normalizePath(currentPath);
  
  // Git status indicator
  let gitIndicator = '';
  if (gitInfo?.isRepo) {
    const branchIcon = config.icons === 'nerd' ? ' ' : '⎇ ';
    const statusIcon = gitInfo.isClean ? '✓' : '●';
    const statusColor = gitInfo.isClean ? theme.gitAdded : theme.gitModified;
    gitIndicator = `${branchIcon}${gitInfo.branch} `;
  }
  
  // Mode indicator
  let modeIndicator = '';
  if (mode === 'search') {
    modeIndicator = ` [SEARCH: ${searchQuery}]`;
  } else if (mode === 'command') {
    modeIndicator = ' [COMMAND]';
  }
  
  return (
    <Box
      borderStyle="single"
      borderColor={theme.border}
      paddingX={1}
      flexDirection="row"
      justifyContent="space-between"
    >
      <Box flexDirection="row">
        <Text color={theme.headerFg}>
          {config.icons !== 'none' ? '📂 ' : ''}
        </Text>
        <Text color={theme.directory} bold>
          {displayPath}
        </Text>
        <Text color={theme.gitModified}>
          {modeIndicator}
        </Text>
      </Box>
      
      {gitInfo?.isRepo && (
        <Box>
          <Text color={theme.gitAdded}>
            {config.icons === 'nerd' ? ' ' : '⎇ '}
          </Text>
          <Text color="#C586C0">
            {gitInfo.branch}
          </Text>
          <Text color={gitInfo.isClean ? theme.gitAdded : theme.gitModified}>
            {' '}{gitInfo.isClean ? '✓' : '●'}
          </Text>
        </Box>
      )}
    </Box>
  );
}
