import { create } from 'zustand';
import { api, setToken, clearToken } from './api';

export const useStore = create((set, get) => ({
  user: null,
  authReady: false, // 👈

  products: [],
  cart: null,
  rates: null,

  async login(email, password) {
    const { token, user } = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    set({ user });
    await get().loadCart().catch(() => {});
  },

  async register(payload) {
    const p = { ...payload, email: payload.email.trim().toLowerCase() };
    await api('/auth/register', { method: 'POST', body: JSON.stringify(p) });
    try { await get().login(p.email, p.password); } catch (e) { console.warn('[register] auto-login failed:', e); }
  },

  logout() {
    clearToken();
    set({ user: null, cart: null });
  },

  async updateProfile(payload) {
    const data = await api('/users/me', { method: 'PUT', body: JSON.stringify(payload) });
    set({ user: data });
    return data;
  },

  async deleteAccount() {
    await api('/users/me', { method: 'DELETE' });
    clearToken();
    set({ user: null, cart: null });
    return true;
  },

  async fetchMe() {
    try {
      const data = await api('/users/me');
      set({ user: data, authReady: true });
      await get().loadCart().catch(() => {});
      return data;
    } catch {
      set({ authReady: true });
      return null;
    }
  },

  async loadProducts() {
    const data = await api('/products');
    set({ products: data });
  },

  async loadCart() {
    const data = await api('/cart');
    set({ cart: data });
  },

  async addToCart(productId, quantity = 1) {
    await api('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) });
    await get().loadCart();
  },

  async setQuantity(itemId, quantity) {
    await api(`/cart/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
    await get().loadCart();
  },

  async removeItem(itemId) {
    await api(`/cart/items/${itemId}`, { method: 'DELETE' });
    await get().loadCart();
  },

  async loadRates(base = 'EUR') {
    const data = await api(`/rates?base=${base}`);
    set({ rates: data });
  },
}));
