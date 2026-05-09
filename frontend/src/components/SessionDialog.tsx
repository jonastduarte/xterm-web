import React, { useState, useEffect } from 'react';
import { Terminal, Monitor, Server, FileText, Globe, Cloud, Database, X, Key, Lock, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SessionDialogProps {
  onClose: () => void;
  onSave: (sessionData: any, mode: 'create' | 'edit') => void;
  initialData?: any;
  mode?: 'create' | 'edit' | 'clone';
}

const SessionDialog: React.FC<SessionDialogProps> = ({ onClose, onSave, initialData, mode = 'create' }) => {
  const { t } = useLanguage();
  const defaultProtocol = initialData?.protocol || 'ssh';
  const defaultPort = initialData?.port || (defaultProtocol === 'ftp' ? 21 : 22);
  
  const [folders, setFolders] = useState<any[]>([]);
  
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const token = localStorage.getItem('xtermweb_token');
    fetch(`${apiUrl}/api/folders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(setFolders).catch(() => {});
  }, []);

  const [activeTab, setActiveTab] = useState(defaultProtocol.toUpperCase());
  const [formData, setFormData] = useState({
    id: mode === 'clone' ? undefined : initialData?.id,
    name: (mode === 'clone' ? `${initialData?.name || ''} (Clone)` : initialData?.name) || '',
    host: initialData?.host || '',
    username: initialData?.username || '',
    port: defaultPort,
    password: initialData?.password || '',
    folder_id: initialData?.folder_id || null,
    protocol: defaultProtocol,
    auth_type: initialData?.auth_type || 'password',
    private_key: initialData?.private_key || '',
    use_sftp: initialData?.use_sftp !== undefined ? initialData.use_sftp : 0
  });

  useEffect(() => {
    const protocolLower = activeTab.toLowerCase();
    let dp = 22;
    if (protocolLower === 'ftp') dp = 21;
    if (protocolLower === 'telnet') dp = 23;
    if (protocolLower === 'rdp') dp = 3389;
    if (protocolLower === 'vnc') dp = 5900;
    setFormData(prev => ({ 
      ...prev, 
      protocol: protocolLower,
      port: prev.port === 22 || prev.port === 21 || prev.port === 23 || prev.port === 3389 || prev.port === 5900 ? dp : prev.port 
    }));
  }, [activeTab]);

  const sessionTypes = [
    { id: 'SSH',    icon: <Terminal size={22} color="#005A9E" />, enabled: true },
    { id: 'Telnet', icon: <Monitor size={22} color="#16a085" />, enabled: true },
    { id: 'RDP',    icon: <Monitor size={22} color="#2980b9" />, enabled: false },
    { id: 'VNC',    icon: <Monitor size={22} color="#c0392b" />, enabled: false },
    { id: 'FTP',    icon: <Globe size={22} color="#f39c12" />,   enabled: true },
    { id: 'SFTP',   icon: <FileText size={22} color="#8e44ad" />,enabled: true },
    { id: 'Serial', icon: <SlidersHorizontal size={22} color="#7f8c8d" />, enabled: true },
    { id: 'Shell',  icon: <Terminal size={22} color="#2c3e50" />, enabled: false },
  ];

  const FolderSelect = () => (
    <select
      value={formData.folder_id || ''}
      onChange={e => setFormData({...formData, folder_id: e.target.value ? parseInt(e.target.value) : null})}
      style={inputStyle}
    >
      <option value="">{t('sd_none')}</option>
      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
    </select>
  );

  const renderSSHForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}><Terminal size={16} color="#005a9e" style={{ marginRight: '6px' }} />{t('sd_ssh_settings')}</h4>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_session_name')} <span style={{ color: '#999', fontWeight: 'normal' }}>({t('sd_optional')})</span></label>
            <input type="text" value={formData.name || ''} placeholder={formData.host || 'e.g. Production Server'} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_folder')}</label>
            <FolderSelect />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>
            <label style={labelStyle}>{t('sd_remote_host')} <span style={{ color: '#c0392b' }}>*</span></label>
            <input type="text" value={formData.host} placeholder="192.168.0.1 or hostname" onChange={e => setFormData({...formData, host: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_username')} <span style={{ color: '#c0392b' }}>*</span></label>
            <input type="text" value={formData.username} placeholder="root" onChange={e => setFormData({...formData, username: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '70px' }}>
            <label style={labelStyle}>{t('sd_port')}</label>
            <input type="number" value={formData.port} onChange={e => setFormData({...formData, port: parseInt(e.target.value)})} style={inputStyle} />
          </div>
        </div>
      </div>
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}><Lock size={16} color="#27ae60" style={{ marginRight: '6px' }} />{t('sd_authentication')}</h4>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="radio" name="auth_type" value="password" checked={formData.auth_type === 'password'} onChange={() => setFormData({...formData, auth_type: 'password'})} />
            {t('sd_auth_password')}
          </label>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="radio" name="auth_type" value="key" checked={formData.auth_type === 'key'} onChange={() => setFormData({...formData, auth_type: 'key'})} />
            {t('sd_auth_key')}
          </label>
        </div>
        {formData.auth_type === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '250px' }}>
            <label style={labelStyle}>{t('sd_password')}</label>
            <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} placeholder={t('sd_enter_pass')} />
          </div>
        )}
        {formData.auth_type === 'key' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4px' }}>
              <label style={labelStyle}><Key size={12} style={{ marginRight: '4px' }} />{t('sd_key_paste')}</label>
              <label style={{ ...labelStyle, color: '#005a9e', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}>
                {t('sd_key_browse')}
                <input type="file" style={{ display: 'none' }} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setFormData({ ...formData, private_key: ev.target?.result as string });
                    };
                    reader.readAsText(file);
                  }
                }} />
              </label>
            </div>
            <textarea value={formData.private_key} onChange={e => setFormData({...formData, private_key: e.target.value})} style={{ ...inputStyle, height: '80px', fontFamily: 'monospace', fontSize: '11px', resize: 'vertical' }} placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;..." />
            <div style={{ display: 'flex', flexDirection: 'column', width: '250px', marginTop: '8px' }}>
              <label style={labelStyle}>{t('sd_key_passphrase')}</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} placeholder={t('sd_key_empty')} />
            </div>
          </div>
        )}
      </div>
      <div style={sectionStyle}>
        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" checked={formData.use_sftp === 1} onChange={e => setFormData({...formData, use_sftp: e.target.checked ? 1 : 0})} />
          {t('sd_sftp_enable')}
        </label>
      </div>
    </div>
  );

  const renderSFTPForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}><FileText size={16} color="#8e44ad" style={{ marginRight: '6px' }} />{t('sd_sftp_settings')}</h4>
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 12px 0' }}>{t('sd_sftp_desc')}</p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_session_name')} <span style={{ color: '#999', fontWeight: 'normal' }}>({t('sd_optional')})</span></label>
            <input type="text" value={formData.name || ''} placeholder={formData.host || 'e.g. File Server'} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_folder')}</label><FolderSelect />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>
            <label style={labelStyle}>{t('sd_remote_host')} <span style={{ color: '#c0392b' }}>*</span></label>
            <input type="text" value={formData.host} placeholder="192.168.0.1" onChange={e => setFormData({...formData, host: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_username')} <span style={{ color: '#c0392b' }}>*</span></label>
            <input type="text" value={formData.username} placeholder="root" onChange={e => setFormData({...formData, username: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '70px' }}>
            <label style={labelStyle}>{t('sd_port')}</label>
            <input type="number" value={formData.port} onChange={e => setFormData({...formData, port: parseInt(e.target.value)})} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '250px', marginTop: '12px' }}>
          <label style={labelStyle}>{t('sd_password')}</label>
          <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} />
        </div>
      </div>
    </div>
  );

  const renderFTPForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}><Globe size={16} color="#f39c12" style={{ marginRight: '6px' }} />{t('sd_ftp_settings')}</h4>
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 12px 0' }}>{t('sd_ftp_desc')}</p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_session_name')} <span style={{ color: '#999', fontWeight: 'normal' }}>({t('sd_optional')})</span></label>
            <input type="text" value={formData.name || ''} placeholder={formData.host || 'e.g. FTP Server'} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_folder')}</label><FolderSelect />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>
            <label style={labelStyle}>{t('sd_ftp_host')} <span style={{ color: '#c0392b' }}>*</span></label>
            <input type="text" value={formData.host} placeholder="ftp.example.com" onChange={e => setFormData({...formData, host: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_username')} <span style={{ color: '#c0392b' }}>*</span></label>
            <input type="text" value={formData.username} placeholder="anonymous" onChange={e => setFormData({...formData, username: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '70px' }}>
            <label style={labelStyle}>{t('sd_port')}</label>
            <input type="number" value={formData.port} onChange={e => setFormData({...formData, port: parseInt(e.target.value)})} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '250px', marginTop: '12px' }}>
          <label style={labelStyle}>{t('sd_password')}</label>
          <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} placeholder={`${t('sd_enter_pass')}`} />
        </div>
      </div>
    </div>
  );

  const renderTelnetForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}><Monitor size={16} color="#16a085" style={{ marginRight: '6px' }} />{t('sd_telnet_settings')}</h4>
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 12px 0' }}>{t('sd_telnet_desc')}</p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_session_name')} <span style={{ color: '#999', fontWeight: 'normal' }}>({t('sd_optional')})</span></label>
            <input type="text" value={formData.name || ''} placeholder={formData.host || 'e.g. Router Console'} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_folder')}</label><FolderSelect />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>
            <label style={labelStyle}>{t('sd_remote_host')} <span style={{ color: '#c0392b' }}>*</span></label>
            <input type="text" value={formData.host} placeholder="192.168.0.1" onChange={e => setFormData({...formData, host: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_username')}</label>
            <input type="text" value={formData.username} placeholder="(optional)" onChange={e => setFormData({...formData, username: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '70px' }}>
            <label style={labelStyle}>{t('sd_port')}</label>
            <input type="number" value={formData.port} onChange={e => setFormData({...formData, port: parseInt(e.target.value)})} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '250px', marginTop: '12px' }}>
          <label style={labelStyle}>{t('sd_password')}</label>
          <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} placeholder={t('sd_telnet_pass')} />
        </div>
      </div>
    </div>
  );

  const renderSerialForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}><SlidersHorizontal size={16} color="#7f8c8d" style={{ marginRight: '6px' }} />{t('sd_serial_settings')}</h4>
        <p style={{ fontSize: '11px', color: '#888', margin: '0 0 12px 0' }}>{t('sd_serial_desc')}</p>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_session_name')} <span style={{ color: '#999', fontWeight: 'normal' }}>({t('sd_optional')})</span></label>
            <input type="text" value={formData.name || ''} placeholder="e.g. Arduino" onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_folder')}</label><FolderSelect />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>{t('sd_baud_rate')}</label>
            <select value={formData.port} onChange={e => setFormData({...formData, port: parseInt(e.target.value)})} style={inputStyle}>
              {[110, 300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <p style={{ fontSize: '10px', color: '#777', margin: '0 0 8px 0' }}>{t('sd_serial_hint')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ width: '820px', maxHeight: '90vh', backgroundColor: '#f0f0f0', borderRadius: '6px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', border: '1px solid #999', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', backgroundColor: '#fff', borderBottom: '1px solid #ccc' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#333' }}>
            {mode === 'edit' ? t('sd_edit_session') : mode === 'clone' ? t('sd_clone_session') : t('sd_new_session')}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={16} color="#888" /></button>
        </div>

        {/* Protocol Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#fff', padding: '8px 12px', gap: '8px', borderBottom: '1px solid #ccc', overflowX: 'auto' }}>
          {sessionTypes.map(type => (
            <div key={type.id} onClick={() => type.enabled && setActiveTab(type.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: type.enabled ? 'pointer' : 'not-allowed', padding: '8px 10px', border: activeTab === type.id ? '2px solid #3498db' : '2px solid transparent', backgroundColor: activeTab === type.id ? '#e8f4f8' : 'transparent', borderRadius: '6px', minWidth: '56px', opacity: type.enabled ? 1 : 0.4, transition: 'all 0.15s' }}>
              {type.icon}
              <span style={{ fontSize: '11px', marginTop: '6px', fontWeight: activeTab === type.id ? 'bold' : 'normal', color: activeTab === type.id ? '#005a9e' : '#666' }}>{type.id}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', backgroundColor: '#f9f9f9', overflow: 'auto', flex: 1 }}>
          {activeTab === 'SSH'    && renderSSHForm()}
          {activeTab === 'SFTP'   && renderSFTPForm()}
          {activeTab === 'FTP'    && renderFTPForm()}
          {activeTab === 'Telnet' && renderTelnetForm()}
          {activeTab === 'Serial' && renderSerialForm()}
          {!['SSH', 'SFTP', 'FTP', 'Telnet', 'Serial'].includes(activeTab) && (
            <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', marginTop: '60px' }}>
              <Monitor size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>{activeTab} {t('sd_not_available')}</p>
              <p style={{ fontSize: '12px' }}>{t('sd_use_instead')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 20px', backgroundColor: '#eef0f3', borderTop: '1px solid #ccc' }}>
          <button onClick={onClose} style={cancelBtnStyle}>{t('sd_cancel')}</button>
          <button
            onClick={() => {
              const saveData = { ...formData, name: formData.name || formData.host, protocol: activeTab.toLowerCase() };
              onSave(saveData, mode === 'edit' ? 'edit' : 'create');
            }}
            style={saveBtnStyle}
            disabled={activeTab !== 'Serial' && (!formData.host || (!formData.username && activeTab !== 'Telnet' && activeTab !== 'FTP'))}
          >
            {mode === 'edit' ? t('sd_save_changes') : t('sd_connect_save')}
          </button>
        </div>
      </div>
    </div>
  );
};

const sectionStyle: React.CSSProperties = { backgroundColor: '#fff', border: '1px solid #ddd', padding: '16px', borderRadius: '6px' };
const sectionTitleStyle: React.CSSProperties = { margin: '0 0 14px 0', fontSize: '13px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center' };
const labelStyle: React.CSSProperties = { fontSize: '12px', marginBottom: '4px', fontWeight: '500', color: '#555' };
const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', color: '#000', backgroundColor: '#fff', fontSize: '13px', outline: 'none', transition: 'border-color 0.15s' };
const saveBtnStyle: React.CSSProperties = { padding: '8px 24px', backgroundColor: '#005a9e', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'background 0.15s' };
const cancelBtnStyle: React.CSSProperties = { padding: '8px 24px', backgroundColor: '#fff', border: '1px solid #ccc', color: '#666', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' };

export default SessionDialog;