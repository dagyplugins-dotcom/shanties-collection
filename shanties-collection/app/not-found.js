import EmptyState from '@/components/EmptyState';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="container page">
      <EmptyState title="We couldn't find that page" text="It may have moved, or the product may no longer be available." href="/categories" action="Browse categories" />
    </div>
  );
}
