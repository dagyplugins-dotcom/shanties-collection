import Link from 'next/link';
import Image from 'next/image';

export default function CategoryCard({ category }) {
  const subs = (category.subcategories || []).slice(0, 3).map((s) => s.name).join(', ');

  return (
    <Link href={`/category/${category.slug}`} className="cat-tile">
      <span className="cat-tile-media">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 900px) 30vw, 220px"
            className="cover"
          />
        ) : (
          <span className="cat-tile-ph" aria-hidden="true">
            {category.name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="cat-tile-text">
        <strong>{category.name}</strong>
        {subs && <small>{subs}</small>}
      </span>
    </Link>
  );
}
