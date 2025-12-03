// Application state management using React Context

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { FileEntry, GitInfo } from '../utils/fileSystem.js';
import type { NavitConfig } from '../config.js';
import { getConfig, setConfig as saveConfig, getTheme, ThemeColors } from '../config.js';
import os from 'os';

// Application modes
export type AppMode = 
  | 'normal'           // Normal navigation
  | 'search'           // Search/filter mode
  | 'deepSearch'       // Recursive search
  | 'command'          // Command palette
  | 'confirm'          // Confirmation dialog
  | 'input'            // Text input (rename, create, etc.)
  | 'help'             // Help screen
  | 'bookmarks';       // Bookmark selection

// Clipboard operation
export interface ClipboardData {
  operation: 'copy' | 'cut';
  files: FileEntry[];
}

// Application state
export interface AppState {
  // Current location
  currentPath: string;
  entries: FileEntry[];
  selectedIndex: number;
  scrollOffset: number;
  
  // Selection
  selectedFiles: Set<string>;
  clipboard: ClipboardData | null;
  
  // Mode
  mode: AppMode;
  inputValue: string;
  inputPrompt: string;
  inputCallback?: (value: string) => void;
  
  // Confirmation
  confirmMessage: string;
  confirmCallback?: (confirmed: boolean) => void;
  
  // Search
  searchQuery: string;
  filteredEntries: FileEntry[];
  
  // Git
  gitInfo: GitInfo | null;
  
  // Config
  config: NavitConfig;
  theme: ThemeColors;
  
  // UI state
  loading: boolean;
  error: string | null;
  message: string | null;
  
  // Terminal
  terminalOpen: boolean;
  lastDirectory: string;
  
  // Preview
  previewContent: string;
  previewIsBinary: boolean;
  previewScrollOffset: number;
}

// Action types
type Action =
  | { type: 'SET_PATH'; path: string; entries: FileEntry[] }
  | { type: 'SET_ENTRIES'; entries: FileEntry[] }
  | { type: 'SET_SELECTED_INDEX'; index: number }
  | { type: 'SET_SCROLL_OFFSET'; offset: number }
  | { type: 'TOGGLE_FILE_SELECTION'; path: string }
  | { type: 'SELECT_ALL' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_CLIPBOARD'; clipboard: ClipboardData | null }
  | { type: 'SET_MODE'; mode: AppMode }
  | { type: 'SET_INPUT'; value: string; prompt: string; callback?: (value: string) => void }
  | { type: 'SET_CONFIRM'; message: string; callback?: (confirmed: boolean) => void }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_FILTERED_ENTRIES'; entries: FileEntry[] }
  | { type: 'SET_GIT_INFO'; info: GitInfo | null }
  | { type: 'SET_CONFIG'; config: Partial<NavitConfig> }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_MESSAGE'; message: string | null }
  | { type: 'TOGGLE_TERMINAL' }
  | { type: 'SET_PREVIEW'; content: string; isBinary: boolean }
  | { type: 'SET_PREVIEW_SCROLL'; offset: number }
  | { type: 'TOGGLE_HIDDEN' };

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PATH':
      return {
        ...state,
        currentPath: action.path,
        entries: action.entries,
        filteredEntries: action.entries,
        selectedIndex: 0,
        scrollOffset: 0,
        lastDirectory: action.path,
        searchQuery: '',
        error: null,
      };
    
    case 'SET_ENTRIES':
      return {
        ...state,
        entries: action.entries,
        filteredEntries: state.searchQuery
          ? action.entries.filter(e => 
              e.name.toLowerCase().includes(state.searchQuery.toLowerCase())
            )
          : action.entries,
      };
    
    case 'SET_SELECTED_INDEX':
      return { ...state, selectedIndex: action.index };
    
    case 'SET_SCROLL_OFFSET':
      return { ...state, scrollOffset: action.offset };
    
    case 'TOGGLE_FILE_SELECTION': {
      const newSelection = new Set(state.selectedFiles);
      if (newSelection.has(action.path)) {
        newSelection.delete(action.path);
      } else {
        newSelection.add(action.path);
      }
      return { ...state, selectedFiles: newSelection };
    }
    
    case 'SELECT_ALL': {
      const allPaths = new Set(state.filteredEntries.map(e => e.path));
      return { ...state, selectedFiles: allPaths };
    }
    
    case 'CLEAR_SELECTION':
      return { ...state, selectedFiles: new Set() };
    
    case 'SET_CLIPBOARD':
      return { ...state, clipboard: action.clipboard };
    
    case 'SET_MODE':
      return { 
        ...state, 
        mode: action.mode,
        inputValue: '',
        searchQuery: action.mode === 'normal' ? '' : state.searchQuery,
      };
    
    case 'SET_INPUT':
      return {
        ...state,
        mode: 'input',
        inputValue: action.value,
        inputPrompt: action.prompt,
        inputCallback: action.callback,
      };
    
    case 'SET_CONFIRM':
      return {
        ...state,
        mode: 'confirm',
        confirmMessage: action.message,
        confirmCallback: action.callback,
      };
    
    case 'SET_SEARCH_QUERY': {
      const filtered = action.query
        ? state.entries.filter(e =>
            e.name.toLowerCase().includes(action.query.toLowerCase())
          )
        : state.entries;
      return {
        ...state,
        searchQuery: action.query,
        filteredEntries: filtered,
        selectedIndex: 0,
      };
    }
    
    case 'SET_FILTERED_ENTRIES':
      return { ...state, filteredEntries: action.entries, selectedIndex: 0 };
    
    case 'SET_GIT_INFO':
      return { ...state, gitInfo: action.info };
    
    case 'SET_CONFIG': {
      const newConfig = { ...state.config, ...action.config };
      return {
        ...state,
        config: newConfig,
        theme: getTheme(newConfig.theme, newConfig.customThemes),
      };
    }
    
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    
    case 'SET_MESSAGE':
      return { ...state, message: action.message };
    
    case 'TOGGLE_TERMINAL':
      return { ...state, terminalOpen: !state.terminalOpen };
    
    case 'SET_PREVIEW':
      return {
        ...state,
        previewContent: action.content,
        previewIsBinary: action.isBinary,
        previewScrollOffset: 0,
      };
    
    case 'SET_PREVIEW_SCROLL':
      return { ...state, previewScrollOffset: action.offset };
    
    case 'TOGGLE_HIDDEN': {
      const newConfig = { ...state.config, showHidden: !state.config.showHidden };
      saveConfig('showHidden', newConfig.showHidden);
      return { ...state, config: newConfig };
    }
    
    default:
      return state;
  }
}

// Initial state factory
function createInitialState(startPath: string): AppState {
  const config = getConfig(startPath);
  return {
    currentPath: startPath,
    entries: [],
    selectedIndex: 0,
    scrollOffset: 0,
    selectedFiles: new Set(),
    clipboard: null,
    mode: 'normal',
    inputValue: '',
    inputPrompt: '',
    confirmMessage: '',
    searchQuery: '',
    filteredEntries: [],
    gitInfo: null,
    config,
    theme: getTheme(config.theme, config.customThemes),
    loading: true,
    error: null,
    message: null,
    terminalOpen: false,
    lastDirectory: startPath,
    previewContent: '',
    previewIsBinary: false,
    previewScrollOffset: 0,
  };
}

// Context
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

// Provider component
interface AppProviderProps {
  startPath?: string;
  children: ReactNode;
}

export function AppProvider({ startPath = process.cwd(), children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, startPath, createInitialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use app state
export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}

// Helper hook for common actions
export function useAppActions() {
  const { state, dispatch } = useAppState();
  
  const setPath = useCallback((path: string, entries: FileEntry[]) => {
    dispatch({ type: 'SET_PATH', path, entries });
  }, [dispatch]);
  
  const setSelectedIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_SELECTED_INDEX', index });
  }, [dispatch]);
  
  const toggleSelection = useCallback((path: string) => {
    dispatch({ type: 'TOGGLE_FILE_SELECTION', path });
  }, [dispatch]);
  
  const setMode = useCallback((mode: AppMode) => {
    dispatch({ type: 'SET_MODE', mode });
  }, [dispatch]);
  
  const promptInput = useCallback((prompt: string, callback: (value: string) => void, initialValue = '') => {
    dispatch({ type: 'SET_INPUT', value: initialValue, prompt, callback });
  }, [dispatch]);
  
  const confirm = useCallback((message: string, callback: (confirmed: boolean) => void) => {
    dispatch({ type: 'SET_CONFIRM', message, callback });
  }, [dispatch]);
  
  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', query });
  }, [dispatch]);
  
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, [dispatch]);
  
  const setMessage = useCallback((message: string | null) => {
    dispatch({ type: 'SET_MESSAGE', message });
  }, [dispatch]);
  
  const setPreview = useCallback((content: string, isBinary: boolean) => {
    dispatch({ type: 'SET_PREVIEW', content, isBinary });
  }, [dispatch]);
  
  return {
    state,
    dispatch,
    setPath,
    setSelectedIndex,
    toggleSelection,
    setMode,
    promptInput,
    confirm,
    setSearchQuery,
    setError,
    setMessage,
    setPreview,
  };
}
