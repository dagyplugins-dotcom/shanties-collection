import Link from 'next/link';
import { searchProducts, PAGE_SIZE } from '@/lib/data';
import ProductGrid from '@/components/ProductGrid';
import Pager from '@/components/Pager';
import EmptyState from '@/components/EmptyState';

export const revalidate = 60;

export function generateMetadata({ searchParams }) {
  const q = typeof searchParams.q === 'string' ? searchParams.q.slice(0, 60) : '';
  return { title: q ? `Results for "${q}"` : 'Search', robots: { index: false } };
}

export default async function SearchPage({ searchParams }) {
  const q = typeof searchParams.q === 'string' ? searchParams.q.trim().slice(0, 60) : '';
  const page = Math.max(1, parseInt(searchParams.page, 10) || 1);
  const { products, total } = q ? await searchProducts(q, page) : { products: [], total: 0 };

  return (
    <div className="container page">
      {!q ? (
        <EmptyState title="What are you looking for?" text="Search by product name, category or keyword." href="/categories" action="Browse categories" />
      ) : (
        <>
          <h1>Results for &ldquo;{q}&rdquo;</h1>
          <p className="muted">{total} {total === 1 ? 'product' : 'products'} found · <Link href="/categories">Clear search</Link></p>
          {products.length === 0 ? (
            <EmptyState icon="🔎" title="No products found." text="Try searching for something else, or check the spelling." href="/categories" action="Browse categories" />
          ) : (
            <>
              <ProductGrid products={products} />
              <Pager page={page} total={total} pageSize={PAGE_SIZE} basePath="/search" params={{ q }} />
            </>
          )}
        </>
      )}
    </div>
  );
}
