'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from './CartProvider';
import Icon from './Icon';

export default function ProductActions({ product }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const out = product.stock <= 0;
  const max = Math.max(1, product.stock);

  if (out) {
    return <p className="stock out big">OUT OF STOCK</p>;
  }
  return (
    <div className="actions">
      <div className="qty-row">
        <span id="qty-label">Quantity</span>
        <div className="qty" role="group" aria-labelledby="qty-label">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}><Icon name="minus" size={18} /></button>
          <output aria-live="polite">{qty}</output>
          <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max}><Icon name="plus" size={18} /></button>
        </div>
      </div>
      <div className="action-btns">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => add(product, qty)}>Add to cart</button>
        <button type="button" className="btn btn-sun btn-lg" onClick={() => { add(product, qty); router.push('/checkout'); }}>Buy now</button>
      </div>
    </div>
  );
}
