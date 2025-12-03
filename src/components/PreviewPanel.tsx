// Preview panel component - shows file metadata and content preview

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { useAppState } from '../state/AppState.js';
import { formatSize, formatDate, FileEntry } from '../utils/fileSystem.js';
import { highlightCode, addLineNumbers } from '../utils/highlight.js';

interface PreviewPanelProps {
  height: number;
  width: number;
}

export function PreviewPanel({ height, width }: PreviewPanelProps) {
  const { state } = useAppState();
  const { 
    filteredEntries, 
    selectedIndex, 
    previewContent, 
    previewIsBinary,
    previewScrollOffset,
    theme, 
    config 
  } = state;
  
  // Get currently selected file
  const selectedFile = filteredEntries[selectedIndex];
  
  // Metadata section height
  const metadataHeight = 5;
  const previewHeight = height - metadataHeight - 3; // Account for borders and separator
  
  // Process preview content
  const previewLines = useMemo(() => {
    if (!previewContent || previewIsBinary) return [];
    
    let content = previewContent;
    
    // Apply syntax highlighting if enabled
    if (config.preview.syntaxHighlight && selectedFile && !selectedFile.isDirectory) {
      try {
        content = highlightCode(content, selectedFile.name);
      } catch {
        // Ignore highlighting errors
      }
    }
    
    return content.split('\n');
  }, [previewContent, previewIsBinary, config.preview.syntaxHighlight, selectedFile]);
  
  // Visible preview lines
  const visibleLines = useMemo(() => {
    return previewLines.slice(previewScrollOffset, previewScrollOffset + previewHeight);
  }, [previewLines, previewScrollOffset, previewHeight]);
  
  // Render metadata section
  const renderMetadata = () => {
    if (!selectedFile) {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text color={theme.hidden}>No file selected</Text>
        </Box>
      );
    }
    
    return (
      <Box flexDirection="column" paddingX={1}>
        {/* File name with icon */}
        <Box flexDirection="row">
          <Text color={theme.headerFg} bold>
            {selectedFile.isDirectory ? '📁 ' : '📄 '}
            {selectedFile.name}
          </Text>
        </Box>
        
        {/* File details */}
        <Box flexDirection="row" marginTop={1}>
          <Text color={theme.file}>
            <Text dimColor>Size: </Text>
            {selectedFile.isDirectory ? '<dir>' : formatSize(selectedFile.size)}
          </Text>
          <Text color={theme.file}>
            <Text dimColor>  │  Modified: </Text>
            {formatDate(selectedFile.modified)}
          </Text>
        </Box>
        
        <Box flexDirection="row">
          <Text color={theme.file}>
            <Text dimColor>Permissions: </Text>
            {selectedFile.permissions || '-'}
          </Text>
          {selectedFile.extension && (
            <Text color={theme.file}>
              <Text dimColor>  │  Type: </Text>
              {selectedFile.extension.slice(1).toUpperCase()}
            </Text>
          )}
        </Box>
      </Box>
    );
  };
  
  // Render preview content
  const renderPreview = () => {
    if (!selectedFile) {
      return (
        <Box flexDirection="column" alignItems="center" justifyContent="center" height={previewHeight}>
          <Text color={theme.hidden}>Select a file to preview</Text>
        </Box>
      );
    }
    
    if (selectedFile.isDirectory) {
      return (
        <Box flexDirection="column" alignItems="center" justifyContent="center" height={previewHeight}>
          <Text color={theme.directory}>📁</Text>
          <Text color={theme.hidden} dimColor>Directory</Text>
          <Text color={theme.hidden} dimColor>Press Enter to open</Text>
        </Box>
      );
    }
    
    if (previewIsBinary) {
      return (
        <Box flexDirection="column" alignItems="center" justifyContent="center" height={previewHeight}>
          <Text color={theme.hidden}>💾</Text>
          <Text color={theme.hidden}>Binary file - cannot preview</Text>
        </Box>
      );
    }
    
    if (!previewContent) {
      return (
        <Box flexDirection="column" alignItems="center" justifyContent="center" height={previewHeight}>
          <Text color={theme.hidden}>Loading preview...</Text>
        </Box>
      );
    }
    
    // Calculate line number width
    const totalLines = previewLines.length;
    const lineNumWidth = String(totalLines).length + 1;
    
    // Show scrollbar
    const showScrollbar = previewLines.length > previewHeight;
    const scrollbarHeight = Math.max(1, Math.floor(previewHeight * (previewHeight / previewLines.length)));
    const scrollbarPosition = Math.floor((previewScrollOffset / Math.max(1, previewLines.length - previewHeight)) * (previewHeight - scrollbarHeight));
    
    return (
      <Box flexDirection="row" height={previewHeight}>
        <Box flexDirection="column" flexGrow={1} overflow="hidden">
          {visibleLines.map((line, index) => {
            const lineNum = previewScrollOffset + index + 1;
            const displayLine = line.slice(0, width - lineNumWidth - 6);
            
            return (
              <Box key={index} flexDirection="row">
                {config.preview.showLineNumbers && (
                  <Text color={theme.hidden} dimColor>
                    {String(lineNum).padStart(lineNumWidth)} │ 
                  </Text>
                )}
                <Text>{displayLine}</Text>
              </Box>
            );
          })}
          {/* Fill empty space */}
          {Array.from({ length: Math.max(0, previewHeight - visibleLines.length) }).map((_, i) => (
            <Text key={`empty-${i}`}> </Text>
          ))}
        </Box>
        
        {/* Preview scrollbar */}
        {showScrollbar && (
          <Box flexDirection="column" width={1}>
            {Array.from({ length: previewHeight }).map((_, i) => (
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
  };
  
  return (
    <Box 
      borderStyle="single" 
      borderColor={theme.border}
      width={width}
      height={height}
      flexDirection="column"
    >
      {/* Metadata section */}
      <Box height={metadataHeight} flexDirection="column">
        {renderMetadata()}
      </Box>
      
      {/* Separator */}
      <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderColor={theme.border}>
        <Text> </Text>
      </Box>
      
      {/* Preview content */}
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {renderPreview()}
      </Box>
    </Box>
  );
}
