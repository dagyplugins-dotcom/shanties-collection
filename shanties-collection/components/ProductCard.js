import Link from 'next/link';
import ProductImage from './ProductImage';
import Rating from './Rating';
import AddToCartButton from './AddToCartButton';
import { formatKSh, discountPct, primaryImage, stockInfo } from '@/lib/utils';

export default function ProductCard({ product, priority = false }) {
  const img = primaryImage(product);
  const pct = discountPct(product.price, product.previous_price);
  const stock = stockInfo(product.stock_quantity);
  const href = `/products/${product.slug}`;
  return (
    <article className="pcard">
      <Link href={href} className="pcard-media" tabIndex={-1} aria-hidden="true">
        <ProductImage image={img} name={product.name} priority={priority} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
        {pct > 0 && <span className="badge badge-sale">{pct}% OFF</span>}
        {stock.tone === 'out' && <span className="badge badge-out">OUT OF STOCK</span>}
      </Link>
      <div className="pcard-body">
        <h3 className="pcard-name"><Link href={href}>{product.name}</Link></h3>
        {product.review_count > 0 && <Rating value={product.rating_avg} count={product.review_count} />}
        <div className="price-row">
          <span className="price">{formatKSh(product.price)}</span>
          {pct > 0 && <span className="was">Was {formatKSh(product.previous_price)}</span>}
        </div>
        {stock.tone === 'low' && <p className="stock low">{stock.label}</p>}
        <AddToCartButton
          product={{ id: product.id, slug: product.slug, name: product.name, price: Number(product.price), image: img?.url || null, stock: product.stock_quantity }}
        />
      </div>
    </article>
  );
}
