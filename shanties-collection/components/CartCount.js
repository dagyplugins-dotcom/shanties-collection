'use client';
import { useCart } from './CartProvider';

export default function CartCount() {
  const { count, ready } = useCart();
  if (!ready || count === 0) return null;
  return <span className="cart-badge" aria-label={`${count} items in cart`}>{count > 99 ? '99+' : count}</span>;
}
