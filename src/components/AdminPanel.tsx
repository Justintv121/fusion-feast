import React, { useState, useEffect, useCallback } from 'react';
import { AuditLogViewer } from './AuditLogViewer';
import { API_BASE } from '../config';

interface Props { token: string; }

export function AdminPanel({ token }: Props) {
  const [activeTab, setActiveTab] = useState<'users' | 'kpi' | 'audit' | 'status' | 'contracts' | 'invoices'>('users');
  // Create user form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolesInput, setRolesInput] = useState('mitarbeiter');
  const [error, setError] = useState<string|null>(null);

  // Listing state
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // KPI / Status
  const [kpi, setKpi] = useState<any|null>(null);
  const [top, setTop] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [statusInfo, setStatusInfo] = useState<any|null>(null);
  const [loadingKpi, setLoadingKpi] = useState(false);

  // Toast system
  const [toasts, setToasts] = useState<Array<{ id:string; msg:string; type:'ok'|'err' }>>([]);
  const pushToast = useCallback((msg: string, type: 'ok'|'err'='ok') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  // Contracts state
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cAmount, setCAmount] = useState<number>(0);
  const [cInterval, setCInterval] = useState('monthly');
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [addCapitalAmount, setAddCapitalAmount] = useState('');
  const [moves, setMoves] = useState<any[]>([]);
  const [loadingMoves, setLoadingMoves] = useState(false);
  const [adjustRemaining, setAdjustRemaining] = useState('');

  // Admin invoices view state
  const [adminInvoices, setAdminInvoices] = useState<any[]>([]);
  const [loadingAdminInvoices, setLoadingAdminInvoices] = useState(false);
  const [invoiceUserFilter, setInvoiceUserFilter] = useState<string>('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('');
  const [invoiceFromDate, setInvoiceFromDate] = useState('');
  const [invoiceToDate, setInvoiceToDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [loadingInvoiceDetail, setLoadingInvoiceDetail] = useState(false);

  const loadAdminInvoices = useCallback(async () => {
    setLoadingAdminInvoices(true);
    try {
      const params = new URLSearchParams();
      if (invoiceUserFilter) params.set('employeeUserId', invoiceUserFilter);
      if (invoiceStatusFilter) params.set('status', invoiceStatusFilter);
      if (invoiceFromDate) params.set('from', invoiceFromDate);
      if (invoiceToDate) params.set('to', invoiceToDate);
  const url = `${API_BASE}/api/invoices` + (params.toString() ? ('?' + params.toString()) : '');
      const res = await fetch(url, { headers:{ Authorization:`Bearer ${token}` }});
      if (res.ok) {
        const data = await res.json();
        setAdminInvoices(Array.isArray(data) ? data : data.invoices || data.rows || []);
      }
    } finally { setLoadingAdminInvoices(false); }
  }, [invoiceUserFilter, invoiceStatusFilter, invoiceFromDate, invoiceToDate, token]);

  const loadInvoiceDetail = useCallback(async (invoiceId: string) => {
    setLoadingInvoiceDetail(true);
    try {
      const res = await fetch(`${API_BASE}/api/invoices/${invoiceId}`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedInvoice(data);
      } else {
        pushToast('Rechnung nicht gefunden', 'err');
      }
    } catch (e) {
      pushToast('Fehler beim Laden der Rechnung', 'err');
    } finally {
      setLoadingInvoiceDetail(false);
    }
  }, [token, pushToast]);

  const deleteInvoice = useCallback(async (invoiceId: string, invoiceNumber: string) => {
    if (!confirm(`Rechnung ${invoiceNumber} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        pushToast('Rechnung gelöscht', 'ok');
        loadAdminInvoices(); // Refresh the list
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          setSelectedInvoice(null); // Close detail modal if it's the deleted invoice
        }
      } else {
        const data = await res.json();
        pushToast(data.error || 'Löschen fehlgeschlagen', 'err');
      }
    } catch (e) {
      pushToast('Fehler beim Löschen', 'err');
    }
  }, [token, pushToast, loadAdminInvoices, selectedInvoice]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search.trim()) params.set('search', search.trim());
  const res = await fetch(`${API_BASE}/api/admin/users?` + params.toString(), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.rows) { setUsers(data.rows); setTotal(data.total); } else { setUsers(data); setTotal(data.length); }
      }
    } finally { setLoading(false); }
  }, [page, pageSize, search, token]);

  // no need to cache users in global capital mode

  async function loadContracts() {
    setLoadingContracts(true);
    try {
  const res = await fetch(`${API_BASE}/api/contracts`, { headers:{ Authorization:`Bearer ${token}` }});
      if (res.ok) setContracts(await res.json());
    } finally { setLoadingContracts(false); }
  }
  // assignments removed

  useEffect(() => { if (activeTab === 'users') loadUsers(); }, [activeTab, loadUsers]);
  useEffect(() => { if (activeTab === 'kpi' || activeTab === 'status') loadKpi(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'contracts') { loadContracts(); } }, [activeTab]);
  useEffect(() => { if (activeTab === 'invoices') { loadAdminInvoices(); } }, [activeTab, loadAdminInvoices]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const body = { username, email: email || undefined, password, roles: rolesInput.split(',').map(r => r.trim()).filter(Boolean) };
  const res = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Fehler'); pushToast(data.error || 'Anlegen fehlgeschlagen', 'err'); return; }
    setUsername(''); setEmail(''); setPassword('');
    pushToast('User angelegt', 'ok');
    loadUsers();
  }

  async function createContract(e: React.FormEvent) {
    e.preventDefault();
    const payload = { title: cTitle.trim(), amount: Number(cAmount), intervalUnit: cInterval };
    if (!payload.title || payload.amount <= 0) { pushToast('Titel & Betrag nötig', 'err'); return; }
  const res = await fetch(`${API_BASE}/api/contracts`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { pushToast(data.error || 'Erstellen fehlgeschlagen', 'err'); return; }
    pushToast('Vertrag erstellt', 'ok');
    setCTitle(''); setCAmount(0); setCInterval('monthly');
    loadContracts();
  }

  async function toggleContractActive(c: any) {
  const res = await fetch(`${API_BASE}/api/contracts/${c.id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ active: !c.active }) });
    const data = await res.json();
    if (!res.ok) { pushToast(data.error || 'Update Fehler', 'err'); return; }
    setContracts(prev => prev.map(x => x.id === c.id ? data : x));
    pushToast('Aktualisiert', 'ok');
  }

  async function updateContractAmount(c: any, newAmount: number) {
  const res = await fetch(`${API_BASE}/api/contracts/${c.id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ amount: newAmount }) });
    const data = await res.json();
    if (!res.ok) { pushToast(data.error || 'Update Fehler', 'err'); return; }
    setContracts(prev => prev.map(x => x.id === c.id ? data : x));
    pushToast('Betrag aktualisiert', 'ok');
  }

  async function addCapitalToContract(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedContractId) return;
    const amt = Number(addCapitalAmount);
    if (!(amt>0)) { pushToast('Betrag > 0', 'err'); return; }
  const res = await fetch(`${API_BASE}/api/contracts/${selectedContractId}/add-capital`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ amount: amt }) });
    const data = await res.json();
    if (!res.ok) { pushToast(data.error || 'Fehler', 'err'); return; }
    pushToast('Kapital hinzugefügt', 'ok');
    setAddCapitalAmount('');
    loadContracts();
  }

  async function loadMoves(contractId: string) {
    if(!contractId) { setMoves([]); return; }
    setLoadingMoves(true);
    try {
  const res = await fetch(`${API_BASE}/api/contracts/${contractId}/moves?limit=50`, { headers:{ Authorization:`Bearer ${token}` }});
      if(res.ok) setMoves(await res.json());
    } finally { setLoadingMoves(false); }
  }

  async function submitAdjustRemaining(e: React.FormEvent) {
    e.preventDefault();
    if(!selectedContractId) return;
    const val = Number(adjustRemaining);
    if(!(val>=0)) { pushToast('Ungültiger Wert', 'err'); return; }
  const res = await fetch(`${API_BASE}/api/contracts/${selectedContractId}/adjust-remaining`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ remaining: val }) });
    const data = await res.json();
    if(!res.ok) { pushToast(data.error || 'Fehler', 'err'); return; }
    pushToast('Restkapital gesetzt', 'ok');
    setAdjustRemaining('');
    loadContracts();
    loadMoves(selectedContractId);
  }

  async function loadKpi() {
    setLoadingKpi(true);
    try {
      const [s1, s2, s3, st] = await Promise.all([
  fetch(`${API_BASE}/api/admin/kpi/summary`, { headers:{ Authorization:`Bearer ${token}` }}),
  fetch(`${API_BASE}/api/admin/kpi/top`, { headers:{ Authorization:`Bearer ${token}` }}),
  fetch(`${API_BASE}/api/admin/kpi/timeseries?days=14`, { headers:{ Authorization:`Bearer ${token}` }}),
  fetch(`${API_BASE}/api/admin/status`, { headers:{ Authorization:`Bearer ${token}` }} )
      ]);
      if (s1.ok) setKpi(await s1.json());
      if (s2.ok) setTop(await s2.json());
      if (s3.ok) setSeries(await s3.json());
      if (st.ok) setStatusInfo(await st.json());
    } finally { setLoadingKpi(false); }
  }

  async function toggleRole(user: any, role: string) {
    const newRoles = user.roles.includes(role) ? user.roles.filter((r:string)=>r!==role) : [...user.roles, role];
  const res = await fetch(`${API_BASE}/api/admin/users/${user.id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ roles: newRoles }) });
    const data = await res.json();
    if (!res.ok) { pushToast(data.error || 'Update Fehler', 'err'); return; }
    pushToast('Rollen aktualisiert', 'ok');
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, roles: data.roles } : u));
  }
  async function toggleActive(user: any) {
  const res = await fetch(`${API_BASE}/api/admin/users/${user.id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ active: !user.active }) });
    const data = await res.json();
    if (!res.ok) { pushToast(data.error || 'Aktiv-Update Fehler', 'err'); return; }
    pushToast('Status aktualisiert', 'ok');
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: data.active } : u));
  }
  async function resetPassword(user: any) {
  const res = await fetch(`${API_BASE}/api/admin/users/${user.id}/reset-password`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) { pushToast(data.error || 'Reset fehlgeschlagen', 'err'); return; }
    pushToast('Temp-Passwort: ' + data.tempPassword, 'ok');
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="ff-stack" style={{ gap:'1.2rem' }}>
      <div className='ff-tabs'>
        <button className={`ff-tab ${activeTab==='users'?'ff-tab-active':''}`} onClick={()=>setActiveTab('users')}>Benutzer</button>
        <button className={`ff-tab ${activeTab==='contracts'?'ff-tab-active':''}`} onClick={()=>setActiveTab('contracts')}>Verträge</button>
  <button className={`ff-tab ${activeTab==='invoices'?'ff-tab-active':''}`} onClick={()=>setActiveTab('invoices')}>Rechnungen</button>
        <button className={`ff-tab ${activeTab==='kpi'?'ff-tab-active':''}`} onClick={()=>setActiveTab('kpi')}>KPI</button>
        <button className={`ff-tab ${activeTab==='audit'?'ff-tab-active':''}`} onClick={()=>setActiveTab('audit')}>Audit Logs</button>
        <button className={`ff-tab ${activeTab==='status'?'ff-tab-active':''}`} onClick={()=>setActiveTab('status')}>Status</button>
      </div>

      {activeTab === 'users' && (
      <div className="ff-card">
        <div className="ff-card-header"><h3 className="ff-card-title">Benutzerverwaltung</h3></div>
        <form onSubmit={createUser} className="ff-inline-fields" style={{ marginBottom: '.9rem', flexWrap:'wrap', gap:6 }}>
          <input className="ff-input-sm" required placeholder='Benutzername' value={username} onChange={e => setUsername(e.target.value)} />
            <input className="ff-input-sm" placeholder='E-Mail (optional)' value={email} onChange={e => setEmail(e.target.value)} />
            <input className="ff-input-sm" required placeholder='Passwort' type='password' value={password} onChange={e => setPassword(e.target.value)} />
            <input className="ff-input-sm" placeholder='Rollen (comma)' value={rolesInput} onChange={e => setRolesInput(e.target.value)} />
            <button type='submit' className='ff-btn ff-btn-primary'>Anlegen</button>
            {error && <span className='ff-feedback-error'>{error}</span>}
        </form>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
          <input className='ff-input-sm' style={{ flex:'1 1 180px' }} placeholder='Suche Nutzer...' value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} />
          <select className='ff-input-sm' value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {[10,20,50].map(n => <option key={n} value={n}>{n}/Seite</option>)}
          </select>
          <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
            <button type='button' className='ff-mini-btn' disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>◀</button>
            <span style={{ fontSize:'.6rem', alignSelf:'center' }}>{page}/{totalPages}</span>
            <button type='button' className='ff-mini-btn' disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>▶</button>
            <button type='button' className='ff-mini-btn' onClick={loadUsers}>⟳</button>
          </div>
        </div>
        <div className='ff-table-wrap'>
          <table className='ff-table ff-compact'>
            <thead><tr><th>User</th><th>Email</th><th>Rollen</th><th>Aktiv</th><th>Login</th><th>Aktionen</th></tr></thead>
            <tbody>
              {loading && Array.from({ length:5 }).map((_,i)=>(<tr key={'sk'+i}><td colSpan={6}><div className='ff-skeleton' style={{ height:12 }}></div></td></tr>))}
              {!loading && users.map(u => (
                <tr key={u.id} className={!u.active ? 'ff-row-dim' : ''}>
                  <td>
                    <InlineUsernameEditor user={u} token={token} onSaved={(newName:string)=> setUsers(prev => prev.map(x => x.id===u.id ? { ...x, username:newName } : x))} pushToast={pushToast} />
                  </td>
                  <td>{u.email || <span className='ff-faded'>—</span>}</td>
                  <td style={{ minWidth:140 }}>
                    <label style={{ fontSize:'.55rem', display:'inline-flex', gap:4, marginRight:6 }}>
                      <input type='checkbox' checked={u.roles.includes('admin')} onChange={()=>toggleRole(u,'admin')} /> Admin
                    </label>
                    <label style={{ fontSize:'.55rem', display:'inline-flex', gap:4 }}>
                      <input type='checkbox' checked={u.roles.includes('mitarbeiter')} onChange={()=>toggleRole(u,'mitarbeiter')} /> Mitarb.
                    </label>
                  </td>
                  <td><input type='checkbox' checked={!!u.active} onChange={()=>toggleActive(u)} /></td>
                  <td>
                    <div style={{ fontSize:'.5rem', lineHeight:1.3 }}>
                      <div>Last: {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}</div>
                      <div>Fails: {u.failedLoginAttempts ?? 0}</div>
                    </div>
                  </td>
                  <td style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    <button className='ff-mini-btn' onClick={()=>resetPassword(u)}>PW Reset</button>
                    <InlinePasswordEditor user={u} token={token} pushToast={pushToast} />
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && <tr><td colSpan={6}><span className='ff-faded'>Keine Nutzer</span></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'contracts' && (
        <div className='ff-card'>
          <div className='ff-card-header'><h3 className='ff-card-title'>Vertragsverwaltung</h3><button className='ff-mini-btn' onClick={loadContracts}>⟳</button></div>
          <form onSubmit={createContract} className='ff-inline-fields' style={{ marginBottom:8, flexWrap:'wrap', gap:6 }}>
            <input className='ff-input-sm' placeholder='Titel' value={cTitle} onChange={e=>setCTitle(e.target.value)} required />
            <input className='ff-input-sm' type='number' min={0} step={0.01} placeholder='Betrag' value={cAmount} onChange={e=>setCAmount(Number(e.target.value))} required />
            <select className='ff-input-sm' value={cInterval} onChange={e=>setCInterval(e.target.value)}>
              <option value='once'>einmalig</option>
              <option value='weekly'>wöchentlich</option>
              <option value='monthly'>monatlich</option>
              <option value='yearly'>jährlich</option>
            </select>
            <button className='ff-btn ff-btn-primary'>Erstellen</button>
          </form>
          <div className='ff-table-wrap'>
            <table className='ff-table ff-compact'>
              <thead><tr><th></th><th>Titel</th><th>Betrag</th><th>Intervall</th><th>Aktiv</th><th>Kapital Total</th><th>Kapital Rest</th></tr></thead>
              <tbody>
                {loadingContracts && <tr><td colSpan={6}><div className='ff-skeleton' style={{ height:14 }} /></td></tr>}
                {!loadingContracts && contracts.map(c => (
                  <tr key={c.id} className={c.id===selectedContractId ? 'ff-row-animate':''}>
                    <td><input type='radio' name='csel' checked={c.id===selectedContractId} onChange={()=>{ const newSel = c.id===selectedContractId?'':c.id; setSelectedContractId(newSel); loadMoves(newSel); }} /></td>
                    <td>{c.title}</td>
                    <td>
                      <input className='ff-input-sm' style={{ width:70 }} type='number' step={0.01} defaultValue={c.amount} onBlur={e=>{ const v = Number(e.target.value); if (v>0 && v!==c.amount) updateContractAmount(c,v); }} />
                    </td>
                    <td>{c.intervalUnit}</td>
                    <td><input type='checkbox' checked={!!c.active} onChange={()=>toggleContractActive(c)} /></td>
                    <td>{c.capitalTotal?.toFixed(2)} $</td>
                    <td>{c.capitalRemaining?.toFixed(2)} $</td>
                  </tr>
                ))}
                {!loadingContracts && contracts.length===0 && <tr><td colSpan={6}><span className='ff-faded'>Keine Verträge</span></td></tr>}
              </tbody>
            </table>
          </div>
          {selectedContractId && (
            <form onSubmit={addCapitalToContract} style={{ marginTop:14, display:'flex', gap:6, flexWrap:'wrap' }}>
              <input className='ff-input-sm' placeholder='Kapital hinzufügen' type='number' min={0} step={0.01} value={addCapitalAmount} onChange={e=>setAddCapitalAmount(e.target.value)} />
              <button className='ff-btn'>Kapital +</button>
            </form>
          )}
          {selectedContractId && (
            <form onSubmit={submitAdjustRemaining} style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
              <input className='ff-input-sm' placeholder='Restkapital setzen' type='number' min={0} step={0.01} value={adjustRemaining} onChange={e=>setAdjustRemaining(e.target.value)} />
              <button className='ff-btn'>Setzen</button>
            </form>
          )}
          {selectedContractId && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:'.55rem', opacity:.7, marginBottom:4 }}>Bewegungen (neueste zuerst)</div>
              <div className='ff-table-wrap'>
                <table className='ff-table ff-compact'>
                  <thead><tr><th>Typ</th><th>Betrag</th><th>Vorher</th><th>Nachher</th><th>Invoice</th><th>Zeit</th></tr></thead>
                  <tbody>
                    {loadingMoves && <tr><td colSpan={6}><div className='ff-skeleton' style={{ height:12 }} /></td></tr>}
                    {!loadingMoves && moves.map(m => (
                      <tr key={m.id}>
                        <td>{m.type}</td>
                        <td>{m.amount.toFixed(2)} $</td>
                        <td>{m.beforeRemaining.toFixed(2)}</td>
                        <td>{m.afterRemaining.toFixed(2)}</td>
                        <td>{m.relatedInvoiceId ? m.relatedInvoiceId.slice(0,8)+'…' : '—'}</td>
                        <td style={{ fontSize:'.5rem' }}>{new Date(m.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {!loadingMoves && moves.length===0 && <tr><td colSpan={6}><span className='ff-faded'>Keine Bewegungen</span></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className='ff-card'>
          <div className='ff-card-header'><h3 className='ff-card-title'>Alle Rechnungen</h3><button className='ff-mini-btn' onClick={loadAdminInvoices}>⟳</button></div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
            <input className='ff-input-sm' placeholder='User ID Filter' value={invoiceUserFilter} onChange={e=>setInvoiceUserFilter(e.target.value)} style={{ flex:'1 1 140px' }} />
            <select className='ff-input-sm' value={invoiceStatusFilter} onChange={e=>setInvoiceStatusFilter(e.target.value)}>
              <option value=''>Status (alle)</option>
              <option value='open'>open</option>
              <option value='done'>done</option>
              <option value='canceled'>canceled</option>
            </select>
            <input className='ff-input-sm' type='date' value={invoiceFromDate} onChange={e=>setInvoiceFromDate(e.target.value)} />
            <input className='ff-input-sm' type='date' value={invoiceToDate} onChange={e=>setInvoiceToDate(e.target.value)} />
            <button type='button' className='ff-mini-btn' onClick={loadAdminInvoices}>Filter</button>
            <a className='ff-mini-btn' href={`${API_BASE}/api/invoices/export?format=csv` + (invoiceStatusFilter?('&status='+invoiceStatusFilter):'') + (invoiceUserFilter?('&employeeUserId='+invoiceUserFilter):'')}>CSV</a>
          </div>
          <div className='ff-table-wrap'>
            <table className='ff-table ff-compact'>
              <thead><tr><th>#</th><th>User</th><th>Status</th><th>Total</th><th>Items</th><th>Vertrag</th><th>Erstellt</th><th>Aktionen</th></tr></thead>
              <tbody>
                {loadingAdminInvoices && <tr><td colSpan={8}><div className='ff-skeleton' style={{ height:16 }} /></td></tr>}
                {!loadingAdminInvoices && adminInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontSize:'.55rem' }}>{inv.invoiceNumber}</td>
                    <td style={{ fontSize:'.55rem' }}>{inv.employeeUsername || (inv.employeeUserId?.slice(0,8)+'…')}</td>
                    <td>{inv.status}</td>
                    <td>{inv.total?.toFixed?.(2)} $</td>
                    <td style={{ fontSize:'.5rem' }}>{Array.isArray(inv.items)? inv.items.length : (inv.itemCount ?? '—')}</td>
                    <td style={{ fontSize:'.55rem' }}>{inv.contractTitle || (inv.contractId ? inv.contractId.slice(0,6)+'…' : '—')}</td>
                    <td style={{ fontSize:'.5rem' }}>{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : '—'}</td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button 
                        className='ff-mini-btn' 
                        onClick={() => loadInvoiceDetail(inv.id)}
                        title='Details anzeigen'
                      >
                        👁️
                      </button>
                      <button 
                        className='ff-mini-btn' 
                        onClick={() => deleteInvoice(inv.id, inv.invoiceNumber)}
                        title='Rechnung löschen'
                        style={{ color: '#f88' }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {!loadingAdminInvoices && adminInvoices.length===0 && <tr><td colSpan={8}><span className='ff-faded'>Keine Rechnungen</span></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedInvoice(null)}
        >
          <div 
            style={{ 
              maxWidth: '800px', 
              width: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ff-card" style={{ margin: 0 }}>
              <div className="ff-card-header">
                <h3 className="ff-card-title">Rechnungsdetails: {selectedInvoice.invoiceNumber}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="ff-mini-btn" 
                    onClick={() => deleteInvoice(selectedInvoice.id, selectedInvoice.invoiceNumber)}
                    title="Rechnung löschen"
                    style={{ color: '#f88' }}
                  >
                    🗑️ Löschen
                  </button>
                  <button className="ff-mini-btn" onClick={() => setSelectedInvoice(null)}>✕</button>
                </div>
              </div>
              
              {loadingInvoiceDetail ? (
                <div className="ff-skeleton" style={{ height: 200 }} />
              ) : (
                <div className="ff-stack">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <strong>Benutzer:</strong><br />
                      {selectedInvoice.employeeUsername || selectedInvoice.employeeUserId}
                    </div>
                    <div>
                      <strong>Status:</strong><br />
                      <span className={`ff-status-badge ${
                        selectedInvoice.status === 'done' ? 'ff-status-done' :
                        selectedInvoice.status === 'canceled' ? 'ff-status-canceled' :
                        'ff-status-open'
                      }`}>
                        {selectedInvoice.status}
                      </span>
                    </div>
                    <div>
                      <strong>Gesamtsumme:</strong><br />
                      {selectedInvoice.total?.toFixed(2)} $
                    </div>
                    <div>
                      <strong>Erstellt:</strong><br />
                      {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : '—'}
                    </div>
                    {selectedInvoice.contractTitle && (
                      <div>
                        <strong>Vertrag:</strong><br />
                        {selectedInvoice.contractTitle}
                      </div>
                    )}
                  </div>
                  
                  <div className="ff-divider" />
                  
                  <div>
                    <h4>Artikel ({selectedInvoice.items?.length || 0})</h4>
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      <div className="ff-table-wrap">
                        <table className="ff-table">
                          <thead>
                            <tr>
                              <th>Bezeichnung</th>
                              <th>Menge</th>
                              <th>Einzelpreis</th>
                              <th>Summe</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.items.map((item: any, index: number) => (
                              <tr key={index}>
                                <td>{item.name}</td>
                                <td>{item.quantity}</td>
                                <td>{item.unitPrice?.toFixed(2)} $</td>
                                <td>{item.lineTotal?.toFixed(2)} $</td>
                              </tr>
                            ))}
                            <tr style={{ borderTop: '2px solid #333', fontWeight: 'bold' }}>
                              <td colSpan={3} style={{ textAlign: 'right' }}>Gesamtsumme:</td>
                              <td>{selectedInvoice.total?.toFixed(2)} $</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="ff-faded">Keine Artikel vorhanden</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'kpi' && (
        <div className='ff-card'>
          <div className='ff-card-header'><h3 className='ff-card-title'>KPI & Performance</h3><button className='ff-mini-btn' onClick={loadKpi}>⟳</button></div>
          {loadingKpi && <div className='ff-skeleton' style={{ height:40, marginBottom:8 }} />}
          {kpi && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:12, fontSize:'.6rem' }}>
              <div className='ff-kpi'><strong>Heute</strong><br />{kpi.todayCount} / {kpi.todayTotal.toFixed(2)} $</div>
              <div className='ff-kpi'><strong>Woche</strong><br />{kpi.weekCount} / {kpi.weekTotal.toFixed(2)} $</div>
              <div className='ff-kpi'><strong>Status</strong><br />O:{kpi.statuses.open} D:{kpi.statuses.done} C:{kpi.statuses.canceled}</div>
              <div className='ff-kpi'><strong>Ø Positionen</strong><br />{kpi.avgItems.toFixed(2)}</div>
            </div>
          )}
          {top.length>0 && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:'.55rem', textTransform:'uppercase', opacity:.6 }}>Top Mitarbeiter</div>
              <ul style={{ listStyle:'none', margin:0, padding:0, fontSize:'.6rem' }}>
                {top.map(t => <li key={t.userId}>{t.username || ('#'+t.userId.slice(0,6))}: {t.count} / {t.total.toFixed(2)} $</li>)}
              </ul>
            </div>
          )}
          {series.length>0 && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:'.55rem', textTransform:'uppercase', opacity:.6 }}>Letzte Tage</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:60 }}>
                {series.map(s => {
                  const max = Math.max(...series.map(x=>x.total));
                  const h = max? (s.total / max) * 60 : 0;
                  return <div key={s.date} title={s.date+': '+s.total.toFixed(2)+' $'} style={{ width:10, background:'#70492f', height: h||2 }} />;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <AuditLogViewer token={token} />
      )}

      {activeTab === 'status' && (
        <div className='ff-card'>
          <div className='ff-card-header'><h3 className='ff-card-title'>Server Status</h3><button className='ff-mini-btn' onClick={loadKpi}>⟳</button></div>
          {!statusInfo && <div className='ff-skeleton' style={{ height:24 }} />}
          {statusInfo && (
            <div style={{ fontSize:'.6rem', display:'flex', gap:16, flexWrap:'wrap' }}>
              <div>Uptime: {Math.floor(statusInfo.uptime)}s</div>
              <div>Node: {statusInfo.node}</div>
              <div>Heap: {(statusInfo.memory.heapUsed/1024/1024).toFixed(1)}MB</div>
              <div>RSS: {(statusInfo.memory.rss/1024/1024).toFixed(1)}MB</div>
              <div style={{ marginLeft:'auto' }}>
                <a className='ff-mini-btn' href={`${API_BASE}/api/invoices/export?format=csv`} target='_blank' rel='noreferrer'>Export CSV</a>
              </div>
            </div>
          )}
        </div>
      )}

  {/* Toasts */}
      <div style={{ position:'fixed', bottom:12, right:12, display:'flex', flexDirection:'column', gap:6, zIndex:999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type==='ok' ? '#234c2a' : '#5b1d1d', color:'#fff', padding:'6px 10px', borderRadius:6, fontSize:'.6rem', boxShadow:'0 2px 6px rgba(0,0,0,.4)' }}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}

interface InlineUsernameEditorProps { user: any; token: string; onSaved: (newName:string)=>void; pushToast:(m:string,t?:'ok'|'err')=>void; }
const InlineUsernameEditor: React.FC<InlineUsernameEditorProps> = ({ user, token, onSaved, pushToast }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(user.username);
  const [saving, setSaving] = useState(false);
  async function save() {
    if (value.trim().length < 3 || value === user.username) { setEditing(false); setValue(user.username); return; }
    setSaving(true);
    try {
  const res = await fetch(`${API_BASE}/api/admin/users/${user.id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ username: value.trim() }) });
      const data = await res.json();
      if(!res.ok) { pushToast(data.error || 'Fehler', 'err'); setValue(user.username); }
      else { onSaved(data.username); pushToast('Username aktualisiert','ok'); }
    } finally { setSaving(false); setEditing(false); }
  }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      {!editing && <span>{user.username}</span>}
      {editing && <input className='ff-input-sm' style={{ width:110 }} value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') save(); if(e.key==='Escape'){ setEditing(false); setValue(user.username);} }} />}
      {!editing && <button type='button' className='ff-mini-btn' title='Rename' onClick={()=>{ setEditing(true); setValue(user.username); }}>✎</button>}
      {editing && <>
        <button type='button' className='ff-mini-btn' disabled={saving} onClick={save}>✔</button>
        <button type='button' className='ff-mini-btn' disabled={saving} onClick={()=>{ setEditing(false); setValue(user.username); }}>✕</button>
      </>}
    </div>
  );
};

interface InlinePasswordEditorProps { user: any; token: string; pushToast:(m:string,t?:'ok'|'err')=>void; }
const InlinePasswordEditor: React.FC<InlinePasswordEditorProps> = ({ user, token, pushToast }) => {
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  
  async function save() {
    if (password.length < 6) { 
      pushToast('Passwort muss mindestens 6 Zeichen lang sein', 'err'); 
      return; 
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${user.id}/set-password`, { 
        method:'POST', 
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, 
        body: JSON.stringify({ password }) 
      });
      const data = await res.json();
      if(!res.ok) { 
        pushToast(data.error || 'Fehler beim Setzen des Passworts', 'err'); 
      } else { 
        pushToast('Passwort erfolgreich gesetzt','ok'); 
        setEditing(false);
        setPassword('');
      }
    } finally { setSaving(false); }
  }
  
  function cancel() {
    setEditing(false);
    setPassword('');
  }
  
  return (
    <>
      {!editing && (
        <button className='ff-mini-btn' title='Passwort setzen' onClick={()=>setEditing(true)}>
          🔑 PW
        </button>
      )}
      {editing && (
        <div style={{ display:'flex', alignItems:'center', gap:4, background:'#1a1a1a', padding:'4px 6px', borderRadius:4, border:'1px solid #333' }}>
          <input 
            className='ff-input-sm' 
            type='password'
            placeholder='Neues Passwort' 
            style={{ width:120 }} 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            onKeyDown={e=>{ 
              if(e.key==='Enter') save(); 
              if(e.key==='Escape') cancel(); 
            }} 
            autoFocus
          />
          <button type='button' className='ff-mini-btn' disabled={saving} onClick={save}>✔</button>
          <button type='button' className='ff-mini-btn' disabled={saving} onClick={cancel}>✕</button>
        </div>
      )}
    </>
  );
};