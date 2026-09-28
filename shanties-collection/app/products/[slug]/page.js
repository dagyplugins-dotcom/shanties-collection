import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelated, getSettings } from '@/lib/data';
import { formatKSh, discountPct, primaryImage, stockInfo, siteUrl } from '@/lib/utils';
import ProductGallery from '@/components/ProductGallery';
import ProductActions from '@/components/ProductActions';
import ProductGrid from '@/components/ProductGrid';
import Rating from '@/components/Rating';
import Icon from '@/components/Icon';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const data = await getProductBySlug(params.slug);
  if (!data) return { title: 'Product not found' };
  const p = data.product;
  const img = primaryImage({ product_images: p.product_images });
  const title = p.seo_title || p.name;
  const description = p.seo_description || (p.description || `Buy ${p.name} at Shanties Collection.`).slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title, description, type: 'website', images: img?.url ? [img.url] : undefined },
    twitter: { card: 'summary_large_image' },
  };
}

function specRows(spec) {
  if (Array.isArray(spec)) return spec.filter((s) => s?.label).map((s) => [s.label, s.value]);
  if (spec && typeof spec === 'object') return Object.entries(spec);
  return [];
}

export default async function ProductPage({ params }) {
  const data = await getProductBySlug(params.slug);
  if (!data) notFound();
  const { product: p, reviews } = data;
  const [related, settings] = await Promise.all([getRelated(p.category_id, p.id), getSettings()]);
  const img = primaryImage({ product_images: p.product_images });
  const pct = discountPct(p.price, p.previous_price);
  const stock = stockInfo(p.stock_quantity);
  const specs = specRows(p.specifications);
  const paymentsOn = settings.payments?.stk_enabled !== false;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description || undefined,
    image: p.product_images.map((i) => i.url),
    url: `${siteUrl()}/products/${p.slug}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'KES',
      price: Number(p.price),
      availability: p.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${siteUrl()}/products/${p.slug}`,
    },
    ...(p.review_count > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(p.rating_avg), reviewCount: p.review_count } } : {}),
  };

  return (
    <div className="container page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> /{' '}
        {p.category && <><Link href={`/category/${p.category.slug}`}>{p.category.name}</Link> / </>}
        <span aria-current="page">{p.name}</span>
      </nav>

      <div className="pdp">
        <ProductGallery images={p.product_images} name={p.name} />
        <div className="pdp-info">
          <h1>{p.name}</h1>
          {p.review_count > 0 ? <Rating value={p.rating_avg} count={p.review_count} size={18} /> : <p className="muted small">No reviews yet</p>}
          <div className="price-row big">
            <span className="price">{formatKSh(p.price)}</span>
            {pct > 0 && (<><span className="was">Was {formatKSh(p.previous_price)}</span><span className="badge badge-sale inline">{pct}% OFF</span></>)}
          </div>
          <p className={`stock ${stock.tone}`}>{stock.label}</p>
          <ProductActions product={{ id: p.id, slug: p.slug, name: p.name, price: Number(p.price), image: img?.url || null, stock: p.stock_quantity }} />
          <ul className="assure">
            <li><Icon name="truck" size={20} /> Delivery across Kenya. Fee shown at checkout.</li>
            {paymentsOn && <li><Icon name="phone" size={20} /> Pay securely with M-Pesa.</li>}
          </ul>
        </div>
      </div>

      <div className="pdp-sections">
        {p.description && <section><h2>Description</h2>{p.description.split(/\n{2,}/).map((t, i) => <p key={i}>{t}</p>)}</section>}
        {p.details && <section><h2>Product details</h2>{p.details.split(/\n{2,}/).map((t, i) => <p key={i}>{t}</p>)}</section>}
        {specs.length > 0 && (
          <section>
            <h2>Specifications</h2>
            <table className="specs"><tbody>{specs.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{String(v)}</td></tr>)}</tbody></table>
          </section>
        )}
        <section id="reviews">
          <h2>Customer reviews</h2>
          {reviews.length === 0 ? (
            <p className="muted">No reviews yet. Customers who buy this product can leave a review from their account.</p>
          ) : (
            <ul className="reviews">
              {reviews.map((r) => (
                <li key={r.id}>
                  <Rating value={r.rating} count={0} />
                  <strong>{r.author_name || 'Customer'}</strong>
                  {r.comment && <p>{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2>Delivery information</h2>
          <p>We deliver across Kenya. Choose your county and town at checkout to see your delivery fee and estimated delivery time. <Link href="/delivery-information">Read more</Link></p>
        </section>
      </div>

      {related.length > 0 && (
        <section className="section" aria-labelledby="h-rel">
          <div className="section-head"><h2 id="h-rel">You may also like</h2></div>
          <ProductGrid products={related} priorityCount={0} />
        </section>
      )}
    </div>
  );
}
