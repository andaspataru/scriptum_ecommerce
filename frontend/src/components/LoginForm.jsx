import React, { useState } from 'react';
import { useStore } from '../store';

export default function LoginForm({ onSwitchToRegister, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const login = useStore((s) => s.login);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      if (onSuccess) onSuccess(); 
    } catch (e) {
      setErr(e.message || 'Autentificare eșuată');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center' }}>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10, width: '100%', maxWidth: 420 }}>
        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
        />
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Parolă"
          required
        />
        <button className="btn" disabled={loading}>
          {loading ? 'Se conectează…' : 'Autentificare'}
        </button>
        {err && <small style={{ color: 'var(--danger)' }}>{err}</small>}
      </form>

      <div className="small" style={{ marginTop: 10, color: 'var(--muted)' }}>
        Nu ai cont?
        {' '}
        <button type="button" className="btn ghost" style={{ padding: '6px 10px', marginLeft: 6 }} onClick={onSwitchToRegister}>
          Creează unul
        </button>
      </div>
    </div>
  );
}
