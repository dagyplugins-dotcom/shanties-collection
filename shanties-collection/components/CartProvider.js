'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const CartCtx = createContext(null);
const KEY = 'sc_cart_v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  const timer = useRef();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(saved)) setItems(saved);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  const add = useCallback((p, qty = 1) => {
    if (!p || p.stock <= 0) return;
    setItems((cur) => {
      const found = cur.find((i) => i.id === p.id);
      if (found) return cur.map((i) => (i.id === p.id ? { ...i, ...p, qty: Math.min(i.qty + qty, p.stock) } : i));
      return [...cur, { ...p, qty: Math.min(qty, p.stock) }];
    });
    notify('Added to cart');
  }, [notify]);

  const setQty = useCallback((id, qty) => {
    setItems((cur) =>
      cur.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock || 99)) } : i))
    );
  }, []);
  const remove = useCallback((id) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items, ready, add, setQty, remove, clear,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.qty * i.price, 0),
    }),
    [items, ready, add, setQty, remove, clear]
  );

  return (
    <CartCtx.Provider value={value}>
      {children}
      <div className="toast" role="status" aria-live="polite">{toast}</div>
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
