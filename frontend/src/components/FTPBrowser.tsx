import React, { useState, useEffect, useRef } from 'react';
import { Folder, File, ArrowUpCircle, Upload, Download, Trash2, Edit3, FolderPlus, RefreshCw, ChevronRight, Globe } from 'lucide-react';

interface FTPFile {
  filename: string;
  longname: string;
  isDirectory: boolean;
  size: number;
  mtime: number;
}

interface FTPBrowserProps {
  apiUrl: string;
  credentials: any;
}

const FTPBrowser: React.FC<FTPBrowserProps> = ({ apiUrl, credentials }) => {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [files, setFiles] = useState<FTPFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FTPFile } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDirectory('/');
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/ftp/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: credentials.host,
          port: credentials.port || 21,
          username: credentials.username,
          password: credentials.password || '',
          targetPath: path
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to list directory');
      }
      
      const data = await res.json();
      setCurrentPath(data.path || path);
      
      // Sort directories first
      const sortedList = (data.list || []).sort((a: FTPFile, b: FTPFile) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.filename.localeCompare(b.filename);
      });
      
      setFiles(sortedList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (file: FTPFile) => {
    if (!file.isDirectory) return;
    
    let newPath = currentPath;
    if (file.filename === '..') {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      newPath = '/' + parts.join('/');
      if (!newPath.endsWith('/')) newPath += '/';
    } else {
      newPath = currentPath.endsWith('/') ? `${currentPath}${file.filename}` : `${currentPath}/${file.filename}`;
    }
    
    loadDirectory(newPath);
  };

  const handleDownload = (file: FTPFile) => {
    if (file.isDirectory) return;
    const downloadPath = currentPath.endsWith('/') ? `${currentPath}${file.filename}` : `${currentPath}/${file.filename}`;
    
    const params = new URLSearchParams({
      host: credentials.host,
      port: String(credentials.port || 21),
      username: credentials.username,
      password: credentials.password || '',
      targetPath: downloadPath
    });
    
    window.open(`${apiUrl}/api/ftp/download?${params.toString()}`, '_blank');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('host', credentials.host);
    formData.append('port', String(credentials.port || 21));
    formData.append('username', credentials.username);
    formData.append('password', credentials.password || '');
    formData.append('targetPath', currentPath);

    try {
      await fetch(`${apiUrl}/api/ftp/upload`, {
        method: 'POST',
        body: formData
      });
      loadDirectory(currentPath);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (file: FTPFile) => {
    if (!confirm(`Delete "${file.filename}"?`)) return;
    const filePath = currentPath.endsWith('/') ? `${currentPath}${file.filename}` : `${currentPath}/${file.filename}`;
    
    try {
      await fetch(`${apiUrl}/api/ftp/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: credentials.host,
          port: credentials.port || 21,
          username: credentials.username,
          password: credentials.password || '',
          targetPath: filePath,
          isDirectory: file.isDirectory
        })
      });
      loadDirectory(currentPath);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRename = async (file: FTPFile) => {
    const newName = prompt('New name:', file.filename);
    if (!newName || newName === file.filename) return;
    const oldPath = currentPath.endsWith('/') ? `${currentPath}${file.filename}` : `${currentPath}/${file.filename}`;
    const newPath = currentPath.endsWith('/') ? `${currentPath}${newName}` : `${currentPath}/${newName}`;
    
    try {
      await fetch(`${apiUrl}/api/ftp/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: credentials.host,
          port: credentials.port || 21,
          username: credentials.username,
          password: credentials.password || '',
          oldPath,
          newPath
        })
      });
      loadDirectory(currentPath);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMkdir = async () => {
    const name = prompt('New folder name:');
    if (!name) return;
    const dirPath = currentPath.endsWith('/') ? `${currentPath}${name}` : `${currentPath}/${name}`;
    
    try {
      await fetch(`${apiUrl}/api/ftp/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: credentials.host,
          port: credentials.port || 21,
          username: credentials.username,
          password: credentials.password || '',
          targetPath: dirPath
        })
      });
      loadDirectory(currentPath);
    } catch (err) {
      console.error(err);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FTPFile) => {
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

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '12px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e8d5b7', padding: '6px 10px', borderBottom: '1px solid #ccc', gap: '6px' }}>
        <Globe size={16} color="#f39c12" />
        <b style={{ color: '#8b6914', fontSize: '12px' }}>FTP Browser</b>
        <span style={{ color: '#888', fontSize: '11px' }}>— {credentials.host}:{credentials.port || 21}</span>
        <div style={{ flex: 1 }} />
        <button 
           onClick={() => handleNavigate({ filename: '..', isDirectory: true } as FTPFile)}
           style={iconBtnStyle}
           title="Up one level"
        >
          <ArrowUpCircle size={14} color="#8b6914"/>
        </button>
        <button onClick={() => loadDirectory(currentPath)} style={iconBtnStyle} title="Refresh">
          <RefreshCw size={13} color="#555" />
        </button>
        <button onClick={handleMkdir} style={iconBtnStyle} title="New Folder">
          <FolderPlus size={14} color="#27ae60" />
        </button>
        <button onClick={() => fileInputRef.current?.click()} style={iconBtnStyle} title="Upload">
          <Upload size={13} color="#8b6914" />
        </button>
      </div>

      {/* Breadcrumb Path */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', backgroundColor: '#f8f4ee', borderBottom: '1px solid #e0d8c8', fontSize: '11px', overflow: 'hidden', flexWrap: 'nowrap', gap: '2px' }}>
        <span 
          style={{ cursor: 'pointer', color: '#8b6914', flexShrink: 0 }}
          onClick={() => loadDirectory('/')}
        >/</span>
        {pathParts.map((part, i) => (
          <React.Fragment key={i}>
            <ChevronRight size={10} style={{ flexShrink: 0, color: '#ccc' }} />
            <span 
              style={{ cursor: 'pointer', color: i === pathParts.length - 1 ? '#333' : '#8b6914', whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => {
                const newPath = '/' + pathParts.slice(0, i + 1).join('/');
                loadDirectory(newPath);
              }}
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '8px 10px', backgroundColor: '#fdeaea', color: '#c0392b', fontSize: '11px', borderBottom: '1px solid #f5c6cb' }}>
          Error: {error}
        </div>
      )}

      {/* File List */}
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff' }}>
        {loading && <div style={{ padding: '16px', color: '#888', textAlign: 'center' }}>Connecting to FTP server...</div>}
        
        {/* Column Headers */}
        {!loading && (
          <div style={{ display: 'flex', padding: '4px 8px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd', fontSize: '10px', fontWeight: 'bold', color: '#555', textTransform: 'uppercase' }}>
            <span style={{ flex: 1 }}>Name</span>
            <span style={{ width: '80px', textAlign: 'right' }}>Size</span>
            <span style={{ width: '130px', textAlign: 'right' }}>Modified</span>
          </div>
        )}
        
        {/* Parent directory entry */}
        {!loading && currentPath !== '/' && (
          <div 
            onDoubleClick={() => handleNavigate({ filename: '..', isDirectory: true } as FTPFile)}
            style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', gap: '6px' }}
          >
            <Folder size={14} color="#DCB940" />
            <span style={{ flex: 1, color: '#1a1a1a' }}>..</span>
          </div>
        )}

        {!loading && files.map((file, idx) => (
          <div
            key={idx}
            onDoubleClick={() => handleNavigate(file)}
            onClick={() => setSelectedFile(file.filename)}
            onContextMenu={(e) => handleContextMenu(e, file)}
            style={{ 
              display: 'flex', alignItems: 'center', padding: '4px 8px', 
              borderBottom: '1px solid #f0f0f0', cursor: file.isDirectory ? 'pointer' : 'default',
              backgroundColor: selectedFile === file.filename ? '#e8d5b7' : idx % 2 === 0 ? '#fff' : '#fafafa',
              gap: '6px'
            }}
          >
            {file.isDirectory ? <Folder size={14} color="#DCB940" /> : <File size={14} color="#888" />}
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1a1a1a' }}>
              {file.filename}
            </span>
            <span style={{ width: '80px', color: '#666', fontSize: '10px', textAlign: 'right' }}>
              {!file.isDirectory ? formatSize(file.size) : ''}
            </span>
            <span style={{ width: '130px', color: '#888', fontSize: '10px', textAlign: 'right' }}>
              {file.mtime ? formatDate(file.mtime) : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div style={{ padding: '4px 8px', borderTop: '1px solid #ccc', backgroundColor: '#f8f4ee', color: '#8b6914', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{files.length} items</span>
        <span>FTP • {credentials.username}@{credentials.host}</span>
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

const ContextMenuItem = ({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color?: string }) => (
  <div 
    onClick={onClick}
    style={{ 
      display: 'flex', alignItems: 'center', gap: '8px', 
      padding: '6px 12px', cursor: 'pointer', color: color || '#333',
      transition: 'background 0.1s'
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5ede0')}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    {icon}
    <span>{label}</span>
  </div>
);

const iconBtnStyle: React.CSSProperties = {
  border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center'
};

export default FTPBrowser;
