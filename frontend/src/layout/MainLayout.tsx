import React, { useState, useEffect, useCallback } from 'react';
import SFTPBrowser from '../components/SFTPBrowser';
import FTPBrowser from '../components/FTPBrowser';
import SessionTree from '../components/SessionTree';
import TerminalComponent, { disposeTerminalInstance } from '../components/Terminal';
import SessionDialog from '../components/SessionDialog';
import UserManagement from '../components/UserManagement';
import SessionLogs from '../components/SessionLogs';
import HelpDialog from '../components/HelpDialog';
import type { TabSession } from '../App';
import { 
  TerminalSquare, 
  FolderClosed, 
  Settings, 
  List, 
  Monitor, 
  LogOut, 
  X,
  Server,
  Wrench,
  FolderOpen,
  Eye,
  LayoutGrid,
  Share2,
  HelpCircle,
  Power,
  FileText,
  HardDrive,
  Plus,
  Globe,
  Lock,
  Users,
  Clock,
  Copy,
  Maximize,
  ZoomIn,
  ZoomOut,
  Printer,
  Moon,
  Sun,
  Download,
  Upload,
  Key
} from 'lucide-react';

interface MainLayoutProps {
  onLogout: () => void;
  apiUrl: string;
  username: string | null;
  role: string;
  userId: number | null;
}

let tabCounter = 0;

const MainLayout: React.FC<MainLayoutProps> = ({ onLogout, apiUrl, username, role, userId }) => {
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [sidebarTab, setSidebarTab] = useState<'sessions' | 'tools' | 'macros' | 'sftp' | 'users' | 'logs'>('sessions');
  const [tabs, setTabs] = useState<TabSession[]>(() => {
    try {
      const saved = localStorage.getItem('moba_tabs');
      if (saved) return JSON.parse(saved).map((t: any) => ({ ...t, ws: null }));
    } catch {}
    return [];
  });
  const [activeTabId, setActiveTabId] = useState<string | null>(() => localStorage.getItem('moba_active_tab') || null);
  const [splitMode, setSplitMode] = useState<'single' | 'vertical' | 'horizontal' | 'grid'>('single');
  const [splitDropdownOpen, setSplitDropdownOpen] = useState(false);
  const [isSessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [isHelpDialogOpen, setHelpDialogOpen] = useState(false);
  const [isMultiExec, setIsMultiExec] = useState(false);
  const [prevSplitMode, setPrevSplitMode] = useState<'single' | 'vertical' | 'horizontal' | 'grid'>('single');
  const [sessionDialogMode, setSessionDialogMode] = useState<'create'|'edit'|'clone'>('create');
  const [sftpPanelWidth, setSftpPanelWidth] = useState(240);
  const [showSftpPanel, setShowSftpPanel] = useState(true);
  const [quickConnectState, setQuickConnectState] = useState<{ host: string; user: string; port: number; name: string } | null>(null);
  const [quickConnectPassword, setQuickConnectPassword] = useState('');
  const [hasVault, setHasVault] = useState(false);
  const [masterPassword, setMasterPassword] = useState<string | null>(sessionStorage.getItem('moba_master_password'));
  const [isVaultModalOpen, setVaultModalOpen] = useState(false);
  const [vaultModalCallback, setVaultModalCallback] = useState<{ resolve: (pass: string) => void, reject: () => void } | null>(null);
  const [vaultActionType, setVaultActionType] = useState<'unlock' | 'setup'>('unlock');
  const [vaultError, setVaultError] = useState('');
  const [vaultPasswordInput, setVaultPasswordInput] = useState('');
  const pendingPromptRef = React.useRef<Promise<string> | null>(null);
  // Tab context menu
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  // Terminal font size
  const [termFontSize, setTermFontSize] = useState(() => parseInt(localStorage.getItem('moba_font_size') || '14'));
  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('moba_theme') as any) || 'dark');
  // View dropdown
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  // Settings dropdown
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  // Default credentials
  const [defaultCredsEnabled, setDefaultCredsEnabled] = useState(() => localStorage.getItem('moba_default_creds_enabled') === 'true');
  const [defaultUsername, setDefaultUsername] = useState(localStorage.getItem('moba_default_username') || '');
  const [defaultPassword, setDefaultPassword] = useState(localStorage.getItem('moba_default_password') || '');
  const [showDefaultPassModal, setShowDefaultPassModal] = useState(false);
  const [defaultPassInput, setDefaultPassInput] = useState('');
  const [defaultUserInput, setDefaultUserInput] = useState('');
  const [defaultCredsEnabledInput, setDefaultCredsEnabledInput] = useState(false);

  const activeTab = tabs.find(t => t.id === activeTabId) || null;

  // Inject print styles for landscape orientation
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'print-styles';
    style.textContent = `
      @media print {
        @page { size: landscape; margin: 5mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `;
    if (!document.getElementById('print-styles')) {
      document.head.appendChild(style);
    }
    return () => { style.remove(); };
  }, []);

  useEffect(() => {
    const toSave = tabs.map(t => ({ id: t.id, session: t.session, protocol: t.protocol, label: t.label }));
    localStorage.setItem('xterm_tabs', JSON.stringify(toSave));
    if (activeTabId) localStorage.setItem('xterm_activeTabId', activeTabId);
  }, [tabs, activeTabId]);

  useEffect(() => {
    const serializable = tabs.map(t => {
      const { ws, ...rest } = t;
      return rest;
    });
    localStorage.setItem('moba_tabs', JSON.stringify(serializable));
  }, [tabs]);

  useEffect(() => {
    if (activeTabId) localStorage.setItem('moba_active_tab', activeTabId);
    else localStorage.removeItem('moba_active_tab');
  }, [activeTabId]);


  useEffect(() => {
    fetch(`${apiUrl}/api/vault/status`)
      .then(r => r.json())
      .then(data => setHasVault(data.hasVault))
      .catch(() => {});
  }, [apiUrl]);

  const promptMasterPassword = (type: 'unlock' | 'setup' = 'unlock'): Promise<string> => {
    if (type === 'unlock' && masterPassword) return Promise.resolve(masterPassword);
    if (pendingPromptRef.current) return pendingPromptRef.current;

    const promise = new Promise<string>((resolve, reject) => {
      setVaultActionType(type);
      setVaultPasswordInput('');
      setVaultError('');
      setVaultModalOpen(true);
      setVaultModalCallback({ 
        resolve: (pass) => {
          pendingPromptRef.current = null;
          resolve(pass);
        }, 
        reject: () => {
          pendingPromptRef.current = null;
          reject();
        } 
      });
    });

    pendingPromptRef.current = promise;
    return promise;
  };

  const handleVaultSubmit = async () => {
    if (vaultActionType === 'setup') {
      try {
        const res = await fetch(`${apiUrl}/api/vault/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ masterPassword: vaultPasswordInput })
        });
        if (!res.ok) throw new Error(await res.text());
        setMasterPassword(vaultPasswordInput);
        sessionStorage.setItem('moba_master_password', vaultPasswordInput);
        setHasVault(true);
        setVaultModalOpen(false);
        vaultModalCallback?.resolve(vaultPasswordInput);
      } catch (err: any) { setVaultError(err.message); }
    } else {
      try {
        const res = await fetch(`${apiUrl}/api/vault/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ masterPassword: vaultPasswordInput })
        });
        const data = await res.json();
        if (data.valid) {
          setMasterPassword(vaultPasswordInput);
          sessionStorage.setItem('moba_master_password', vaultPasswordInput);
          setVaultModalOpen(false);
          vaultModalCallback?.resolve(vaultPasswordInput);
        } else {
          setVaultError('Invalid master password');
        }
      } catch (err: any) { setVaultError('Connection error'); }
    }
  };

  const createConnection = useCallback((session: any, existingTabId?: string) => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    const protocol = session.protocol || 'ssh';
    const tabId = existingTabId || `tab-${++tabCounter}-${Date.now()}`;

    // Add the tab immediately (with ws: null) so the user sees it opening
    const newTab: TabSession = {
      id: tabId,
      session,
      protocol,
      ws: null,
      label: session.name || session.host || 'New Connection'
    };
    if (!existingTabId) setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);

    // If session comes from the saved list, password is masked as '***'
    // Fetch the real credentials from the connect endpoint before opening WS
    const getCredentials = (): Promise<any> => {
      if (session.id) {
        return fetch(`${apiUrl}/api/sessions/${session.id}/connect`)
          .then(r => r.ok ? r.json() : session)
          .catch(() => session);
      }
      return Promise.resolve(session);
    };

    getCredentials().then(async realSession => {
      let currentMasterPass = masterPassword;
      if (hasVault && realSession.id && !currentMasterPass && realSession.password) {
        try {
          currentMasterPass = await promptMasterPassword('unlock');
        } catch {
          setTabs(prev => prev.filter(t => t.id !== tabId));
          return;
        }
      }

      // Auto-save session if it doesn't have an ID (e.g. Quick Connect)
      if (!realSession.id) {
        try {
          const saveResponse = await fetch(`${apiUrl}/api/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...realSession,
              name: realSession.name || `${realSession.host}${realSession.port ? ':' + realSession.port : ''}`,
              protocol: realSession.protocol || 'ssh',
              masterPassword: currentMasterPass
            })
          });
          if (saveResponse.ok) {
            const saved = await saveResponse.json();
            realSession.id = saved.id;
            window.dispatchEvent(new Event('sessions-updated'));
          }
        } catch (e) { console.error('Auto-save failed', e); }
      }

      if (protocol === 'serial') {
        return;
      }

      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        websocket.send(JSON.stringify({
          type: 'connect',
          payload: { ...realSession, protocol, tabId, masterPassword: currentMasterPass, token: localStorage.getItem('moba_token'), persistenceId: tabId }
        }));
        setTabs(prev => prev.map(t =>
          t.id === tabId ? { ...t, ws: websocket, session: realSession } : t
        ));
      };

      websocket.onclose = () => {
        setTabs(prev => prev.map(t =>
          t.id === tabId ? { ...t, ws: null } : t
        ));
      };

      websocket.onerror = () => {
        setTabs(prev => prev.map(t =>
          t.id === tabId ? { ...t, ws: null } : t
        ));
      };
    });
  }, [apiUrl]); // Only re-bind on apiUrl change

  const handleTerminalData = useCallback((data: string, sourceTabId: string) => {
    if (isMultiExec) {
      tabs.forEach(tab => {
        if (tab.ws && tab.ws.readyState === WebSocket.OPEN) {
           tab.ws.send(JSON.stringify({ 
             type: 'data', 
             payload: { data, persistenceId: tab.id } 
           }));
        }
      });
    } else {
      const tab = tabs.find(t => t.id === sourceTabId);
      if (tab?.ws && tab.ws.readyState === WebSocket.OPEN) {
        tab.ws.send(JSON.stringify({ 
          type: 'data', 
          payload: { data, persistenceId: tab.id } 
        }));
      }
    }
  }, [isMultiExec, tabs]);

  const handleTerminalResize = useCallback((rows: number, cols: number, tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.ws && tab.ws.readyState === WebSocket.OPEN) {
      tab.ws.send(JSON.stringify({ 
        type: 'resize', 
        payload: { rows, cols, persistenceId: tabId } 
      }));
    }
  }, [tabs]);

  
  useEffect(() => {
    // Restore connections for all persisted tabs
    const savedTabs = localStorage.getItem('moba_tabs');
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs);
        parsed.forEach((tab: any) => {
          if (tab.session) {
             createConnection(tab.session, tab.id);
          }
        });
      } catch (e) {}
    }
  }, []); // Only run once on mount

  const closeTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.ws) {
      tab.ws.close();
    }
    
    setTabs(prev => {
      const remaining = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
      }
      return remaining;
    });
    
    // Clean up terminal instance from cache
    disposeTerminalInstance(tabId);
  }, [tabs, activeTabId]);

  const handleSaveSession = async (sessionData: any, mode: 'create' | 'edit') => {
    setSessionDialogOpen(false);
    
    let currentMasterPass = masterPassword;
    if (hasVault && !currentMasterPass) {
       try {
         currentMasterPass = await promptMasterPassword('unlock');
       } catch { return; }
    }

    const body = { ...sessionData, masterPassword: currentMasterPass };

    if (mode === 'edit' && sessionData.id) {
      await fetch(`${apiUrl}/api/sessions/${sessionData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } else {
      await fetch(`${apiUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    }
    // Trigger refresh in SessionTree
    window.dispatchEvent(new Event('sessions-updated'));
  };

  const openSessionDialog = (mode: 'create' | 'edit' | 'clone', sessionData: any = null) => {
    setSessionDialogMode(mode);
    setEditingSession(sessionData);
    setSessionDialogOpen(true);
  };

  // Determine if we should show SFTP or FTP panel
  const showFileBrowser = activeTab && activeTab.ws && showSftpPanel && activeTab.session?.use_sftp === 1;
  const isSSHConnection = activeTab?.protocol === 'ssh';
  const isSFTPConnection = activeTab?.protocol === 'sftp';
  const isFTPConnection = activeTab?.protocol === 'ftp';
  const isTelnetConnection = activeTab?.protocol === 'telnet';

  const getPanes = (count: number) => {
    let p = [...tabs].filter(t => t.protocol !== 'ftp');
    const activeIdx = p.findIndex(t => t.id === activeTabId);
    if (activeIdx >= count && p.length > 0) {
      const temp = p[0];
      p[0] = p[activeIdx];
      p[activeIdx] = temp;
    }
    const result = p.slice(0, count);
    while (result.length < count) result.push(null as any);
    return result;
  };

  // MultiExec panes: show all open terminal tabs (up to 4), no nulls
  const getMultiExecPanes = () => {
    const terminalTabs = tabs.filter(t => t.protocol !== 'ftp' && t.protocol !== 'sftp' && t.ws);
    return terminalTabs.slice(0, 4);
  };

  const multiExecPanes = isMultiExec ? getMultiExecPanes() : [];

  let panes: (TabSession | null)[] = [];
  if (!isMultiExec) {
    if (splitMode === 'single') panes = [activeTab || null];
    else if (splitMode === 'vertical' || splitMode === 'horizontal') panes = getPanes(2);
    else if (splitMode === 'grid') panes = getPanes(4);
  }

  const toggleMultiExec = () => {
    if (!isMultiExec) {
      // Activating MultiExec
      const terminalTabs = tabs.filter(t => t.protocol !== 'ftp' && t.protocol !== 'sftp' && t.ws);
      if (terminalTabs.length < 2) {
        alert('MultiExec requires at least 2 active terminal sessions. Open more sessions first.');
        return;
      }
      setPrevSplitMode(splitMode);
      setIsMultiExec(true);
    } else {
      // Deactivating MultiExec — restore previous split mode
      setIsMultiExec(false);
      setSplitMode(prevSplitMode);
    }
  };

  const renderTerminalPane = (tab: TabSession | null) => {
    if (!tab) {
      return (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555', backgroundColor: '#1e1e1e', border: '1px solid #333', minWidth: 0, minHeight: 0 }}>
          Empty Pane
        </div>
      );
    }
    const isActive = tab.id === activeTabId;
    return (
      <div 
        onClick={() => setActiveTabId(tab.id)}
        style={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden', 
          padding: '2px',
          border: isMultiExec ? '2px solid #fbc02d' : (isActive && splitMode !== 'single' ? '1px solid #3498db' : '1px solid #333'),
          display: 'flex',
          minWidth: 0,
          minHeight: 0
        }}>
        {(tab.ws || tab.protocol === 'serial') ? (
          tab.protocol !== 'sftp' ? (
            <TerminalComponent 
              tab={tab} 
              onData={(d) => handleTerminalData(d, tab.id)}
              onResize={(r, c) => handleTerminalResize(r, c, tab.id)}
              fontSize={termFontSize}
              termTheme={theme}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
              <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <h3 style={{ margin: 0 }}>SFTP Session</h3>
            </div>
          )
        ) : (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
            <Monitor size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ fontSize: '13px' }}>Connection closed</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#F0F0F0', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {isSessionDialogOpen && <SessionDialog onClose={() => setSessionDialogOpen(false)} onSave={handleSaveSession} initialData={editingSession} mode={sessionDialogMode} />}
      {isHelpDialogOpen && <HelpDialog onClose={() => setHelpDialogOpen(false)} />}

      {/* Title Bar */}
      <div style={{ backgroundColor: '#fff', padding: '2px 8px', borderBottom: '1px solid #ccc', fontSize: '12px', display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={menuItemStyle}>Terminal</span>
          <span style={menuItemStyle}>Sessions</span>
          <span style={menuItemStyle}>View</span>
          <span style={menuItemStyle}>Tools</span>
          <span style={menuItemStyle}>Settings</span>
          <span style={menuItemStyle}>Help</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
           <span style={{ fontWeight: 'bold', color: '#005a9e' }}>{username}</span>
           <button onClick={onLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }} title="Logout">
              <LogOut size={14} color="#d9534f" />
           </button>
        </div>
      </div>

      {/* Ribbon Toolbar */}
      <div style={{ backgroundColor: '#eef0f3', padding: '4px 8px', borderBottom: '1px solid #d3d3d3', display: 'flex', gap: '8px', alignItems: 'center' }}>
        
        <RibbonBtn icon={<Monitor size={22} color="#3598db" />} label="Session" onClick={() => openSessionDialog('create')} />
        <div style={{ width: '1px', height: '36px', backgroundColor: '#d3d3d3', margin: '0 2px' }} />
        <RibbonBtn icon={<TerminalSquare size={22} color="#27ae60" />} label="SSH" onClick={() => openSessionDialog('create')} />
        <RibbonBtn icon={<FileText size={22} color="#8e44ad" />} label="SFTP" onClick={() => { setEditingSession({ protocol: 'sftp' }); setSessionDialogMode('create'); setSessionDialogOpen(true); }} />
        <RibbonBtn icon={<Globe size={22} color="#f39c12" />} label="FTP" onClick={() => { setEditingSession({ protocol: 'ftp', port: 21 }); setSessionDialogMode('create'); setSessionDialogOpen(true); }} />
        <RibbonBtn icon={<Monitor size={22} color="#16a085" />} label="Telnet" onClick={() => { setEditingSession({ protocol: 'telnet', port: 23 }); setSessionDialogMode('create'); setSessionDialogOpen(true); }} />
        <div style={{ width: '1px', height: '36px', backgroundColor: '#d3d3d3', margin: '0 2px' }} />
        <RibbonBtn icon={<FolderOpen size={22} color="#f1c40f" />} label="Sessions" onClick={() => setSidebarTab('sessions')} />
        {/* View dropdown */}
        <div style={{ position: 'relative' }}>
          <RibbonBtn icon={<Eye size={22} color="#2ecc71" />} label="View" onClick={() => { setViewDropdownOpen(!viewDropdownOpen); setSettingsDropdownOpen(false); setSplitDropdownOpen(false); }} />
          {viewDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #ccc', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', flexDirection: 'column', minWidth: '220px' }}>
              <div style={splitMenuItemStyle} onClick={() => { document.documentElement.requestFullscreen?.(); setViewDropdownOpen(false); }}>
                <Maximize size={14} /> Fullscreen Mode
              </div>
              <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
              <div style={splitMenuItemStyle} onClick={() => { setTermFontSize(s => { const n = Math.min(24, s + 1); localStorage.setItem('moba_font_size', String(n)); return n; }); setViewDropdownOpen(false); }}>
                <ZoomIn size={14} /> Zoom + (Font {termFontSize}px)
              </div>
              <div style={splitMenuItemStyle} onClick={() => { setTermFontSize(s => { const n = Math.max(8, s - 1); localStorage.setItem('moba_font_size', String(n)); return n; }); setViewDropdownOpen(false); }}>
                <ZoomOut size={14} /> Zoom - (Font {termFontSize}px)
              </div>
              <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
              <div style={splitMenuItemStyle} onClick={() => { setViewDropdownOpen(false); setTimeout(() => window.print(), 200); }}>
                <Printer size={14} /> Print Screen
              </div>
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <RibbonBtn icon={<LayoutGrid size={22} color="#3498db" />} label="Split" onClick={() => { setSplitDropdownOpen(!splitDropdownOpen); setViewDropdownOpen(false); setSettingsDropdownOpen(false); }} />
          {splitDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #ccc', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', flexDirection: 'column', minWidth: '220px' }}>
              <div style={splitMenuItemStyle} onClick={() => { setSplitMode('single'); setSplitDropdownOpen(false); }}>Single terminal mode</div>
              <div style={splitMenuItemStyle} onClick={() => { setSplitMode('vertical'); setSplitDropdownOpen(false); }}>2 terminals mode (vertical split)</div>
              <div style={splitMenuItemStyle} onClick={() => { setSplitMode('horizontal'); setSplitDropdownOpen(false); }}>2 terminals mode (horizontal split)</div>
              <div style={splitMenuItemStyle} onClick={() => { setSplitMode('grid'); setSplitDropdownOpen(false); }}>4 terminals mode</div>
            </div>
          )}
        </div>
        {/* Settings dropdown */}
        <div style={{ position: 'relative' }}>
          <RibbonBtn icon={<Settings size={22} color="#95a5a6" />} label="Settings" onClick={() => { setSettingsDropdownOpen(!settingsDropdownOpen); setViewDropdownOpen(false); setSplitDropdownOpen(false); }} />
          {settingsDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #ccc', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', flexDirection: 'column', minWidth: '240px' }}>
              <div style={splitMenuItemStyle} onClick={() => { const t = theme === 'dark' ? 'light' : 'dark'; setTheme(t); localStorage.setItem('moba_theme', t); setSettingsDropdownOpen(false); }}>
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} Theme: {theme === 'dark' ? 'Dark' : 'Light'} (toggle)
              </div>
              <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
              <div style={splitMenuItemStyle} onClick={() => { promptMasterPassword(hasVault ? 'unlock' : 'setup'); setSettingsDropdownOpen(false); }}>
                <Lock size={14} /> Password Vault {hasVault ? '(Unlock)' : '(Setup)'}
              </div>
              <div style={splitMenuItemStyle} onClick={() => { setSidebarTab('users'); setSettingsDropdownOpen(false); }}>
                <Users size={14} /> System User Manager
              </div>
              <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
              <div style={splitMenuItemStyle} onClick={() => { setShowDefaultPassModal(true); setDefaultUserInput(defaultUsername); setDefaultPassInput(defaultPassword); setDefaultCredsEnabledInput(defaultCredsEnabled); setSettingsDropdownOpen(false); }}>
                <Key size={14} /> Default Credentials {defaultCredsEnabled ? '(Active)' : '(Disabled)'}
              </div>
              <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
              <div style={splitMenuItemStyle} onClick={() => { const data = JSON.stringify({ tabs: tabs.map(t => ({ session: t.session, protocol: t.protocol, label: t.label })), settings: { theme, termFontSize, defaultPassword } }); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'xterm-web-config.json'; a.click(); setSettingsDropdownOpen(false); }}>
                <Download size={14} /> Export Configuration
              </div>
              <div style={splitMenuItemStyle} onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = (e: any) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { try { const cfg = JSON.parse(ev.target?.result as string); if (cfg.settings) { if (cfg.settings.theme) { setTheme(cfg.settings.theme); localStorage.setItem('moba_theme', cfg.settings.theme); } if (cfg.settings.termFontSize) { setTermFontSize(cfg.settings.termFontSize); localStorage.setItem('moba_font_size', String(cfg.settings.termFontSize)); } if (cfg.settings.defaultPassword) { setDefaultPassword(cfg.settings.defaultPassword); localStorage.setItem('moba_default_password', cfg.settings.defaultPassword); } } alert('Configuration imported successfully!'); } catch { alert('Invalid config file'); } }; reader.readAsText(file); } }; input.click(); setSettingsDropdownOpen(false); }}>
                <Upload size={14} /> Import Configuration
              </div>
            </div>
          )}
        </div>
        <RibbonBtn 
          icon={<Share2 size={22} color={isMultiExec ? "#e74c3c" : "#9b59b6"} />} 
          label="MultiExec" 
          onClick={toggleMultiExec} 
        />
        
        <div style={{ flex: 1 }}></div>
        <RibbonBtn icon={<HelpCircle size={22} color="#3498db" />} label="Help" onClick={() => setHelpDialogOpen(true)} />
        <RibbonBtn icon={<Power size={22} color="#e74c3c" />} label="Exit" onClick={() => {
          tabs.forEach(t => closeTab(t.id));
        }} />
      </div>
      
      {/* MultiExec Notification Bar */}
      {isMultiExec && (
        <div style={{ backgroundColor: '#fff9c4', padding: '6px 20px', borderBottom: '2px solid #fbc02d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#333' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={16} color="#e67e22" />
            <b>Multi-execution mode:</b> commands are typed to all terminals ({multiExecPanes.length} sessions active)
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
             <button 
                onClick={toggleMultiExec}
                style={{ padding: '4px 14px', fontSize: '12px', cursor: 'pointer', border: 'none', borderRadius: '3px', background: '#e74c3c', color: '#fff', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}
             >
               <X size={14} /> Exit multi-execution mode
             </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Vertical Tabs Bar (Left Edge) */}
        <div style={{ width: '28px', backgroundColor: '#eef0f3', borderRight: '1px solid #d4d4d4', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '8px' }}>
          
          <VerticalTab 
            icon={<FolderClosed size={16} />} 
            label="Sessions" 
            isActive={sidebarTab === 'sessions'} 
            onClick={() => setSidebarTab('sessions')} 
          />
          <VerticalTab 
            icon={<Wrench size={16} />} 
            label="Tools" 
            isActive={sidebarTab === 'tools'} 
            onClick={() => setSidebarTab('tools')} 
          />
          <VerticalTab 
            icon={<List size={16} />} 
            label="Macros" 
            isActive={sidebarTab === 'macros'} 
            onClick={() => setSidebarTab('macros')} 
          />
          <VerticalTab 
            icon={<HardDrive size={16} />} 
            label="Sftp" 
            isActive={sidebarTab === 'sftp'} 
            onClick={() => setSidebarTab('sftp')} 
            color="#e67e22"
          />
          <VerticalTab 
            icon={<Clock size={16} />} 
            label="Logs" 
            isActive={sidebarTab === 'logs'} 
            onClick={() => setSidebarTab('logs')} 
            color="#16a085"
          />
          <VerticalTab 
            icon={<Users size={16} />} 
            label="Users" 
            isActive={sidebarTab === 'users'} 
            onClick={() => setSidebarTab('users')} 
            color="#8e44ad"
          />
          
        </div>

        {/* Left Sidebar Panel */}
        <div style={{ width: sidebarWidth, backgroundColor: '#FFFFFF', borderRight: '1px solid #D4D4D4', display: 'flex', flexDirection: 'column' }}>
          
          {/* Quick Connect Input */}
          <div style={{ padding: '4px', backgroundColor: '#f5f6f7', borderBottom: '1px solid #d4d4d4', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input 
              placeholder="Quick connect..." 
              style={{ flex: 1, border: '1px solid #ccc', padding: '4px 8px', borderRadius: '4px', outline: 'none', fontSize: '12px' }} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    // Parse quick connect: user@host:port or host
                    let host = val, user = 'root', port = 22;
                    if (val.includes('@')) {
                      const parts = val.split('@');
                      user = parts[0];
                      host = parts[1];
                    }
                    if (host.includes(':')) {
                      const parts = host.split(':');
                      host = parts[0];
                      port = parseInt(parts[1]) || 22;
                    }
                    // Trigger the password modal
                    setQuickConnectState({ host, user, port, name: val });
                    setQuickConnectPassword('');
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>

          {/* Sidebar Content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
             {sidebarTab === 'sessions' && (
                <SessionTree 
                  apiUrl={apiUrl} 
                  onConnect={(session) => createConnection(session)}
                  onEdit={(s) => openSessionDialog('edit', s)}
                  onClone={(s) => openSessionDialog('clone', s)}
                />
             )}
             
             {sidebarTab === 'tools' && (
                <div style={{ padding: '12px', color: '#555', fontSize: '12px' }}>
                  <b style={{ marginBottom: '8px', display: 'block', color: '#1a1a1a' }}>Network Tools</b>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {['Network services', 'List open ports', 'Network scanner', 'Ports scanner', 'Packet capture'].map(tool => (
                      <li key={tool} style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: '#1a1a1a' }}>
                        <Server size={14} color="#7f8c8d" />
                        <span>{tool}</span>
                      </li>
                    ))}
                  </ul>

                  <b style={{ marginTop: '20px', marginBottom: '8px', display: 'block', color: '#1a1a1a' }}>Security & Vault</b>
                  <div style={{ padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '6px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Lock size={16} color={hasVault ? '#27ae60' : '#7f8c8d'} />
                      <span style={{ fontWeight: '500' }}>Password Vault: {hasVault ? 'Active' : 'Disabled'}</span>
                    </div>
                    {!hasVault ? (
                      <button 
                        onClick={() => promptMasterPassword('setup')}
                        style={{ padding: '6px 12px', width: '100%', cursor: 'pointer', backgroundColor: '#005a9e', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px' }}
                      >
                        Enable Vault
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setMasterPassword(null); alert('Vault locked for this session.'); }}
                        style={{ padding: '6px 12px', width: '100%', cursor: 'pointer', backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '4px', fontSize: '11px' }}
                      >
                        Lock Vault
                      </button>
                    )}
                  </div>
                </div>
             )}
             
             {sidebarTab === 'macros' && (
                <div style={{ padding: '12px', color: '#555', fontSize: '12px' }}>
                  <b style={{ marginBottom: '8px', display: 'block', color: '#1a1a1a' }}>Saved Macros</b>
                  <p style={{ fontStyle: 'italic', color: '#999' }}>No macros saved yet</p>
                </div>
             )}

             {sidebarTab === 'sftp' && (
                <div style={{ padding: '12px', color: '#555', fontSize: '12px' }}>
                  <b style={{ marginBottom: '8px', display: 'block', color: '#1a1a1a' }}>Standalone SFTP/FTP</b>
                  <p style={{ fontSize: '11px', color: '#888', lineHeight: '1.4' }}>
                    Use the Session button or ribbon to create a dedicated SFTP or FTP connection.
                  </p>
                  <button 
                    onClick={() => { setEditingSession({ protocol: 'sftp' }); setSessionDialogMode('create'); setSessionDialogOpen(true); }}
                    style={{ ...btnSmallStyle, marginTop: '8px', width: '100%' }}
                  >
                    <FileText size={14} /> New SFTP Session
                  </button>
                  <button 
                    onClick={() => { setEditingSession({ protocol: 'ftp', port: 21 }); setSessionDialogMode('create'); setSessionDialogOpen(true); }}
                    style={{ ...btnSmallStyle, marginTop: '6px', width: '100%' }}
                  >
                    <Globe size={14} /> New FTP Session
                  </button>
                </div>
             )}

             {sidebarTab === 'users' && (
                <UserManagement apiUrl={apiUrl} role={role} currentUserId={userId} />
             )}

             {sidebarTab === 'logs' && (
                <SessionLogs apiUrl={apiUrl} />
             )}
          </div>
        </div>

        {/* Resizer */}
        <div 
          style={{ width: '4px', cursor: 'col-resize', backgroundColor: '#E1E1E1' }}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = sidebarWidth;
            
            const onMouseMove = (moveEvent: MouseEvent) => {
              const newWidth = Math.max(150, Math.min(600, startWidth + moveEvent.clientX - startX));
              setSidebarWidth(newWidth);
            };
            
            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          }}
        />

        {/* Right Content / Terminal */}
        <div style={{ flex: 1, backgroundColor: '#1e1e1e', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Tab Bar */}
          <div style={{ display: 'flex', backgroundColor: '#eef0f3', borderBottom: '1px solid #d4d4d4', minHeight: '32px', alignItems: 'flex-end' }}>
            {tabs.map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                onContextMenu={(e) => { e.preventDefault(); setTabContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id }); }}
                style={{ 
                  padding: '4px 12px', 
                  backgroundColor: tab.id === activeTabId ? '#5D6B78' : '#ccc',
                  color: tab.id === activeTabId ? '#FFF' : '#333',
                  fontSize: '12px', 
                  borderTop: tab.id === activeTabId ? '2px solid #3498db' : '2px solid transparent',
                  borderTopLeftRadius: '4px', 
                  borderTopRightRadius: '4px', 
                  marginTop: '4px', 
                  marginLeft: '2px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  cursor: 'pointer',
                  userSelect: 'none',
                  maxWidth: '200px'
                }}
              >
                {tab.protocol === 'ftp' ? <Globe size={13} /> : tab.protocol === 'sftp' ? <FileText size={13} /> : tab.protocol === 'telnet' ? <Monitor size={13} /> : <TerminalSquare size={13} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{tab.label}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} 
                  style={{ background: 'transparent', border: 'none', color: tab.id === activeTabId ? '#fff' : '#666', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  <X size={12}/>
                </button>
              </div>
            ))}
            
            {/* New tab button */}
            <div 
              onClick={() => openSessionDialog('create')}
              style={{ padding: '4px 8px', marginTop: '4px', marginLeft: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#888' }}
              title="New session"
            >
              <Plus size={14} />
            </div>
          </div>

          {/* Tab Context Menu */}
          {tabContextMenu && (
            <>
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setTabContextMenu(null)} />
              <div style={{ position: 'fixed', top: tabContextMenu.y, left: tabContextMenu.x, backgroundColor: '#fff', border: '1px solid #ccc', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', flexDirection: 'column', minWidth: '180px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={splitMenuItemStyle} onClick={() => { closeTab(tabContextMenu.tabId); setTabContextMenu(null); }}>
                  <X size={14} /> Close
                </div>
                <div style={splitMenuItemStyle} onClick={() => { const tab = tabs.find(t => t.id === tabContextMenu.tabId); if (tab?.session) createConnection(tab.session); setTabContextMenu(null); }}>
                  <Copy size={14} /> Duplicate
                </div>
                <div style={splitMenuItemStyle} onClick={() => { const el = document.documentElement; el.requestFullscreen?.(); setTabContextMenu(null); }}>
                  <Maximize size={14} /> Fullscreen
                </div>
                <div style={{ height: '1px', backgroundColor: '#eee', margin: '2px 0' }} />
                <div style={splitMenuItemStyle} onClick={() => { setTermFontSize(s => { const n = Math.min(24, s + 1); localStorage.setItem('moba_font_size', String(n)); return n; }); setTabContextMenu(null); }}>
                  <ZoomIn size={14} /> Increase Font
                </div>
                <div style={splitMenuItemStyle} onClick={() => { setTermFontSize(s => { const n = Math.max(8, s - 1); localStorage.setItem('moba_font_size', String(n)); return n; }); setTabContextMenu(null); }}>
                  <ZoomOut size={14} /> Decrease Font
                </div>
                <div style={{ height: '1px', backgroundColor: '#eee', margin: '2px 0' }} />
                <div style={{ ...splitMenuItemStyle, color: '#e74c3c' }} onClick={() => { tabs.forEach(t => closeTab(t.id)); setTabContextMenu(null); }}>
                  <X size={14} /> Close All Tabs
                </div>
              </div>
            </>
          )}
          
          {/* Terminal Workspace Area */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* SFTP/FTP Browser Panel (when SSH connected or standalone SFTP) */}
            {showFileBrowser && (isSSHConnection || isSFTPConnection) && (
              <>
                <div style={{ width: sftpPanelWidth, borderRight: '1px solid #333', backgroundColor: '#f0f0f0', display: 'flex', flexDirection: 'column' }}>
                   <SFTPBrowser 
                    ws={activeTab!.ws}
                    apiUrl={apiUrl}
                    credentials={activeTab!.session}
                  />
                </div>
                {/* SFTP Resizer */}
                <div 
                  style={{ width: '3px', cursor: 'col-resize', backgroundColor: '#555' }}
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startW = sftpPanelWidth;
                    const onMove = (ev: MouseEvent) => setSftpPanelWidth(Math.max(150, Math.min(500, startW + ev.clientX - startX)));
                    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                  }}
                />
              </>
            )}

            {/* FTP Browser takes full width when protocol is ftp */}
            {showFileBrowser && isFTPConnection && (
        <div style={{ flex: 1, backgroundColor: '#f0f0f0', display: 'flex', flexDirection: 'column' }}>
          <FTPBrowser
            apiUrl={apiUrl}
            credentials={activeTab!.session}
          />
        </div>
      )}
      
      {/* Vault Password Modal */}
      {isVaultModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ width: '350px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Lock size={20} color="#005a9e" />
              <h4 style={{ margin: 0, color: '#333', fontSize: '16px' }}>
                {vaultActionType === 'setup' ? 'Setup Password Vault' : 'Unlock Password Vault'}
              </h4>
            </div>
            
            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '12px', lineHeight: '1.4' }}>
              {vaultActionType === 'setup' 
                ? 'Create a master password to encrypt your session credentials. This password will never be stored in plain text.' 
                : 'Enter your master password to decrypt session credentials and connect.'}
            </p>

            <input
              autoFocus
              type="password"
              placeholder="Master Password..."
              value={vaultPasswordInput}
              onChange={e => setVaultPasswordInput(e.target.value)}
              style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '8px', outline: 'none', fontSize: '14px' }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleVaultSubmit();
                if (e.key === 'Escape') { setVaultModalOpen(false); vaultModalCallback?.reject(); }
              }}
            />
            
            {vaultError && <p style={{ color: '#d93025', fontSize: '11px', margin: '4px 0 12px 0' }}>{vaultError}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button 
                onClick={() => { setVaultModalOpen(false); vaultModalCallback?.reject(); }} 
                style={{ padding: '8px 16px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleVaultSubmit} 
                style={{ padding: '8px 20px', border: 'none', background: '#005a9e', color: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', fontWeight: '500' }}
              >
                {vaultActionType === 'setup' ? 'Setup Vault' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Connect Password Modal */}
      {quickConnectState && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ width: '320px', backgroundColor: '#fff', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '14px' }}>Password Required</h4>
            <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '12px' }}>
              Connect to {quickConnectState.user}@{quickConnectState.host}:{quickConnectState.port}
            </p>
            <input
              autoFocus
              type="password"
              placeholder="Password..."
              value={quickConnectPassword}
              onChange={e => setQuickConnectPassword(e.target.value)}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '16px', outline: 'none' }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  createConnection({ ...quickConnectState, username: quickConnectState.user, password: quickConnectPassword, protocol: 'ssh' });
                  setQuickConnectState(null);
                } else if (e.key === 'Escape') {
                  setQuickConnectState(null);
                }
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setQuickConnectState(null)} style={{ padding: '6px 16px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', borderRadius: '4px' }}>Cancel</button>
              <button 
                onClick={() => {
                  createConnection({ ...quickConnectState, username: quickConnectState.user, password: quickConnectPassword, protocol: 'ssh' });
                  setQuickConnectState(null);
                }} 
                style={{ padding: '6px 16px', border: 'none', background: '#005a9e', color: '#fff', cursor: 'pointer', borderRadius: '4px' }}
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal content area - ALL terminals always mounted, CSS controls visibility */}
      {tabs.filter(t => t.protocol !== 'ftp').length > 0 && !isFTPConnection && (() => {
        // Determine which tab IDs should be visible and in what positions
        const terminalTabs = tabs.filter(t => t.protocol !== 'ftp' && t.protocol !== 'sftp');
        
        let visibleIds: string[] = [];
        if (isMultiExec) {
          visibleIds = terminalTabs.filter(t => t.ws).slice(0, 4).map(t => t.id);
        } else if (splitMode === 'single') {
          visibleIds = activeTabId ? [activeTabId] : [];
        } else {
          // vertical, horizontal, grid
          const count = (splitMode === 'vertical' || splitMode === 'horizontal') ? 2 : 4;
          const p = [...terminalTabs];
          const activeIdx = p.findIndex(t => t.id === activeTabId);
          if (activeIdx >= count && p.length > 0) {
            const temp = p[0];
            p[0] = p[activeIdx];
            p[activeIdx] = temp;
          }
          visibleIds = p.slice(0, count).map(t => t.id);
        }
        
        const visibleCount = visibleIds.length;
        
        // Determine layout: how many rows/cols
        let layoutMode: 'single' | 'row' | 'col' | 'grid' = 'single';
        if (isMultiExec) {
          layoutMode = visibleCount <= 2 ? 'row' : 'grid';
        } else if (splitMode === 'vertical') {
          layoutMode = 'row';
        } else if (splitMode === 'horizontal') {
          layoutMode = 'col';
        } else if (splitMode === 'grid') {
          layoutMode = 'grid';
        }
        
        // Calculate CSS grid template
        let gridStyle: React.CSSProperties = { flex: 1, position: 'relative', overflow: 'hidden', padding: '4px', minWidth: 0, minHeight: 0 };
        if (layoutMode === 'single') {
          gridStyle = { ...gridStyle, display: 'flex' };
        } else if (layoutMode === 'row') {
          gridStyle = { ...gridStyle, display: 'grid', gridTemplateColumns: `repeat(${visibleCount}, 1fr)`, gridTemplateRows: '1fr', gap: '4px' };
        } else if (layoutMode === 'col') {
          gridStyle = { ...gridStyle, display: 'grid', gridTemplateColumns: '1fr', gridTemplateRows: `repeat(${visibleCount}, 1fr)`, gap: '4px' };
        } else if (layoutMode === 'grid') {
          gridStyle = { ...gridStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: `repeat(${Math.ceil(visibleCount / 2)}, 1fr)`, gap: '4px' };
        }

        return (
          <div style={gridStyle}>
            {terminalTabs.map(tab => {
              const isVisible = visibleIds.includes(tab.id);
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  style={{
                    display: isVisible ? 'flex' : 'none',
                    flex: layoutMode === 'single' ? 1 : undefined,
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '2px',
                    border: isMultiExec ? '2px solid #fbc02d' : (isActive && splitMode !== 'single' ? '1px solid #3498db' : '1px solid #333'),
                    minWidth: 0,
                    minHeight: 0
                  }}
                >
                  {(tab.ws || tab.protocol === 'serial') ? (
                    <TerminalComponent
                      tab={tab}
                      onData={(d) => handleTerminalData(d, tab.id)}
                      onResize={(r, c) => handleTerminalResize(r, c, tab.id)}
                      fontSize={termFontSize}
                      termTheme={theme}
                    />
                  ) : (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
                      <Monitor size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                      <p style={{ fontSize: '13px' }}>Connection closed</p>
                    </div>
                  )}
                </div>
              );
            })}
            {/* SFTP tab rendering (when active) */}
            {activeTab && activeTab.protocol === 'sftp' && (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#aaa', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
                <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <h3 style={{ margin: 0 }}>SFTP Session</h3>
              </div>
            )}
            {/* Empty panes for grid mode when we have fewer tabs than slots */}
            {!isMultiExec && (splitMode === 'grid' || splitMode === 'vertical' || splitMode === 'horizontal') && (() => {
              const slots = splitMode === 'grid' ? 4 : 2;
              const empties = Math.max(0, slots - visibleCount);
              return Array.from({ length: empties }).map((_, i) => (
                <div key={`empty-${i}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555', backgroundColor: '#1e1e1e', border: '1px solid #333', minWidth: 0, minHeight: 0 }}>
                  Empty Pane
                </div>
              ));
            })()}
          </div>
        );
      })()}

            {/* Welcome screen when no tabs */}
            {!activeTab && (
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
                <div style={{ textAlign: 'center', color: '#888' }}>
                  <Monitor size={56} style={{ marginBottom: '16px', opacity: 0.4 }} />
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'normal', color: '#aaa' }}>XTerm Web</h2>
                  <p style={{ maxWidth: '420px', lineHeight: '1.5', fontSize: '13px', color: '#666' }}>
                    SSH client, SFTP browser, and FTP client — all in your browser.<br/>
                    Create a session or use Quick Connect to get started.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
                    <button onClick={() => openSessionDialog('create')} style={welcomeBtnStyle}>
                      <Plus size={16} /> New Session
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
      
      {/* Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ecf0f1', color: '#555', borderTop: '1px solid #bdc3c7', padding: '2px 12px', fontSize: '11px', height: '22px' }}>
         <div style={{ display: 'flex', gap: '16px' }}>
           <span>Ready</span>
           <span style={{ color: '#27ae60' }}>{tabs.length > 0 ? `${tabs.length} connection(s)` : ''}</span>
         </div>
         <div style={{ display: 'flex', gap: '16px' }}>
           {activeTab?.ws && <span style={{ color: '#005a9e' }}>● {activeTab.protocol.toUpperCase()} → {activeTab.session.host}:{activeTab.session.port}</span>}
           {activeTab && !activeTab.ws && <span style={{ color: '#e74c3c' }}>○ Disconnected</span>}
         </div>
      </div>

      {/* Default Credentials Modal */}
      {showDefaultPassModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ width: '420px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Key size={20} color="#e67e22" />
              <h4 style={{ margin: 0, color: '#333', fontSize: '16px' }}>Default Credentials</h4>
            </div>
            <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '12px', lineHeight: '1.4' }}>
              Set default credentials (user and password) that will be used for all sessions created without their own login information.
            </p>

            {/* Enable/Disable toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer', fontSize: '13px', color: '#333' }}>
              <input
                type="checkbox"
                checked={defaultCredsEnabledInput}
                onChange={e => setDefaultCredsEnabledInput(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Enable default credentials for sessions without login
            </label>

            <div style={{ opacity: defaultCredsEnabledInput ? 1 : 0.4, pointerEvents: defaultCredsEnabledInput ? 'auto' : 'none' }}>
              <label style={{ fontSize: '12px', color: '#555', marginBottom: '4px', display: 'block' }}>Username</label>
              <input
                autoFocus
                type="text"
                placeholder="Default username..."
                value={defaultUserInput}
                onChange={e => setDefaultUserInput(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '12px', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
              />
              <label style={{ fontSize: '12px', color: '#555', marginBottom: '4px', display: 'block' }}>Password</label>
              <input
                type="password"
                placeholder="Default password..."
                value={defaultPassInput}
                onChange={e => setDefaultPassInput(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '16px', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setDefaultCredsEnabled(defaultCredsEnabledInput);
                    setDefaultUsername(defaultUserInput);
                    setDefaultPassword(defaultPassInput);
                    localStorage.setItem('moba_default_creds_enabled', String(defaultCredsEnabledInput));
                    localStorage.setItem('moba_default_username', defaultUserInput);
                    localStorage.setItem('moba_default_password', defaultPassInput);
                    setShowDefaultPassModal(false);
                  }
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowDefaultPassModal(false)} style={{ padding: '8px 16px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>Cancel</button>
              <button onClick={() => {
                setDefaultCredsEnabled(defaultCredsEnabledInput);
                setDefaultUsername(defaultUserInput);
                setDefaultPassword(defaultPassInput);
                localStorage.setItem('moba_default_creds_enabled', String(defaultCredsEnabledInput));
                localStorage.setItem('moba_default_username', defaultUserInput);
                localStorage.setItem('moba_default_password', defaultPassInput);
                setShowDefaultPassModal(false);
              }} style={{ padding: '8px 16px', border: 'none', background: '#005a9e', color: '#fff', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>Save</button>
              {(defaultUsername || defaultPassword) && <button onClick={() => {
                setDefaultCredsEnabled(false);
                setDefaultUsername('');
                setDefaultPassword('');
                setDefaultUserInput('');
                setDefaultPassInput('');
                setDefaultCredsEnabledInput(false);
                localStorage.removeItem('moba_default_creds_enabled');
                localStorage.removeItem('moba_default_username');
                localStorage.removeItem('moba_default_password');
                setShowDefaultPassModal(false);
              }} style={{ padding: '8px 16px', border: '1px solid #e74c3c', background: '#fff', color: '#e74c3c', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>Clear</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Sub-Components =====

const RibbonBtn = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
  <div 
    onClick={onClick} 
    style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', 
      padding: '3px 6px', minWidth: '40px', borderRadius: '4px', transition: 'background 0.15s'
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d5dde5')}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    {icon}
    <span style={{ fontSize: '10px', marginTop: '2px', color: '#333' }}>{label}</span>
  </div>
);

const VerticalTab = ({ icon, label, isActive, onClick, color }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; color?: string }) => (
  <div 
    onClick={onClick}
    style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '12px 4px', cursor: 'pointer', borderRight: 'none',
      backgroundColor: isActive ? '#fff' : 'transparent',
      borderTop: isActive ? '1px solid #d4d4d4' : 'none',
      borderBottom: isActive ? '1px solid #d4d4d4' : 'none',
      borderLeft: isActive ? `2px solid ${color || '#f1c40f'}` : '2px solid transparent',
      width: '100%',
      writingMode: 'vertical-rl',
      textOrientation: 'mixed',
      transform: 'rotate(180deg)'
    }}
  >
    <div style={{ transform: 'rotate(90deg)', marginBottom: '8px', color: isActive ? (color || '#34495e') : '#7f8c8d' }}>
       {icon}
    </div>
    <span style={{ fontSize: '11px', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? (color || '#34495e') : '#7f8c8d' }}>
      {label}
    </span>
  </div>
);

const menuItemStyle: React.CSSProperties = { cursor: 'pointer', padding: '2px 4px', color: '#1a1a1a' };

const splitMenuItemStyle: React.CSSProperties = {
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: '12px',
  color: '#333',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const btnSmallStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px', background: '#fff',
  border: '1px solid #ccc', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px',
  justifyContent: 'center'
};

const welcomeBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  background: 'transparent', border: '1px solid #555', borderRadius: '6px',
  padding: '10px 20px', cursor: 'pointer', color: '#aaa', fontSize: '13px',
  transition: 'all 0.2s'
};

export default MainLayout;