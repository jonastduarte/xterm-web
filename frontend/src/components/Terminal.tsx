import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalComponentProps {
  ws: WebSocket;
  tabId: string;
}

const TerminalComponent: React.FC<TerminalComponentProps> = ({ ws, tabId }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!terminalRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
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
      scrollback: 5000,
      convertEol: true,
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Helper: safe fit — only calls fit() when the container has real dimensions
    const safeFit = () => {
      const el = terminalRef.current;
      if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) return;
      try {
        fitAddon.fit();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', payload: { rows: term.rows, cols: term.cols } }));
        }
      } catch (_) { /* ignore */ }
    };

    // Open AFTER the browser has painted the container (double rAF ensures layout)
    const openTerminal = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!terminalRef.current) return;
          try {
            term.open(terminalRef.current);
          } catch (e) {
            return; // container not ready
          }
          term.writeln('\x1b[32mConnecting...\x1b[0m');
          // Small extra delay for fonts/CSS to settle
          setTimeout(safeFit, 50);
        });
      });
    };

    openTerminal();

    // ── WebSocket messages ──
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

    // ── Terminal input ──
    const onDataDisposable = term.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'data', payload: data }));
      }
    });

    // ── Resize observers ──
    window.addEventListener('resize', safeFit);

    const resizeObserver = new ResizeObserver(() => safeFit());
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      initializedRef.current = false;
      window.removeEventListener('resize', safeFit);
      resizeObserver.disconnect();
      ws.removeEventListener('message', handleMessage);
      try { onDataDisposable.dispose(); } catch (_) {}
      try { term.dispose(); } catch (_) {}
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, [ws, tabId]);

  return (
    <div
      ref={terminalRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
};

export default TerminalComponent;