import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { TabSession } from '../App';

interface TerminalComponentProps {
  tab: TabSession;
}

const TerminalComponent: React.FC<TerminalComponentProps> = ({ tab }) => {
  const { ws, protocol, session } = tab;
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initializedRef = useRef(false);
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);

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

    const safeFit = () => {
      const el = terminalRef.current;
      if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) return;
      try {
        fitAddon.fit();
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', payload: { rows: term.rows, cols: term.cols } }));
        }
      } catch (_) { /* ignore */ }
    };

    const openTerminal = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!terminalRef.current) return;
          try {
            term.open(terminalRef.current);
          } catch (e) {
            return;
          }
          term.writeln('\x1b[32mConnecting...\x1b[0m');
          setTimeout(safeFit, 50);
          
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
    if (ws) ws.addEventListener('message', handleMessage);

    const onDataDisposable = term.onData(async data => {
      if (protocol === 'serial' && serialPortRef.current?.writable) {
        const writer = serialPortRef.current.writable.getWriter();
        await writer.write(new TextEncoder().encode(data));
        writer.releaseLock();
      } else if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'data', payload: data }));
      }
    });

    window.addEventListener('resize', safeFit);

    const resizeObserver = new ResizeObserver(() => safeFit());
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      initializedRef.current = false;
      window.removeEventListener('resize', safeFit);
      resizeObserver.disconnect();
      if (ws) ws.removeEventListener('message', handleMessage);
      
      if (serialReaderRef.current) {
        try { serialReaderRef.current.cancel(); } catch(_) {}
      }
      if (serialPortRef.current) {
        try { serialPortRef.current.close(); } catch(_) {}
      }

      try { onDataDisposable.dispose(); } catch (_) {}
      try { term.dispose(); } catch (_) {}
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, [ws, protocol, session]);

  return (
    <div
      ref={terminalRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
    />
  );
};

export default TerminalComponent;