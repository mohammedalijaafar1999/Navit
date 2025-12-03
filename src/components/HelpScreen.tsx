// Help screen component

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState } from '../state/AppState.js';

interface HelpScreenProps {
  onClose: () => void;
}

export function HelpScreen({ onClose }: HelpScreenProps) {
  const { state } = useAppState();
  const { theme, config } = state;
  
  useInput(() => {
    onClose();
  });
  
  const sections = [
    {
      title: 'Navigation',
      items: [
        ['j / ↓', 'Move down'],
        ['k / ↑', 'Move up'],
        ['h / Backspace', 'Go to parent directory'],
        ['l / Enter', 'Open folder / Preview file'],
        ['o', 'Open file with system app'],
        ['g', 'Go to bookmark'],
        ['G', 'Go to path'],
        ['~', 'Go to home directory'],
      ],
    },
    {
      title: 'Selection & Clipboard',
      items: [
        ['Space', 'Toggle file selection'],
        ['Ctrl+A', 'Select all'],
        ['Ctrl+C', 'Copy selected files'],
        ['Ctrl+X', 'Cut selected files'],
        ['Ctrl+V', 'Paste files'],
        ['y', 'Copy path to clipboard'],
      ],
    },
    {
      title: 'File Operations',
      items: [
        ['n', 'Create new file'],
        ['N', 'Create new folder'],
        ['r', 'Rename file'],
        ['Delete', 'Delete selected files'],
      ],
    },
    {
      title: 'Search & Filter',
      items: [
        ['/', 'Filter current directory'],
        ['Ctrl+F', 'Deep search (recursive)'],
        ['Esc', 'Clear filter'],
      ],
    },
    {
      title: 'View & Display',
      items: [
        ['.', 'Toggle hidden files'],
        ['Ctrl+R', 'Refresh directory'],
        ['Ctrl+T', 'Toggle terminal'],
      ],
    },
    {
      title: 'Other',
      items: [
        [':', 'Command palette'],
        ['?', 'Show this help'],
        ['b', 'Bookmarks menu'],
        ['B', 'Add bookmark'],
        ['q', 'Quit'],
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
