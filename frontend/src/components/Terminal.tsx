import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { TabSession } from '../App';

interface TerminalComponentProps {
  tab: TabSession;
  onData?: (data: string) => void;
  onResize?: (rows: number, cols: number) => void;
  fontSize?: number;
  termTheme?: 'dark' | 'light';
}

// We do NOT cache Terminal instances because xterm.js does not support
// re-opening a terminal on a different DOM element. Instead, we create
// a fresh terminal each time the component mounts and rely on the
// backend's history replay to restore previous output.
//
// To avoid re-creating terminals unnecessarily during tab switches,
// we use React keys in the parent to keep the component mounted.

export const disposeTerminalInstance = (_tabId: string) => {
  // No-op: cleanup is handled by the component's useEffect return
};

const TerminalComponent: React.FC<TerminalComponentProps> = ({ tab, onData, onResize, fontSize = 14, termTheme = 'dark' }) => {
  const { ws, protocol, session } = tab;
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initializedRef = useRef(false);
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  // Keep latest onData/onResize in refs so they're always current
  const onDataRef = useRef(onData);
  const onResizeRef = useRef(onResize);
  onDataRef.current = onData;
  onResizeRef.current = onResize;

  // Dynamic font size and theme updates
  useEffect(() => {
    if (!termRef.current) return;
    termRef.current.options.fontSize = fontSize;
    if (fitAddonRef.current) {
      try { fitAddonRef.current.fit(); } catch(_) {}
    }
  }, [fontSize]);

  useEffect(() => {
    if (!termRef.current) return;
    const darkTheme = {
      background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#aeafad',
      cursorAccent: '#1e1e1e', selectionBackground: '#264f78',
      black: '#1e1e1e', red: '#f44747', green: '#6a9955', yellow: '#d7ba7d',
      blue: '#569cd6', magenta: '#c586c0', cyan: '#4ec9b0', white: '#d4d4d4',
      brightBlack: '#808080', brightRed: '#f44747', brightGreen: '#6a9955',
      brightYellow: '#d7ba7d', brightBlue: '#569cd6', brightMagenta: '#c586c0',
      brightCyan: '#4ec9b0', brightWhite: '#e5e5e5'
    };
    const lightTheme = {
      background: '#ffffff', foreground: '#1e1e1e', cursor: '#333333',
      cursorAccent: '#ffffff', selectionBackground: '#add6ff',
      black: '#000000', red: '#cd3131', green: '#008000', yellow: '#795e26',
      blue: '#0451a5', magenta: '#bc05bc', cyan: '#0598bc', white: '#d4d4d4',
      brightBlack: '#666666', brightRed: '#cd3131', brightGreen: '#008000',
      brightYellow: '#795e26', brightBlue: '#0451a5', brightMagenta: '#bc05bc',
      brightCyan: '#0598bc', brightWhite: '#1e1e1e'
    };
    termRef.current.options.theme = termTheme === 'light' ? lightTheme : darkTheme;
  }, [termTheme]);

  useEffect(() => {
    if (!terminalRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: fontSize,
      fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', 'Courier New', monospace",
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#264f78',
        black: '#1e1e1e',
        red: '#f44747',
        green: '#6a9955',
        yellow: '#d7ba7d',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#4ec9b0',
        white: '#d4d4d4',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#6a9955',
        brightYellow: '#d7ba7d',
        brightBlue: '#569cd6',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#e5e5e5'
      },
      scrollback: 10000,
      convertEol: true,
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const safeFit = () => {
      const el = terminalRef.current;
      if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) return;
      try {
        fitAddon.fit();
        if (onResizeRef.current) {
          onResizeRef.current(term.rows, term.cols);
        } else if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ 
            type: 'resize', 
            payload: { rows: term.rows, cols: term.cols, persistenceId: tab.id } 
          }));
        }
      } catch (_) { /* ignore */ }
    };

    const openTerminal = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!terminalRef.current) return;
          try {
            term.open(terminalRef.current);
            term.focus();
          } catch (e) {
            return;
          }
          term.writeln('\x1b[32mConnecting...\x1b[0m');
          setTimeout(() => {
            safeFit();
            term.focus();
          }, 50);
          
          if (protocol === 'serial') {
            connectSerial();
          }
        });
      });
    };

    const connectSerial = async () => {
      if (!('serial' in navigator)) {
        term.writeln('\r\n\x1b[31m[Error: Web Serial API not supported in this browser]\x1b[0m');
        return;
      }

      try {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: Number(session?.port) || 9600 });
        serialPortRef.current = port;
        term.writeln('\x1b[32m[Serial Connected]\x1b[0m\r\n');

        const reader = port.readable.getReader();
        serialReaderRef.current = reader;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          term.write(value);
        }
      } catch (err: any) {
        term.writeln(`\r\n\x1b[31m[Serial Error: ${err.message}]\x1b[0m\r\n`);
      }
    };

    openTerminal();

    const onDataDisposable = term.onData(async data => {
      if (protocol === 'serial' && serialPortRef.current?.writable) {
        const writer = serialPortRef.current.writable.getWriter();
        await writer.write(new TextEncoder().encode(data));
        writer.releaseLock();
      } else if (onDataRef.current) {
        onDataRef.current(data);
      } else if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'data', 
          payload: { data, persistenceId: tab.id } 
        }));
      }
    });

    term.onSelectionChange(() => {
      const selection = term.getSelection();
      if (selection) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(selection).catch(() => {});
        } else {
          // Fallback for non-secure contexts (HTTP)
          const textArea = document.createElement("textarea");
          textArea.value = selection;
          textArea.style.position = "fixed";  // Avoid scrolling to bottom
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
          } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
          }
          document.body.removeChild(textArea);
        }
      }
    });

    const handleContextMenu = async (e: MouseEvent) => {
      e.preventDefault();
      try {
        let text = '';
        if (navigator.clipboard && navigator.clipboard.readText) {
          text = await navigator.clipboard.readText();
        } else {
          // Insecure context fallback: cannot read clipboard programmatically usually,
          // but we can prompt the user to use Ctrl+V. We will just inform them or try fallback if extension allows.
          alert('Clipboard reading is blocked in insecure connections (HTTP). Please press Ctrl+V to paste or use HTTPS.');
          return;
        }
        if (text) {
          setPasteContent(text);
          setPasteModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to read clipboard', err);
        // Fallback info if paste failed even in HTTPS (permission denied)
        alert('Failed to read clipboard automatically. Please press Ctrl+V to paste.');
      }
    };

    if (terminalRef.current) {
      terminalRef.current.addEventListener('contextmenu', handleContextMenu);
    }

    window.addEventListener('resize', safeFit);

    const resizeObserver = new ResizeObserver(() => safeFit());
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      const termEl = terminalRef.current;
      if (termEl) {
        termEl.removeEventListener('contextmenu', handleContextMenu);
      }
      window.removeEventListener('resize', safeFit);
      resizeObserver.disconnect();
      
      if (serialReaderRef.current) {
        try { serialReaderRef.current.cancel(); } catch(_) {}
      }
      if (serialPortRef.current) {
        try { serialPortRef.current.close(); } catch(_) {}
      }

      onDataDisposable.dispose();
      try { term.dispose(); } catch(_) {}
      initializedRef.current = false;
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, []); // Only run once on mount — tab identity is stable via React key

  // Separate effect for WebSocket listeners to support re-attachment
  useEffect(() => {
    if (!ws || !termRef.current) return;

    const term = termRef.current;
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'data') {
          term.write(data.payload);
        } else if (data.type === 'status') {
          term.writeln(`\r\n\x1b[33m[Status: ${data.payload}]\x1b[0m\r\n`);
        } else if (data.type === 'error') {
          term.writeln(`\r\n\x1b[31m[Error: ${data.payload}]\x1b[0m\r\n`);
        }
      } catch (_) {}
    };

    ws.addEventListener('message', handleMessage);
    
    // Also trigger a fit when WS reconnects
    if (ws.readyState === WebSocket.OPEN) {
      setTimeout(() => {
        if (fitAddonRef.current) {
          try {
            fitAddonRef.current.fit();
            if (onResizeRef.current) {
              onResizeRef.current(term.rows, term.cols);
            } else {
              ws.send(JSON.stringify({ 
                type: 'resize', 
                payload: { rows: term.rows, cols: term.cols, persistenceId: tab.id } 
              }));
            }
          } catch(e){}
        }
      }, 200);
    }

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const handlePasteConfirm = () => {
    if (termRef.current) {
      if (protocol === 'serial' && serialPortRef.current?.writable) {
        const writer = serialPortRef.current.writable.getWriter();
        writer.write(new TextEncoder().encode(pasteContent)).finally(() => writer.releaseLock());
      } else if (onDataRef.current) {
        onDataRef.current(pasteContent);
      } else if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'data', 
          payload: { data: pasteContent, persistenceId: tab.id } 
        }));
      }
    }
    setPasteModalOpen(false);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={terminalRef}
        style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      />
      
      {pasteModalOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '600px', maxWidth: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', color: '#333' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
              Warning: Please verify the paste content before proceeding
            </h3>
            <p style={{ fontSize: '13px', marginBottom: '12px', color: '#555' }}>
              Please review the content that you are about to paste and make sure it is safe or modify it before proceeding:
            </p>
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              style={{ width: '100%', height: '200px', padding: '8px', fontFamily: 'monospace', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button 
                onClick={handlePasteConfirm}
                style={{ padding: '6px 16px', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <span style={{ color: '#27ae60', fontSize: '16px' }}>✔️</span> Continue
              </button>
              <button 
                onClick={() => setPasteModalOpen(false)}
                style={{ padding: '6px 16px', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <span style={{ color: '#e74c3c', fontSize: '16px' }}>❌</span> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalComponent;