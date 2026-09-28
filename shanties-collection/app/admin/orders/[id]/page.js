import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatKSh } from '@/lib/utils';
import { updateOrderStatus, markOrderPaid } from '../actions';

export const metadata = { title: 'Order — Admin' };

const PAYMENT_OPTIONS = [
  'pending_payment',
  'payment_processing',
  'paid',
  'payment_failed',
  'payment_cancelled',
  'payment_refunded',
];

const ORDER_OPTIONS = [
  'order_placed',
  'payment_confirmed',
  'processing',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export default async function AdminOrderDetail({ params, searchParams }) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearch = await Promise.resolve(searchParams);
  const id = resolvedParams?.id;
  if (!id) notFound();

  const supabase = createClient();

  const [{ data: order }, { data: items }, { data: payments }] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).maybeSingle(),
    supabase.from('order_items').select('*').eq('order_id', id),
    supabase.from('payments').select('*').eq('order_id', id).order('created_at', { ascending: false }),
  ]);

  if (!order) notFound();

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/orders" style={{ color: '#888', fontSize: '.9rem' }}>← Back to orders</Link>
        <h1 style={{ margin: '.5rem 0 0 0' }}>Order {order.order_number}</h1>
        <p style={{ color: '#888', margin: '.25rem 0 0 0', fontSize: '.9rem' }}>
          Placed {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

      {resolvedSearch?.error && (
        <p className="alert err" role="alert" style={{ marginBottom: '1rem' }}>{resolvedSearch.error}</p>
      )}
      {resolvedSearch?.message && (
        <p className="alert ok" role="status" style={{ marginBottom: '1rem' }}>{resolvedSearch.message}</p>
      )}

      {order.payment_status !== 'paid' && (
        <form action={markOrderPaid} style={{ marginBottom: '1.5rem' }}>
          <input type="hidden" name="id" value={order.id} />
          <button type="submit" className="btn btn-primary">
            ✓ Mark as paid
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <section className="admin-panel">
            <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Items</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(items || []).map((it) => (
                  <tr key={it.id}>
                    <td>{it.name}</td>
                    <td>{formatKSh(it.price)}</td>
                    <td>{it.quantity}</td>
                    <td><strong>{formatKSh(it.price * it.quantity)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
              <div>Subtotal: <strong>{formatKSh(order.subtotal)}</strong></div>
              <div>Delivery: <strong>{formatKSh(order.delivery_fee)}</strong></div>
              <div style={{ fontSize: '1.05rem', marginTop: '.35rem' }}>Total: <strong>{formatKSh(order.total)}</strong></div>
            </div>
          </section>

          <section className="admin-panel">
            <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Customer & delivery</h2>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '.4rem 1rem', margin: 0 }}>
              <dt style={{ color: '#888' }}>Name</dt><dd style={{ margin: 0 }}>{order.customer_name}</dd>
              <dt style={{ color: '#888' }}>Phone</dt><dd style={{ margin: 0 }}>{order.customer_phone}</dd>
              {order.customer_email && <><dt style={{ color: '#888' }}>Email</dt><dd style={{ margin: 0 }}>{order.customer_email}</dd></>}
              <dt style={{ color: '#888' }}>County</dt><dd style={{ margin: 0 }}>{order.delivery_county}</dd>
              <dt style={{ color: '#888' }}>Town</dt><dd style={{ margin: 0 }}>{order.delivery_town}</dd>
              {order.delivery_area && <><dt style={{ color: '#888' }}>Area</dt><dd style={{ margin: 0 }}>{order.delivery_area}</dd></>}
              <dt style={{ color: '#888' }}>Address</dt><dd style={{ margin: 0 }}>{order.delivery_address}</dd>
              {order.delivery_notes && <><dt style={{ color: '#888' }}>Notes</dt><dd style={{ margin: 0 }}>{order.delivery_notes}</dd></>}
            </dl>
          </section>

          <section className="admin-panel">
            <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Payments</h2>
            {(!payments || payments.length === 0) ? (
              <p style={{ color: '#888' }}>No payment records.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Receipt</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.method}</td>
                      <td>{formatKSh(p.amount)}</td>
                      <td>{p.status}</td>
                      <td>{p.mpesa_receipt || '—'}</td>
                      <td style={{ color: '#888', fontSize: '.85rem' }}>{new Date(p.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <aside className="admin-panel" style={{ position: 'sticky', top: '5rem' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Update status</h2>
          <form action={updateOrderStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="hidden" name="id" value={order.id} />

            <label className="field">
              <span>Payment status</span>
              <select name="payment_status" defaultValue={order.payment_status} className="input">
                {PAYMENT_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Order status</span>
              <select name="order_status" defaultValue={order.order_status} className="input">
                {ORDER_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Payment reference (receipt no.)</span>
              <input
                name="payment_reference"
                defaultValue={order.payment_reference || ''}
                placeholder="e.g. QK12AB34CD"
                className="input"
              />
            </label>

            <button type="submit" className="btn btn-primary">Save changes</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
