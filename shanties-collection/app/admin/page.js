import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatKSh } from '@/lib/utils';

export default async function AdminDashboard() {
  const supabase = createClient();

  // Today's start
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    { count: todayOrders },
    { data: todaySalesData },
    { count: pendingOrders },
    { count: totalProducts },
    { count: totalCustomers },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString()),
    supabase
      .from('orders')
      .select('total')
      .gte('created_at', startOfToday.toISOString())
      .eq('payment_status', 'paid'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'pending_payment'),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer'),
    supabase
      .from('orders')
      .select('id, order_number, customer_name, total, payment_status, order_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const todaySales = (todaySalesData || []).reduce((s, o) => s + Number(o.total || 0), 0);

  const stats = [
    { label: "Today's orders", value: todayOrders ?? 0, icon: '🧾' },
    { label: "Today's sales", value: formatKSh(todaySales), icon: '💰' },
    { label: 'Pending payment', value: pendingOrders ?? 0, icon: '⏳' },
    { label: 'Active products', value: totalProducts ?? 0, icon: '📦' },
    { label: 'Customers', value: totalCustomers ?? 0, icon: '👥' },
  ];

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="admin-stats">
        {stats.map((s) => (
          <div key={s.label} className="admin-stat-card">
            <span className="admin-stat-icon">{s.icon}</span>
            <span className="admin-stat-label">{s.label}</span>
            <strong className="admin-stat-value">{s.value}</strong>
          </div>
        ))}
      </div>

      <section style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Recent orders</h2>
          <Link href="/admin/orders" className="btn btn-ghost">View all</Link>
        </div>

        {!recentOrders || recentOrders.length === 0 ? (
          <p style={{ color: '#888', marginTop: '1rem' }}>No orders yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`}><strong>{o.order_number}</strong></Link>
                    </td>
                    <td>{o.customer_name}</td>
                    <td>{formatKSh(o.total)}</td>
                    <td><StatusPill value={o.payment_status} /></td>
                    <td><StatusPill value={o.order_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusPill({ value }) {
  const tone = value.includes('paid') || value === 'delivered'
    ? 'ok'
    : value.includes('fail') || value === 'cancelled'
    ? 'bad'
    : 'wait';
  return <span className={`pill pill-${tone}`}>{value.replace(/_/g, ' ')}</span>;
}
