import Link from 'next/link';
import Image from 'next/image';

const TONES = ['t1', 't2', 't3', 't4', 't5', 't6'];

export default function CategoryCard({ category, index = 0 }) {
  const subs = (category.subcategories || []).slice(0, 3).map((s) => s.name).join(', ');
  return (
    <Link href={`/category/${category.slug}`} className={`ccard ${TONES[index % TONES.length]}`}>
      {category.image_url && <Image src={category.image_url} alt="" fill sizes="(max-width: 640px) 50vw, 200px" className="cover" />}
      <span className="ccard-text">
        <strong>{category.name}</strong>
        {subs && <small>{subs}</small>}
      </span>
    </Link>
  );
}
