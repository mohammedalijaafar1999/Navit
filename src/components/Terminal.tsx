// Terminal component for split view

import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';
import { spawn, ChildProcess } from 'child_process';
import { getDefaultShell } from '../utils/platform.js';
import { useAppState } from '../state/AppState.js';

interface TerminalProps {
  height: number;
  width: number;
  cwd: string;
  onExit: () => void;
}

export function Terminal({ height, width, cwd, onExit }: TerminalProps) {
  const { state } = useAppState();
  const { theme } = state;
  const [output, setOutput] = useState<string[]>([]);
  const [inputLine, setInputLine] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const processRef = useRef<ChildProcess | null>(null);
  const outputRef = useRef<string[]>([]);
  
  // Get visible lines
  const visibleHeight = height - 4; // Account for borders and input line
  const visibleOutput = output.slice(-visibleHeight);
  
  // Handle input
  useInput((input, key) => {
    if (key.escape) {
      // Kill any running process and exit terminal
      if (processRef.current) {
        processRef.current.kill();
      }
      onExit();
      return;
    }
    
    if (isRunning) {
      // Send input to running process
      if (key.ctrl && input === 'c') {
        processRef.current?.kill('SIGINT');
        setIsRunning(false);
      }
      return;
    }
    
    if (key.return) {
      if (inputLine.trim()) {
        executeCommand(inputLine.trim());
        setHistory(prev => [...prev, inputLine.trim()]);
        setHistoryIndex(-1);
      }
      setInputLine('');
      return;
    }
    
    if (key.backspace) {
      setInputLine(prev => prev.slice(0, -1));
      return;
    }
    
    if (key.upArrow) {
      // Navigate history
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInputLine(history[history.length - 1 - newIndex] || '');
      }
      return;
    }
    
    if (key.downArrow) {
      // Navigate history forward
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputLine(history[history.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputLine('');
      }
      return;
    }
    
    if (key.tab) {
      // Could implement tab completion here
      return;
    }
    
    if (!key.ctrl && !key.meta && input) {
      setInputLine(prev => prev + input);
    }
  });
  
  // Execute a command
  const executeCommand = (cmd: string) => {
    // Add command to output
    const promptLine = `$ ${cmd}`;
    setOutput(prev => [...prev, promptLine]);
    outputRef.current = [...outputRef.current, promptLine];
    
    // Handle built-in commands
    if (cmd === 'exit' || cmd === 'quit') {
      onExit();
      return;
    }
    
    if (cmd === 'clear' || cmd === 'cls') {
      setOutput([]);
      outputRef.current = [];
      return;
    }
    
    // Parse command and arguments
    const shell = getDefaultShell();
    const isWindows = process.platform === 'win32';
    
    setIsRunning(true);
    
    // Spawn process
    const proc = spawn(shell, isWindows ? ['/c', cmd] : ['-c', cmd], {
      cwd,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    processRef.current = proc;
    
    // Handle stdout
    proc.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n');
      setOutput(prev => [...prev, ...lines]);
      outputRef.current = [...outputRef.current, ...lines];
    });
    
    // Handle stderr
    proc.stderr?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n');
      setOutput(prev => [...prev, ...lines]);
      outputRef.current = [...outputRef.current, ...lines];
    });
    
    // Handle close
    proc.on('close', (code) => {
      setIsRunning(false);
      processRef.current = null;
      if (code !== 0 && code !== null) {
        setOutput(prev => [...prev, `Process exited with code ${code}`]);
      }
    });
    
    // Handle error
    proc.on('error', (err) => {
      setIsRunning(false);
      processRef.current = null;
      setOutput(prev => [...prev, `Error: ${err.message}`]);
    });
  };
  
  // Show welcome message
  useEffect(() => {
    setOutput([
      '╔══════════════════════════════════════════════╗',
      '║  Navit Terminal                              ║',
      '║  Type commands below. Press Esc to close.   ║',
      '╚══════════════════════════════════════════════╝',
      '',
      `Working directory: ${cwd}`,
      '',
    ]);
  }, [cwd]);
  
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.headerFg}
      width={width}
      height={height}
    >
      {/* Terminal header */}
      <Box paddingX={1} justifyContent="space-between">
        <Text color={theme.headerFg} bold>Terminal</Text>
        <Text color={theme.hidden} dimColor>Esc: close │ Ctrl+C: interrupt</Text>
      </Box>
      
      {/* Separator */}
      <Box borderStyle="single" borderTop={false} borderLeft={false} borderRight={false} borderColor={theme.border}>
        <Text> </Text>
      </Box>
      
      {/* Output area */}
      <Box flexDirection="column" flexGrow={1} paddingX={1} overflow="hidden">
        {visibleOutput.map((line, i) => (
          <Text key={i} color={theme.file} wrap="truncate">
            {line.slice(0, width - 4)}
          </Text>
        ))}
        {/* Fill empty space */}
        {Array.from({ length: Math.max(0, visibleHeight - visibleOutput.length) }).map((_, i) => (
          <Text key={`empty-${i}`}> </Text>
        ))}
      </Box>
      
      {/* Input line */}
      <Box borderStyle="single" borderBottom={false} borderLeft={false} borderRight={false} borderColor={theme.border}>
        <Box paddingX={1}>
          <Text color={theme.gitAdded}>$ </Text>
          <Text color={theme.file}>{inputLine}</Text>
          <Text color={theme.headerFg}>█</Text>
          {isRunning && <Text color={theme.gitModified}> (running...)</Text>}
        </Box>
      </Box>
    </Box>
  );
}
