'use client';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import Icon from '@/components/Icon';
import EmptyState from '@/components/EmptyState';
import { formatKSh } from '@/lib/utils';

export default function CartPage() {
  const { items, ready, setQty, remove, subtotal } = useCart();
  if (!ready) return <div className="container page"><h1>Your cart</h1></div>;
  if (items.length === 0) {
    return (
      <div className="container page">
        <EmptyState icon="🛒" title="Your cart is empty." text="Start shopping and add products to your cart." href="/categories" action="Shop now" />
      </div>
    );
  }
  return (
    <div className="container page cart">
      <h1>Your cart</h1>
      <div className="cart-layout">
        <ul className="cart-items">
          {items.map((i) => (
            <li key={i.id} className="cart-item">
              <Link href={`/products/${i.slug}`} className="ci-img">
                {i.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={i.image} alt="" loading="lazy" width="88" height="88" /> : <span className="ph"><span>{i.name.charAt(0)}</span></span>}
              </Link>
              <div className="ci-main">
                <Link href={`/products/${i.slug}`} className="ci-name">{i.name}</Link>
                <span className="price">{formatKSh(i.price)}</span>
                <div className="ci-row">
                  <div className="qty" role="group" aria-label={`Quantity for ${i.name}`}>
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQty(i.id, i.qty - 1)} disabled={i.qty <= 1}><Icon name="minus" size={18} /></button>
                    <output>{i.qty}</output>
                    <button type="button" aria-label="Increase quantity" onClick={() => setQty(i.id, i.qty + 1)} disabled={i.qty >= i.stock}><Icon name="plus" size={18} /></button>
                  </div>
                  <button type="button" className="link-btn" onClick={() => remove(i.id)}>Remove</button>
                </div>
              </div>
              <strong className="ci-total">{formatKSh(i.price * i.qty)}</strong>
            </li>
          ))}
        </ul>
        <aside className="summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <dl>
            <div><dt>Subtotal</dt><dd>{formatKSh(subtotal)}</dd></div>
            <div><dt>Delivery</dt><dd>Shown at checkout</dd></div>
          </dl>
          <Link href="/checkout" className="btn btn-primary btn-block btn-lg">Checkout</Link>
          <Link href="/categories" className="btn btn-ghost btn-block">Keep shopping</Link>
        </aside>
      </div>
    </div>
  );
}
