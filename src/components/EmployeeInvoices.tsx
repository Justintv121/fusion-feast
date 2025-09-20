import React, { useEffect, useState, useMemo } from 'react';
import { API_BASE } from '../config';
import { PRODUCTS, PRODUCT_CATEGORIES } from '../data/products';
import { MyInvoices } from './MyInvoices';

interface InvoiceItemDraft { id: string; productId?: string; name: string; quantity: number; unitPrice: number; };

function randomId() { return Math.random().toString(36).slice(2,10); }

export function EmployeeInvoices({ token }: { token: string }) {
  const [items, setItems] = useState<InvoiceItemDraft[]>([ { id: randomId(), name: '', quantity: 1, unitPrice: 0 } ]);
  const [categoryFilter, setCategoryFilter] = useState<'essen' | 'trinken' | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rechner' | 'vertraege' | 'meine-rechnungen'>('rechner');
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractLocked, setContractLocked] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [contractError, setContractError] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');

  useEffect(() => { loadContracts(); }, []);
  useEffect(() => { if (activeTab==='vertraege') loadContracts(); }, [activeTab]);

  async function loadContracts() {
    setLoadingContracts(true);
    try {
  const res = await fetch(`${API_BASE}/api/contracts/mine/list`, { headers:{ Authorization:`Bearer ${token}` }});
      if(res.ok) { setContracts(await res.json()); }
    } finally { setLoadingContracts(false); }
  }

  function updateItem(id: string, patch: Partial<InvoiceItemDraft>) { setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i)); }
  function addItem() { setItems(prev => [...prev, { id: randomId(), name: '', quantity: 1, unitPrice: 0 }]); }
  function selectProduct(draftId: string, productId: string) {
    const p = PRODUCTS.find(p => p.id === productId); if (!p) return;
    setItems(prev => prev.map(i => i.id === draftId ? { ...i, productId, name: p.name, unitPrice: p.price } : i));
  }

  const filteredProducts = useMemo(() => PRODUCTS.filter(p => (categoryFilter === 'all' || p.category === categoryFilter) && p.name.toLowerCase().includes(search.toLowerCase())), [categoryFilter, search]);
  const subTotal = useMemo(() => items.reduce((s,i) => s + (i.quantity * i.unitPrice || 0), 0), [items]);
  const grandTotal = subTotal; // später ggf. Vertrags-Abzüge
  const validItems = useMemo(() => items.filter(i => i.name.trim() && i.quantity > 0 && i.unitPrice > 0), [items]);
  const totalUnits = useMemo(() => validItems.reduce((s,i)=>s+i.quantity,0), [validItems]);
  function removeItem(id: string) { setItems(prev => prev.length === 1 ? prev : prev.filter(i => i.id !== id)); }
  function resetForm() { if (items.some(i => i.name || i.unitPrice>0 || i.quantity>1) || description.trim()) { if(!confirm('Entwurf wirklich zurücksetzen?')) return; } setItems([{ id: randomId(), name: '', quantity: 1, unitPrice: 0 }]); setDescription(''); }

  async function submitInvoice() {
    setSending(true); setError(null); setSuccess(null); setContractError(null);
    const payload: any = { items: validItems.map(i => ({ name: i.name.trim(), quantity: i.quantity, unitPrice: i.unitPrice })) };
    if (selectedContractId) payload.contractId = selectedContractId;
    if (description.trim()) payload.description = description.trim();
    if (!payload.items.length) { setError('Bitte mindestens einen gültigen Posten ausfüllen.'); setSending(false); return; }
  if (selectedContractId) {
      const contract = contracts.find(c => c.id === selectedContractId);
      if (contract && contract.capitalRemaining < grandTotal) {
        setContractError(`Vertrag Kapital zu niedrig (${contract.capitalRemaining.toFixed(2)} $ < ${grandTotal.toFixed(2)} $)`);
        setSending(false); return;
      }
    }
    try {
  const res = await fetch(`${API_BASE}/api/invoices`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!res.ok) { let txt = await res.text(); try { const j = JSON.parse(txt); if (j.error) txt = j.error; } catch {}; throw new Error('Fehler: ' + txt); }
      const created = await res.json();
      setSuccess('Rechnung erstellt: ' + created.invoiceNumber);
      if (selectedContractId) loadContracts();
  resetForm();
  setSelectedContractId(''); setContractLocked(false);
    } catch (e:any) { setError(e.message); } finally { setSending(false); }
  }

  return (
    <div className="ff-area-wrapper">
      <h2 className="ff-section-title">Mitarbeiterbereich</h2>
      <div className='ff-tabs'>
        <button className={`ff-tab ${activeTab==='rechner' ? 'ff-tab-active':''}`} onClick={() => setActiveTab('rechner')}>Rechner</button>
        <button className={`ff-tab ${activeTab==='meine-rechnungen' ? 'ff-tab-active':''}`} onClick={() => setActiveTab('meine-rechnungen')}>Meine Rechnungen</button>
        <button className={`ff-tab ${activeTab==='vertraege' ? 'ff-tab-active':''}`} onClick={() => setActiveTab('vertraege')}>Verträge<span className='ff-tab-badge'>BETA</span></button>
      </div>
      {activeTab === 'rechner' && (
      <div className="ff-card">
        <div className="ff-card-header">
          <h3 className="ff-card-title">Rechnung erstellen</h3>
          <span className="ff-faded">Interne Erfassung</span>
        </div>
        <div className="ff-stack">
          {selectedContractId && (() => { const c = contracts.find(x=>x.id===selectedContractId); if(!c) return null; const after = c.capitalRemaining - grandTotal; const insufficient = after < 0; return (
            <div className='ff-card' style={{ background:'#281d13', border:'1px solid #4a3524', padding:'.6rem .7rem', display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
              <div style={{ fontSize:'.6rem' }}>
                <strong style={{ fontSize:'.65rem' }}>Vertrag:</strong><br/>{c.title}
              </div>
              <div style={{ fontSize:'.55rem' }}>
                Kapital: {c.capitalRemaining.toFixed(2)} / {c.capitalTotal.toFixed(2)} $
              </div>
              <div style={{ fontSize:'.55rem' }}>
                Abzug: {grandTotal.toFixed(2)} $
              </div>
              <div style={{ fontSize:'.55rem', color: insufficient ? '#f88' : '#8fd68f' }}>
                Danach: {after.toFixed(2)} $
              </div>
              <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                <button type='button' className='ff-mini-btn' onClick={()=>{ setContractLocked(false); setSelectedContractId(''); }}>Vertrag entfernen</button>
              </div>
              {insufficient && <div style={{ flexBasis:'100%', fontSize:'.55rem', color:'#f88' }}>Nicht genug Kapital – Positionen reduzieren oder anderen Vertrag wählen.</div>}
            </div>
          ); })()}
          <div className='ff-flex-row ff-gap' style={{ flexWrap:'wrap' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <span className='ff-slim-label'>Kategorie</span>
              <select className='ff-input-sm' value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)}>
                <option value='all'>Alle</option>
                {PRODUCT_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <span className='ff-slim-label'>Suche</span>
              <input className='ff-input-sm' placeholder='Produkt suchen...' value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <span className='ff-slim-label'>Positionen</span>
              <div className='ff-faded'>{validItems.length} / {items.length}</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <span className='ff-slim-label'>Anzahl</span>
              <div className='ff-faded'>{totalUnits}</div>
            </div>
            <div style={{ marginLeft:'auto', display:'flex', flexDirection:'column', gap:4 }}>
              <span className='ff-slim-label'>Zwischensumme</span>
              <div className='ff-faded'>{subTotal.toFixed(2)} $</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <span className='ff-slim-label'>Summe</span>
              <div style={{ fontSize:'.8rem', fontWeight:600 }}>{grandTotal.toFixed(2)} $</div>
            </div>
          </div>
          <div className='ff-divider' />
          <div className='ff-flex-row ff-gap' style={{ marginBottom: '.8rem' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <span className='ff-slim-label'>Bezeichnung / Name</span>
              <input 
                className='ff-input-sm' 
                placeholder='z.B. "Büroausstattung Q1" oder "Kunde Meyer"' 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                style={{ width: '300px' }}
              />
            </div>
          </div>
          <div style={{ display:'grid', gap:'.6rem', gridTemplateColumns:'280px 1fr' }}>
            <div style={{ maxHeight:260, overflowY:'auto', border:'1px solid #3a2a1b', borderRadius:10, padding:'.5rem .6rem', background:'#2d2013' }}>
              <div style={{ fontSize:'.55rem', textTransform:'uppercase', letterSpacing:'.5px', opacity:.6, marginBottom:4 }}>Produkte</div>
              <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:4 }}>
                {filteredProducts.map(p => (
                  <li key={p.id}>
                    <button
                      type='button'
                      onClick={() => {
                        setItems(prev => {
                          const existing = prev.find(it => it.productId === p.id);
                          if (existing) { return prev.map(it => it.productId === p.id ? { ...it, quantity: it.quantity + 1 } : it); }
                          return [...prev, { id: randomId(), productId: p.id, name: p.name, quantity:1, unitPrice: p.price }];
                        });
                      }}
                      className='ff-mini-btn'
                      style={{ width:'100%', justifyContent:'space-between', display:'flex' }}>
                      <span style={{ textAlign:'left' }}>{p.name}</span>
                      <span style={{ opacity:.7 }}>{p.price} $</span>
                    </button>
                  </li>
                ))}
                {filteredProducts.length === 0 && <li style={{ fontSize:'.6rem', opacity:.6 }}>Keine Treffer…</li>}
              </ul>
            </div>
            <div className='ff-stack'>
              <div className='ff-grid-head'>
                <span className='ff-col-label'>Artikel</span>
                <span className='ff-col-label'>Menge</span>
                <span className='ff-col-label'>Einzelpreis</span>
                <span className='ff-col-label'>Summe</span>
                <span className='ff-col-label' />
              </div>
              {items.map(it => {
                const lineTotal = (it.quantity * it.unitPrice) || 0;
                return (
                  <div key={it.id} className='ff-grid-line ff-grid-line-wide'>
                    <input className='ff-input-sm' placeholder='Bezeichnung' value={it.name} onChange={e => updateItem(it.id, { name: e.target.value })} />
                    <div className='ff-qty-box'>
                      <button type='button' className='ff-mini-btn' onClick={() => updateItem(it.id, { quantity: Math.max(1, it.quantity - 1) })}>-</button>
                      <input className='ff-input-sm ff-qty-input' type='number' min={1} value={it.quantity} onChange={e => updateItem(it.id, { quantity: parseInt(e.target.value)||1 })} />
                      <button type='button' className='ff-mini-btn' onClick={() => updateItem(it.id, { quantity: it.quantity + 1 })}>+</button>
                    </div>
                    <input className='ff-input-sm' type='number' min={0} step={0.01} value={it.unitPrice} onChange={e => updateItem(it.id, { unitPrice: parseFloat(e.target.value)||0 })} />
                    <div className='ff-line-total'>{lineTotal.toFixed(2)} $</div>
                    <button onClick={() => removeItem(it.id)} disabled={items.length===1} className='ff-mini-btn'>✕</button>
                  </div>
                );
              })}
              <div className='ff-flex-row ff-gap'>
                <button onClick={addItem} className='ff-btn'>Leer+</button>
                <button onClick={submitInvoice} disabled={sending || !validItems.length || (selectedContractId ? (contracts.find(c=>c.id===selectedContractId)?.capitalRemaining < grandTotal) : false)} className='ff-btn ff-btn-primary'>{sending ? 'Sende…' : 'Rechnung speichern'}</button>
                <button onClick={resetForm} className='ff-btn'>Reset</button>
                {!selectedContractId && <button type='button' className='ff-btn' onClick={()=> setActiveTab('vertraege')}>Vertrag auswählen…</button>}
              </div>
              {!validItems.length && <div className='ff-feedback-error'>Keine gültigen Positionen – bitte Artikel hinzufügen.</div>}
              {contractError && <div className='ff-feedback-error'>{contractError}</div>}
              {error && <div className='ff-feedback-error'>{error}</div>}
              {success && <div className='ff-feedback-ok'>{success}</div>}
            </div>
          </div>
        </div>
      </div>
      )}
      {activeTab === 'vertraege' && (
        <div className='ff-card'>
          <div className='ff-card-header'>
            <h3 className='ff-card-title'>Meine Verträge</h3>
            <button onClick={loadContracts} className='ff-mini-btn'>Neu laden</button>
          </div>
          <div className='ff-table-wrap'>
            <table className='ff-table'>
              <thead><tr><th></th><th>Titel</th><th>Kapital</th><th>Rest</th><th>Intervall</th></tr></thead>
              <tbody>
                {loadingContracts && <tr><td colSpan={5}><div className='ff-skeleton' style={{ height:14 }} /></td></tr>}
                {!loadingContracts && contracts.map(c => {
                  const active = c.id === selectedContractId;
                  return (
                    <tr key={c.id} className={active ? 'ff-row-animate':''}>
                      <td><input type='radio' name='contractSel' disabled={contractLocked && !active} checked={active} onChange={()=>{ if (contractLocked && active) return; setSelectedContractId(c.id); setContractLocked(true); }} /></td>
                      <td>{c.title}</td>
                      <td>{c.capitalTotal?.toFixed(2) ?? '0.00'} $</td>
                      <td style={{ color: c.capitalRemaining < grandTotal ? '#f88':'inherit' }}>{c.capitalRemaining?.toFixed(2) ?? '0.00'} $</td>
                      <td>{c.intervalUnit}</td>
                    </tr>
                  );
                })}
                {!loadingContracts && contracts.length===0 && <tr><td colSpan={5}><span className='ff-faded'>Keine Verträge</span></td></tr>}
              </tbody>
            </table>
          </div>
          {selectedContractId && <div style={{ fontSize:'.55rem', marginTop:6, opacity:.7 }}>Beim Speichern wird das Kapital des ausgewählten Vertrags belastet.</div>}
        </div>
      )}
      {activeTab === 'meine-rechnungen' && <MyInvoices token={token} />}
    </div>
  );
}

// Inline style helpers removed in favor of CSS classes
