'use client';

import { useState } from 'react';
import { saveBanner, deleteBanner, deleteBannerImage } from '../actions';

export default function BannerCard({ banner }) {
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(null);

  return (
    <div className="admin-panel" style={{ marginBottom: '1rem', padding: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: '1rem', alignItems: 'start' }}>
        <div style={{
          aspectRatio: '16 / 9',
          background: '#f4f4f4',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#aaa',
          fontSize: '.8rem',
          position: 'relative',
        }}>
          {preview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : banner.image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={banner.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            'No image'
          )}
        </div>

        <div>
          <strong style={{ display: 'block', fontSize: '1rem' }}>{banner.title || '(no title)'}</strong>
          <p style={{ color: '#666', fontSize: '.85rem', margin: '.25rem 0' }}>{banner.subtitle || ''}</p>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.35rem' }}>
            {banner.button_text && (
              <span style={{ fontSize: '.78rem', background: '#f0f0f0', padding: '.15rem .5rem', borderRadius: 4 }}>
                Button: {banner.button_text} → {banner.button_link}
              </span>
            )}
            <span className={`pill pill-${banner.is_active ? 'ok' : 'bad'}`}>
              {banner.is_active ? 'Active' : 'Hidden'}
            </span>
            <span style={{ fontSize: '.78rem', color: '#888' }}>Order: {banner.sort_order}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', alignItems: 'flex-end' }}>
          <button type="button" onClick={() => setEditing((e) => !e)} className="btn btn-ghost" style={{ fontSize: '.82rem', padding: '.3rem .6rem' }}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {editing && (
        <form
          action={saveBanner}
          encType="multipart/form-data"
          style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee', display: 'grid', gap: '.75rem' }}
        >
          <input type="hidden" name="id" value={banner.id} />

          <label className="field">
            <span>Title</span>
            <input name="title" defaultValue={banner.title || ''} className="input" />
          </label>

          <label className="field">
            <span>Subtitle</span>
            <input name="subtitle" defaultValue={banner.subtitle || ''} className="input" />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <label className="field">
              <span>Button text</span>
              <input name="button_text" defaultValue={banner.button_text || ''} placeholder="Shop now" className="input" />
            </label>
            <label className="field">
              <span>Button link</span>
              <input name="button_link" defaultValue={banner.button_link || ''} placeholder="/categories" className="input" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <label className="field">
              <span>Sort order</span>
              <input name="sort_order" type="number" defaultValue={banner.sort_order} className="input" />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', alignSelf: 'end', paddingBottom: '.5rem' }}>
              <input type="checkbox" name="is_active" defaultChecked={banner.is_active} />
              Active
            </label>
          </div>

          <label className="field">
            <span>Replace image (optional)</span>
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setPreview(f ? URL.createObjectURL(f) : null);
              }}
              style={{ padding: '.4rem 0' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary">Save banner</button>
          </div>
        </form>
      )}

      {editing && (
        <div style={{ marginTop: '.75rem', display: 'flex', gap: '1rem', fontSize: '.85rem' }}>
          {banner.image_url && (
            <form action={deleteBannerImage}>
              <input type="hidden" name="id" value={banner.id} />
              <button type="submit" className="link-btn" style={{ color: '#8a6d00' }}>Remove image</button>
            </form>
          )}
          <form action={deleteBanner}>
            <input type="hidden" name="id" value={banner.id} />
            <button
              type="submit"
              className="link-btn"
              style={{ color: '#b00020' }}
              onClick={(e) => { if (!confirm('Delete this banner permanently?')) e.preventDefault(); }}
            >
              Delete banner
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
