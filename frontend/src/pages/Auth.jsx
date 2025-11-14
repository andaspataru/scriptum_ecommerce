import React, { useState } from 'react';
import { useStore } from '../store';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

export default function Auth({ setPage }) { 
  const user = useStore((s) => s.user);
  const [tab, setTab] = useState('login');

  const goHome = () => (typeof setPage === 'function'
    ? setPage('home')
    : localStorage.setItem('page', 'home'));

  return (
    <div className="auth-page">
      <div className="auth-inner">
    <div className="container" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div className="section" style={{ width: 'min(720px, 100%)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ textAlign: 'center', margin: '40px auto 30px' }}>
          <h2 style={{ margin: 0 }}>Bine ai venit la Scriptum</h2>
          <div className="small" style={{ color: 'var(--muted)', marginTop:'6px' }}>
    {user
      ? 'Ești autentificat – poți gestiona contul și comenzile.'
      : 'Autentifică-te sau creează-ți un cont nou.'}
  </div>
</div>

        </div>

        {tab === 'login' ? (
          <LoginForm
            onSwitchToRegister={() => setTab('register')}
            onSuccess={goHome}             
          />
        ) : (
          <RegisterForm
            onSwitchToLogin={() => setTab('login')}
            onRegisteredSuccess={goHome}
          />
        )}
      </div>
    </div>
    </div>
    </div>
  );
}
