// File list component - left pane showing directory contents

import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState } from '../state/AppState.js';
import { getIcon, getFileColor, formatSize, formatDate, FileEntry } from '../utils/fileSystem.js';

interface FileListProps {
  height: number;
  width: number;
}

export function FileList({ height, width }: FileListProps) {
  const { state } = useAppState();
  const { 
    filteredEntries, 
    selectedIndex, 
    scrollOffset, 
    selectedFiles,
    theme, 
    config,
    gitInfo,
  } = state;
  
  // Calculate visible items
  const visibleHeight = height - 2; // Account for borders
  const visibleItems = useMemo(() => {
    return filteredEntries.slice(scrollOffset, scrollOffset + visibleHeight);
  }, [filteredEntries, scrollOffset, visibleHeight]);
  
  // Render a single file entry
  const renderEntry = (entry: FileEntry, index: number) => {
    const actualIndex = scrollOffset + index;
    const isSelected = actualIndex === selectedIndex;
    const isMarked = selectedFiles.has(entry.path);
    
    // Apply git status from gitInfo
    if (gitInfo?.status && gitInfo.status.has(entry.name)) {
      entry = { ...entry, gitStatus: gitInfo.status.get(entry.name) };
    }
    
    // Get icon and color
    const icon = getIcon(entry, config.icons);
    const color = getFileColor(entry, theme);
    
    // Selection indicator
    const marker = isMarked ? '●' : ' ';
    
    // Git status indicator
    let gitIndicator = ' ';
    if (entry.gitStatus) {
      switch (entry.gitStatus) {
        case 'modified': gitIndicator = 'M'; break;
        case 'added': 
        case 'staged': gitIndicator = 'A'; break;
        case 'deleted': gitIndicator = 'D'; break;
        case 'renamed': gitIndicator = 'R'; break;
        case 'untracked': gitIndicator = '?'; break;
      }
    }
    
    // Calculate available width for name
    const iconWidth = config.icons !== 'none' ? 2 : 0;
    const markerWidth = 2;
    const gitWidth = config.columns.includes('git') ? 2 : 0;
    const sizeWidth = config.columns.includes('size') && !entry.isDirectory ? 8 : 0;
    const nameWidth = width - iconWidth - markerWidth - gitWidth - sizeWidth - 4;
    
    // Truncate name if needed
    let displayName = entry.name;
    if (displayName.length > nameWidth) {
      displayName = displayName.slice(0, nameWidth - 1) + '…';
    }
    
    // Cursor indicator
    const cursor = isSelected ? '▶' : ' ';
    
    return (
      <Box key={entry.path} flexDirection="row">
        <Text 
          backgroundColor={isSelected ? theme.selected : undefined}
          color={isSelected ? '#FFFFFF' : theme.cursor}
        >
          {cursor}
        </Text>
        <Text 
          color={isMarked ? theme.gitAdded : theme.file}
          backgroundColor={isSelected ? theme.selected : undefined}
        >
          {marker}
        </Text>
        {config.icons !== 'none' && (
          <Text 
            backgroundColor={isSelected ? theme.selected : undefined}
            color={color}
          >
            {icon}{' '}
          </Text>
        )}
        <Text 
          color={color} 
          bold={entry.isDirectory}
          backgroundColor={isSelected ? theme.selected : undefined}
        >
          {displayName.padEnd(nameWidth)}
        </Text>
        {config.columns.includes('git') && (
          <Text 
            color={entry.gitStatus ? getGitStatusColor(entry.gitStatus, theme) : theme.file}
            backgroundColor={isSelected ? theme.selected : undefined}
          >
            {' '}{gitIndicator}
          </Text>
        )}
        {config.columns.includes('size') && !entry.isDirectory && (
          <Text 
            color={theme.file} 
            dimColor
            backgroundColor={isSelected ? theme.selected : undefined}
          >
            {' '}{formatSize(entry.size).padStart(7)}
          </Text>
        )}
      </Box>
    );
  };
  
  // Empty directory message
  if (filteredEntries.length === 0) {
    return (
      <Box 
        borderStyle="single" 
        borderColor={theme.border}
        width={width}
        height={height}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Text color={theme.hidden}>
          {state.searchQuery ? 'No matches found' : 'Empty directory'}
        </Text>
      </Box>
    );
  }
  
  // Scrollbar calculation
  const showScrollbar = filteredEntries.length > visibleHeight;
  const scrollbarHeight = Math.max(1, Math.floor(visibleHeight * (visibleHeight / filteredEntries.length)));
  const scrollbarPosition = Math.floor((scrollOffset / Math.max(1, filteredEntries.length - visibleHeight)) * (visibleHeight - scrollbarHeight));
  
  return (
    <Box 
      borderStyle="single" 
      borderColor={theme.border}
      width={width}
      height={height}
      flexDirection="row"
    >
      <Box flexDirection="column" flexGrow={1}>
        {visibleItems.map((entry, index) => renderEntry(entry, index))}
        {/* Fill empty space */}
        {Array.from({ length: Math.max(0, visibleHeight - visibleItems.length) }).map((_, i) => (
          <Text key={`empty-${i}`}> </Text>
        ))}
      </Box>
      
      {/* Scrollbar */}
      {showScrollbar && (
        <Box flexDirection="column" width={1}>
          {Array.from({ length: visibleHeight }).map((_, i) => (
            <Text 
              key={`scroll-${i}`} 
              color={i >= scrollbarPosition && i < scrollbarPosition + scrollbarHeight ? theme.headerFg : theme.border}
            >
              {i >= scrollbarPosition && i < scrollbarPosition + scrollbarHeight ? '█' : '░'}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}

// Helper to get git status color
function getGitStatusColor(status: string, theme: any): string {
  switch (status) {
    case 'modified': return theme.gitModified;
    case 'added':
    case 'staged': return theme.gitAdded;
    case 'deleted': return theme.gitDeleted;
    case 'renamed': return theme.gitRenamed;
    case 'untracked': return theme.gitUntracked;
    default: return theme.file;
  }
}
