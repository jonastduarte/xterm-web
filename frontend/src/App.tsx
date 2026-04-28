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

  return (
    <MainLayout 
      onLogout={handleLogout}
      apiUrl={apiUrl} 
      username={username}
    />
  );
}

export default App;