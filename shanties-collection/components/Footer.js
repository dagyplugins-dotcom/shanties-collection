import Link from 'next/link';
import Logo from './Logo';
import { FOOTER_LINKS } from '@/lib/pages';

const SOCIAL = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['x', 'X'], ['youtube', 'YouTube']];

export default function Footer({ store, categories, social }) {
  const name = store?.name || 'Shanties Collection';
  const links = SOCIAL.filter(([k]) => /^https?:\/\//i.test(social?.[k] || ''));
  return (
    <footer className="site-footer">
      <div className="kanga kanga-strip" aria-hidden="true" />
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo store={store} />
          <p>{store?.description}</p>
        </div>
        <nav aria-label="Shop">
          <h2>Shop</h2>
          <ul>
            <li><Link href="/categories">All categories</Link></li>
            {categories.map((c) => <li key={c.id}><Link href={`/category/${c.slug}`}>{c.name}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Customer care">
          <h2>Customer care</h2>
          <ul>{FOOTER_LINKS.map(([l, h]) => <li key={h}><Link href={h}>{l}</Link></li>)}</ul>
        </nav>
        {links.length > 0 && (
          <div>
            <h2>Follow us</h2>
            <ul>{links.map(([k, l]) => <li key={k}><a href={social[k]} target="_blank" rel="noopener noreferrer">{l}</a></li>)}</ul>
          </div>
        )}
      </div>
      <div className="container footer-base">© {new Date().getFullYear()} {name}</div>
    </footer>
  );
}
