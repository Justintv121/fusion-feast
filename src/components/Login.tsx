import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface Props { onLogin: (token: string, user: any) => void; title?: string; subtitle?: string }

export function Login({ onLogin, title = 'Zugang', subtitle = 'Bitte anmelden um fortzufahren' }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const ct = res.headers.get('content-type') || '';
      const raw = await res.text();
      let data: any = {};
      if (ct.includes('application/json')) {
        try { data = raw ? JSON.parse(raw) : {}; } catch (e) {
          throw new Error('Defekte JSON Antwort');
        }
      }
      if (!res.ok) {
        const msg = data.error || raw.slice(0,120) || 'Login fehlgeschlagen';
        throw new Error(msg);
      }
      if (!data.accessToken || !data.user) {
        throw new Error('Antwort unvollständig');
      }
      onLogin(data.accessToken, data.user);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Scroll sperren solange Login angezeigt
  useEffect(() => {
    document.body.classList.add('ff-lock-scroll');
    return () => { document.body.classList.remove('ff-lock-scroll'); };
  }, []);

  return (
    <div className="ff-login-wrapper">
      <div className="ff-login-card">
        <div className="ff-login-head">
          <img src="/logo.svg" alt="Fusion Feast" className="ff-login-logo" />
          <h2 className="ff-login-title">{title}</h2>
          <p className="ff-login-sub">{subtitle}</p>
        </div>
        <form onSubmit={submit} className="ff-login-form">
          <label className="ff-field">
            <span className="ff-label">Benutzername</span>
            <input className="ff-input" value={username} onChange={e => setUsername(e.target.value)} type="text" autoComplete="username" required />
          </label>
          <label className="ff-field">
            <span className="ff-label">Passwort</span>
            <input className="ff-input" value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" required />
          </label>
          {error && <div className="ff-error-box">{error}</div>}
          <button type="submit" className="ff-btn-primary">Einloggen</button>
        </form>
      </div>
    </div>
  );
}
