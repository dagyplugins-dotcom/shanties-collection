'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';

export default function SearchBar({ initial = '' }) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState(initial);
  const [res, setRes] = useState(null);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) { setRes(null); return; }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch('/api/search/suggest?q=' + encodeURIComponent(t), { signal: ctrl.signal });
        if (r.ok) setRes(await r.json());
      } catch {}
    }, 250);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [q]);

  useEffect(() => {
    const h = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, []);

  function submit(e) {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    setOpen(false);
    router.push('/search?q=' + encodeURIComponent(t));
  }

  const hasSuggestions = res && (res.products.length || res.categories.length);

  return (
    <div className="search" ref={box}>
      <form role="search" onSubmit={submit}>
        <label htmlFor={id} className="sr-only">Search products</label>
        <span className="search-ico"><Icon name="search" size={20} /></span>
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search products, categories…"
          autoComplete="off"
          enterKeyHint="search"
          maxLength={60}
        />
        {q && (
          <button type="button" className="search-clear" aria-label="Clear search" onClick={() => { setQ(''); setRes(null); if (initial) router.push('/categories'); }}>
            <Icon name="x" size={18} />
          </button>
        )}
        <button type="submit" className="search-go">Search</button>
      </form>
      {open && hasSuggestions && (
        <ul className="suggest" aria-label="Suggestions">
          {res.categories.map((c) => (
            <li key={c.href}><Link href={c.href} onClick={() => setOpen(false)}><span className="sg-tag">In category</span>{c.name}</Link></li>
          ))}
          {res.products.map((p) => (
            <li key={p.slug}><Link href={`/products/${p.slug}`} onClick={() => setOpen(false)}>{p.name}</Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}
