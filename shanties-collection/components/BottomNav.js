'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import CartCount from './CartCount';

const ITEMS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/categories', label: 'Categories', icon: 'grid' },
  { href: '/cart', label: 'Cart', icon: 'cart' },
  { href: '/account', label: 'Account', icon: 'user' },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Main">
      {ITEMS.map((i) => {
        const active = i.href === '/' ? path === '/' : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
            <span className="bn-ico"><Icon name={i.icon} size={24} />{i.icon === 'cart' && <CartCount />}</span>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
