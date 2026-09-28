import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryPage, PAGE_SIZE } from '@/lib/data';
import ProductGrid from '@/components/ProductGrid';
import FilterBar from '@/components/FilterBar';
import Pager from '@/components/Pager';
import EmptyState from '@/components/EmptyState';

export const revalidate = 60;

const num = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : 0; };
const parse = (sp) => ({
  sub: typeof sp.sub === 'string' ? sp.sub : '',
  sort: ['newest', 'price_asc', 'price_desc'].includes(sp.sort) ? sp.sort : '',
  page: Math.max(1, num(sp.page) || 1),
  min: num(sp.min),
  max: num(sp.max),
});

export async function generateMetadata({ params, searchParams }) {
  const data = await getCategoryPage(params.slug, parse(searchParams));
  if (!data) return { title: 'Category not found' };
  const c = data.category;
  const title = data.activeSub ? `${data.activeSub.name} in ${c.name}` : c.name;
  const description = c.description || `Shop ${c.name} online in Kenya. Pay with M-Pesa and get it delivered.`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${c.slug}` },
    openGraph: { title, description, images: c.image_url ? [c.image_url] : undefined },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const f = parse(searchParams);
  const data = await getCategoryPage(params.slug, f);
  if (!data) notFound();
  const { category, activeSub, products, total } = data;
  const basePath = `/category/${category.slug}`;
  const heading = activeSub ? activeSub.name : category.name;

  return (
    <div className="container page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/categories">Categories</Link> /{' '}
        {activeSub ? <><Link href={basePath}>{category.name}</Link> / <span aria-current="page">{activeSub.name}</span></> : <span aria-current="page">{category.name}</span>}
      </nav>
      <h1>{heading}</h1>
      <p className="muted">{total} {total === 1 ? 'product' : 'products'}</p>
      <FilterBar basePath={basePath} subs={category.subcategories} sub={f.sub} sort={f.sort} min={f.min || ''} max={f.max || ''} />
      {products.length === 0 ? (
        <EmptyState title="No products here yet" text="Try another subcategory or clear your filters." href={basePath} action={`See all ${category.name}`} />
      ) : (
        <>
          <ProductGrid products={products} />
          <Pager page={f.page} total={total} pageSize={PAGE_SIZE} basePath={basePath} params={{ sub: f.sub, sort: f.sort, min: f.min || '', max: f.max || '' }} />
        </>
      )}
    </div>
  );
}
