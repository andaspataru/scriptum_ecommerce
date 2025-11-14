import React, { useEffect, useState } from 'react';
import { getToken } from '../api';
import { useStore } from '../store';

export default function Orders() {
  const user = useStore((s) => s.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const token = getToken();
        const res = await fetch('/api/orders', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || 'Eroare la încărcarea comenzilor');
        }
        const data = await res.json().catch(() => []);
        if (!cancelled) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Eroare neașteptată');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || user.role !== 'admin') {
    return <div>Nu ai acces la această pagină.</div>;
  }

  return (
    <div className="orders-page">
      <header className="orders-header">
        <div>
          <p className="admin-kicker">Panou administrator</p>
          <h1 className="admin-title">Comenzi</h1>
          <p className="admin-subtitle">
            Vezi toate comenzile plasate de clienți. Lista este doar pentru vizualizare
            (deocamdată).
          </p>
        </div>
      </header>

      {loading && <div className="orders-info">Se încarcă comenzile…</div>}
      {err && <div className="orders-info orders-error">{err}</div>}

      {!loading && !err && (
        <>
          {orders.length === 0 ? (
            <div className="orders-info">Nu există comenzi înregistrate.</div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Articole</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const items = Array.isArray(o.items || o.orderItems)
                      ? o.items || o.orderItems
                      : [];

                    const total =
                      typeof o.total === 'number'
                        ? o.total
                        : items.reduce((s, it) => {
                            const p = Number(it.price || it.productPrice || 0);
                            const q = Number(it.quantity || it.qty || 1);
                            return s + p * q;
                          }, 0);

                    const customerName =
                      o.user?.name ||
                      o.customerName ||
                      o.customer?.name ||
                      '—';

                    const customerEmail =
                      o.user?.email ||
                      o.customerEmail ||
                      o.customer?.email ||
                      '—';

                    const status = o.status || 'înregistrată';

                    const created =
                      o.createdAt ||
                      o.date ||
                      o.created_at ||
                      null;

                    const createdText = created
                      ? new Date(created).toLocaleString('ro-RO')
                      : '—';

                    return (
                      <tr key={o.id}>
                        <td>{o.id}</td>
                        <td>{customerName}</td>
                        <td>{customerEmail}</td>
                        <td>{total.toFixed(2)} RON</td>
                        <td>{status}</td>
                        <td>{createdText}</td>
                        <td>
                          {items.length
                            ? `${items.length} produs(e)`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
