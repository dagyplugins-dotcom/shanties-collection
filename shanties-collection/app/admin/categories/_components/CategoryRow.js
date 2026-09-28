'use client';

import { useState } from 'react';
import { saveCategory, deleteCategory, saveSubcategory, deleteSubcategory } from '../actions';

export default function CategoryRow({ category, subcategories }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingSub, setAddingSub] = useState(false);

  return (
    <div className="admin-panel" style={{ marginBottom: '.75rem', padding: '1rem' }}>
      {/* ─── Category header row ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="link-btn"
          style={{ fontSize: '1rem', minWidth: '1.2rem' }}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open ? '▾' : '▸'}
        </button>

        <strong style={{ fontSize: '1.05rem', flex: 1 }}>{category.name}</strong>

        <span style={{ color: '#888', fontSize: '.82rem' }}>
          {subcategories.length} subcategor{subcategories.length === 1 ? 'y' : 'ies'}
        </span>

        <span className={`pill pill-${category.is_active ? 'ok' : 'bad'}`}>
          {category.is_active ? 'Active' : 'Hidden'}
        </span>

        <button type="button" onClick={() => setEditing((e) => !e)} className="btn btn-ghost" style={{ fontSize: '.82rem', padding: '.3rem .6rem' }}>
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* ─── Edit category form ─── */}
      {editing && (
        <form action={saveCategory} style={{ marginTop: '1rem', padding: '.75rem', background: '#fafafa', borderRadius: 8, display: 'grid', gap: '.6rem' }}>
          <input type="hidden" name="id" value={category.id} />
          <input name="name" defaultValue={category.name} required className="input" placeholder="Category name" />
          <input name="slug" defaultValue={category.slug} className="input" placeholder="slug (optional)" />
          <input name="description" defaultValue={category.description || ''} className="input" placeholder="Description (optional)" />
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="field" style={{ flex: 1, minWidth: 100 }}>
              <span style={{ fontSize: '.82rem' }}>Sort order</span>
              <input name="sort_order" type="number" defaultValue={category.sort_order} className="input" />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              <input type="checkbox" name="is_active" defaultChecked={category.is_active} />
              Active
            </label>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      )}

      {/* ─── Subcategories ─── */}
      {open && (
        <div style={{ marginTop: '1rem', paddingLeft: '1.5rem', borderLeft: '2px solid #f0f0f0' }}>
          {subcategories.length === 0 && !addingSub && (
            <p style={{ color: '#888', fontSize: '.9rem', margin: '.5rem 0' }}>No subcategories yet.</p>
          )}

          {subcategories.map((s) => (
            <SubcategoryRow key={s.id} sub={s} />
          ))}

          {addingSub ? (
            <form action={saveSubcategory} style={{ marginTop: '.75rem', padding: '.75rem', background: '#f9f9f9', borderRadius: 8, display: 'grid', gap: '.5rem' }}>
              <input type="hidden" name="category_id" value={category.id} />
              <input name="name" required placeholder="Subcategory name" className="input" />
              <input name="slug" placeholder="slug (optional)" className="input" />
              <input name="sort_order" type="number" defaultValue={subcategories.length} className="input" />
              <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.9rem' }}>
                <input type="checkbox" name="is_active" defaultChecked />
                Active
              </label>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '.85rem', padding: '.4rem .8rem' }}>Add subcategory</button>
                <button type="button" onClick={() => setAddingSub(false)} className="btn btn-ghost" style={{ fontSize: '.85rem', padding: '.4rem .8rem' }}>Cancel</button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setAddingSub(true)} className="btn btn-ghost" style={{ marginTop: '.5rem', fontSize: '.85rem', padding: '.35rem .7rem' }}>
              + Add subcategory
            </button>
          )}
        </div>
      )}

      {/* ─── Danger zone ─── */}
      {editing && (
        <form action={deleteCategory} style={{ marginTop: '.75rem' }}>
          <input type="hidden" name="id" value={category.id} />
          <button
            type="submit"
            className="link-btn"
            style={{ color: '#b00020', fontSize: '.85rem' }}
          >
            Delete category
          </button>
        </form>
      )}
    </div>
  );
}

function SubcategoryRow({ sub }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form action={saveSubcategory} style={{ padding: '.6rem', background: '#f9f9f9', borderRadius: 6, marginBottom: '.35rem', display: 'grid', gap: '.5rem' }}>
        <input type="hidden" name="id" value={sub.id} />
        <input type="hidden" name="category_id" value={sub.category_id} />
        <input name="name" defaultValue={sub.name} required className="input" />
        <input name="slug" defaultValue={sub.slug} className="input" />
        <input name="sort_order" type="number" defaultValue={sub.sort_order} className="input" />
        <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem' }}>
          <input type="checkbox" name="is_active" defaultChecked={sub.is_active} />
          Active
        </label>
        <div style={{ display: 'flex', gap: '.4rem' }}>
          <button type="submit" className="btn btn-primary" style={{ fontSize: '.82rem', padding: '.35rem .7rem' }}>Save</button>
          <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost" style={{ fontSize: '.82rem', padding: '.35rem .7rem' }}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '.6rem',
      padding: '.4rem .6rem',
      borderRadius: 6,
      marginBottom: '.25rem',
      flexWrap: 'wrap',
    }}>
      <span style={{ flex: 1 }}>{sub.name}</span>
      <small style={{ color: '#aaa' }}>/{sub.slug}</small>
      {!sub.is_active && <span className="pill pill-bad" style={{ fontSize: '.68rem' }}>Hidden</span>}

      <button type="button" onClick={() => setEditing(true)} className="link-btn" style={{ fontSize: '.8rem' }}>Edit</button>
      <form action={deleteSubcategory} style={{ display: 'inline' }}>
        <input type="hidden" name="id" value={sub.id} />
        <button type="submit" className="link-btn" style={{ color: '#b00020', fontSize: '.8rem' }}>Delete</button>
      </form>
    </div>
  );
}
