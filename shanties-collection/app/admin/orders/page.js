import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatKSh } from '@/lib/utils';

export const metadata = { title: 'Orders — Admin' };

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending_payment', label: 'Pending payment' },
  { key: 'payment_processing', label: 'Processing' },
  { key: 'paid', label: 'Paid' },
  { key: 'payment_failed', label: 'Failed' },
];

export default async function AdminOrdersPage({ searchParams }) {
  const resolved = await Promise.resolve(searchParams);
  const filter = resolved?.status || 'all';
  const q = (resolved?.q || '').trim();

  const supabase = createClient();

  let query = supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, total, payment_method, payment_status, order_status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (filter !== 'all') query = query.eq('payment_status', filter);
  if (q) query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);

  const { data: orders } = await query;

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0' }}>Orders</h1>

      <form method="get" style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by order number, name, or phone"
          className="input"
          style={{ flex: 1, minWidth: 220 }}
        />
        <input type="hidden" name="status" value={filter} />
        <button type="submit" className="btn btn-primary">Search</button>
        {q && <Link href={`/admin/orders?status=${filter}`} className="btn btn-ghost">Clear</Link>}
      </form>

      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/orders?status=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '.85rem', padding: '.35rem .75rem' }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {!orders || orders.length === 0 ? (
        <div className="admin-table-wrap" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#888' }}>No orders match this filter.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Total</th>
                <th>Method</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}><strong>{o.order_number}</strong></Link>
                  </td>
                  <td>{o.customer_name}</td>
                  <td>{o.customer_phone}</td>
                  <td>{formatKSh(o.total)}</td>
                  <td>{o.payment_method === 'mpesa_manual' ? 'Manual' : 'STK'}</td>
                  <td><PaymentPill value={o.payment_status} /></td>
                  <td><StatusPill value={o.order_status} /></td>
                  <td style={{ color: '#888', fontSize: '.85rem' }}>
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/admin/orders/${o.id}`} className="btn btn-ghost">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PaymentPill({ value }) {
  const tone = value === 'paid'
    ? 'ok'
    : value === 'payment_failed' || value === 'payment_cancelled'
    ? 'bad'
    : value === 'payment_processing'
    ? 'wait'
    : 'wait';
  return <span className={`pill pill-${tone}`}>{value.replace(/_/g, ' ')}</span>;
}

function StatusPill({ value }) {
  const tone = value === 'delivered'
    ? 'ok'
    : value === 'cancelled'
    ? 'bad'
    : 'wait';
  return <span className={`pill pill-${tone}`}>{value.replace(/_/g, ' ')}</span>;
}
