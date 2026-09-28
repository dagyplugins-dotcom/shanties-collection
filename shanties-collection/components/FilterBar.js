'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function FilterBar({ basePath, subs, sub, sort, min, max }) {
  const router = useRouter();
  const [lo, setLo] = useState(min || '');
  const [hi, setHi] = useState(max || '');

  function url(next) {
    const p = new URLSearchParams();
    const v = { sub, sort, min: lo, max: hi, ...next };
    Object.entries(v).forEach(([k, val]) => { if (val) p.set(k, val); });
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  }

  return (
    <div className="filters">
      {subs.length > 0 && (
        <div className="chips" role="list" aria-label="Subcategories">
          <Link role="listitem" href={url({ sub: '' })} className={!sub ? 'on' : ''}>All</Link>
          {subs.map((s) => (
            <Link role="listitem" key={s.id} href={url({ sub: s.slug })} className={sub === s.slug ? 'on' : ''}>{s.name}</Link>
          ))}
        </div>
      )}
      <div className="filter-row">
        <label className="field-inline">
          <span>Sort</span>
          <select value={sort || 'featured'} onChange={(e) => router.push(url({ sort: e.target.value === 'featured' ? '' : e.target.value }))}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </label>
        <form className="price-filter" onSubmit={(e) => { e.preventDefault(); router.push(url({})); }}>
          <label><span className="sr-only">Minimum price in KSh</span><input inputMode="numeric" pattern="[0-9]*" placeholder="Min KSh" value={lo} onChange={(e) => setLo(e.target.value.replace(/\D/g, ''))} /></label>
          <label><span className="sr-only">Maximum price in KSh</span><input inputMode="numeric" pattern="[0-9]*" placeholder="Max KSh" value={hi} onChange={(e) => setHi(e.target.value.replace(/\D/g, ''))} /></label>
          <button type="submit" className="btn btn-ghost btn-sm">Apply</button>
        </form>
      </div>
    </div>
  );
}
