import Link from 'next/link';
import ImageCarousel from '@/components/ImageCarousel';
import CategoryCard from '@/components/CategoryCard';
import ProductGrid from '@/components/ProductGrid';
import { getCategories, getHomepage } from '@/lib/data';
import { isConfigured } from '@/lib/supabase/public';

export const revalidate = 60;

export default async function Home() {
  const [home, categories] = await Promise.all([getHomepage(), getCategories()]);
  const on = (k) => home.sections[k]?.is_enabled !== false;
  const title = (k, d) => home.sections[k]?.title || d;
  const promo = home.sections.promo;

  return (
    <>
      {!isConfigured() && (
        <div className="notice" role="status">
          The store isn&apos;t connected to its database yet. Add your Supabase keys in the environment settings, then redeploy.
        </div>
      )}

      {/* ─── Hero row: left sidebar + right carousel ─── */}
      <div className="container hero-row">
        {categories.length > 0 && (
          <aside className="hero-sidebar" aria-label="Shop by category">
            <h2 className="hero-sidebar-title">Category</h2>
            <ul>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`} className="hero-sidebar-link">
                    <span className="hero-sidebar-dot" aria-hidden="true" />
                    <span className="hero-sidebar-name">{c.name}</span>
                    <span className="hero-sidebar-arrow" aria-hidden="true">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <div className="hero-main">
          <ImageCarousel banners={home.banners} />
        </div>
      </div>

      {/* ─── Shop by category tiles ─── */}
      {on('categories') && categories.length > 0 && (
        <section className="container section" aria-labelledby="h-cats">
          <div className="section-head">
            <h2 id="h-cats">{title('categories', 'Shop by category')}</h2>
            <Link href="/categories">See all</Link>
          </div>
          <div className="cat-grid">
            {categories.map((c, i) => <CategoryCard key={c.id} category={c} index={i} />)}
          </div>
        </section>
      )}

      {on('featured') && home.featured.length > 0 && (
        <section className="container section" aria-labelledby="h-feat">
          <div className="section-head"><h2 id="h-feat">{title('featured', 'Featured products')}</h2></div>
          <ProductGrid products={home.featured} />
        </section>
      )}

      {on('popular') && home.popular.length > 0 && (
        <section className="container section" aria-labelledby="h-pop">
          <div className="section-head"><h2 id="h-pop">{title('popular', 'Popular right now')}</h2></div>
          <ProductGrid products={home.popular} priorityCount={0} />
        </section>
      )}

      {on('promo') && promo?.title && (
        <section className="container section">
          <div className="promo kanga">
            <div className="promo-inner">
              <h2>{promo.title}</h2>
              {promo.subtitle && <p>{promo.subtitle}</p>}
              {promo.button_text && promo.button_link && <Link href={promo.button_link} className="btn btn-sun">{promo.button_text}</Link>}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
