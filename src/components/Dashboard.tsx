import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { AdminPanel } from './AdminPanel';
import { EmployeeInvoices } from './EmployeeInvoices';

interface Props { token: string; user: any; onLogout: () => void; }

export function Dashboard({ token, user, onLogout }: Props) {
  const isAdmin = user?.roles?.includes('admin');
  const isEmployee = user?.roles?.includes('mitarbeiter') || isAdmin;

  // Decide initial tab based on hostname & roles
  const [view, setView] = useState<'panel'|'mitarbeiter'>(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname.toLowerCase();
      if (host.startsWith('mitarbeiter.')) return 'mitarbeiter';
  const path = window.location.pathname;
  if (path.startsWith('/mitarbeiter')) return 'mitarbeiter';
    }
    if (!isAdmin && isEmployee) return 'mitarbeiter';
    return 'panel';
  });

  // If roles change (e.g., after refresh token fetch) ensure non-admins don't stay on admin panel
  useEffect(() => {
    if (!isAdmin && view === 'panel') setView('mitarbeiter');
  }, [isAdmin, view]);

  // Keep tab selection in sync with path if user manually navigates
  useEffect(() => {
    function onPop() {
      const path = window.location.pathname;
      if (path.startsWith('/mitarbeiter')) setView('mitarbeiter');
      else if (isAdmin) setView('panel');
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [isAdmin]);

  // When switching tabs, optionally push a shallow history entry for nicer bookmarking
  function switchView(v: 'panel'|'mitarbeiter') {
    setView(v);
    if (typeof window !== 'undefined') {
      const targetPath = v === 'mitarbeiter' ? '/mitarbeiter' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  }

  return (
    <div className="ff-area-wrapper">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={onLogout} className='ff-mini-btn'>Logout</button>
      </div>
      {(isAdmin || isEmployee) && (
        <div className='ff-tabs'>
          {isAdmin && <button className={`ff-tab ${view==='panel'?'ff-tab-active':''}`} onClick={()=>switchView('panel')}>Admin Panel</button>}
          {isEmployee && <button className={`ff-tab ${view==='mitarbeiter'?'ff-tab-active':''}`} onClick={()=>switchView('mitarbeiter')}>Mitarbeiter</button>}
        </div>
      )}
      {isAdmin && view==='panel' && <AdminPanel token={token} />}
      {isEmployee && view==='mitarbeiter' && <EmployeeInvoices token={token} />}
    </div>
  );
}
