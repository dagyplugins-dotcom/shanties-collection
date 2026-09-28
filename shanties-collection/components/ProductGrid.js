import ProductCard from './ProductCard';

export default function ProductGrid({ products, priorityCount = 2 }) {
  return (
    <div className="pgrid">
      {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < priorityCount} />)}
    </div>
  );
}
