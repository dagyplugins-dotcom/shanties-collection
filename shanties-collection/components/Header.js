import Link from 'next/link';
import Logo from './Logo';
import SearchBar from './SearchBar';
import CartCount from './CartCount';
import Icon from './Icon';

export default function Header({ store, categories }) {
  return (
    <header className="site-header">
      <div className="container header-row">
        <Logo store={store} />
        <div className="header-search"><SearchBar /></div>
        <nav className="desk-nav" aria-label="Main">
          <Link href="/">Home</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/cart" className="nav-cart"><Icon name="cart" size={20} /> Cart <CartCount /></Link>
          <Link href="/account"><Icon name="user" size={20} /> Account</Link>
        </nav>
      </div>
      {categories.length > 0 && (
        <nav className="cat-strip" aria-label="Shop by category">
          <ul className="container">
            {categories.map((c) => (
              <li key={c.id}><Link href={`/category/${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
