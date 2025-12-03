// Input prompt component - for search, commands, and text input

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useAppState, useAppActions } from '../state/AppState.js';

interface InputPromptProps {
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function SearchInput({ onSubmit, onCancel }: InputPromptProps) {
  const { state } = useAppState();
  const { setSearchQuery } = useAppActions();
  const { searchQuery, theme } = state;
  
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    } else if (key.return) {
      onSubmit(searchQuery);
    }
  });
  
  return (
    <Box
      borderStyle="single"
      borderColor={theme.headerFg}
      paddingX={1}
    >
      <Text color={theme.headerFg}>/</Text>
      <TextInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Type to filter..."
      />
    </Box>
  );
}

export function CommandInput({ onSubmit, onCancel }: InputPromptProps) {
  const { state } = useAppState();
  const { theme } = state;
  const [value, setValue] = useState('');
  
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    } else if (key.return) {
      onSubmit(value);
    }
  });
  
  return (
    <Box
      borderStyle="single"
      borderColor={theme.headerFg}
      paddingX={1}
    >
      <Text color={theme.headerFg}>:</Text>
      <TextInput
        value={value}
        onChange={setValue}
        placeholder="Enter command..."
      />
    </Box>
  );
}

export function TextInputPrompt({ onSubmit, onCancel }: InputPromptProps) {
  const { state } = useAppState();
  const { inputPrompt, inputValue, theme } = state;
  const [value, setValue] = useState(inputValue);
  
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    } else if (key.return) {
      onSubmit(value);
    }
  });
  
  return (
    <Box
      borderStyle="single"
      borderColor={theme.headerFg}
      paddingX={1}
      flexDirection="column"
    >
      <Text color={theme.headerFg}>{inputPrompt}</Text>
      <Box>
        <Text color={theme.headerFg}>&gt; </Text>
        <TextInput
          value={value}
          onChange={setValue}
        />
      </Box>
    </Box>
  );
}

export function ConfirmPrompt() {
  const { state, dispatch } = useAppState();
  const { confirmMessage, confirmCallback, theme } = state;
  
  useInput((input, key) => {
    if (key.escape || input.toLowerCase() === 'n') {
      confirmCallback?.(false);
      dispatch({ type: 'SET_MODE', mode: 'normal' });
    } else if (input.toLowerCase() === 'y') {
      confirmCallback?.(true);
      dispatch({ type: 'SET_MODE', mode: 'normal' });
    }
  });
  
  return (
    <Box
      borderStyle="single"
      borderColor="#F14C4C"
      paddingX={1}
      flexDirection="column"
    >
      <Text color="#F14C4C" bold>⚠ Confirm</Text>
      <Text color={theme.file}>{confirmMessage}</Text>
      <Box marginTop={1}>
        <Text color={theme.hidden}>[y] Yes  [n] No</Text>
      </Box>
    </Box>
  );
}
