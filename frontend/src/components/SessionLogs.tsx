import React, { useState, useEffect } from 'react';
import { Download, Trash2, FileText, X, Eye, Search } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SessionLogsProps {
  apiUrl: string;
}

const SessionLogs: React.FC<SessionLogsProps> = ({ apiUrl }) => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingLog, setViewingLog] = useState<{ name: string, content: string, isTruncated: boolean } | null>(null);

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

  const handleViewLog = async (filename: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/logs/view/${filename}`);
      if (!res.ok) throw new Error('Failed to view log');
      const data = await res.json();
      setViewingLog({ name: filename, content: data.content, isTruncated: data.isTruncated });
    } catch (err: any) {
      alert(t('alert_err') + err.message);
    }
  };

  const handleDownload = (filename: string) => {
    const token = localStorage.getItem('xtermweb_token');
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
      .catch(err => alert(t('alert_err') + err.message));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const filteredLogs = logs.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    new Date(l.mtime).toLocaleString().includes(searchTerm)
  );

  return (
    <div style={{ padding: '12px', fontSize: '13px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <b style={{ color: '#1a1a1a' }}>{t('sl_title')}</b>
      </div>
      
      <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px', lineHeight: 1.4 }}>
        {t('sl_desc')}
      </p>

      <div style={{ marginBottom: '12px', position: 'relative' }}>
        <input 
          type="text" 
          placeholder={t('sl_search')} 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '6px 8px 6px 28px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
        />
        <Search size={14} color="#888" style={{ position: 'absolute', left: '8px', top: '8px' }} />
      </div>

      {loading ? <p>{t('sl_loading')}</p> : filteredLogs.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>{t('sl_no_logs')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredLogs.map(log => (
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
                <button onClick={() => handleViewLog(log.name)} title="View Log" style={iconBtnStyle}>
                  <Eye size={14} color="#2ecc71" />
                </button>
                <button onClick={() => handleDownload(log.name)} title="Download Log" style={iconBtnStyle}>
                  <Download size={14} color="#3498db" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingLog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#fff', width: '80%', height: '80%', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#7f8c8d" />
                <h3 style={{ margin: 0, fontSize: '15px', color: '#333' }}>{viewingLog.name}</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button onClick={() => handleDownload(viewingLog.name)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #3498db', background: 'transparent', color: '#3498db', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                  <Download size={14} /> {t('sl_download')}
                </button>
                <button onClick={() => setViewingLog(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={20} color="#7f8c8d" />
                </button>
              </div>
            </div>
            
            {viewingLog.isTruncated && (
              <div style={{ padding: '10px 16px', backgroundColor: '#fff3cd', color: '#856404', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #ffeeba' }}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <span>{t('sl_trunc_warn')}</span>
              </div>
            )}
            
            <div style={{ flex: 1, overflow: 'auto', padding: '16px', backgroundColor: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
              {viewingLog.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' };

export default SessionLogs;
