import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import React from 'react';
import ProductGalleryModal from './ProductGalleryModal';

const API_URL = 'http://localhost:4000';

function toPublicUrl(u) {
  if (!u) return '';
  let p = String(u).trim();

  if (/^https?:\/\//i.test(p)) {
    return p
      .replace('/public/public/', '/')
      .replace('/public/images/', '/images/')
      .replace('/public/', '/');
  }

  p = p.replace(/^\/+/, '');
  p = p.replace(/^public\/public\//i, '');
  p = p.replace(/^public\//i, '');

  if (!/^images\//i.test(p)) {
    p = `images/${p}`;
  }

  return `${API_URL}/${p}`;
}

export default function ProductList({ setPage }) {
  const { products, loadProducts, addToCart, user } = useStore((s) => ({
    products: s.products,
    loadProducts: s.loadProducts,
    addToCart: s.addToCart,
    user: s.user,
  }));

  const canBuy = !!user && user.role === 'customer';
  const isAdmin = user?.role === 'admin';

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryProductId, setGalleryProductId] = useState(null);
  const [galleryTitle, setGalleryTitle] = useState('');

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadProducts();
  }, [loadProducts]);

  async function deleteProduct(id) {
    if (!confirm('Ștergi produsul? Operațiunea este ireversibilă.')) return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('r_token')}` },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return alert(data?.error || 'Eroare la ștergere');
    await loadProducts();
    alert('Produs șters.');
  }

  function goEdit(id) {
    localStorage.setItem('admin_edit_id', String(id));
    if (typeof setPage === 'function') setPage('admin.edit');
  }

  const total = products.length;

  return (
    <>
      <div className="books-layout">
        {/* bara de sus a listei */}
        <div className="books-toolbar">
          <div>
            <h2 className="books-heading">Toate titlurile</h2>
            <p className="books-subheading">
              {total === 0
                ? 'Nu există încă titluri active în catalog.'
                : `${total} titlu${total === 1 ? '' : 'ri'} disponibile în acest moment.`}
            </p>
          </div>

          <div className="books-toolbar-actions">
            {isAdmin && (
              <button
                className="btn secondary"
                type="button"
                onClick={() => setPage && setPage('admin.add')}
              >
                Adaugă titlu nou
              </button>
            )}
          </div>
        </div>

        {/* fiecare carte = un dreptunghi mic */}
        <div className="books-grid">
          {products.map((p) => (
            <article key={p.id} className="book-tile">
              <div className="book-tile-cover-wrap">
                {p.imageUrl ? (
                  <img
                    className="book-tile-cover"
                    src={toPublicUrl(p.imageUrl)}
                    alt={`Copertă: ${p.title}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="book-tile-cover placeholder">
                    Fără copertă
                  </div>
                )}
              </div>

              <div className="book-tile-body">
                <div className="book-tile-meta">
                  <div>
                    <h3 className="book-tile-title">{p.title}</h3>
                    {p.category?.name && (
                      <div className="book-tile-category">
                        {p.category.name}
                      </div>
                    )}
                  </div>
                  <div className="book-tile-price">
                    {Number(p.price).toFixed(2)} RON
                  </div>
                </div>

                {p.description && (
                  <p className="book-tile-description">
                    {p.description}
                  </p>
                )}

                <div className="book-tile-footer">
                  <div className="book-tile-actions-main">
                    {canBuy && (
                      <button
                        className="btn"
                        type="button"
                        onClick={() => addToCart(p.id, 1)}
                      >
                        Adaugă în coș
                      </button>
                    )}
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() => {
                        setGalleryProductId(p.id);
                        setGalleryTitle(p.title);
                        setGalleryOpen(true);
                      }}
                    >
                      Detalii
                    </button>
                  </div>

                  {isAdmin && (
                    <div className="book-tile-actions-admin">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => goEdit(p.id)}
                      >
                        Editează
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => deleteProduct(p.id)}
                      >
                        Șterge
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <ProductGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        productId={galleryProductId}
        title={galleryTitle}
      />
    </>
  );
}
