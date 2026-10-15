import Link from 'next/link';
import { getCategories } from '@/lib/data';
import EmptyState from '@/components/EmptyState';
import CategoryCard from '@/components/CategoryCard';

export const revalidate = 60;
export const metadata = { title: 'Shop by category', description: 'Browse every category at Shanties Collection.' };

export default async function Categories() {
  const categories = await getCategories();

  if (categories.length === 0) {
    return (
      <div className="container page">
        <h1>Categories</h1>
        <EmptyState title="No categories yet" text="Categories will appear here once the store is set up." href="/" action="Back to home" />
      </div>
    );
  }

  return (
    <div className="container page">
      <h1>Shop by category</h1>

      <div className="cat-layout">
        <aside className="cat-sidebar" aria-label="Categories">
          <h2 className="cat-sidebar-title">Category</h2>
          <ul>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="cat-sidebar-link">
                  <span className="cat-sidebar-dot" aria-hidden="true" />
                  <span className="cat-sidebar-name">{c.name}</span>
                  <span className="cat-sidebar-arrow" aria-hidden="true">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div className="cat-main">
          <div className="cat-grid">
            {categories.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
