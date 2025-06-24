import { useEffect, useRef, useCallback } from 'react';

type KeyboardShortcut = string;
type ShortcutHandler = (event: KeyboardEvent) => void;
type ShortcutMap = Record<KeyboardShortcut, ShortcutHandler>;

interface KeyboardShortcutsOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enableInInput?: boolean;
  scope?: 'global' | 'local';
}

/**
 * Parses a keyboard shortcut string into its components
 * Examples: "cmd+k", "ctrl+shift+s", "escape", "?"
 */
function parseShortcut(shortcut: string): {
  key: string;
  modifiers: {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
  };
} {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  
  return {
    key,
    modifiers: {
      ctrl: parts.includes('ctrl'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('cmd') || parts.includes('meta'),
    },
  };
}

/**
 * Hook for managing keyboard shortcuts in your application
 * Supports modifier keys and prevents conflicts
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  options?: KeyboardShortcutsOptions
) {
  const {
    preventDefault = true,
    stopPropagation = true,
    enableInInput = false,
    scope = 'global',
  } = options || {};

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in an input/textarea (unless explicitly enabled)
    if (!enableInInput) {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target.contentEditable === 'true'
      ) {
        return;
      }
    }

    // Check each shortcut
    Object.entries(shortcutsRef.current).forEach(([shortcut, handler]) => {
      const { key, modifiers } = parseShortcut(shortcut);
      
      // Check if key matches
      const eventKey = event.key.toLowerCase();
      if (eventKey !== key && event.code.toLowerCase() !== key) {
        return;
      }
      
      // Check if all required modifiers are pressed
      const modifiersMatch =
        modifiers.ctrl === (event.ctrlKey || event.metaKey) &&
        modifiers.alt === event.altKey &&
        modifiers.shift === event.shiftKey &&
        modifiers.meta === (event.metaKey || event.ctrlKey);
      
      if (modifiersMatch) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        handler(event);
      }
    });
  }, [enableInInput, preventDefault, stopPropagation]);

  useEffect(() => {
    const target = scope === 'global' ? window : document.activeElement;
    if (!target) return;

    target.addEventListener('keydown', handleKeyDown as EventListener);
    
    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, scope]);
}

/**
 * Hook for a single keyboard shortcut
 */
export function useKeyboardShortcut(
  shortcut: string,
  handler: ShortcutHandler,
  options?: KeyboardShortcutsOptions
) {
  useKeyboardShortcuts({ [shortcut]: handler }, options);
}

/**
 * Common keyboard shortcuts for navigation
 */
export function useNavigationShortcuts({
  onSearch,
  onNext,
  onPrevious,
  onHome,
  onHelp,
}: {
  onSearch?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onHome?: () => void;
  onHelp?: () => void;
}) {
  const shortcuts: ShortcutMap = {};
  
  if (onSearch) shortcuts['cmd+k'] = onSearch;
  if (onSearch) shortcuts['ctrl+k'] = onSearch;
  if (onSearch) shortcuts['/'] = onSearch;
  if (onNext) shortcuts['j'] = onNext;
  if (onPrevious) shortcuts['k'] = onPrevious;
  if (onHome) shortcuts['g h'] = onHome;
  if (onHelp) shortcuts['?'] = onHelp;
  
  useKeyboardShortcuts(shortcuts);
}