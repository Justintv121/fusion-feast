import React, { useState, useEffect } from 'react';
import { Login } from '../components/Login';
import { Dashboard } from '../components';
import { Landing } from '../components/Landing';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const isPanelDomain = host.startsWith('panel.') || path.startsWith('/panel');
  const isEmployeeDomain = host.startsWith('mitarbeiter.') || path.startsWith('/mitarbeiter');
  const isLanding = !isPanelDomain && !isEmployeeDomain;

  // Optional: normalize path (so /panel or /mitarbeiter always stay when switching login states)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isPanelDomain && path === '/') {
      window.history.replaceState({}, '', '/panel');
    } else if (isEmployeeDomain && path === '/') {
      window.history.replaceState({}, '', '/mitarbeiter');
    }
  }, []);

  function handleLogin(t: string, u: any) {
    if (isPanelDomain && !u.roles?.includes('admin')) {
      setError('Nur Admins dürfen dieses Panel benutzen.');
      // Sofort wieder ausloggen (kein Token speichern)
      setToken(null);
      setUser(null);
      return;
    }
    setError(null);
    setToken(t);
  // WICHTIG: komplette User-Rollen übernehmen, sonst Zugriff schlägt fehl
  setUser(u);
  }

  if (isLanding) {
    // Immer Landing – kein Login Formular auf Root Domain
    return <Landing />;
  }

  if (!token) {
    const title = isPanelDomain ? 'Admin Zugang' : 'Mitarbeiter Zugang';
    const subtitle = isPanelDomain ? 'Nur autorisierte Verwaltung' : 'Intern – bitte anmelden';
    return <><Login onLogin={handleLogin} title={title} subtitle={subtitle} />{error && <div style={{ position:'fixed', top:12, left:0, right:0, textAlign:'center', fontFamily:'sans-serif', fontSize:12, color:'#f88' }}>{error}</div>}</>;
  }

  // Panel Domain: zusätzliche Sicherheit – falls Rolle nachträglich entfernt wurde
  if (isPanelDomain && !user?.roles?.includes('admin')) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: 32, color: 'red' }}>
        Zugriff verweigert – kein Admin.
        <button onClick={() => { setToken(null); setUser(null); }}>Neu einloggen</button>
      </div>
    );
  }
  if (isEmployeeDomain && !(user?.roles?.includes('mitarbeiter') || user?.roles?.includes('admin'))) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: 32, color: 'red' }}>
        Zugriff verweigert – kein Mitarbeiter.
        <button onClick={() => { setToken(null); setUser(null); }}>Neu einloggen</button>
      </div>
    );
  }

  return <Dashboard token={token} user={user} onLogout={() => { setToken(null); setUser(null); }} />;
}
