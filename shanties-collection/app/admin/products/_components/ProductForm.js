'use client';

import { useState } from 'react';
import Link from 'next/link';
import { saveProduct, deleteProduct } from '../actions';

export default function ProductForm({ product, categories, subcategories, mode = 'new' }) {
  const [categoryId, setCategoryId] = useState(product?.category_id || '');
  const [saving, setSaving] = useState(false);

  const filteredSubs = subcategories.filter((s) => !categoryId || s.category_id === categoryId);

  return (
    <form
      action={saveProduct}
      onSubmit={() => setSaving(true)}
      className="product-form"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 720 }}
    >
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      <label className="field">
        <span>Name *</span>
        <input name="name" defaultValue={product?.name || ''} required maxLength={200} className="input" />
      </label>

      <label className="field">
        <span>Slug (URL) — leave blank to auto-generate</span>
        <input name="slug" defaultValue={product?.slug || ''} maxLength={200} className="input" placeholder="womens-leather-handbag" />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <label className="field">
          <span>Category</span>
          <select
            name="category_id"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input"
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Subcategory</span>
          <select name="subcategory_id" defaultValue={product?.subcategory_id || ''} className="input">
            <option value="">— None —</option>
            {filteredSubs.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <label className="field">
          <span>Price (KSh) *</span>
          <input name="price" type="number" min="0" step="0.01" defaultValue={product?.price ?? ''} required className="input" />
        </label>
        <label className="field">
          <span>Previous price</span>
          <input name="previous_price" type="number" min="0" step="0.01" defaultValue={product?.previous_price ?? ''} className="input" />
        </label>
        <label className="field">
          <span>Stock *</span>
          <input name="stock_quantity" type="number" min="0" step="1" defaultValue={product?.stock_quantity ?? 0} required className="input" />
        </label>
      </div>

      <label className="field">
        <span>Short description</span>
        <textarea name="description" rows="3" defaultValue={product?.description || ''} className="input" />
      </label>

      <label className="field">
        <span>Long details (optional)</span>
        <textarea name="details" rows="5" defaultValue={product?.details || ''} className="input" />
      </label>

      <label className="field">
        <span>Keywords (for search — comma separated)</span>
        <input name="keywords" defaultValue={product?.keywords || ''} className="input" placeholder="handbag purse tote" />
      </label>

      <fieldset style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem' }}>
        <legend style={{ padding: '0 .4rem', color: '#666', fontSize: '.85rem' }}>Visibility</legend>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <input type="checkbox" name="is_active" defaultChecked={product ? product.is_active : true} />
            Active
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured || false} />
            Featured
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <input type="checkbox" name="is_popular" defaultChecked={product?.is_popular || false} />
            Popular
          </label>
        </div>
      </fieldset>

      <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', marginTop: '.5rem' }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : mode === 'new' ? 'Create product' : 'Save changes'}
        </button>
        <Link href="/admin/products" className="btn btn-ghost">Cancel</Link>
      </div>

      {mode === 'edit' && (
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
          <details>
            <summary style={{ cursor: 'pointer', color: '#b00020', fontSize: '.9rem' }}>
              Danger zone
            </summary>
            <p style={{ color: '#666', fontSize: '.88rem', margin: '1rem 0' }}>
              Deleting this product is permanent and will remove it from all orders' references.
            </p>
            <button
              type="submit"
              formAction={deleteProduct}
              className="btn"
              style={{ background: '#fdecec', color: '#b00020', border: '1px solid #f5c2c7' }}
              onClick={(e) => { if (!confirm('Delete this product permanently?')) e.preventDefault(); }}
            >
              Delete product
            </button>
          </details>
        </div>
      )}
    </form>
  );
}
