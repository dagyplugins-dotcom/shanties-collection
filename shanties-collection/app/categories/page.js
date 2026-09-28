import Link from 'next/link';
import { getCategories } from '@/lib/data';
import EmptyState from '@/components/EmptyState';

export const revalidate = 60;
export const metadata = { title: 'Shop by category', description: 'Browse every category at Shanties Collection.' };

export default async function Categories() {
  const categories = await getCategories();
  return (
    <div className="container page">
      <h1>Categories</h1>
      {categories.length === 0 ? (
        <EmptyState title="No categories yet" text="Categories will appear here once the store is set up." href="/" action="Back to home" />
      ) : (
        <div className="cat-list">
          {categories.map((c) => (
            <section key={c.id} className="cat-block" aria-labelledby={`c-${c.slug}`}>
              <h2 id={`c-${c.slug}`}><Link href={`/category/${c.slug}`}>{c.name}</Link></h2>
              <ul className="chips-static">
                {c.subcategories.map((s) => (
                  <li key={s.id}><Link href={`/category/${c.slug}?sub=${s.slug}`}>{s.name}</Link></li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
