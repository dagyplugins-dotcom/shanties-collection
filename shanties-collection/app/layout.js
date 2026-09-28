import './globals.css';
import { CartProvider } from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { getCategories, getSettings } from '@/lib/data';
import { siteUrl } from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata() {
  const s = await getSettings();
  const store = s.store || {};
  const name = store.name || 'Shanties Collection';
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${name} | Online shopping in Kenya`, template: `%s | ${name}` },
    description: store.description || 'Fashion, beauty, home and family essentials delivered across Kenya. Pay with M-Pesa.',
    openGraph: { siteName: name, type: 'website', locale: 'en_KE' },
    icons: store.favicon_url ? { icon: store.favicon_url } : undefined,
  };
}

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0E5A4D' };

export default async function RootLayout({ children }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <CartProvider>
          <Header store={settings.store} categories={categories} />
          <main id="main">{children}</main>
          <Footer store={settings.store} categories={categories} social={settings.social} />
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
