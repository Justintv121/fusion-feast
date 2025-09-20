import React, { useEffect, useState, useMemo } from 'react';
import { API_BASE } from '../config';
import { PRODUCTS } from '../data/products';

interface InvoiceItem {
  id?: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: 'open' | 'done' | 'canceled';
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  contractId?: string;
  employeeUserId: string;
  description?: string;
}

interface EditingInvoice {
  id: string;
  items: InvoiceItem[];
}

export function MyInvoices({ token }: { token: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done' | 'canceled'>('all');
  const [editingInvoice, setEditingInvoice] = useState<EditingInvoice | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    return invoices.filter(inv => inv.status === statusFilter);
  }, [invoices, statusFilter]);

  const editingTotal = useMemo(() => {
    if (!editingInvoice) return 0;
    return editingInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [editingInvoice]);

  async function loadInvoices() {
    setLoading(true);
    setError(null);
    try {
      // First get the basic invoice list
      const res = await fetch(`${API_BASE}/api/invoices/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Laden der Rechnungen fehlgeschlagen');
      const basicData = await res.json();
      
      // Now get detailed info for each invoice
      const detailedInvoices = await Promise.all(
        basicData.map(async (inv: any) => {
          try {
            const detailRes = await fetch(`${API_BASE}/api/invoices/${inv.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (detailRes.ok) {
              const fullInvoice = await detailRes.json();
              // Ensure items array exists
              if (!fullInvoice.items) {
                fullInvoice.items = [];
              }
              return fullInvoice;
            }
            // Fallback: create items array if not exists
            return { ...inv, items: [] };
          } catch {
            return { ...inv, items: [] };
          }
        })
      );
      
      setInvoices(detailedInvoices);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function updateInvoiceStatus(invoiceId: string, newStatus: 'done' | 'canceled') {
    try {
      const res = await fetch(`${API_BASE}/api/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        await loadInvoices();
        setSuccess(`Rechnung als ${newStatus === 'done' ? 'erledigt' : 'abgebrochen'} markiert`);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  function startEditingInvoice(invoice: Invoice) {
    if (invoice.status !== 'open') {
      setError('Nur offene Rechnungen können bearbeitet werden');
      return;
    }
    
    // Ensure we have at least one empty item to edit
    const itemsToEdit = invoice.items && invoice.items.length > 0 
      ? [...invoice.items] 
      : [{ name: '', quantity: 1, unitPrice: 0 }];
    
    setEditingInvoice({
      id: invoice.id,
      items: itemsToEdit
    });
    setError(null);
    setSuccess(null);
  }

  function updateEditingItem(index: number, field: keyof InvoiceItem, value: any) {
    if (!editingInvoice) return;
    
    const newItems = [...editingInvoice.items];
    let processedValue = value;
    
    // Ensure numbers are properly typed
    if (field === 'quantity') {
      processedValue = parseInt(value) || 1;
    } else if (field === 'unitPrice') {
      processedValue = parseFloat(value) || 0;
    }
    
    newItems[index] = { ...newItems[index], [field]: processedValue };
    
    setEditingInvoice({
      ...editingInvoice,
      items: newItems
    });
  }

  function addEditingItem() {
    if (!editingInvoice) return;
    
    setEditingInvoice({
      ...editingInvoice,
      items: [...editingInvoice.items, { name: '', quantity: 1, unitPrice: 0 }]
    });
  }

  function removeEditingItem(index: number) {
    if (!editingInvoice) return;
    
    const newItems = editingInvoice.items.filter((_, i) => i !== index);
    if (newItems.length === 0) {
      newItems.push({ name: '', quantity: 1, unitPrice: 0 });
    }
    
    setEditingInvoice({
      ...editingInvoice,
      items: newItems
    });
  }

  function selectProductForEditing(index: number, productId: string) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product || !editingInvoice) return;
    
    const newItems = [...editingInvoice.items];
    newItems[index] = { 
      ...newItems[index], 
      name: product.name,
      unitPrice: product.price 
    };
    
    setEditingInvoice({
      ...editingInvoice,
      items: newItems
    });
  }

  async function saveEditingInvoice() {
    if (!editingInvoice) return;
    
    const validItems = editingInvoice.items.filter(item => 
      item.name.trim() && item.quantity > 0 && item.unitPrice > 0
    ).map(item => ({
      name: item.name.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));
    
    if (validItems.length === 0) {
      setError('Bitte mindestens einen gültigen Artikel hinzufügen');
      return;
    }
    
    setSaveLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/invoices/${editingInvoice.id}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(validItems)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = 'Speichern fehlgeschlagen';
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      await loadInvoices();
      setEditingInvoice(null);
      setSuccess('Rechnung erfolgreich aktualisiert');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaveLoading(false);
    }
  }

  function cancelEditing() {
    setEditingInvoice(null);
    setError(null);
    setSuccess(null);
  }

  if (editingInvoice) {
    const originalInvoice = invoices.find(inv => inv.id === editingInvoice.id);
    
    return (
      <div className="ff-area-wrapper">
        <div className="ff-card">
          <div className="ff-card-header">
            <h3 className="ff-card-title">
              Rechnung bearbeiten: {originalInvoice?.invoiceNumber}
            </h3>
            <div className="ff-flex-row ff-gap">
              <button onClick={cancelEditing} className="ff-mini-btn">
                Abbrechen
              </button>
              <button 
                onClick={saveEditingInvoice} 
                disabled={saveLoading}
                className="ff-btn ff-btn-primary"
              >
                {saveLoading ? 'Speichere...' : 'Speichern'}
              </button>
            </div>
          </div>
          
          <div className="ff-stack">
            <div className="ff-flex-row ff-gap" style={{ flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="ff-slim-label">Artikel</span>
                <div className="ff-faded">{editingInvoice.items.length}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="ff-slim-label">Gesamtsumme</span>
                <div style={{ fontSize: '.8rem', fontWeight: 600 }}>
                  {editingTotal.toFixed(2)} $
                </div>
              </div>
            </div>
            
            <div className="ff-divider" />
            
            <div className="ff-grid-head">
              <span className="ff-col-label">Artikel</span>
              <span className="ff-col-label">Menge</span>
              <span className="ff-col-label">Einzelpreis</span>
              <span className="ff-col-label">Summe</span>
              <span className="ff-col-label"></span>
            </div>
            
            {editingInvoice.items.map((item, index) => {
              const lineTotal = (item.quantity * item.unitPrice) || 0;
              return (
                <div key={index} className="ff-grid-line ff-grid-line-wide">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input 
                      className="ff-input-sm" 
                      placeholder="Bezeichnung" 
                      value={item.name} 
                      onChange={e => updateEditingItem(index, 'name', e.target.value)} 
                    />
                    <select 
                      className="ff-input-sm" 
                      value="" 
                      onChange={e => e.target.value && selectProductForEditing(index, e.target.value)}
                    >
                      <option value="">Produkt auswählen...</option>
                      {PRODUCTS.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.price}$)</option>
                      ))}
                    </select>
                  </div>
                  <div className="ff-qty-box">
                    <button 
                      type="button" 
                      className="ff-mini-btn" 
                      onClick={() => updateEditingItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                    >
                      -
                    </button>
                    <input 
                      className="ff-input-sm ff-qty-input" 
                      type="number" 
                      min={1} 
                      value={item.quantity} 
                      onChange={e => updateEditingItem(index, 'quantity', parseInt(e.target.value) || 1)} 
                    />
                    <button 
                      type="button" 
                      className="ff-mini-btn" 
                      onClick={() => updateEditingItem(index, 'quantity', item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <input 
                    className="ff-input-sm" 
                    type="number" 
                    min={0} 
                    step={0.01} 
                    value={item.unitPrice} 
                    onChange={e => updateEditingItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} 
                  />
                  <div className="ff-line-total">{lineTotal.toFixed(2)} $</div>
                  <button 
                    onClick={() => removeEditingItem(index)} 
                    disabled={editingInvoice.items.length === 1} 
                    className="ff-mini-btn"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            
            <div className="ff-flex-row ff-gap">
              <button onClick={addEditingItem} className="ff-btn">
                Artikel hinzufügen
              </button>
            </div>
            
            {error && <div className="ff-feedback-error">{error}</div>}
            {success && <div className="ff-feedback-ok">{success}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-area-wrapper">
      <div className="ff-card">
        <div className="ff-card-header">
          <h3 className="ff-card-title">Meine Rechnungen</h3>
          <div className="ff-flex-row ff-gap">
            <select 
              className="ff-input-sm" 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Alle Status</option>
              <option value="open">Offen</option>
              <option value="done">Erledigt</option>
              <option value="canceled">Abgebrochen</option>
            </select>
            <button onClick={loadInvoices} className="ff-mini-btn">
              Neu laden
            </button>
          </div>
        </div>

        {loading && (
          <div className="ff-skeleton" style={{ height: 200, margin: '1rem 0' }} />
        )}

        {!loading && (
          <div className="ff-table-wrap">
            <table className="ff-table">
              <thead>
                <tr>
                  <th>Nr.</th>
                  <th>Bezeichnung</th>
                  <th>Datum</th>
                  <th>Artikel</th>
                  <th>Summe</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => {
                  const badgeClass = 
                    invoice.status === 'done' ? 'ff-status-badge ff-status-done' : 
                    invoice.status === 'canceled' ? 'ff-status-badge ff-status-canceled' : 
                    'ff-status-badge ff-status-open';

                  return (
                    <tr key={invoice.id} className="ff-row-animate">
                      <td>{invoice.invoiceNumber}</td>
                      <td>
                        <div style={{ fontSize: '.75rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {invoice.description || <span className="ff-faded">—</span>}
                        </div>
                      </td>
                      <td>{new Date(invoice.createdAt).toLocaleString()}</td>
                      <td>
                        <div style={{ fontSize: '.7rem' }}>
                          {invoice.items.slice(0, 2).map((item, i) => (
                            <div key={i}>
                              {item.quantity}x {item.name} ({item.unitPrice}$)
                            </div>
                          ))}
                          {invoice.items.length > 2 && (
                            <div className="ff-faded">...und {invoice.items.length - 2} weitere</div>
                          )}
                        </div>
                      </td>
                      <td>{invoice.total.toFixed(2)} $</td>
                      <td>
                        <span className={badgeClass}>{invoice.status}</span>
                      </td>
                      <td>
                        <div className="ff-flex-row ff-gap">
                          {invoice.status === 'open' && (
                            <>
                              <button
                                onClick={() => startEditingInvoice(invoice)}
                                className="ff-mini-btn"
                                title="Bearbeiten"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, 'done')}
                                className="ff-status-btn ff-ok"
                                title="Fertig"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, 'canceled')}
                                className="ff-status-btn ff-cancel"
                                title="Abbrechen"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <span className="ff-faded">
                        {statusFilter === 'all' 
                          ? 'Keine Rechnungen vorhanden.' 
                          : `Keine Rechnungen mit Status "${statusFilter}" vorhanden.`}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {error && <div className="ff-feedback-error">{error}</div>}
        {success && <div className="ff-feedback-ok">{success}</div>}
      </div>
    </div>
  );
}