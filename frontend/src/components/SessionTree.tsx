import React, { useState, useEffect, useCallback } from 'react';
import { Monitor, Folder, ChevronRight, ChevronDown, PlusCircle, Edit2, Copy, Terminal, FileText, Globe, Trash2, Play, Download, Upload } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SessionTreeProps {
  apiUrl: string;
  onConnect: (session: any) => void;
  onEdit: (session: any) => void;
  onClone: (session: any) => void;
}

const SessionTree: React.FC<SessionTreeProps> = ({ apiUrl, onConnect, onEdit, onClone }) => {
  const { t } = useLanguage();
  const [folders, setFolders] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<{ [key: number]: boolean }>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'session' | 'folder'; item: any } | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState<number | 'root' | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  
  const refreshData = useCallback(() => {
    const token = localStorage.getItem('xtermweb_token');
    fetch(`${apiUrl}/api/folders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(setFolders).catch(() => {});
    fetch(`${apiUrl}/api/sessions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(setSessions).catch(() => {});
  }, [apiUrl]);

  useEffect(() => {
    refreshData();
    
    // Listen for session updates
    const handler = () => refreshData();
    window.addEventListener('sessions-updated', handler);
    return () => window.removeEventListener('sessions-updated', handler);
  }, [refreshData]);

  const toggleFolder = (id: number) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, type: 'session' | 'folder', id: number) => {
    e.dataTransfer.setData('type', type);
    e.dataTransfer.setData('id', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('type');
    const id = parseInt(e.dataTransfer.getData('id'), 10);
    
    if (type === 'session') {
      fetch(`${apiUrl}/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('xtermweb_token')}`
        },
        body: JSON.stringify({ folder_id: targetFolderId })
      }).then(() => refreshData());
    } else if (type === 'folder') {
      fetch(`${apiUrl}/api/folders/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('xtermweb_token')}`
        },
        body: JSON.stringify({ parent_id: targetFolderId })
      }).then(() => refreshData());
    }
  };

  const submitCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const parentId = isCreatingFolder === 'root' ? null : isCreatingFolder;
    fetch(`${apiUrl}/api/folders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('xtermweb_token')}`
      },
      body: JSON.stringify({ name: newFolderName.trim(), parent_id: parentId })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to create folder');
      return res.json();
    })
    .then(() => {
      setNewFolderName('');
      setIsCreatingFolder(null);
      refreshData();
    })
    .catch(err => alert(t('alert_err') + err.message));
  };

  // Close context menu on click outside
  React.useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, type: 'session' | 'folder', item: any) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, item });
  };

  const openAllInFolder = (folderId: number) => {
    const folderSessions = sessions.filter(s => s.folder_id === folderId);
    folderSessions.forEach(s => onConnect(s));
  };

  const handleExport = () => {
    fetch(`${apiUrl}/api/sessions/export/all`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('xtermweb_token')}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'xterm-web-sessions.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => alert(t('alert_err_export') + err.message));
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8 = new Uint8Array(arrayBuffer);
        
        // Detecção de encoding via BOM (Byte Order Mark)
        let encoding = 'utf-8';
        let offset = 0;
        
        if (uint8[0] === 0xFF && uint8[1] === 0xFE) {
          encoding = 'utf-16le';
          offset = 2;
        } else if (uint8[0] === 0xFE && uint8[1] === 0xFF) {
          encoding = 'utf-16be';
          offset = 2;
        } else if (uint8[0] === 0xEF && uint8[1] === 0xBB && uint8[2] === 0xBF) {
          encoding = 'utf-8';
          offset = 3;
        }

        try {
          const decoder = new TextDecoder(encoding);
          const text = decoder.decode(uint8.subarray(offset)).trim();
          
          let data: any = null;
          let isMoba = false;
          
          // Abordagem robusta com bloco Try-Catch para diferenciar JSON nativo de INI do Moba
          try {
            data = JSON.parse(text);
          } catch (jsonErr) {
            data = parseXTermWebConf(text);
            isMoba = true;
          }

          if (data && (data.sessions?.length > 0 || data.folders?.length > 0)) {
            fetch(`${apiUrl}/api/sessions/import`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('xtermweb_token')}`
              },
              body: JSON.stringify(data)
            }).then(async (res) => {
              if (res.ok) {
                refreshData();
                if (isMoba) {
                  alert(
                    `Importação do MobaXterm concluída!\n\n` +
                    `• Pastas criadas: ${data.folders.length}\n` +
                    `• Sessões importadas: ${data.sessions.length}\n\n` +
                    `Nota de Segurança: As senhas criptografadas do MobaXterm foram preservadas em branco devido à portabilidade do sistema original. Por favor, insira as credenciais reais no primeiro acesso.`
                  );
                } else {
                  alert(`${t('alert_imp_succ')} (${data.sessions.length} conexões, ${data.folders.length} pastas)`);
                }
              } else {
                const errData = await res.json();
                alert(t('alert_err') + (errData.error || 'Erro interno do servidor'));
              }
            }).catch(err => {
              alert(t('alert_err') + err.message);
            });
          } else {
            alert("Nenhuma sessão ou pasta válida foi encontrada no arquivo importado.");
          }
        } catch (err: any) { 
          alert(t('alert_inv_format') + ' - ' + err.message); 
        }
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  };

  const parseXTermWebConf = (text: string) => {
    const lines = text.split(/\r?\n/);
    const importFolders: any[] = [];
    const importSessions: any[] = [];
    const folderMap: Record<string, number> = {};
    let currentFolderId: number | null = null;
    let currentFolderPath: string | undefined = undefined;
    let folderCounter = 1;
    
    // Credentials Map
    const credentialsMap: Record<string, string> = {};
    // Passwords Map
    const passwordsMap: Record<string, string> = {};
    let currentSection = '';

    // First pass to extract [Credentials] and [Passwords]
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith(';')) continue;

      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.substring(1, line.length - 1).trim().toLowerCase();
        continue;
      }

      if (currentSection === 'credentials') {
        const eqIdx = line.indexOf('=');
        if (eqIdx > 0) {
          const key = line.substring(0, eqIdx).trim().toLowerCase();
          const val = line.substring(eqIdx + 1).trim();
          const userPart = val.split(':')[0] || val;
          credentialsMap[key] = userPart;
        }
      } else if (currentSection === 'passwords') {
        const eqIdx = line.indexOf('=');
        if (eqIdx > 0) {
          const key = line.substring(0, eqIdx).trim().toLowerCase();
          const val = line.substring(eqIdx + 1).trim();
          passwordsMap[key] = val;
        }
      }
    }

    currentSection = '';
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith(';')) continue;

      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.substring(1, line.length - 1).trim().toLowerCase();
        if (currentSection.startsWith('bookmarks')) {
          currentFolderPath = '';
          currentFolderId = null;
        } else {
          currentFolderPath = undefined;
          currentFolderId = null;
        }
        continue;
      }

      if (currentSection && currentSection.startsWith('bookmarks')) {
        if (line.startsWith('SubRep=')) {
          let pathVal = line.substring(7).trim();
          // Substituir \_ por espaço real
          pathVal = pathVal.replace(/\\_/g, ' ');
          currentFolderPath = pathVal;

          if (currentFolderPath) {
            const parts = currentFolderPath.split('\\');
            let currentPath = '';
            let parentId: number | null = null;
            for (const part of parts) {
              currentPath = currentPath ? currentPath + '\\' + part : part;
              if (!folderMap[currentPath]) {
                folderMap[currentPath] = folderCounter++;
                importFolders.push({ id: folderMap[currentPath], name: part, parent_id: parentId });
              }
              parentId = folderMap[currentPath];
            }
            currentFolderId = folderMap[currentFolderPath];
          }
        } else if (line.includes('=#') && currentFolderPath !== undefined) {
          const eqIdx = line.indexOf('=');
          let name = line.substring(0, eqIdx).trim();
          // Substituir \_ por espaço real no nome do bookmark
          name = name.replace(/\\_/g, ' ');
          
          const val = line.substring(eqIdx + 1).trim();
          if (val.startsWith('#')) {
            const parts = val.split('%');
            if (parts.length >= 4) {
              let host = parts[1];
              let port = parseInt(parts[2]) || 22;
              let username = parts[3] || 'root';

              if (host.includes('@')) {
                const hostParts = host.split('@');
                host = hostParts[hostParts.length - 1];
                if (hostParts.length >= 2) username = hostParts[hostParts.length - 2];
              }

              // Resolvendo credenciais
              if (username.startsWith('[') && username.endsWith(']')) {
                const credKey = username.substring(1, username.length - 1).trim().toLowerCase();
                if (credentialsMap[credKey]) {
                  username = credentialsMap[credKey];
                } else {
                  username = username.substring(1, username.length - 1);
                }
              }

              let protocol = 'ssh';
              if (val.startsWith('#98#') || val.startsWith('#140#') || val.startsWith('#126#') || val.startsWith('#147#')) {
                protocol = 'telnet';
              } else if (val.startsWith('#83#')) {
                protocol = 'sftp';
              } else if (val.startsWith('#105#')) {
                protocol = 'ftp';
              } else if (val.startsWith('#131#')) {
                protocol = 'serial';
              } else {
                // Fallback inteligente baseando-se na porta padrão
                if (port === 23) protocol = 'telnet';
                else if (port === 21) protocol = 'ftp';
              }

              importSessions.push({
                name: name,
                host: host,
                port: port,
                username: username,
                protocol: protocol,
                password: '', // Mantemos em branco para preenchimento de segurança manual no primeiro login
                folder_id: currentFolderId
              });
            }
          }
        }
      }
    }
    return { folders: importFolders, sessions: importSessions };
  };

  const deleteSession = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm(t('alert_del_session'))) return;
    fetch(`${apiUrl}/api/sessions/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('xtermweb_token')}` }
    }).then(() => refreshData());
  };

  const deleteFolder = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm(t('alert_del_folder'))) return;
    fetch(`${apiUrl}/api/folders/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('xtermweb_token')}` }
    }).then(() => refreshData());
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'sftp': return <FileText size={13} color="#8e44ad" />;
      case 'ftp': return <Globe size={13} color="#f39c12" />;
      case 'telnet': return <Monitor size={13} color="#16a085" />;
      default: return <Terminal size={13} color="#005A9E" />;
    }
  };

  const getProtocolBadge = (protocol: string) => {
    const colors: Record<string, string> = {
      ssh: '#005a9e',
      sftp: '#8e44ad',
      ftp: '#f39c12',
      telnet: '#16a085'
    };
    return (
      <span style={{ 
        fontSize: '9px', 
        backgroundColor: colors[protocol] || '#888',
        color: '#fff',
        padding: '1px 4px',
        borderRadius: '3px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {protocol}
      </span>
    );
  };

  const sessionsInRoot = sessions.filter(s => !s.folder_id);
  const foldersInRoot = folders.filter(f => !f.parent_id);

  const renderSessionItem = (s: any, level: number = 0) => {
    const itemId = `session-${s.id}`;
    const isHovered = hoveredItem === itemId;

    return (
      <li 
        key={s.id} 
        draggable 
        onDragStart={(e) => handleDragStart(e, 'session', s.id)}
        onClick={() => onConnect(s)}
        onContextMenu={(e) => handleContextMenu(e, 'session', s)}
        onMouseEnter={() => setHoveredItem(itemId)}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          ...sessionItemStyle,
          backgroundColor: isHovered ? '#e8f0fe' : 'transparent',
          marginLeft: `${level * 10}px`
        }}
      >
        {getProtocolIcon(s.protocol || 'ssh')}
        <span style={{ flex: 1, color: '#1a1a1a', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || s.host}</span>
        {getProtocolBadge(s.protocol || 'ssh')}
      </li>
    );
  };

  const renderFolder = (folder: any, level: number = 0) => {
    const folderSessions = sessions.filter(s => s.folder_id === folder.id);
    const subfolders = folders.filter(f => f.parent_id === folder.id);
    const isExpanded = expandedFolders[folder.id];
    const folderId = `folder-${folder.id}`;
    const isFolderHovered = hoveredItem === folderId;

    return (
      <li key={folder.id} style={{ margin: '2px 0' }}>
        <div 
          draggable
          onDragStart={(e) => handleDragStart(e, 'folder', folder.id)}
          onClick={() => toggleFolder(folder.id)}
          onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, folder.id)}
          onMouseEnter={() => setHoveredItem(folderId)}
          onMouseLeave={() => setHoveredItem(null)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', 
            padding: '4px 6px', backgroundColor: isFolderHovered ? '#f0f0f0' : '#fafafa', 
            borderRadius: '4px', transition: 'background 0.1s', marginLeft: `${level * 10}px`
          }}
        >
          {isExpanded ? <ChevronDown size={13} color="#444"/> : <ChevronRight size={13} color="#444"/>}
          <Folder size={14} color="#DCB940"/>
          <span style={{ flex: 1, fontWeight: '600', fontSize: '12px', color: '#1a1a1a' }}>{folder.name}</span>
          <span style={{ fontSize: '10px', color: '#777' }}>{folderSessions.length + subfolders.length}</span>
          {isFolderHovered && (
            <button onClick={(e) => deleteFolder(e, folder.id)} style={delBtn} title="Delete folder"><Trash2 size={11} /></button>
          )}
        </div>
        {isExpanded && (
          <ul style={{ listStyle: 'none', paddingLeft: '0', margin: '2px 0' }}>
            {subfolders.map(sf => renderFolder(sf, level + 1))}
            {folderSessions.map(s => renderSessionItem(s, level + 1))}
            {folderSessions.length === 0 && subfolders.length === 0 && <li style={{ color: '#bbb', fontStyle: 'italic', fontSize: '10px', padding: `4px ${8 + (level + 1) * 10}px` }}>{t('st_empty_folder')}</li>}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '12px' }}>
      
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: '4px', backgroundColor: '#fafafa' }}>
         <button onClick={() => setIsCreatingFolder('root')} style={btnStyle} title={t('st_folder')}><PlusCircle size={13}/> {t('st_folder')}</button>
         <button onClick={handleExport} style={btnStyle} title={t('st_export')}><Download size={13}/> {t('st_export')}</button>
         <button onClick={handleImport} style={btnStyle} title={t('st_import')}><Upload size={13}/> {t('st_import')}</button>
      </div>

      {isCreatingFolder && (
        <div style={{ padding: '6px 8px', backgroundColor: '#e8f4f8', borderBottom: '1px solid #d4d4d4', display: 'flex', gap: '4px' }}>
          <input 
            autoFocus
            type="text" 
            value={newFolderName} 
            onChange={e => setNewFolderName(e.target.value)}
            placeholder={t('st_folder_name')}
            style={{ flex: 1, padding: '4px', fontSize: '11px', border: '1px solid #ccc', borderRadius: '3px' }}
            onKeyDown={e => {
              if (e.key === 'Enter') submitCreateFolder();
              if (e.key === 'Escape') setIsCreatingFolder(null);
            }}
          />
          <button onClick={submitCreateFolder} style={{...btnStyle, backgroundColor: '#005a9e', color: 'white'}}>{t('st_add')}</button>
          <button onClick={() => setIsCreatingFolder(null)} style={btnStyle}>{t('st_cancel')}</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        <b style={{ marginBottom: '6px', display: 'block', color: '#1a1a1a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('st_user_sessions')}</b>
        
        {/* Root Drop Zone */}
        <div 
          onDragOver={handleDragOver} 
          onDrop={(e) => handleDrop(e, null)}
          style={{ minHeight: '20px' }}
        >
          <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
            {foldersInRoot.map(folder => renderFolder(folder, 0))}
            {/* Root Sessions */}
            {sessionsInRoot.map(s => renderSessionItem(s, 0))}
          </ul>

          {sessions.length === 0 && folders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 8px', color: '#bbb', fontSize: '11px' }}>
              <Monitor size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p>{t('st_no_sessions')}</p>
              <p style={{ fontSize: '10px' }}>{t('st_use_session_btn')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10000, minWidth: '160px', padding: '4px 0', fontSize: '12px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'session' && (
            <>
              <div onClick={() => { onConnect(contextMenu.item); setContextMenu(null); }} style={ctxItemStyle} onMouseEnter={ctxHover} onMouseLeave={ctxLeave}>
                <Play size={13} color="#27ae60" /> <span>{t('st_connect')}</span>
              </div>
              <div onClick={() => { onEdit(contextMenu.item); setContextMenu(null); }} style={ctxItemStyle} onMouseEnter={ctxHover} onMouseLeave={ctxLeave}>
                <Edit2 size={13} /> <span>{t('st_edit')}</span>
              </div>
              <div onClick={() => { onClone(contextMenu.item); setContextMenu(null); }} style={ctxItemStyle} onMouseEnter={ctxHover} onMouseLeave={ctxLeave}>
                <Copy size={13} /> <span>{t('st_clone')}</span>
              </div>
              <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
              <div onClick={() => { if (confirm(t('alert_del_session'))) { fetch(`${apiUrl}/api/sessions/${contextMenu.item.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('xtermweb_token')}` } }).then(() => refreshData()); } setContextMenu(null); }} style={{ ...ctxItemStyle, color: '#cc0000' }} onMouseEnter={ctxHover} onMouseLeave={ctxLeave}>
                <Trash2 size={13} color="#cc0000" /> <span>{t('st_delete')}</span>
              </div>
            </>
          )}
          {contextMenu.type === 'folder' && (
            <>
              <div onClick={() => { openAllInFolder(contextMenu.item.id); setContextMenu(null); }} style={ctxItemStyle} onMouseEnter={ctxHover} onMouseLeave={ctxLeave}>
                <Play size={13} color="#27ae60" /> <span>{t('st_open_all')}</span>
              </div>
              <div onClick={() => { setIsCreatingFolder(contextMenu.item.id); setContextMenu(null); }} style={ctxItemStyle} onMouseEnter={ctxHover} onMouseLeave={ctxLeave}>
                <PlusCircle size={13} /> <span>{t('st_create_sub')}</span>
              </div>
              <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
              <div onClick={() => { if (confirm(t('alert_del_folder2'))) { fetch(`${apiUrl}/api/folders/${contextMenu.item.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('xtermweb_token')}` } }).then(() => refreshData()); } setContextMenu(null); }} style={{ ...ctxItemStyle, color: '#cc0000' }} onMouseEnter={ctxHover} onMouseLeave={ctxLeave}>
                <Trash2 size={13} color="#cc0000" /> <span>{t('st_delete_folder')}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const sessionItemStyle: React.CSSProperties = {
  cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px',
  backgroundColor: 'transparent', borderRadius: '4px', transition: 'background 0.1s',
  margin: '1px 0'
};

const actionBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center'
};

const btnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '4px', background: '#fff',
  border: '1px solid #ddd', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px'
};

const delBtn: React.CSSProperties = { 
  background: 'transparent', border: 'none', color: '#cc0000', cursor: 'pointer', 
  padding: '2px', display: 'flex', alignItems: 'center'
};

const ctxItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '6px 12px', cursor: 'pointer', color: '#333',
  transition: 'background 0.1s'
};

const ctxHover = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.backgroundColor = '#e8f0fe'; };
const ctxLeave = (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.backgroundColor = 'transparent'; };

export default SessionTree;