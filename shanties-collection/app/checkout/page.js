'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { formatKSh } from '@/lib/utils';
import { getPublicClient } from '@/lib/supabase/public';

export default function Checkout() {
  const { items, ready, subtotal, clear } = useCart();

  const [zones, setZones] = useState([]);
  const [settings, setSettings] = useState({ paybill: '', till: '', business_phone: '', stk_enabled: true, manual_enabled: true });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa_stk');
  const [placedOrder, setPlacedOrder] = useState(null); // { order_number, method, total }

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_county: '',
    delivery_town: '',
    delivery_area: '',
    delivery_address: '',
    delivery_notes: '',
  });

  // Load zones + payment settings
  useEffect(() => {
    const supabase = getPublicClient();
    if (!supabase) return;

    supabase
      .from('delivery_zones')
      .select('county, town, fee, eta')
      .eq('is_enabled', true)
      .order('sort_order')
      .then(({ data }) => { if (data) setZones(data); });

    supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'payments')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setSettings((s) => ({ ...s, ...data.value }));
        }
      });
  }, []);

  const selectedZone = zones.find((z) => z.county === formData.delivery_county);
  const deliveryFee = selectedZone ? Number(selectedZone.fee) : 0;
  const total = subtotal + deliveryFee;
  const cartEmpty = items.length === 0;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartEmpty) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: formData,
          phone: formData.customer_phone,
          payment_method: paymentMethod,
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            qty: i.qty,
            image: i.image,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Checkout failed. Please try again.');
        setLoading(false);
        return;
      }

      // Save order info, clear cart
      setPlacedOrder({
        order_number: data.order_number,
        method: data.payment_method,
        total,
        phone: formData.customer_phone,
      });
      clear();
      setLoading(false);
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  if (!ready) {
    return <div className="container page"><h1>Checkout</h1><p>Loading…</p></div>;
  }

  // ─── SUCCESS STATE ───
  if (placedOrder) {
    const isManual = placedOrder.method === 'mpesa_manual';
    return (
      <div className="container page">
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h1>🎉 Order placed!</h1>
          <p style={{ fontSize: '1.1rem' }}>
            Your order number is <strong>{placedOrder.order_number}</strong>
          </p>
          <p>Total: <strong>{formatKSh(placedOrder.total)}</strong></p>

          {isManual && (
            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', padding: '1.25rem', borderRadius: 10, marginTop: '1.5rem', textAlign: 'left' }}>
              <h3 style={{ marginTop: 0 }}>Complete your payment</h3>
              {settings.paybill && (
                <p><strong>Paybill:</strong> {settings.paybill}</p>
              )}
              {settings.till && (
                <p><strong>Till Number:</strong> {settings.till}</p>
              )}
              <p><strong>Account Number:</strong> {placedOrder.order_number}</p>
              <p><strong>Amount:</strong> {formatKSh(placedOrder.total)}</p>
              {settings.business_phone && (
                <p><strong>Confirm to:</strong> {settings.business_phone}</p>
              )}
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 0 }}>
                Use your M-Pesa app or USSD to send the amount. We will confirm your order once payment is received.
              </p>
            </div>
          )}

          {!isManual && (
            <div style={{ background: '#e3f2fd', border: '1px solid #90caf9', padding: '1.25rem', borderRadius: 10, marginTop: '1.5rem', textAlign: 'left' }}>
              <h3 style={{ marginTop: 0 }}>Check your phone</h3>
              <p>We sent an M-Pesa STK Push to <strong>{placedOrder.phone}</strong>. Enter your PIN to complete the payment.</p>
            </div>
          )}

          <div style={{ marginTop: '2rem' }}>
            <Link href="/" className="btn btn-primary">Continue shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── EMPTY CART ───
  if (cartEmpty) {
    return (
      <div className="container page">
        <div className="empty">
          <h2>Your cart is empty</h2>
          <p>Add items to your cart before checking out.</p>
          <Link href="/categories" className="btn btn-primary">Shop now</Link>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT FORM ───
  const stkAvailable = settings.stk_enabled !== false;
  const manualAvailable = settings.manual_enabled !== false;

  return (
    <div className="container page">
      <h1>Checkout</h1>

      <div className="checkout-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2>Delivery details</h2>

          <input type="text" name="customer_name" placeholder="Full name" required
            value={formData.customer_name} onChange={handleChange} className="input" />

          <input type="tel" name="customer_phone" placeholder="Phone (e.g. 0712345678)" required
            value={formData.customer_phone} onChange={handleChange} className="input" />

          <input type="email" name="customer_email" placeholder="Email (optional)"
            value={formData.customer_email} onChange={handleChange} className="input" />

          <select name="delivery_county" required
            value={formData.delivery_county} onChange={handleChange} className="input">
            <option value="">Select county</option>
            {zones.map((z) => (
              <option key={z.county} value={z.county}>
                {z.county} — {formatKSh(z.fee)} {z.eta ? `(${z.eta})` : ''}
              </option>
            ))}
          </select>

          <input type="text" name="delivery_town" placeholder="Town / area" required
            value={formData.delivery_town} onChange={handleChange} className="input" />

          <input type="text" name="delivery_area" placeholder="Estate / area (optional)"
            value={formData.delivery_area} onChange={handleChange} className="input" />

          <input type="text" name="delivery_address" placeholder="Specific address / landmark" required
            value={formData.delivery_address} onChange={handleChange} className="input" />

          <textarea name="delivery_notes" placeholder="Delivery notes (optional)" rows="2"
            value={formData.delivery_notes} onChange={handleChange} className="input" />

          <h2 style={{ marginTop: '0.5rem' }}>Payment method</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>
              <input type="radio" name="payment" value="mpesa_stk"
                checked={paymentMethod === 'mpesa_stk'}
                onChange={() => setPaymentMethod('mpesa_stk')}
                disabled={!stkAvailable} />
              <span>
                <strong>Pay with M-Pesa (STK)</strong>
                <br />
                <small style={{ color: '#666' }}>We send a prompt to your phone. Enter your PIN to pay.</small>
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>
              <input type="radio" name="payment" value="mpesa_manual"
                checked={paymentMethod === 'mpesa_manual'}
                onChange={() => setPaymentMethod('mpesa_manual')}
                disabled={!manualAvailable} />
              <span>
                <strong>Pay manually</strong>
                <br />
                <small style={{ color: '#666' }}>Get Paybill/Till details and pay from your M-Pesa app.</small>
              </span>
            </label>
          </div>

          {errorMsg && (
            <p style={{ color: '#b00020', background: '#fdecec', padding: '0.75rem', borderRadius: '6px' }}>
              {errorMsg}
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading || cartEmpty}>
            {loading ? 'Placing order…' : `Place order — ${formatKSh(total)}`}
          </button>
        </form>

        <aside>
          <h2>Order summary</h2>
          <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>{item.name} × {item.qty}</span>
                <span>{formatKSh(item.price * item.qty)}</span>
              </div>
            ))}
            <hr />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span>{formatKSh(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery{selectedZone ? ` (${selectedZone.county})` : ''}</span>
              <span>{selectedZone ? formatKSh(deliveryFee) : '—'}</span>
            </div>
            <hr />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Total</span>
              <span>{formatKSh(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
