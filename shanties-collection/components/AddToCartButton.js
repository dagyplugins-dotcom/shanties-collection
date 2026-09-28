'use client';
import { useCart } from './CartProvider';

export default function AddToCartButton({ product, className = '' }) {
  const { add } = useCart();
  const out = product.stock <= 0;
  return (
    <button type="button" className={`btn btn-primary btn-block ${className}`} disabled={out} onClick={() => add(product, 1)}>
      {out ? 'Out of stock' : 'Add to cart'}
    </button>
  );
}
