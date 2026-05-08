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
    fetch(`${apiUrl}/api/folders`).then(r => r.json()).then(setFolders).catch(() => {});
    fetch(`${apiUrl}/api/sessions`).then(r => r.json()).then(setSessions).catch(() => {});
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: targetFolderId })
      }).then(() => refreshData());
    } else if (type === 'folder') {
      fetch(`${apiUrl}/api/folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: targetFolderId })
      }).then(() => refreshData());
    }
  };

  const submitCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const parentId = isCreatingFolder === 'root' ? null : isCreatingFolder;
    fetch(`${apiUrl}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    fetch(`${apiUrl}/api/sessions/export/all`)
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
    input.accept = '.json,.mobaconf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let data: any = null;
        try {
          if (file.name.endsWith('.mobaconf')) {
            data = parseMobaConf(reader.result as string);
          } else {
            data = JSON.parse(reader.result as string);
          }
        } catch (err: any) { 
          alert(t('alert_inv_format') + err.message); 
          return; 
        }

        if (data) {
          fetch(`${apiUrl}/api/sessions/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).then(() => {
            refreshData();
            alert(t('alert_imp_succ'));
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const parseMobaConf = (text: string) => {
    const lines = text.split('\n');
    const importFolders: any[] = [];
    const importSessions: any[] = [];
    const folderMap: Record<string, number> = {};
    let currentFolderId: number | null = null;
    let currentFolderPath: string | undefined = undefined;
    let folderCounter = 1;

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith(';')) continue;
      
      if (line.startsWith('[Bookmarks')) {
         currentFolderPath = '';
         currentFolderId = null;
      } else if (line.startsWith('[')) {
         currentFolderPath = undefined;
         currentFolderId = null;
      } else if (line.startsWith('SubRep=')) {
         currentFolderPath = line.substring(7).trim();
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
         const name = line.substring(0, eqIdx).trim();
         const val = line.substring(eqIdx + 1).trim();
         if (val.startsWith('#')) {
           const parts = val.split('%');
           if (parts.length >= 4) {
             let host = parts[1];
             const port = parseInt(parts[2]) || 22;
             let username = parts[3] || 'root';
             
             if (host.includes('@')) {
                 const hostParts = host.split('@');
                 host = hostParts[hostParts.length - 1];
                 if (hostParts.length >= 2) username = hostParts[hostParts.length - 2];
             }

             let protocol = 'ssh';
             if (val.startsWith('#98#')) protocol = 'telnet';
             else if (val.startsWith('#83#')) protocol = 'sftp';
             else if (val.startsWith('#105#')) protocol = 'ftp';
             else if (val.startsWith('#131#')) protocol = 'serial';
             
             importSessions.push({
               name: name,
               host: host,
               port: port,
               username: username,
               protocol: protocol,
               folder_id: currentFolderId
             });
           }
         }
      }
    }
    return { folders: importFolders, sessions: importSessions };
  };

  const deleteSession = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm(t('alert_del_session'))) return;
    fetch(`${apiUrl}/api/sessions/${id}`, { method: 'DELETE' }).then(() => refreshData());
  };

  const deleteFolder = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm(t('alert_del_folder'))) return;
    fetch(`${apiUrl}/api/folders/${id}`, { method: 'DELETE' }).then(() => refreshData());
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
              <div onClick={() => { if (confirm(t('alert_del_session'))) { fetch(`${apiUrl}/api/sessions/${contextMenu.item.id}`, { method: 'DELETE' }).then(() => refreshData()); } setContextMenu(null); }} style={{ ...ctxItemStyle, color: '#cc0000' }} onMouseEnter={ctxHover} onMouseLeave={ctxLeave}>
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
              <div onClick={() => { if (confirm(t('alert_del_folder2'))) { fetch(`${apiUrl}/api/folders/${contextMenu.item.id}`, { method: 'DELETE' }).then(() => refreshData()); } setContextMenu(null); }} style={{ ...ctxItemStyle, color: '#cc0000' }} onMouseEnter={ctxHover} onMouseLeave={ctxLeave}>
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