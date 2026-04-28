import React, { useState, useEffect, useCallback } from 'react';
import SFTPBrowser from '../components/SFTPBrowser';
import FTPBrowser from '../components/FTPBrowser';
import SessionTree from '../components/SessionTree';
import TerminalComponent from '../components/Terminal';
import SessionDialog from '../components/SessionDialog';
import type { TabSession } from '../App';
import { 
  TerminalSquare, 
  FolderClosed, 
  Settings, 
  List, 
  Monitor, 
  LogOut,
  X,
  SlidersHorizontal,
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
  Globe
} from 'lucide-react';

interface MainLayoutProps {
  onLogout: () => void;
  apiUrl: string;
  username: string | null;
}

let tabCounter = 0;

const MainLayout: React.FC<MainLayoutProps> = ({ onLogout, apiUrl, username }) => {
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [sidebarTab, setSidebarTab] = useState<'sessions' | 'tools' | 'macros' | 'sftp'>('sessions');
  const [tabs, setTabs] = useState<TabSession[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isSessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [sessionDialogMode, setSessionDialogMode] = useState<'create'|'edit'|'clone'>('create');
  const [sftpPanelWidth, setSftpPanelWidth] = useState(240);
  const [showSftpPanel, setShowSftpPanel] = useState(true);
  const [quickConnectState, setQuickConnectState] = useState<{ host: string; user: string; port: number; name: string } | null>(null);
  const [quickConnectPassword, setQuickConnectPassword] = useState('');

  const activeTab = tabs.find(t => t.id === activeTabId) || null;

  const createConnection = useCallback((session: any) => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    const protocol = session.protocol || 'ssh';
    const tabId = `tab-${++tabCounter}-${Date.now()}`;

    // Add the tab immediately (with ws: null) so the user sees it opening
    const newTab: TabSession = {
      id: tabId,
      session,
      protocol,
      ws: null,
      label: session.name || session.host || 'New Connection'
    };
    setTabs(prev => [...prev, newTab]);
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
      // Auto-save session if it doesn't have an ID (e.g. Quick Connect)
      if (!realSession.id) {
        try {
          const saveResponse = await fetch(`${apiUrl}/api/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...realSession,
              name: realSession.name || `${realSession.host}${realSession.port ? ':' + realSession.port : ''}`,
              protocol: realSession.protocol || 'ssh'
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
          payload: { ...realSession, protocol }
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
  }, [apiUrl]);

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
  }, [tabs, activeTabId]);

  const handleSaveSession = async (sessionData: any, mode: 'create' | 'edit') => {
    setSessionDialogOpen(false);
    
    if (mode === 'edit' && sessionData.id) {
      await fetch(`${apiUrl}/api/sessions/${sessionData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
    } else {
      await fetch(`${apiUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#F0F0F0', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      
      {isSessionDialogOpen && <SessionDialog onClose={() => setSessionDialogOpen(false)} onSave={handleSaveSession} initialData={editingSession} mode={sessionDialogMode} />}

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
        <RibbonBtn icon={<FolderOpen size={22} color="#f1c40f" />} label="Sessions" />
        <RibbonBtn icon={<Eye size={22} color="#2ecc71" />} label="View" />
        <RibbonBtn icon={<LayoutGrid size={22} color="#3498db" />} label="Split" />
        <RibbonBtn icon={<Share2 size={22} color="#9b59b6" />} label="MultiExec" />
        <RibbonBtn icon={<SlidersHorizontal size={22} color="#34495e" />} label="Tunneling" />
        <RibbonBtn icon={<Settings size={22} color="#95a5a6" />} label="Settings" />
        
        <div style={{ flex: 1 }}></div>
        <RibbonBtn icon={<HelpCircle size={22} color="#3498db" />} label="Help" />
        <RibbonBtn icon={<Power size={22} color="#e74c3c" />} label="Exit" onClick={() => {
          tabs.forEach(t => closeTab(t.id));
        }} />
      </div>

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
                    {['MobaSSHTunnel', 'Network services', 'List open ports', 'Network scanner', 'Ports scanner', 'Packet capture'].map(tool => (
                      <li key={tool} style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: '#1a1a1a' }}>
                        <Server size={14} color="#7f8c8d" />
                        <span>{tool}</span>
                      </li>
                    ))}
                  </ul>
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

      {/* Terminal content area */}
      {activeTab && !isFTPConnection && (
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '4px' }}>
                {(activeTab.ws || activeTab.protocol === 'serial') ? (
                  activeTab.protocol !== 'sftp' ? (
                    <TerminalComponent tab={activeTab} />
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#aaa', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
                      <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                      <h3 style={{ margin: 0 }}>SFTP Session</h3>
                      <p style={{ maxWidth: '300px', textAlign: 'center', lineHeight: '1.4', fontSize: '13px', opacity: 0.6 }}>
                        Use the file browser on the left to navigate, upload, and download files.
                      </p>
                    </div>
                  )
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#aaa', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
                    <Monitor size={36} style={{ marginBottom: '12px', opacity: 0.3 }} />
                    <p style={{ fontSize: '13px' }}>Connection closed</p>
                  </div>
                )}
              </div>
            )}

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