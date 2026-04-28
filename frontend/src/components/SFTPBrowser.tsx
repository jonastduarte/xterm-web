import React, { useState, useEffect, useRef } from 'react';
import { Folder, File, ArrowUpCircle, Upload, Download, Trash2, Edit3, FolderPlus, RefreshCw, ChevronRight } from 'lucide-react';

interface SFTPFile {
  filename: string;
  longname: string;
  isDirectory: boolean;
  size: number;
  mtime: number;
}

interface SFTPBrowserProps {
  ws: WebSocket | null;
  apiUrl?: string;
  credentials?: any;
}

const SFTPBrowser: React.FC<SFTPBrowserProps> = ({ ws, apiUrl, credentials }) => {
  const [currentPath, setCurrentPath] = useState<string>('.');
  const [files, setFiles] = useState<SFTPFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: SFTPFile } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'sftp:ready') {
          ws.send(JSON.stringify({ type: 'sftp:list', payload: '.' }));
          setLoading(true);
        } else if (data.type === 'sftp:list:result') {
          if (data.payload.path !== undefined) {
             setCurrentPath(data.payload.path);
          }
          const sortedList = (data.payload.list || []).sort((a: SFTPFile, b: SFTPFile) => {
             if (a.isDirectory && !b.isDirectory) return -1;
             if (!a.isDirectory && b.isDirectory) return 1;
             return a.filename.localeCompare(b.filename);
          });
          setFiles(sortedList);
          setLoading(false);
        } else if (data.type === 'sftp:error') {
          console.error('SFTP Error:', data.payload);
          setLoading(false);
        } else if (data.type === 'sftp:delete:result' || data.type === 'sftp:rename:result' || data.type === 'sftp:mkdir:result') {
          // Refresh after operation
          refreshDirectory();
        }
      } catch (e) {
        // Ignored
      }
    };

    ws.addEventListener('message', handleMessage);
    
    if (ws.readyState === WebSocket.OPEN) {
       ws.send(JSON.stringify({ type: 'sftp:list', payload: currentPath }));
    }

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const refreshDirectory = () => {
    if (!ws) return;
    setLoading(true);
    ws.send(JSON.stringify({ type: 'sftp:list', payload: currentPath }));
  };

  const handleNavigate = (file: SFTPFile) => {
    if (!file.isDirectory || !ws) return;
    
    let newPath = currentPath;
    if (file.filename === '..') {
      const parts = currentPath.split('/');
      parts.pop();
      newPath = parts.length > 0 ? parts.join('/') : '/';
      if (newPath === '') newPath = '/';
    } else if (file.filename !== '.') {
      newPath = currentPath.endsWith('/') ? `${currentPath}${file.filename}` : `${currentPath}/${file.filename}`;
    }
    
    setLoading(true);
    setCurrentPath(newPath);
    ws.send(JSON.stringify({ type: 'sftp:list', payload: newPath }));
  };

  const handleDownload = (file: SFTPFile) => {
    if (file.isDirectory || !apiUrl || !credentials) return;
    const downloadPath = currentPath.endsWith('/') ? `${currentPath}${file.filename}` : `${currentPath}/${file.filename}`;
    
    const params = new URLSearchParams({
      host: credentials.host,
      username: credentials.username,
      password: credentials.password || '',
      targetPath: downloadPath
    });
    
    window.open(`${apiUrl}/api/sftp/download?${params.toString()}`, '_blank');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !apiUrl || !credentials) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('host', credentials.host);
    formData.append('username', credentials.username);
    formData.append('password', credentials.password || '');
    formData.append('targetPath', currentPath === '.' ? '' : currentPath);

    fetch(`${apiUrl}/api/sftp/upload`, {
      method: 'POST',
      body: formData
    })
    .then(r => r.json())
    .then(() => refreshDirectory())
    .catch(console.error)
    .finally(() => {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const handleDelete = (file: SFTPFile) => {
    if (!ws) return;
    const filePath = currentPath.endsWith('/') ? `${currentPath}${file.filename}` : `${currentPath}/${file.filename}`;
    if (!confirm(`Delete "${file.filename}"?`)) return;
    ws.send(JSON.stringify({ type: 'sftp:delete', payload: { path: filePath, isDirectory: file.isDirectory } }));
  };

  const handleRename = (file: SFTPFile) => {
    if (!ws) return;
    const newName = prompt('New name:', file.filename);
    if (!newName || newName === file.filename) return;
    const oldPath = currentPath.endsWith('/') ? `${currentPath}${file.filename}` : `${currentPath}/${file.filename}`;
    const newPath = currentPath.endsWith('/') ? `${currentPath}${newName}` : `${currentPath}/${newName}`;
    ws.send(JSON.stringify({ type: 'sftp:rename', payload: { oldPath, newPath } }));
  };

  const handleMkdir = () => {
    if (!ws) return;
    const name = prompt('New folder name:');
    if (!name) return;
    const dirPath = currentPath.endsWith('/') ? `${currentPath}${name}` : `${currentPath}/${name}`;
    ws.send(JSON.stringify({ type: 'sftp:mkdir', payload: dirPath }));
  };

  const handleContextMenu = (e: React.MouseEvent, file: SFTPFile) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return '';
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Breadcrumb parts
  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e2e2e2', padding: '4px 6px', borderBottom: '1px solid #ccc', gap: '4px' }}>
        <b style={{ marginRight: '4px', color: '#005a9e', fontSize: '11px' }}>SFTP</b>
        <button 
           onClick={() => handleNavigate({ filename: '..', isDirectory: true } as SFTPFile)}
           style={iconBtnStyle}
           title="Up one level"
        >
          <ArrowUpCircle size={14} color="#005A9E"/>
        </button>
        <button onClick={refreshDirectory} style={iconBtnStyle} title="Refresh">
          <RefreshCw size={13} color="#555" />
        </button>
        <button onClick={handleMkdir} style={iconBtnStyle} title="New Folder">
          <FolderPlus size={14} color="#27ae60" />
        </button>
        <button onClick={() => fileInputRef.current?.click()} style={iconBtnStyle} title="Upload">
          <Upload size={13} color="#005a9e" />
        </button>
      </div>

      {/* Breadcrumb Path */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '3px 6px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', fontSize: '11px', overflow: 'hidden', flexWrap: 'nowrap', gap: '2px' }}>
        <span 
          style={{ cursor: 'pointer', color: '#005a9e', flexShrink: 0 }}
          onClick={() => { setCurrentPath('/'); ws?.send(JSON.stringify({ type: 'sftp:list', payload: '/' })); }}
        >/</span>
        {pathParts.map((part, i) => (
          <React.Fragment key={i}>
            <ChevronRight size={10} style={{ flexShrink: 0, color: '#aaa' }} />
            <span 
              style={{ cursor: 'pointer', color: i === pathParts.length - 1 ? '#333' : '#005a9e', whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => {
                const newPath = '/' + pathParts.slice(0, i + 1).join('/');
                setCurrentPath(newPath);
                ws?.send(JSON.stringify({ type: 'sftp:list', payload: newPath }));
              }}
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>
      
      {/* File List */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff' }}>
        {loading && <div style={{ padding: '12px', color: '#888', textAlign: 'center' }}>Loading...</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {!loading && files.filter(f => f.filename !== '.').map((file, idx) => (
              <tr 
                key={idx} 
                onDoubleClick={() => handleNavigate(file)}
                onClick={() => setSelectedFile(file.filename)}
                onContextMenu={(e) => handleContextMenu(e, file)}
                style={{ 
                  cursor: file.isDirectory ? 'pointer' : 'default',
                  backgroundColor: selectedFile === file.filename ? '#cde8ff' : idx % 2 === 0 ? '#fff' : '#fafafa'
                }}
              >
                <td style={{ padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #f0f0f0' }}>
                  {file.isDirectory ? <Folder size={14} color="#DCB940" /> : <File size={14} color="#888" />}
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1a1a1a' }}>
                    {file.filename}
                  </span>
                </td>
                <td style={{ padding: '3px 6px', color: '#666', fontSize: '10px', whiteSpace: 'nowrap', borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>
                  {!file.isDirectory ? formatSize(file.size) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div style={{ padding: '3px 6px', borderTop: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#666', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{files.filter(f => f.filename !== '.' && f.filename !== '..').length} items</span>
        {selectedFile && <span>{selectedFile}</span>}
      </div>

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleUpload} />

      {/* Context Menu */}
      {contextMenu && (
        <div 
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10000,
            minWidth: '160px',
            padding: '4px 0',
            fontSize: '12px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.file.isDirectory && (
            <ContextMenuItem icon={<Folder size={13} />} label="Open" onClick={() => { handleNavigate(contextMenu.file); setContextMenu(null); }} />
          )}
          {!contextMenu.file.isDirectory && (
            <ContextMenuItem icon={<Download size={13} />} label="Download" onClick={() => { handleDownload(contextMenu.file); setContextMenu(null); }} />
          )}
          <ContextMenuItem icon={<Edit3 size={13} />} label="Rename" onClick={() => { handleRename(contextMenu.file); setContextMenu(null); }} />
          <ContextMenuItem icon={<Trash2 size={13} color="#c0392b" />} label="Delete" onClick={() => { handleDelete(contextMenu.file); setContextMenu(null); }} color="#c0392b" />
          <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
          <ContextMenuItem icon={<FolderPlus size={13} />} label="New Folder" onClick={() => { handleMkdir(); setContextMenu(null); }} />
          <ContextMenuItem icon={<Upload size={13} />} label="Upload Here" onClick={() => { fileInputRef.current?.click(); setContextMenu(null); }} />
        </div>
      )}
    </div>
  );
};

// Context Menu Item
const ContextMenuItem = ({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color?: string }) => (
  <div 
    onClick={onClick}
    style={{ 
      display: 'flex', alignItems: 'center', gap: '8px', 
      padding: '6px 12px', cursor: 'pointer', color: color || '#333',
      transition: 'background 0.1s'
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8f0fe')}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    {icon}
    <span>{label}</span>
  </div>
);

const iconBtnStyle: React.CSSProperties = {
  border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center'
};

export default SFTPBrowser;