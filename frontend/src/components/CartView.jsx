import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { api } from '../api';

/* ───────── Modal de checkout ───────── */

function CheckoutModal({ open = false, onClose, cartTotal = 0, onOrderPlaced }) {
  const { user, cart } = useStore();

  const [useAccountPersonal, setUseAccountPersonal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [useAccountAddress, setUseAccountAddress] = useState(false);
  const [judet, setJudet] = useState('');
  const [localitate, setLocalitate] = useState('');
  const [strada, setStrada] = useState('');
  const [numar, setNumar] = useState('');
  const [bloc, setBloc] = useState('');
  const [scara, setScara] = useState('');
  const [etaj, setEtaj] = useState('');
  const [apartament, setApartament] = useState('');
  const [codPostal, setCodPostal] = useState('');

  const [payment, setPayment] = useState('ramburs');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : NaN);
  const items = Array.isArray(cart?.items) ? cart.items : [];
  const isValidItem = (it) => it?.product && Number.isFinite(num(it.product?.price));
  const validItems = items.filter(isValidItem);
  const hasBroken = items.some((it) => !isValidItem(it));
  const canSubmit = !hasBroken && Number.isFinite(num(cartTotal)) && cartTotal > 0;

  const fillPersonalFromAccount = () => {
    if (!user) return;
    setFullName((user.name || '').trim());
    setEmail((user.email || '').trim().toLowerCase());
    setPhone((user.phoneNumber || '').trim());
  };
  const clearPersonal = () => {
    setFullName('');
    setEmail('');
    setPhone('');
  };
  const fillAddressFromAccount = () => {
    if (!user) return;
    setJudet(user.judet || '');
    setLocalitate(user.localitate || '');
    setStrada(user.strada || '');
    setNumar(user.numar || '');
    setBloc(user.bloc || '');
    setScara(user.scara || '');
    setEtaj(user.etaj || '');
    setApartament(user.apartament || '');
    setCodPostal(user.codPostal || '');
  };
  const clearAddress = () => {
    setJudet('');
    setLocalitate('');
    setStrada('');
    setNumar('');
    setBloc('');
    setScara('');
    setEtaj('');
    setApartament('');
    setCodPostal('');
  };

  if (!open) return null;

  const handleCardNumber = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    const grouped = digits.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(grouped);
  };
  const handleCardName = (v) =>
    setCardName(v.replace(/[^a-zA-ZăâîșțĂÂÎȘȚ .\-']/g, '').toUpperCase());
  const handleCardExp = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    let mm = digits.slice(0, 2);
    const yy = digits.slice(2, 4);
    if (mm.length === 2) {
      let mmNum = Number(mm);
      if (mmNum === 0) mmNum = 1;
      if (mmNum > 12) mmNum = 12;
      mm = mmNum < 10 ? `0${mmNum}` : `${mmNum}`;
    }
    setCardExp(yy ? `${mm}/${yy}` : mm);
  };
  const handleCVV = (v) => setCardCvv(v.replace(/\D/g, '').slice(0, 3));
  const handlePhone = (v) => setPhone(v.replace(/[^\d+]/g, ''));
  const handlePostal = (v) => setCodPostal(v.replace(/\D/g, '').slice(0, 6));

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function isValidPhone(v) {
    const d = v.replace(/\D/g, '');
    return d.length >= 10 && d.length <= 15;
  }
  function isValidExp(mmYY) {
    if (!/^\d{2}\/\d{2}$/.test(mmYY)) return false;
    const [mmStr, yyStr] = mmYY.split('/');
    const mm = Number(mmStr);
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    const yNow = now.getFullYear() % 100;
    const mNow = now.getMonth() + 1;
    const yy = Number(yyStr);
    if (yy > yNow) return true;
    if (yy < yNow) return false;
    return mm >= mNow;
  }

  async function submitOrder(e) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    const nameTrim = fullName.trim();
    const emailTrim = email.trim().toLowerCase();
    if (!nameTrim) return setErr('Completează numele.');
    if (!emailTrim || !isValidEmail(emailTrim)) return setErr('Email invalid.');
    if (!isValidPhone(phone)) return setErr('Telefon invalid (10–15 cifre).');
    if (!judet || !localitate || !strada || !numar || !codPostal) {
      return setErr(
        'Completează adresa de livrare (județ, localitate, stradă, număr, cod poștal).'
      );
    }
    if (!/^\d{6}$/.test(codPostal)) return setErr('Cod poștal invalid (6 cifre).');

    if (payment === 'card') {
      const rawCard = cardNumber.replace(/\s|-/g, '');
      if (!/^\d{16}$/.test(rawCard)) return setErr('Număr card invalid (trebuie 16 cifre).');
      if (!cardName.trim()) return setErr('Titular card lipsă.');
      if (!/^\d{2}\/\d{2}$/.test(cardExp) || !isValidExp(cardExp)) {
        return setErr('Expirare card invalidă (MM/YY).');
      }
      if (!/^\d{3}$/.test(cardCvv)) return setErr('CVV invalid (3 cifre).');
    }

    if (hasBroken || !canSubmit) {
      return setErr(
        'Nu poți plasa comanda: coșul conține produse indisponibile sau totalul este 0.'
      );
    }

    try {
      setSubmitting(true);

      const payload = {
        customer: { name: nameTrim, email: emailTrim, phone },
        shippingAddress: {
          judet,
          localitate,
          strada,
          numar,
          bloc,
          scara,
          etaj,
          apartament,
          codPostal,
        },
        payment: {
          method: payment,
          ...(payment === 'card'
            ? { cardLast4: cardNumber.replace(/\s/g, '').slice(-4), holder: cardName }
            : {}),
        },
        items: validItems.map((it) => ({
          productId: it.product.id,
          title: it.product.title,
          price: num(it.product.price),
          quantity: Number.isFinite(Number(it.quantity)) ? Number(it.quantity) : 1,
        })),
        total: Number.isFinite(num(cartTotal)) ? num(cartTotal) : 0,
      };

      const res = await api('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const orderId = res?.id || res?.orderId || res?.data?.id;

      try {
        await api('/r_orders', {
          method: 'POST',
          body: JSON.stringify({
            orderId,
            createdAt: new Date().toISOString(),
            ...payload,
          }),
        });
      } catch (_) {
        /* ignore */
      }

      setOk('Comanda a fost plasată cu succes!');
      onOrderPlaced?.(orderId);
    } catch (e2) {
      setErr(e2?.message || 'Eroare la trimiterea comenzii.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="modal checkout-modal" onSubmit={submitOrder}>
        <div className="modal-head">
          <div>
            <h3 style={{ margin: 0 }}>Finalizare comandă</h3>
            <div className="small">
              Total comanda: <b>{Number(cartTotal ?? 0).toFixed(2)} RON</b>
            </div>
          </div>
          <button
            type="button"
            className="btn ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Închide
          </button>
        </div>

        <div className="modal-body checkout-body">
          {/* Date personale */}
          <section className="checkout-section">
            <header className="checkout-section-head">
              <h4>Date personale</h4>
              <label className="small">
                <input
                  type="checkbox"
                  checked={useAccountPersonal}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseAccountPersonal(checked);
                    if (checked) fillPersonalFromAccount();
                    else clearPersonal();
                  }}
                />{' '}
                Folosește datele din cont
              </label>
            </header>
            <div className="checkout-grid two">
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nume complet"
              />
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                placeholder="Email"
                inputMode="email"
              />
              <input
                className="input"
                value={phone}
                onChange={(e) => handlePhone(e.target.value)}
                placeholder="Telefon (+40…)"
                inputMode="tel"
              />
            </div>
          </section>

          {/* Adresă */}
          <section className="checkout-section">
            <header className="checkout-section-head">
              <h4>Adresă de livrare</h4>
              <label className="small">
                <input
                  type="checkbox"
                  checked={useAccountAddress}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseAccountAddress(checked);
                    if (checked) fillAddressFromAccount();
                    else clearAddress();
                  }}
                />{' '}
                Folosește adresa din cont
              </label>
            </header>
            <div className="checkout-grid two">
              <input
                className="input"
                value={judet}
                onChange={(e) => setJudet(e.target.value)}
                placeholder="Județ"
              />
              <input
                className="input"
                value={localitate}
                onChange={(e) => setLocalitate(e.target.value)}
                placeholder="Localitate"
              />
              <input
                className="input"
                value={strada}
                onChange={(e) => setStrada(e.target.value)}
                placeholder="Stradă"
              />
              <input
                className="input"
                value={numar}
                onChange={(e) => setNumar(e.target.value)}
                placeholder="Număr"
              />
              <input
                className="input"
                value={bloc}
                onChange={(e) => setBloc(e.target.value)}
                placeholder="Bloc (opțional)"
              />
              <input
                className="input"
                value={scara}
                onChange={(e) => setScara(e.target.value)}
                placeholder="Scara (opțional)"
              />
              <input
                className="input"
                value={etaj}
                onChange={(e) => setEtaj(e.target.value)}
                placeholder="Etaj (opțional)"
              />
              <input
                className="input"
                value={apartament}
                onChange={(e) => setApartament(e.target.value)}
                placeholder="Apartament (opțional)"
              />
              <input
                className="input"
                value={codPostal}
                onChange={(e) => handlePostal(e.target.value)}
                placeholder="Cod poștal (6 cifre)"
                inputMode="numeric"
                maxLength={6}
              />
            </div>
          </section>

          {/* Plată */}
          <section className="checkout-section">
            <header className="checkout-section-head">
              <h4>Plată</h4>
            </header>
            <div className="checkout-pay-options">
              <label>
                <input
                  type="radio"
                  name="pay"
                  checked={payment === 'ramburs'}
                  onChange={() => setPayment('ramburs')}
                />{' '}
                Ramburs
              </label>
              <label>
                <input
                  type="radio"
                  name="pay"
                  checked={payment === 'card'}
                  onChange={() => setPayment('card')}
                />{' '}
                Card
              </label>
            </div>

            {payment === 'card' && (
              <div className="checkout-grid two">
                <input
                  className="input"
                  value={cardNumber}
                  onChange={(e) => handleCardNumber(e.target.value)}
                  placeholder="Număr card (doar demo)"
                  inputMode="numeric"
                  maxLength={19}
                />
                <input
                  className="input"
                  value={cardName}
                  onChange={(e) => handleCardName(e.target.value)}
                  placeholder="Titular card"
                  autoCapitalize="characters"
                />
                <input
                  className="input"
                  value={cardExp}
                  onChange={(e) => handleCardExp(e.target.value)}
                  placeholder="Expirare MM/YY"
                  inputMode="numeric"
                  maxLength={5}
                />
                <input
                  className="input"
                  value={cardCvv}
                  onChange={(e) => handleCVV(e.target.value)}
                  placeholder="CVV"
                  inputMode="numeric"
                  maxLength={3}
                />
              </div>
            )}
          </section>

          {/* Footer */}
          <div className="checkout-footer">
            <div className="checkout-total">
              <span>Total</span>
              <strong>{Number(cartTotal ?? 0).toFixed(2)} RON</strong>
            </div>
            <div className="checkout-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Renunță
              </button>
              <button
                className="btn"
                type="submit"
                disabled={submitting || !canSubmit}
              >
                {submitting ? 'Se trimite…' : 'Plasează comanda'}
              </button>
            </div>
          </div>

          {hasBroken && (
            <div className="checkout-msg warning">
              Coșul conține produse indisponibile. Te rugăm să le elimini pentru a finaliza
              comanda.
            </div>
          )}
          {err && <div className="checkout-msg error">{err}</div>}
          {ok && <div className="checkout-msg success">{ok}</div>}
        </div>
      </form>
    </div>
  );
}

/* ───────── Pagina de coș ───────── */

export default function CartView() {
  const { cart, loadCart, setQuantity, removeItem, rates, loadRates, user } =
    useStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderOk, setOrderOk] = useState('');

  useEffect(() => {
    loadCart();
    loadRates('RON');
  }, [loadCart, loadRates]);

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const isFiniteNumber = (v) => Number.isFinite(Number(v));
  const isValidItem = (it) => it?.product && isFiniteNumber(it.product?.price);

  const validItems = useMemo(() => items.filter(isValidItem), [items]);
  const hasBroken = items.some((it) => !isValidItem(it));

  const total = useMemo(
    () =>
      validItems.reduce(
        (s, it) => s + Number(it.product.price) * Number(it.quantity || 0),
        0
      ),
    [validItems]
  );

  const clearCartNow = async () => {
    await Promise.all(items.map((it) => removeItem(it.id)));
    await loadCart();
  };

  if (items.length === 0) {
    return <div>Coșul este gol.</div>;
  }

  return (
    <div className="cart-page">
      <header className="cart-header">
        <div>
          <h2 className="cart-title">Coș de lectură</h2>
          <p className="cart-subtitle">
            {items.length} titlu{items.length === 1 ? '' : 'ri'} în coș.
          </p>
        </div>
        <div className="cart-header-total">
          <span>Total estimat</span>
          <strong>{total.toFixed(2)} RON</strong>
        </div>
      </header>

      {orderOk && (
        <div className="cart-banner cart-banner-success">{orderOk}</div>
      )}

      {hasBroken && (
        <div className="cart-banner cart-banner-warning">
          Unele articole nu mai sunt disponibile. Te rugăm să le elimini pentru a putea
          continua.
        </div>
      )}

      <div className="cart-lines">
        {items.map((it) => {
          const p = it?.product;
          const broken = !isValidItem(it);

          return (
            <article
              key={it.id}
              className={`cart-line ${broken ? 'is-broken' : ''}`}
            >
              <div className="cart-line-main">
                <div className="cart-line-title">
                  {broken
                    ? 'Produs indisponibil (șters sau invalid)'
                    : p.title}
                </div>
                {!broken && (
                  <div className="cart-line-meta">
                    <span className="cart-line-price">
                      {Number(p.price).toFixed(2)} RON
                    </span>
                  </div>
                )}
              </div>

              <div className="cart-line-qty">
                <label className="small">Cantitate</label>
                <input
                  type="number"
                  min={1}
                  value={
                    Number.isFinite(Number(it.quantity)) ? it.quantity : 1
                  }
                  onChange={(e) =>
                    setQuantity(
                      it.id,
                      Math.max(1, Number(e.target.value) || 1)
                    )
                  }
                  disabled={broken}
                />
              </div>

              <div className="cart-line-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => removeItem(it.id)}
                >
                  Șterge
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="cart-footer">
        <div className="cart-footer-total">
          <span>Total</span>
          <strong>{total.toFixed(2)} RON</strong>
        </div>

        {user ? (
          <button
            className="btn"
            onClick={() => setCheckoutOpen(true)}
            disabled={hasBroken || total <= 0}
            title={
              hasBroken
                ? 'Elimină produsele indisponibile pentru a continua'
                : undefined
            }
          >
            Finalizează comanda
          </button>
        ) : (
          <div className="cart-footer-note">
            Autentifică-te pentru a plasa comanda.
          </div>
        )}
      </footer>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartTotal={total}
        onOrderPlaced={async (orderId) => {
          await clearCartNow();
          setCheckoutOpen(false);
          setOrderOk(
            `Comanda a fost plasată cu succes${
              orderId ? ` (nr. ${orderId})` : ''
            }. Îți mulțumim!`
          );
        }}
      />
    </div>
  );
}
