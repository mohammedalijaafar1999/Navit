// Help screen component

import React from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { useAppState } from '../state/AppState.js';
import { formatKeybinding } from '../utils/keybindings.js';

interface HelpScreenProps {
  onClose: () => void;
}

export function HelpScreen({ onClose }: HelpScreenProps) {
  const { state } = useAppState();
  const { theme, config } = state;
  const kb = config.keybindings;
  const { stdout } = useStdout();
  
  const terminalWidth = stdout?.columns || 80;
  const terminalHeight = stdout?.rows || 24;
  
  // Calculate help box dimensions
  const helpWidth = Math.min(70, terminalWidth - 4);
  const helpHeight = Math.min(terminalHeight - 6, 30);
  
  useInput(() => {
    onClose();
  });
  
  const allItems = [
    { section: 'Navigation', key: formatKeybinding(kb.down), desc: 'Move down' },
    { section: 'Navigation', key: formatKeybinding(kb.up), desc: 'Move up' },
    { section: 'Navigation', key: formatKeybinding(kb.parent), desc: 'Go to parent directory' },
    { section: 'Navigation', key: formatKeybinding(kb.open), desc: 'Open folder / Preview file' },
    { section: 'Navigation', key: formatKeybinding(kb.openExternal), desc: 'Open with system app' },
    { section: 'Navigation', key: '~', desc: 'Go to home directory' },
    { section: 'Selection', key: formatKeybinding(kb.select), desc: 'Toggle file selection' },
    { section: 'Selection', key: formatKeybinding(kb.selectAll), desc: 'Select all' },
    { section: 'Selection', key: formatKeybinding(kb.copy), desc: 'Copy selected files' },
    { section: 'Selection', key: formatKeybinding(kb.cut), desc: 'Cut selected files' },
    { section: 'Selection', key: formatKeybinding(kb.paste), desc: 'Paste files' },
    { section: 'Selection', key: formatKeybinding(kb.copyPath), desc: 'Copy path to clipboard' },
    { section: 'File Ops', key: 'n', desc: 'Create new file' },
    { section: 'File Ops', key: 'N', desc: 'Create new folder' },
    { section: 'File Ops', key: 'r', desc: 'Rename file' },
    { section: 'File Ops', key: formatKeybinding(kb.delete), desc: 'Delete selected files' },
    { section: 'View', key: formatKeybinding(kb.search), desc: 'Filter directory' },
    { section: 'View', key: formatKeybinding(kb.toggleHidden), desc: 'Toggle hidden files' },
    { section: 'View', key: formatKeybinding(kb.refresh), desc: 'Refresh directory' },
    { section: 'View', key: formatKeybinding(kb.terminal), desc: 'Toggle terminal' },
    { section: 'Other', key: formatKeybinding(kb.command), desc: 'Command palette' },
    { section: 'Other', key: formatKeybinding(kb.goToBookmark), desc: 'Go to bookmark' },
    { section: 'Other', key: 'B', desc: 'Add bookmark' },
    { section: 'Other', key: formatKeybinding(kb.help), desc: 'Show this help' },
    { section: 'Other', key: formatKeybinding(kb.quit), desc: 'Quit' },
  ];
  
  // Limit visible items based on height
  const maxVisibleItems = helpHeight - 5;
  const visibleItems = allItems.slice(0, maxVisibleItems);
  
  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={theme.headerFg}
      width={helpWidth}
      height={helpHeight}
      padding={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text color={theme.headerFg} bold>
          ═══ Navit - Keyboard Shortcuts ═══
        </Text>
      </Box>
      
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {visibleItems.map((item, index) => (
          <Box key={index} flexDirection="row">
            <Text color={theme.hidden} dimColor>
              {item.section.padEnd(11)}
            </Text>
            <Text color={theme.gitModified} bold>
              {item.key.padEnd(14)}
            </Text>
            <Text color={theme.file}>{item.desc}</Text>
          </Box>
        ))}
        {allItems.length > maxVisibleItems && (
          <Text color={theme.hidden} dimColor italic>
            ... and {allItems.length - maxVisibleItems} more
          </Text>
        )}
      </Box>
      
      <Box marginTop={1} justifyContent="center">
        <Text color={theme.hidden} dimColor>
          Press any key to close
        </Text>
      </Box>
    </Box>
  );
}
