'use client';

import { useRef, useState } from 'react';
import { uploadProductImage, deleteProductImage, setPrimaryImage } from '../actions';

export default function ImageUploader({ productId, images }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);

    const fd = new FormData();
    fd.append('product_id', productId);
    fd.append('file', file);

    // Form submission — server action will redirect
    const form = e.target.closest('form');
    if (form) form.submit();
  };

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
      <h3 style={{ marginTop: 0 }}>Product images</h3>

      {images.length === 0 ? (
        <p style={{ color: '#888' }}>No images yet. Upload the first one below.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {images.map((img) => (
            <div key={img.id} style={{
              border: img.is_primary ? '2px solid #1e7c45' : '1px solid #eee',
              borderRadius: 8,
              padding: '.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '.4rem',
              background: '#fff',
            }}>
              <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#f4f4f4', borderRadius: 6, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {img.is_primary && (
                  <span style={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    background: '#1e7c45',
                    color: '#fff',
                    fontSize: '.68rem',
                    padding: '.15rem .4rem',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}>PRIMARY</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '.25rem', fontSize: '.72rem' }}>
                {!img.is_primary && (
                  <form action={setPrimaryImage} style={{ flex: 1 }}>
                    <input type="hidden" name="image_id" value={img.id} />
                    <input type="hidden" name="product_id" value={productId} />
                    <button type="submit" className="link-btn" style={{ width: '100%' }}>Set primary</button>
                  </form>
                )}
                <form action={deleteProductImage} style={{ flex: 1 }}>
                  <input type="hidden" name="image_id" value={img.id} />
                  <input type="hidden" name="product_id" value={productId} />
                  <button
                    type="submit"
                    className="link-btn"
                    style={{ width: '100%', color: '#b00020' }}
                    onClick={(e) => { if (!confirm('Delete this image?')) e.preventDefault(); }}
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <form action={uploadProductImage} encType="multipart/form-data">
        <input type="hidden" name="product_id" value={productId} />

        <div style={{
          border: '2px dashed #ddd',
          borderRadius: 10,
          padding: '1.25rem',
          textAlign: 'center',
          background: '#fafafa',
        }}>
          <label style={{ cursor: 'pointer', display: 'block' }}>
            <input
              ref={fileRef}
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              required
              style={{ display: 'block', width: '100%', marginBottom: '.75rem' }}
            />
            <small style={{ color: '#888', display: 'block', marginBottom: '.5rem' }}>
              JPG, PNG, or WebP · Max 5MB
            </small>
          </label>

          {preview && (
            <div style={{ marginBottom: '.75rem' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt=""
                style={{ maxWidth: 180, maxHeight: 180, objectFit: 'cover', borderRadius: 8 }}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload image'}
          </button>
        </div>
      </form>
    </div>
  );
}
