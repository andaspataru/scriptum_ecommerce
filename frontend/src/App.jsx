import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import Home from './pages/Home';
import Products from './pages/Products';
import EditProduct from './pages/EditProduct';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import AddProduct from './pages/AddProduct';
import Orders from './pages/Orders';
import './styles/theme.css';


export default function App() {
  const [page, setPageState] = useState(() => localStorage.getItem('page') || 'home');

  // luăm tot store-ul ca să avem acces la orice structură de coș ai acolo
  const store = useStore((s) => s);
  const { user, logout, fetchMe, authReady } = store;

  // ───────── calcul robust al numărului de articole din coș
  let cartCount = 0;

  if (typeof store.cartCount === 'number') {
    // dacă ai deja un cartCount în store, îl folosim direct
    cartCount = store.cartCount;
  } else {
    let cartArray = null;

    // încercăm câteva variante uzuale
    if (Array.isArray(store.cart)) cartArray = store.cart;
    if (!cartArray && Array.isArray(store.cartItems)) cartArray = store.cartItems;
    if (!cartArray && store.cart && Array.isArray(store.cart.items)) cartArray = store.cart.items;
    if (!cartArray && Array.isArray(store.itemsInCart)) cartArray = store.itemsInCart;

    if (Array.isArray(cartArray)) {
      cartCount = cartArray.reduce((sum, item) => {
        if (!item) return sum;
        if (typeof item === 'number') return sum + item;
        if (typeof item.quantity === 'number') return sum + item.quantity;
        if (typeof item.qty === 'number') return sum + item.qty;
        return sum + 1;
      }, 0);
    }
  }

  const setPage = (p) => {
    setPageState(p);
    localStorage.setItem('page', p);
  };

  useEffect(() => {
    fetchMe?.();
  }, [fetchMe]);

  if (!authReady) {
    return (
      <div className="container">
        <header className="app-header">
          <div className="brand">
            <div className="brand-badge">S</div>
            <div>
              <div className="brand-title">Librăria Scriptum</div>
              <div className="brand-subtitle">se încarcă…</div>
            </div>
          </div>
          <div className="header-right">
            <span className="tag">…</span>
          </div>
        </header>
        <div className="section">Se încarcă…</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="app-header">
        <div
          className="brand"
          onClick={() => setPage('home')}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-badge">S</div>
          <div>
            <div className="brand-title">Librăria Scriptum</div>
            <div className="brand-subtitle">Cărți, cafele &amp; idei bune</div>
          </div>
        </div>

        <nav className="nav" role="tablist" aria-label="Navigare">
          <button
            className="tab"
            aria-current={page === 'home' ? 'page' : undefined}
            onClick={() => setPage('home')}
          >
            Acasă
          </button>

          <button
            className="tab"
            aria-current={page === 'products' ? 'page' : undefined}
            onClick={() => setPage('products')}
          >
            Cărți
          </button>

          {user?.role === 'customer' && (
            <button
              className="tab tab-cart"
              aria-current={page === 'cart' ? 'page' : undefined}
              onClick={() => setPage('cart')}
            >
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              <span>
                Coș de lectură
              </span>
            </button>
          )}

          {user?.role === 'customer' && (
            <button
              className="tab"
              aria-current={page === 'profile' ? 'page' : undefined}
              onClick={() => setPage('profile')}
            >
              Profil
            </button>
          )}

          {user?.role === 'admin' && (
            <>
              <button
                className="tab"
                aria-current={page === 'admin.add' ? 'page' : undefined}
                onClick={() => setPage('admin.add')}
                title="Adaugă titlu nou"
              >
                Admin cărți
              </button>
              <button
                className="tab"
                aria-current={page === 'admin.orders' ? 'page' : undefined}
                onClick={() => setPage('admin.orders')}
                title="Vezi comenzile"
              >
                Comenzi
              </button>
            </>
          )}

        </nav>

        <div className="header-right">
          {user ? (
            <>
              <span className="tag">
                {user.name} · {user.role === 'admin' ? 'administrator' : 'cititor'}
              </span>
              <button
                className="btn ghost"
                onClick={() => {
                  logout();
                  setPage('home');
                }}
              >
                Ieșire
              </button>
            </>
          ) : (
            <button className="btn secondary" onClick={() => setPage('auth')}>
              Intră în cont / Înregistrează-te
            </button>
          )}
        </div>
      </header>

      <div className="section">
        {page === 'home' && <Home />}
        {page === 'products' && <Products setPage={setPage} />}
        {page === 'cart' && <Cart setPage={setPage} />}
        {page === 'profile' && <Profile setPage={setPage} />}
        {page === 'auth' && <Auth setPage={setPage} />}
        {page === 'admin.add' && <AddProduct setPage={setPage} />}
        {page === 'admin.edit' && <EditProduct setPage={setPage} />}
        {page === 'admin.orders' && <Orders />}

      </div>
    </div>
  );
}
