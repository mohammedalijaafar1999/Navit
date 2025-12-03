// Bookmarks component

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState, useAppActions } from '../state/AppState.js';
import { setConfig } from '../config.js';

interface BookmarksProps {
  onSelect: (path: string) => void;
  onClose: () => void;
}

export function BookmarksList({ onSelect, onClose }: BookmarksProps) {
  const { state } = useAppState();
  const { config, theme } = state;
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const bookmarks = Object.entries(config.bookmarks);
  
  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }
    
    if (key.return && bookmarks.length > 0) {
      const [, path] = bookmarks[selectedIndex];
      onSelect(path);
      return;
    }
    
    if (input === 'j' || key.downArrow) {
      setSelectedIndex(prev => Math.min(prev + 1, bookmarks.length - 1));
    } else if (input === 'k' || key.upArrow) {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (input === 'd' && bookmarks.length > 0) {
      // Delete bookmark
      const [name] = bookmarks[selectedIndex];
      const newBookmarks = { ...config.bookmarks };
      delete newBookmarks[name];
      setConfig('bookmarks', newBookmarks);
    }
  });
  
  if (bookmarks.length === 0) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor={theme.border}
        padding={1}
      >
        <Text color={theme.headerFg} bold>📑 Bookmarks</Text>
        <Text color={theme.hidden}>No bookmarks saved</Text>
        <Text color={theme.hidden} dimColor>
          Press 'B' in normal mode to add current directory
        </Text>
        <Box marginTop={1}>
          <Text color={theme.hidden} dimColor>Press Esc to close</Text>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.border}
      padding={1}
    >
      <Text color={theme.headerFg} bold>📑 Bookmarks</Text>
      <Box flexDirection="column" marginTop={1}>
        {bookmarks.map(([name, path], index) => (
          <Box key={name} flexDirection="row">
            <Text
              color={index === selectedIndex ? theme.headerFg : theme.file}
              backgroundColor={index === selectedIndex ? theme.selected : undefined}
            >
              {index === selectedIndex ? '▶ ' : '  '}
              <Text bold>{name}</Text>
              <Text dimColor> → {path}</Text>
            </Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color={theme.hidden} dimColor>
          Enter: go │ d: delete │ Esc: close
        </Text>
      </Box>
    </Box>
  );
}

interface AddBookmarkProps {
  path: string;
  onAdd: (name: string) => void;
  onCancel: () => void;
}

export function AddBookmark({ path, onAdd, onCancel }: AddBookmarkProps) {
  const { state } = useAppState();
  const { theme } = state;
  const [name, setName] = useState('');
  
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    } else if (key.return && name.trim()) {
      onAdd(name.trim());
    } else if (key.backspace || key.delete) {
      setName(prev => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setName(prev => prev + input);
    }
  });
  
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.headerFg}
      padding={1}
    >
      <Text color={theme.headerFg} bold>📑 Add Bookmark</Text>
      <Box marginTop={1}>
        <Text color={theme.file}>Path: </Text>
        <Text color={theme.directory}>{path}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={theme.file}>Name: </Text>
        <Text color={theme.headerFg}>{name}</Text>
        <Text color={theme.headerFg}>█</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={theme.hidden} dimColor>
          Enter: save │ Esc: cancel
        </Text>
      </Box>
    </Box>
  );
}
