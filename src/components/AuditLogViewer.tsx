import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

interface Props { token: string; }

export function AuditLogViewer({ token }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page:String(page), pageSize:String(pageSize) });
      if (action.trim()) params.set('action', action.trim());
  const res = await fetch(`${API_BASE}/api/admin/audit?` + params.toString(), { headers:{ Authorization:`Bearer ${token}` }});
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows); setTotal(data.total); setPage(data.page); setPageSize(data.pageSize);
      }
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, [page, pageSize, action]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className='ff-card'>
      <div className='ff-card-header'>
        <h3 className='ff-card-title'>Audit Logs</h3>
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
        <input className='ff-input-sm' placeholder='Action Filter (z.B. user.update)' value={action} onChange={e=>{ setPage(1); setAction(e.target.value); }} />
        <select className='ff-input-sm' value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
          {[25,50,100].map(n => <option key={n} value={n}>{n}/Seite</option>)}
        </select>
        <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
          <button className='ff-mini-btn' disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>◀</button>
          <span style={{ fontSize:'.6rem', alignSelf:'center' }}>{page}/{totalPages}</span>
          <button className='ff-mini-btn' disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>▶</button>
          <button className='ff-mini-btn' onClick={load}>⟳</button>
        </div>
      </div>
      <div className='ff-table-wrap' style={{ maxHeight:300 }}>
        <table className='ff-table ff-compact'>
          <thead>
            <tr>
              <th>Zeit</th><th>User</th><th>Action</th><th>Entity</th><th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5}><div className='ff-skeleton' style={{ height:14 }} /></td></tr>}
            {!loading && rows.map(r => (
              <tr key={r.id}>
                <td style={{ whiteSpace:'nowrap' }}>{new Date(r.createdAt).toLocaleString()}</td>
                <td style={{ fontSize:'.55rem' }}>{r.userUsername || (r.userId?.slice(0,6)+'…') || '—'}</td>
                <td style={{ fontSize:'.55rem' }}>{r.action}</td>
                <td style={{ fontSize:'.55rem' }}>
                  {r.entityType || ''} {r.entityType==='user' && r.entityUsername ? r.entityUsername : ''}
                  {r.entityType==='contract' && r.contractTitle ? ' '+r.contractTitle : (r.entityId ? ' #'+String(r.entityId).slice(0,6) : '')}
                </td>
                <td style={{ fontSize:'.5rem', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis' }}>
                  {r.before || r.after ? JSON.stringify({ before:r.before, after:r.after }) : '—'}
                </td>
              </tr>
            ))}
            {!loading && rows.length===0 && <tr><td colSpan={5}><span className='ff-faded'>Keine Einträge</span></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogViewer;