import React, { useState } from 'react';
import MainLayout from './layout/MainLayout';
import LoginScreen from './components/LoginScreen';

export interface TabSession {
  id: string; // unique tab id
  session: any; // session data (host, username, etc.)
  protocol: string;
  ws: WebSocket | null;
  label: string;
}

const originalFetch = window.fetch;
window.fetch = async function (...args) {
  let [resource, config] = args;
  const token = localStorage.getItem('moba_token');
  if (token && typeof resource === 'string' && resource.includes('/api/')) {
    if (!config) config = {};
    if (!config.headers) config.headers = {};
    (config.headers as any)['Authorization'] = `Bearer ${token}`;
  }
  return originalFetch(resource, config);
};

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('moba_token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('moba_user'));

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleLogin = (t: string, u: string) => {
    localStorage.setItem('moba_token', t);
    localStorage.setItem('moba_user', u);
    setToken(t);
    setUsername(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('moba_token');
    localStorage.removeItem('moba_user');
    setToken(null);
    setUsername(null);
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} apiUrl={apiUrl} />;
  }

  let role = 'user';
  let userId = null;
  if (token) {
    try {
      const decoded = atob(token);
      const parts = decoded.split(':');
      userId = parseInt(parts[0]);
      role = parts[2];
    } catch(e) {}
  }

  return (
    <MainLayout 
      onLogout={handleLogout}
      apiUrl={apiUrl} 
      username={username}
      role={role}
      userId={userId}
    />
  );
}

export default App;