import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Admin — Shanties Collection',
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '📦' },
  { href: '/admin/orders', label: 'Orders', icon: '🧾' },
  { href: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { href: '/admin/delivery', label: 'Delivery', icon: '🚚' },
  { href: '/admin/homepage', label: 'Homepage', icon: '🖼️' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default async function AdminLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'admin') redirect('/');

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link href="/admin">
            <strong>SHANTIES</strong>
            <span>Admin</span>
          </Link>
        </div>
        <nav className="admin-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="admin-nav-link">
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-nav-link" target="_blank" rel="noopener">
            <span className="admin-nav-icon">🌐</span>
            <span>View store</span>
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <span>{profile.full_name || user.email}</span>
            <small style={{ display: 'block', color: '#888', fontWeight: 400 }}>
              Administrator
            </small>
          </div>
          <form action="/auth/signout" method="post">
            <Link href="/account" className="btn btn-ghost">My account</Link>
          </form>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
