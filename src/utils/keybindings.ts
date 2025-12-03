// Keybinding utilities for Navit

import type { KeyBindings } from '../config.js';
import type { Key } from 'ink';

// Parsed key representation
interface ParsedKey {
  key: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

// Parse a keybinding string like "ctrl+c" or "j"
function parseKeyString(keyStr: string): ParsedKey {
  const parts = keyStr.toLowerCase().split('+');
  const result: ParsedKey = {
    key: '',
    ctrl: false,
    meta: false,
    shift: false,
  };
  
  for (const part of parts) {
    switch (part) {
      case 'ctrl':
      case 'control':
        result.ctrl = true;
        break;
      case 'meta':
      case 'cmd':
      case 'command':
      case 'win':
        result.meta = true;
        break;
      case 'shift':
        result.shift = true;
        break;
      default:
        result.key = part;
    }
  }
  
  return result;
}

// Normalize ink Key object to comparable format
function normalizeInkKey(input: string, key: Key): ParsedKey {
  let keyName = input.toLowerCase();
  
  // Map special keys
  if (key.upArrow) keyName = 'up';
  else if (key.downArrow) keyName = 'down';
  else if (key.leftArrow) keyName = 'left';
  else if (key.rightArrow) keyName = 'right';
  else if (key.return) keyName = 'return';
  else if (key.escape) keyName = 'escape';
  else if (key.backspace) keyName = 'backspace';
  else if (key.delete) keyName = 'delete';
  else if (key.tab) keyName = 'tab';
  else if (key.pageDown) keyName = 'pagedown';
  else if (key.pageUp) keyName = 'pageup';
  
  return {
    key: keyName,
    ctrl: key.ctrl || false,
    meta: key.meta || false,
    shift: key.shift || false,
  };
}

// Check if a key matches any of the keybindings
function keysMatch(parsed: ParsedKey, binding: ParsedKey): boolean {
  // Special handling for space
  if (binding.key === ' ' || binding.key === 'space') {
    if (parsed.key === ' ' || parsed.key === 'space') {
      return parsed.ctrl === binding.ctrl && 
             parsed.meta === binding.meta && 
             parsed.shift === binding.shift;
    }
    return false;
  }
  
  return parsed.key === binding.key &&
         parsed.ctrl === binding.ctrl &&
         parsed.meta === binding.meta &&
         parsed.shift === binding.shift;
}

// KeyMatcher class for efficient keybinding matching
export class KeyMatcher {
  private bindings: Map<keyof KeyBindings, ParsedKey[]>;
  
  constructor(keybindings: KeyBindings) {
    this.bindings = new Map();
    
    // Parse all keybindings
    for (const [action, keys] of Object.entries(keybindings)) {
      const parsedKeys = keys.map(parseKeyString);
      this.bindings.set(action as keyof KeyBindings, parsedKeys);
    }
  }
  
  // Check if input matches a specific action
  matches(input: string, key: Key, action: keyof KeyBindings): boolean {
    const parsedInput = normalizeInkKey(input, key);
    const actionBindings = this.bindings.get(action);
    
    if (!actionBindings) return false;
    
    return actionBindings.some(binding => keysMatch(parsedInput, binding));
  }
  
  // Get the action for a given input (first match)
  getAction(input: string, key: Key): keyof KeyBindings | null {
    const parsedInput = normalizeInkKey(input, key);
    
    for (const [action, bindings] of this.bindings) {
      if (bindings.some(binding => keysMatch(parsedInput, binding))) {
        return action;
      }
    }
    
    return null;
  }
  
  // Get display string for an action's keybinding
  getDisplayKey(action: keyof KeyBindings): string {
    const bindings = this.bindings.get(action);
    if (!bindings || bindings.length === 0) return '';
    
    const binding = bindings[0];
    let display = '';
    
    if (binding.ctrl) display += 'Ctrl+';
    if (binding.meta) display += 'Meta+';
    if (binding.shift) display += 'Shift+';
    
    // Format key name
    let keyName = binding.key;
    switch (keyName) {
      case 'return': keyName = 'Enter'; break;
      case 'backspace': keyName = 'Bksp'; break;
      case 'delete': keyName = 'Del'; break;
      case 'escape': keyName = 'Esc'; break;
      case 'up': keyName = '↑'; break;
      case 'down': keyName = '↓'; break;
      case 'left': keyName = '←'; break;
      case 'right': keyName = '→'; break;
      case ' ': keyName = 'Space'; break;
      case 'pageup': keyName = 'PgUp'; break;
      case 'pagedown': keyName = 'PgDn'; break;
      default:
        if (keyName.length === 1) keyName = keyName.toUpperCase();
    }
    
    return display + keyName;
  }
  
  // Update keybindings
  updateBindings(keybindings: KeyBindings): void {
    this.bindings.clear();
    for (const [action, keys] of Object.entries(keybindings)) {
      const parsedKeys = keys.map(parseKeyString);
      this.bindings.set(action as keyof KeyBindings, parsedKeys);
    }
  }
}

// Create a key matcher from config
export function createKeyMatcher(keybindings: KeyBindings): KeyMatcher {
  return new KeyMatcher(keybindings);
}

// Format keybinding for display in help/status
export function formatKeybinding(keys: string[]): string {
  if (keys.length === 0) return '';
  
  return keys.map(k => {
    const parsed = parseKeyString(k);
    let display = '';
    
    if (parsed.ctrl) display += 'C-';
    if (parsed.meta) display += 'M-';
    if (parsed.shift) display += 'S-';
    
    let keyName = parsed.key;
    switch (keyName) {
      case 'return': keyName = '↵'; break;
      case 'backspace': keyName = '⌫'; break;
      case 'delete': keyName = '⌦'; break;
      case 'escape': keyName = 'Esc'; break;
      case 'up': keyName = '↑'; break;
      case 'down': keyName = '↓'; break;
      case 'left': keyName = '←'; break;
      case 'right': keyName = '→'; break;
      case ' ': keyName = '␣'; break;
    }
    
    return display + keyName;
  }).join('/');
}
