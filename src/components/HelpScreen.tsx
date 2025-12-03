// Help screen component

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState } from '../state/AppState.js';
import { formatKeybinding } from '../utils/keybindings.js';

interface HelpScreenProps {
  onClose: () => void;
}

export function HelpScreen({ onClose }: HelpScreenProps) {
  const { state } = useAppState();
  const { theme, config } = state;
  const kb = config.keybindings;
  
  useInput(() => {
    onClose();
  });
  
  const sections = [
    {
      title: 'Navigation',
      items: [
        [formatKeybinding(kb.down), 'Move down'],
        [formatKeybinding(kb.up), 'Move up'],
        [formatKeybinding(kb.parent), 'Go to parent directory'],
        [formatKeybinding(kb.open), 'Open folder / Preview file'],
        [formatKeybinding(kb.openExternal), 'Open file with system app'],
        [formatKeybinding(kb.goToBookmark), 'Go to bookmark'],
        ['~', 'Go to home directory'],
      ],
    },
    {
      title: 'Selection & Clipboard',
      items: [
        [formatKeybinding(kb.select), 'Toggle file selection'],
        [formatKeybinding(kb.selectAll), 'Select all'],
        [formatKeybinding(kb.copy), 'Copy selected files'],
        [formatKeybinding(kb.cut), 'Cut selected files'],
        [formatKeybinding(kb.paste), 'Paste files'],
        [formatKeybinding(kb.copyPath), 'Copy path to clipboard'],
      ],
    },
    {
      title: 'File Operations',
      items: [
        ['n', 'Create new file'],
        ['N / Shift+n', 'Create new folder'],
        ['R / Shift+r', 'Rename file'],
        [formatKeybinding(kb.delete), 'Delete selected files'],
      ],
    },
    {
      title: 'Search & Filter',
      items: [
        [formatKeybinding(kb.search), 'Filter current directory'],
        [formatKeybinding(kb.deepSearch), 'Deep search (recursive)'],
        ['Esc', 'Clear filter'],
      ],
    },
    {
      title: 'View & Display',
      items: [
        [formatKeybinding(kb.toggleHidden), 'Toggle hidden files'],
        [formatKeybinding(kb.refresh), 'Refresh directory'],
        [formatKeybinding(kb.terminal), 'Toggle terminal'],
      ],
    },
    {
      title: 'Other',
      items: [
        [formatKeybinding(kb.command), 'Command palette'],
        [formatKeybinding(kb.help), 'Show this help'],
        [formatKeybinding(kb.bookmark), 'Bookmarks menu'],
        ['B / Shift+b', 'Add bookmark'],
        [formatKeybinding(kb.quit), 'Quit'],
      ],
    },
  ];
  
  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor={theme.headerFg}
      padding={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text color={theme.headerFg} bold>
          ╔══════════════════════════════════════╗
        </Text>
      </Box>
      <Box justifyContent="center" marginBottom={1}>
        <Text color={theme.headerFg} bold>
           Navit - Keyboard Shortcuts 
        </Text>
      </Box>
      <Box justifyContent="center" marginBottom={1}>
        <Text color={theme.headerFg} bold>
          ╚══════════════════════════════════════╝
        </Text>
      </Box>
      
      <Box flexDirection="row" flexWrap="wrap">
        {sections.map((section, sectionIndex) => (
          <Box 
            key={section.title} 
            flexDirection="column" 
            marginRight={4}
            marginBottom={1}
            width={30}
          >
            <Text color={theme.directory} bold underline>
              {section.title}
            </Text>
            {section.items.map(([key, desc]) => (
              <Box key={key} flexDirection="row">
                <Text color={theme.gitModified} bold>
                  {key.padEnd(12)}
                </Text>
                <Text color={theme.file}>{desc}</Text>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
      
      <Box marginTop={1} justifyContent="center">
        <Text color={theme.hidden} dimColor>
          Press any key to close
        </Text>
      </Box>
    </Box>
  );
}
