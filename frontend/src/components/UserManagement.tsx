import React, { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Key, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface UserManagementProps {
  apiUrl: string;
  role: string;
  currentUserId: number | null;
}

const UserManagement: React.FC<UserManagementProps> = ({ apiUrl, role, currentUserId }) => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{ isOpen: boolean, mode: 'create'|'edit'|'password', user?: any }>({ isOpen: false, mode: 'create' });
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (role !== 'admin') {
      // Normal users only see themselves. We can mock this by just fetching nothing and relying on context, 
      // but let's just make an API that returns their own info, or mock it since they only edit password.
      setUsers([{ id: currentUserId, username: localStorage.getItem('moba_user'), role: 'user' }]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/users`);
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {}
    setLoading(false);
  };

  const openDialog = (mode: 'create'|'edit'|'password', user?: any) => {
    setForm({ username: user?.username || '', password: '', role: user?.role || 'user' });
    setDialog({ isOpen: true, mode, user });
  };

  const closeDialog = () => setDialog({ isOpen: false, mode: 'create' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let url = `${apiUrl}/api/users`;
      let method = 'POST';
      
      if (dialog.mode === 'edit' || dialog.mode === 'password') {
        url += `/${dialog.user.id}`;
        method = 'PUT';
      }
      
      const payload: any = { username: form.username, role: form.role };
      if (form.password) payload.password = form.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchUsers();
        closeDialog();
        if (dialog.mode === 'password' && dialog.user.id === currentUserId) {
           alert(t('alert_pass_succ'));
        }
      } else {
        const err = await res.json();
        alert(t('alert_err') + err.error);
      }
    } catch (err: any) {
      alert(t('alert_err') + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('alert_del_user'))) return;
    try {
      const res = await fetch(`${apiUrl}/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
      else alert(t('alert_fail_del') + (await res.json()).error);
    } catch (err: any) { alert(t('alert_err') + err.message); }
  };

  return (
    <div style={{ padding: '12px', fontSize: '13px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <b style={{ color: '#1a1a1a' }}>{t('um_title')}</b>
        {role === 'admin' && (
          <button onClick={() => openDialog('create')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#3498db', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
            <UserPlus size={14} /> {t('um_new_user')}
          </button>
        )}
      </div>

      {loading ? <p>{t('sl_loading')}</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: '#f5f6f7', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#333' }}>{u.username}</div>
                <div style={{ fontSize: '11px', color: '#7f8c8d' }}>{t('um_role')}: {u.role}</div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => openDialog('password', u)} title={t('um_change_pass')} style={iconBtnStyle}><Key size={14} color="#f39c12" /></button>
                {role === 'admin' && <button onClick={() => openDialog('edit', u)} title={t('um_edit_user')} style={iconBtnStyle}><Edit size={14} color="#3498db" /></button>}
                {role === 'admin' && u.id !== 1 && <button onClick={() => handleDelete(u.id)} title={t('st_delete')} style={iconBtnStyle}><Trash2 size={14} color="#e74c3c" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {dialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '300px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
                {dialog.mode === 'create' ? t('um_new_user') : dialog.mode === 'edit' ? t('um_edit_user') : t('um_change_pass')}
              </h3>
              <button onClick={closeDialog} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#7f8c8d" /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(dialog.mode === 'create' || dialog.mode === 'edit') && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#555' }}>{t('um_username')}</label>
                  <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required style={inputStyle} />
                </div>
              )}
              
              {(dialog.mode === 'create' || dialog.mode === 'password') && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#555' }}>{dialog.mode === 'password' ? t('um_new_pass') : t('um_password')}</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={dialog.mode === 'create'} style={inputStyle} />
                </div>
              )}

              {role === 'admin' && (dialog.mode === 'create' || dialog.mode === 'edit') && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#555' }}>{t('um_role')}</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={inputStyle}>
                    <option value="user">{t('um_role_user')}</option>
                    <option value="admin">{t('um_role_admin')}</option>
                  </select>
                </div>
              )}

              <button type="submit" style={{ padding: '8px', background: '#005a9e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '8px' }}>
                {t('um_save')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' };
const inputStyle = { width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', boxSizing: 'border-box' as any, color: '#333', backgroundColor: '#fff' };

export default UserManagement;
