import React, { useState, useEffect } from 'react';
import { Download, Trash2, FileText, X } from 'lucide-react';

interface SessionLogsProps {
  apiUrl: string;
}

const SessionLogs: React.FC<SessionLogsProps> = ({ apiUrl }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/logs`);
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {}
    setLoading(false);
  };

  const handleDownload = (filename: string) => {
    const token = localStorage.getItem('moba_token');
    // Using fetch to download to easily attach auth headers if needed,
    // though our token fetch interceptor already handles it.
    // Wait, the interceptor intercepts fetch, but to trigger a download we need a blob.
    fetch(`${apiUrl}/api/logs/download/${filename}`)
      .then(res => {
         if (!res.ok) throw new Error('Download failed');
         return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => alert(err.message));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div style={{ padding: '12px', fontSize: '13px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <b style={{ color: '#1a1a1a' }}>Session Logs</b>
      </div>
      
      <p style={{ fontSize: '11px', color: '#666', marginBottom: '16px', lineHeight: 1.4 }}>
        Terminal sessions are automatically recorded here. Logs are kept for 30 days.
      </p>

      {loading ? <p>Loading...</p> : logs.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>No logs found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {logs.map(log => (
            <div key={log.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: '#f5f6f7', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <FileText size={16} color="#7f8c8d" style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: '600', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.name}</div>
                  <div style={{ fontSize: '11px', color: '#7f8c8d' }}>
                    {new Date(log.mtime).toLocaleString()} • {formatSize(log.size)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => handleDownload(log.name)} title="Download Log" style={iconBtnStyle}>
                  <Download size={14} color="#3498db" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' };

export default SessionLogs;
