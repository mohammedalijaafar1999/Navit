// Main App component

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { AppProvider, useAppState, useAppActions, AppMode } from './state/AppState.js';
import { Header } from './components/Header.js';
import { FileList } from './components/FileList.js';
import { PreviewPanel } from './components/PreviewPanel.js';
import { StatusBar } from './components/StatusBar.js';
import { SearchInput, CommandInput, TextInputPrompt, ConfirmPrompt } from './components/InputPrompt.js';
import { HelpScreen } from './components/HelpScreen.js';
import { BookmarksList, AddBookmark } from './components/Bookmarks.js';
import { Terminal } from './components/Terminal.js';
import { executeCommand } from './commands/index.js';
import { 
  readDirectory, 
  getGitInfo, 
  getFilePreview,
  deleteFile,
  copyFile,
  moveFile,
  createDirectory,
  createFile,
  renameFile,
  FileEntry,
} from './utils/fileSystem.js';
import { 
  copyToClipboard, 
  openWithDefault, 
  getParentDir, 
  isRoot 
} from './utils/platform.js';
import { createKeyMatcher, KeyMatcher } from './utils/keybindings.js';
import { setConfig } from './config.js';
import path from 'path';
import os from 'os';

interface AppContentProps {
  startPath: string;
}

function AppContent({ startPath }: AppContentProps) {
  const { state, dispatch } = useAppState();
  const actions = useAppActions();
  const { exit } = useApp();
  const { stdout } = useStdout();
  
  const [addingBookmark, setAddingBookmark] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  
  // Create key matcher from config
  const keyMatcher = useMemo(() => {
    return createKeyMatcher(state.config.keybindings);
  }, [state.config.keybindings]);
  
  // Calculate dimensions
  const terminalWidth = stdout?.columns || 80;
  const terminalHeight = stdout?.rows || 24;
  const listWidth = Math.floor(terminalWidth * 0.35);
  const previewWidth = terminalWidth - listWidth - 2;
  
  // Split height for terminal
  const mainContentHeight = showTerminal 
    ? Math.floor((terminalHeight - 4) * 0.6) 
    : terminalHeight - 4;
  const terminalPanelHeight = showTerminal 
    ? terminalHeight - 4 - mainContentHeight 
    : 0;
  
  const contentHeight = mainContentHeight;
  
  // Load directory
  const loadDirectory = useCallback(async (dirPath: string) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    
    try {
      const entries = await readDirectory(dirPath, state.config.showHidden);
      dispatch({ type: 'SET_PATH', path: dirPath, entries });
      
      // Load git info in background
      getGitInfo(dirPath).then(info => {
        dispatch({ type: 'SET_GIT_INFO', info });
      });
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        error: err instanceof Error ? err.message : 'Failed to load directory' 
      });
    }
    
    dispatch({ type: 'SET_LOADING', loading: false });
  }, [dispatch, state.config.showHidden]);
  
  // Load preview for selected file
  const loadPreview = useCallback(async (entry: FileEntry) => {
    if (entry.isDirectory) {
      dispatch({ type: 'SET_PREVIEW', content: '', isBinary: false });
      return;
    }
    
    const { content, isBinary } = await getFilePreview(
      entry.path,
      state.config.preview.maxFileSize
    );
    dispatch({ type: 'SET_PREVIEW', content, isBinary });
  }, [dispatch, state.config.preview.maxFileSize]);
  
  // Refresh current directory
  const refresh = useCallback(async () => {
    await loadDirectory(state.currentPath);
  }, [loadDirectory, state.currentPath]);
  
  // Navigate to path
  const navigate = useCallback(async (newPath: string) => {
    await loadDirectory(newPath);
  }, [loadDirectory]);
  
  // Initial load
  useEffect(() => {
    loadDirectory(startPath);
  }, []);
  
  // Load preview when selection changes
  useEffect(() => {
    const selected = state.filteredEntries[state.selectedIndex];
    if (selected) {
      loadPreview(selected);
    }
  }, [state.selectedIndex, state.filteredEntries, loadPreview]);
  
  // Handle keyboard input
  useInput((input, key) => {
    // Skip if in a modal mode or terminal is open
    if (['search', 'command', 'input', 'confirm', 'help', 'bookmarks'].includes(state.mode)) {
      return;
    }
    
    // Skip if terminal is focused
    if (showTerminal && state.terminalOpen) {
      return;
    }
    
    const entries = state.filteredEntries;
    const current = entries[state.selectedIndex];
    
    // Use KeyMatcher for configurable keybindings
    
    // Navigation - down
    if (keyMatcher.matches(input, key, 'down')) {
      const newIndex = Math.min(state.selectedIndex + 1, entries.length - 1);
      dispatch({ type: 'SET_SELECTED_INDEX', index: newIndex });
      
      // Scroll if needed
      const visibleHeight = contentHeight - 2;
      if (newIndex >= state.scrollOffset + visibleHeight) {
        dispatch({ type: 'SET_SCROLL_OFFSET', offset: newIndex - visibleHeight + 1 });
      }
      return;
    }
    
    // Navigation - up
    if (keyMatcher.matches(input, key, 'up')) {
      const newIndex = Math.max(state.selectedIndex - 1, 0);
      dispatch({ type: 'SET_SELECTED_INDEX', index: newIndex });
      
      // Scroll if needed
      if (newIndex < state.scrollOffset) {
        dispatch({ type: 'SET_SCROLL_OFFSET', offset: newIndex });
      }
      return;
    }
    
    // Page navigation
    if (key.pageDown) {
      const visibleHeight = contentHeight - 2;
      const newIndex = Math.min(state.selectedIndex + visibleHeight, entries.length - 1);
      dispatch({ type: 'SET_SELECTED_INDEX', index: newIndex });
      dispatch({ type: 'SET_SCROLL_OFFSET', offset: Math.max(0, newIndex - visibleHeight + 1) });
      return;
    }
    
    if (key.pageUp) {
      const visibleHeight = contentHeight - 2;
      const newIndex = Math.max(state.selectedIndex - visibleHeight, 0);
      dispatch({ type: 'SET_SELECTED_INDEX', index: newIndex });
      dispatch({ type: 'SET_SCROLL_OFFSET', offset: newIndex });
      return;
    }
    
    // Open / Enter
    if (keyMatcher.matches(input, key, 'open')) {
      if (current?.isDirectory) {
        navigate(current.path);
      }
      return;
    }
    
    // Parent directory
    if (keyMatcher.matches(input, key, 'parent')) {
      if (!isRoot(state.currentPath)) {
        navigate(getParentDir(state.currentPath));
      }
      return;
    }
    
    // Open with system app
    if (keyMatcher.matches(input, key, 'openExternal')) {
      if (current) {
        openWithDefault(current.path);
        actions.setMessage(`Opened: ${current.name}`);
      }
      return;
    }
    
    // Search/Filter
    if (keyMatcher.matches(input, key, 'search')) {
      dispatch({ type: 'SET_MODE', mode: 'search' });
      return;
    }
    
    // Command palette
    if (keyMatcher.matches(input, key, 'command')) {
      dispatch({ type: 'SET_MODE', mode: 'command' });
      return;
    }
    
    // Help
    if (keyMatcher.matches(input, key, 'help')) {
      dispatch({ type: 'SET_MODE', mode: 'help' });
      return;
    }
    
    // Toggle hidden files
    if (keyMatcher.matches(input, key, 'toggleHidden')) {
      dispatch({ type: 'TOGGLE_HIDDEN' });
      loadDirectory(state.currentPath);
      return;
    }
    
    // Toggle selection
    if (keyMatcher.matches(input, key, 'select')) {
      if (current) {
        dispatch({ type: 'TOGGLE_FILE_SELECTION', path: current.path });
      }
      return;
    }
    
    // Select all
    if (keyMatcher.matches(input, key, 'selectAll')) {
      dispatch({ type: 'SELECT_ALL' });
      return;
    }
    
    // Copy
    if (keyMatcher.matches(input, key, 'copy')) {
      const filesToCopy = state.selectedFiles.size > 0
        ? entries.filter(e => state.selectedFiles.has(e.path))
        : current ? [current] : [];
      
      if (filesToCopy.length > 0) {
        dispatch({ 
          type: 'SET_CLIPBOARD', 
          clipboard: { operation: 'copy', files: filesToCopy }
        });
        actions.setMessage(`Copied ${filesToCopy.length} file(s)`);
      }
      return;
    }
    
    // Cut
    if (keyMatcher.matches(input, key, 'cut')) {
      const filesToCut = state.selectedFiles.size > 0
        ? entries.filter(e => state.selectedFiles.has(e.path))
        : current ? [current] : [];
      
      if (filesToCut.length > 0) {
        dispatch({ 
          type: 'SET_CLIPBOARD', 
          clipboard: { operation: 'cut', files: filesToCut }
        });
        actions.setMessage(`Cut ${filesToCut.length} file(s)`);
      }
      return;
    }
    
    // Paste
    if (keyMatcher.matches(input, key, 'paste')) {
      if (state.clipboard) {
        const { operation, files } = state.clipboard;
        
        (async () => {
          try {
            for (const file of files) {
              const destPath = path.join(state.currentPath, file.name);
              
              if (operation === 'copy') {
                await copyFile(file.path, destPath);
              } else {
                await moveFile(file.path, destPath);
              }
            }
            
            if (operation === 'cut') {
              dispatch({ type: 'SET_CLIPBOARD', clipboard: null });
            }
            
            await refresh();
            actions.setMessage(`${operation === 'copy' ? 'Copied' : 'Moved'} ${files.length} file(s)`);
          } catch (err) {
            actions.setError(err instanceof Error ? err.message : 'Paste failed');
          }
        })();
      }
      return;
    }
    
    // Delete
    if (keyMatcher.matches(input, key, 'delete')) {
      const filesToDelete = state.selectedFiles.size > 0
        ? entries.filter(e => state.selectedFiles.has(e.path))
        : current ? [current] : [];
      
      if (filesToDelete.length > 0 && state.config.confirmDelete) {
        const names = filesToDelete.length === 1 
          ? filesToDelete[0].name 
          : `${filesToDelete.length} files`;
        
        dispatch({
          type: 'SET_CONFIRM',
          message: `Delete ${names}? This cannot be undone.`,
          callback: async (confirmed: boolean) => {
            if (confirmed) {
              try {
                for (const file of filesToDelete) {
                  await deleteFile(file.path);
                }
                dispatch({ type: 'CLEAR_SELECTION' });
                await refresh();
                actions.setMessage(`Deleted ${filesToDelete.length} file(s)`);
              } catch (err) {
                actions.setError(err instanceof Error ? err.message : 'Delete failed');
              }
            }
          },
        });
      }
      return;
    }
    
    // Copy path to clipboard
    if (keyMatcher.matches(input, key, 'copyPath')) {
      if (current) {
        copyToClipboard(current.path);
        actions.setMessage('Path copied to clipboard');
      }
      return;
    }
    
    // Refresh
    if (keyMatcher.matches(input, key, 'refresh')) {
      refresh();
      actions.setMessage('Directory refreshed');
      return;
    }
    
    // Terminal toggle
    if (keyMatcher.matches(input, key, 'terminal')) {
      setShowTerminal(prev => !prev);
      dispatch({ type: 'TOGGLE_TERMINAL' });
      return;
    }
    
    // Home directory
    if (keyMatcher.matches(input, key, 'home') || input === '~') {
      navigate(os.homedir());
      return;
    }
    
    // Bookmarks - go to
    if (keyMatcher.matches(input, key, 'goToBookmark')) {
      dispatch({ type: 'SET_MODE', mode: 'bookmarks' });
      return;
    }
    
    // Add bookmark (Shift+B or 'B')
    if (keyMatcher.matches(input, key, 'bookmark') || input === 'B') {
      setAddingBookmark(true);
      return;
    }
    
    // New file
    if (keyMatcher.matches(input, key, 'newFile') || (input === 'n' && !key.ctrl && !key.shift)) {
      actions.promptInput('New file name:', async (name) => {
        if (name.trim()) {
          try {
            await createFile(path.join(state.currentPath, name.trim()));
            await refresh();
            actions.setMessage(`Created: ${name}`);
          } catch (err) {
            actions.setError(err instanceof Error ? err.message : 'Failed to create file');
          }
        }
        dispatch({ type: 'SET_MODE', mode: 'normal' });
      });
      return;
    }
    
    // New folder
    if (keyMatcher.matches(input, key, 'newFolder') || input === 'N' || (input === 'n' && key.shift)) {
      actions.promptInput('New folder name:', async (name) => {
        if (name.trim()) {
          try {
            await createDirectory(path.join(state.currentPath, name.trim()));
            await refresh();
            actions.setMessage(`Created folder: ${name}`);
          } catch (err) {
            actions.setError(err instanceof Error ? err.message : 'Failed to create folder');
          }
        }
        dispatch({ type: 'SET_MODE', mode: 'normal' });
      });
      return;
    }
    
    // Rename
    if (keyMatcher.matches(input, key, 'rename') || input === 'R' || (input === 'r' && key.shift)) {
      if (current) {
        actions.promptInput('Rename to:', async (newName) => {
          if (newName.trim() && newName !== current.name) {
            try {
              await renameFile(current.path, path.join(state.currentPath, newName.trim()));
              await refresh();
              actions.setMessage(`Renamed to: ${newName}`);
            } catch (err) {
              actions.setError(err instanceof Error ? err.message : 'Rename failed');
            }
          }
          dispatch({ type: 'SET_MODE', mode: 'normal' });
        }, current.name);
      }
      return;
    }
    
    // Quit
    if (keyMatcher.matches(input, key, 'quit')) {
      // Write last directory if configured
      if (state.config.exitToCwd) {
        // Could write to a temp file for shell integration
      }
      exit();
      return;
    }
  });
  
  // Handle search submit
  const handleSearchSubmit = useCallback((query: string) => {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
  }, [dispatch]);
  
  // Handle search cancel
  const handleSearchCancel = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_QUERY', query: '' });
    dispatch({ type: 'SET_MODE', mode: 'normal' });
  }, [dispatch]);
  
  // Handle command submit
  const handleCommandSubmit = useCallback(async (input: string) => {
    const result = await executeCommand(input, {
      state,
      dispatch,
      navigate,
      refresh,
    });
    
    if (result.error) {
      actions.setError(result.error);
    } else if (result.message) {
      actions.setMessage(result.message);
    }
    
    dispatch({ type: 'SET_MODE', mode: 'normal' });
  }, [state, dispatch, navigate, refresh, actions]);
  
  // Handle input submit
  const handleInputSubmit = useCallback((value: string) => {
    state.inputCallback?.(value);
    dispatch({ type: 'SET_MODE', mode: 'normal' });
  }, [state.inputCallback, dispatch]);
  
  // Handle input cancel
  const handleInputCancel = useCallback(() => {
    dispatch({ type: 'SET_MODE', mode: 'normal' });
  }, [dispatch]);
  
  // Handle bookmark selection
  const handleBookmarkSelect = useCallback((bookmarkPath: string) => {
    navigate(bookmarkPath);
    dispatch({ type: 'SET_MODE', mode: 'normal' });
  }, [navigate, dispatch]);
  
  // Handle add bookmark
  const handleAddBookmark = useCallback((name: string) => {
    const newBookmarks = {
      ...state.config.bookmarks,
      [name]: state.currentPath,
    };
    setConfig('bookmarks', newBookmarks);
    dispatch({ type: 'SET_CONFIG', config: { bookmarks: newBookmarks } });
    setAddingBookmark(false);
    actions.setMessage(`Added bookmark: ${name}`);
  }, [state.config.bookmarks, state.currentPath, dispatch, actions]);
  
  // Render modals
  const renderModal = () => {
    switch (state.mode) {
      case 'search':
        return (
          <Box position="absolute" marginTop={terminalHeight - 5}>
            <SearchInput onSubmit={handleSearchSubmit} onCancel={handleSearchCancel} />
          </Box>
        );
      
      case 'command':
        return (
          <Box position="absolute" marginTop={terminalHeight - 5}>
            <CommandInput onSubmit={handleCommandSubmit} onCancel={handleInputCancel} />
          </Box>
        );
      
      case 'input':
        return (
          <Box position="absolute" marginTop={terminalHeight - 6}>
            <TextInputPrompt onSubmit={handleInputSubmit} onCancel={handleInputCancel} />
          </Box>
        );
      
      case 'confirm':
        return (
          <Box position="absolute" marginTop={Math.floor(terminalHeight / 2) - 3}>
            <ConfirmPrompt />
          </Box>
        );
      
      case 'help':
        return (
          <Box position="absolute" marginTop={2} marginLeft={2}>
            <HelpScreen onClose={() => dispatch({ type: 'SET_MODE', mode: 'normal' })} />
          </Box>
        );
      
      case 'bookmarks':
        return (
          <Box position="absolute" marginTop={Math.floor(terminalHeight / 2) - 5} marginLeft={Math.floor(terminalWidth / 2) - 20}>
            <BookmarksList 
              onSelect={handleBookmarkSelect} 
              onClose={() => dispatch({ type: 'SET_MODE', mode: 'normal' })} 
            />
          </Box>
        );
    }
    
    if (addingBookmark) {
      return (
        <Box position="absolute" marginTop={Math.floor(terminalHeight / 2) - 3} marginLeft={Math.floor(terminalWidth / 2) - 20}>
          <AddBookmark 
            path={state.currentPath}
            onAdd={handleAddBookmark}
            onCancel={() => setAddingBookmark(false)}
          />
        </Box>
      );
    }
    
    return null;
  };
  
  return (
    <Box flexDirection="column" width={terminalWidth} height={terminalHeight}>
      {/* Header */}
      <Header />
      
      {/* Main content */}
      <Box flexDirection="row" height={mainContentHeight}>
        {/* File list (left pane) */}
        <FileList height={mainContentHeight} width={listWidth} />
        
        {/* Preview panel (right pane) */}
        <PreviewPanel height={mainContentHeight} width={previewWidth} />
      </Box>
      
      {/* Terminal panel (when open) */}
      {showTerminal && (
        <Terminal 
          height={terminalPanelHeight} 
          width={terminalWidth - 2}
          cwd={state.currentPath}
          onExit={() => {
            setShowTerminal(false);
            dispatch({ type: 'TOGGLE_TERMINAL' });
          }}
        />
      )}
      
      {/* Status bar */}
      <StatusBar />
      
      {/* Modals */}
      {renderModal()}
    </Box>
  );
}

// App wrapper with provider
interface AppProps {
  startPath?: string;
}

export function App({ startPath = process.cwd() }: AppProps) {
  return (
    <AppProvider startPath={startPath}>
      <AppContent startPath={startPath} />
    </AppProvider>
  );
}
