'use client';

import * as ContextMenu from '@radix-ui/react-context-menu';
import { Copy, Share, Trash, Edit, Code2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function CustomContextMenu({ children }: { children: React.ReactNode }) {
  const [isMac, setIsMac] = useState(false);
  
  useEffect(() => {
    setIsMac(window.navigator?.platform?.toUpperCase().indexOf('MAC') >= 0);
  }, []);
  
  const handleInspect = () => {
    if (typeof window !== 'undefined') {
      try {
        // Create and dispatch keyboard event for DevTools
        const event = new KeyboardEvent('keydown', {
          key: 'I',
          code: 'KeyI',
          keyCode: 73,
          which: 73,
          metaKey: isMac,
          ctrlKey: !isMac,
          altKey: isMac,
          shiftKey: !isMac,
          bubbles: true
        });
        document.dispatchEvent(event);
        
        // Fallback: Use debugger statement
        setTimeout(() => {
          debugger;
        }, 100);
      } catch (error) {
        console.error('Failed to open DevTools:', error);
      }
    }
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="context-menu-content">
          <ContextMenu.Item className="context-menu-item">
            <span>Copy</span>
            <Copy size={16} />
            <div className="context-menu-shortcut">⌘C</div>
          </ContextMenu.Item>
          <ContextMenu.Item className="context-menu-item">
            <span>Share</span>
            <Share size={16} />
            <div className="context-menu-shortcut">⌘S</div>
          </ContextMenu.Item>
          <ContextMenu.Separator className="context-menu-separator" />
          <ContextMenu.Item className="context-menu-item">
            <span>Edit</span>
            <Edit size={16} />
            <div className="context-menu-shortcut">⌘E</div>
          </ContextMenu.Item>
          <ContextMenu.Item className="context-menu-item" data-destructive>
            <span>Delete</span>
            <Trash size={16} />
            <div className="context-menu-shortcut">⌫</div>
          </ContextMenu.Item>
          <ContextMenu.Separator className="context-menu-separator" />
          <ContextMenu.Item className="context-menu-item" onSelect={handleInspect}>
            <span>Inspect</span>
            <Code2 size={16} />
            <div className="context-menu-shortcut">{isMac ? '⌘⌥I' : 'Ctrl+Shift+I'}</div>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
} 