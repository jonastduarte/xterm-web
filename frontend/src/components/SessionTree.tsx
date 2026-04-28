import React, { useState, useEffect, useCallback } from 'react';
import { Monitor, Folder, ChevronRight, ChevronDown, PlusCircle, Edit2, Copy, Terminal, FileText, Globe, Trash2 } from 'lucide-react';

interface SessionTreeProps {
  apiUrl: string;
  onConnect: (session: any) => void;
  onEdit: (session: any) => void;
  onClone: (session: any) => void;
}

const SessionTree: React.FC<SessionTreeProps> = ({ apiUrl, onConnect, onEdit, onClone }) => {
  const [folders, setFolders] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<{ [key: number]: boolean }>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
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
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: number | null) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const id = parseInt(e.dataTransfer.getData('id'), 10);
    
    if (type === 'session') {
      fetch(`${apiUrl}/api/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: targetFolderId })
      }).then(() => refreshData());
    }
  };

  const createFolder = () => {
    const name = prompt('Folder name:');
    if (!name) return;
    fetch(`${apiUrl}/api/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(() => refreshData());
  };

  const deleteSession = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Delete session?')) return;
    fetch(`${apiUrl}/api/sessions/${id}`, { method: 'DELETE' }).then(() => refreshData());
  };

  const deleteFolder = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Delete folder? (Sessions will be moved to root)')) return;
    fetch(`${apiUrl}/api/folders/${id}`, { method: 'DELETE' }).then(() => refreshData());
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'sftp': return <FileText size={13} color="#8e44ad" />;
      case 'ftp': return <Globe size={13} color="#f39c12" />;
      default: return <Terminal size={13} color="#005A9E" />;
    }
  };

  const getProtocolBadge = (protocol: string) => {
    const colors: Record<string, string> = {
      ssh: '#005a9e',
      sftp: '#8e44ad',
      ftp: '#f39c12'
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

  const renderSessionItem = (s: any) => {
    const itemId = `session-${s.id}`;
    const isHovered = hoveredItem === itemId;

    return (
      <li 
        key={s.id} 
        draggable 
        onDragStart={(e) => handleDragStart(e, 'session', s.id)}
        onClick={() => onConnect(s)}
        onMouseEnter={() => setHoveredItem(itemId)}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          ...sessionItemStyle,
          backgroundColor: isHovered ? '#e8f0fe' : 'transparent'
        }}
      >
        {getProtocolIcon(s.protocol || 'ssh')}
        <span style={{ flex: 1, color: '#1a1a1a', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || s.host}</span>
        {getProtocolBadge(s.protocol || 'ssh')}
        {isHovered && (
          <div style={{ display: 'flex', gap: '2px', marginLeft: '4px' }}>
            <button onClick={(e) => { e.stopPropagation(); onEdit(s); }} style={actionBtn} title="Edit"><Edit2 size={11} /></button>
            <button onClick={(e) => { e.stopPropagation(); onClone(s); }} style={actionBtn} title="Clone"><Copy size={11} /></button>
            <button onClick={(e) => deleteSession(e, s.id)} style={delBtn} title="Delete"><Trash2 size={11} /></button>
          </div>
        )}
      </li>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '12px' }}>
      
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: '4px', backgroundColor: '#fafafa' }}>
         <button onClick={createFolder} style={btnStyle} title="New Folder"><PlusCircle size={13}/> Folder</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        <b style={{ marginBottom: '6px', display: 'block', color: '#1a1a1a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>USER SESSIONS</b>
        
        {/* Root Drop Zone */}
        <div 
          onDragOver={handleDragOver} 
          onDrop={(e) => handleDrop(e, null)}
          style={{ minHeight: '20px' }}
        >
          <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
            {folders.map(folder => {
              const folderSessions = sessions.filter(s => s.folder_id === folder.id);
              const isExpanded = expandedFolders[folder.id];
              const folderId = `folder-${folder.id}`;
              const isFolderHovered = hoveredItem === folderId;

              return (
                <li key={folder.id} style={{ margin: '2px 0' }}>
                  
                  {/* Folder Item */}
                  <div 
                    onClick={() => toggleFolder(folder.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    onMouseEnter={() => setHoveredItem(folderId)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', 
                      padding: '4px 6px', backgroundColor: isFolderHovered ? '#f0f0f0' : '#fafafa', 
                      borderRadius: '4px', transition: 'background 0.1s'
                    }}
                  >
                    {isExpanded ? <ChevronDown size={13} color="#444"/> : <ChevronRight size={13} color="#444"/>}
                    <Folder size={14} color="#DCB940"/>
                    <span style={{ flex: 1, fontWeight: '600', fontSize: '12px', color: '#1a1a1a' }}>{folder.name}</span>
                    <span style={{ fontSize: '10px', color: '#777' }}>{folderSessions.length}</span>
                    {isFolderHovered && (
                      <button onClick={(e) => deleteFolder(e, folder.id)} style={delBtn} title="Delete folder"><Trash2 size={11} /></button>
                    )}
                  </div>

                  {/* Folder Contents */}
                  {isExpanded && (
                    <ul style={{ listStyle: 'none', paddingLeft: '20px', margin: '2px 0' }}>
                      {folderSessions.map(s => renderSessionItem(s))}
                      {folderSessions.length === 0 && <li style={{ color: '#bbb', fontStyle: 'italic', fontSize: '10px', padding: '4px 8px' }}>Empty folder</li>}
                    </ul>
                  )}
                </li>
              );
            })}

            {/* Root Sessions */}
            {sessionsInRoot.map(s => renderSessionItem(s))}
          </ul>

          {sessions.length === 0 && folders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 8px', color: '#bbb', fontSize: '11px' }}>
              <Monitor size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p>No sessions yet</p>
              <p style={{ fontSize: '10px' }}>Use the Session button to create one</p>
            </div>
          )}
        </div>
      </div>
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

export default SessionTree;