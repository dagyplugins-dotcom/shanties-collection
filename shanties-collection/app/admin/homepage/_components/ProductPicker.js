'use client';

import { useState } from 'react';
import { updateFeaturedPopular } from '../actions';

export default function ProductPicker({ mode, products, selectedIds }) {
  const [selected, setSelected] = useState(new Set(selectedIds));
  const [search, setSearch] = useState('');

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <form action={updateFeaturedPopular}>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="all_ids" value={JSON.stringify(products.map((p) => p.id))} />

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ flex: 1, minWidth: 200 }}
        />
        <span style={{ alignSelf: 'center', color: '#666', fontSize: '.9rem' }}>
          {selected.size} selected
        </span>
      </div>

      <div className="admin-table-wrap" style={{ maxHeight: 500, overflowY: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>✓</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const checked = selected.has(p.id);
              return (
                <tr key={p.id} style={{ background: checked ? '#f0faf4' : undefined }}>
                  <td>
                    <input
                      type="checkbox"
                      name="selected"
                      value={p.id}
                      checked={checked}
                      onChange={() => toggle(p.id)}
                    />
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.category_name || '—'}</td>
                  <td>{p.price_display}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', position: 'sticky', bottom: 0, background: '#fff', paddingTop: '.75rem' }}>
        <button type="submit" className="btn btn-primary">
          Save {mode} selection
        </button>
      </div>
    </form>
  );
}
