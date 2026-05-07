import React, { useState } from 'react';
import { TerminalSquare, Lock, User } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/translations';

interface LoginScreenProps {
  onLogin: (token: string, username: string) => void;
  apiUrl: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, apiUrl }) => {
  const { lang, setLang, t } = useLanguage();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLogin(data.token, data.username);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', 
      flexDirection: 'column', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', 
      color: '#fff' 
    }}>
      {/* Language switcher at top-right */}
      <div style={{ position: 'absolute', top: 16, right: 20, display: 'flex', gap: 6 }}>
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            style={{
              background: lang === l.code ? 'rgba(255,255,255,0.2)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              padding: '4px 10px',
              cursor: 'pointer',
              fontWeight: lang === l.code ? 700 : 400,
            }}
          >
            {l.flag} {l.code.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        backdropFilter: 'blur(10px)',
        padding: '40px 36px', 
        borderRadius: '12px', 
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)', 
        width: '340px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, #005a9e, #3498db)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 4px 15px rgba(0, 90, 158, 0.3)' }}>
          <TerminalSquare size={28} color="#fff" />
        </div>
        
        <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600', color: '#fff' }}>XTerm Web</h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{t('login_subtitle')}</p>
        
        {error && (
          <div style={{ color: '#ff6b6b', fontSize: '12px', marginBottom: '12px', backgroundColor: 'rgba(255, 107, 107, 0.1)', padding: '8px 12px', borderRadius: '6px', width: '100%', textAlign: 'center', border: '1px solid rgba(255, 107, 107, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <User size={12} /> {t('login_username')}
            </label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <Lock size={12} /> {t('login_password')}
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: '11px', background: loading ? '#555' : 'linear-gradient(135deg, #005a9e, #3498db)', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'wait' : 'pointer', fontWeight: '600', marginTop: '6px', fontSize: '14px', boxShadow: '0 4px 15px rgba(0, 90, 158, 0.3)', transition: 'all 0.2s' }}
          >
            {loading ? t('login_signing') : t('login_signin')}
          </button>
        </form>
      </div>
      
      <p style={{ marginTop: '24px', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
        {t('login_footer')}
      </p>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
  boxSizing: 'border-box', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s'
};

export default LoginScreen;