import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatKSh } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My orders', robots: { index: false } };

export default async function MyOrdersPage() {
  const { user } = await requireUser('/account/orders');

  const supabase = createClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total, payment_status, order_status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="container page">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/account" style={{ color: '#888', fontSize: '.9rem' }}>← Back to account</Link>
        <h1 style={{ margin: '.5rem 0 0 0' }}>My orders</h1>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="empty">
          <h2>No orders yet</h2>
          <p>When you place your first order, it will appear here.</p>
          <Link href="/categories" className="btn btn-primary">Start shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 10,
                padding: '1rem 1.25rem',
                textDecoration: 'none',
                color: 'inherit',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '1rem' }}>{o.order_number}</strong>
                <small style={{ color: '#888' }}>{new Date(o.created_at).toLocaleDateString()}</small>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <PaymentPill value={o.payment_status} />
                <StatusPill value={o.order_status} />
              </div>
              <div style={{ fontWeight: 600 }}>{formatKSh(o.total)}</div>
            </Link>
          ))}
        </div>
      )}
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
