import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatKSh } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order details', robots: { index: false } };

export default async function OrderDetailPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  if (!id) notFound();

  const { user } = await requireUser(`/account/orders/${id}`);

  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id);

  return (
    <div className="container page">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/account/orders" style={{ color: '#888', fontSize: '.9rem' }}>← Back to my orders</Link>
        <h1 style={{ margin: '.5rem 0 0 0' }}>{order.order_number}</h1>
        <p style={{ color: '#888', margin: '.25rem 0 0 0', fontSize: '.9rem' }}>
          Placed {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <PaymentPill value={order.payment_status} />
        <StatusPill value={order.order_status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <section className="auth-card">
          <h2 style={{ marginTop: 0 }}>Items</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(items || []).map((it) => (
              <li key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '.6rem 0', borderBottom: '1px solid #f1f1f1' }}>
                <div>
                  <strong>{it.name}</strong>
                  <br />
                  <small style={{ color: '#888' }}>{formatKSh(it.price)} × {it.quantity}</small>
                </div>
                <span style={{ fontWeight: 600 }}>{formatKSh(it.price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <div>Subtotal: <strong>{formatKSh(order.subtotal)}</strong></div>
            <div>Delivery: <strong>{formatKSh(order.delivery_fee)}</strong></div>
            <div style={{ fontSize: '1.1rem', marginTop: '.35rem' }}>Total: <strong>{formatKSh(order.total)}</strong></div>
          </div>
        </section>

        <aside className="auth-card">
          <h2 style={{ marginTop: 0 }}>Delivery</h2>
          <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '.4rem 1rem', margin: 0, fontSize: '.92rem' }}>
            <dt style={{ color: '#888' }}>Name</dt><dd style={{ margin: 0 }}>{order.customer_name}</dd>
            <dt style={{ color: '#888' }}>Phone</dt><dd style={{ margin: 0 }}>{order.customer_phone}</dd>
            <dt style={{ color: '#888' }}>County</dt><dd style={{ margin: 0 }}>{order.delivery_county}</dd>
            <dt style={{ color: '#888' }}>Town</dt><dd style={{ margin: 0 }}>{order.delivery_town}</dd>
            {order.delivery_area && <><dt style={{ color: '#888' }}>Area</dt><dd style={{ margin: 0 }}>{order.delivery_area}</dd></>}
            <dt style={{ color: '#888' }}>Address</dt><dd style={{ margin: 0 }}>{order.delivery_address}</dd>
          </dl>
          {order.payment_reference && (
            <p style={{ marginTop: '1rem', fontSize: '.85rem', color: '#666' }}>
              Payment reference: <strong>{order.payment_reference}</strong>
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function PaymentPill({ value }) {
  const tone = value === 'paid' ? 'ok' : value.includes('fail') || value.includes('cancel') ? 'bad' : 'wait';
  return <span className={`pill pill-${tone}`}>{value.replace(/_/g, ' ')}</span>;
}

function StatusPill({ value }) {
  const tone = value === 'delivered' ? 'ok' : value === 'cancelled' ? 'bad' : 'wait';
  return <span className={`pill pill-${tone}`}>{value.replace(/_/g, ' ')}</span>;
}
