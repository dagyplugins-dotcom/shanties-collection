import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatKSh } from '@/lib/utils';
import { saveZone, deleteZone } from './actions';

export const metadata = { title: 'Delivery — Admin' };

export default async function AdminDeliveryPage({ searchParams }) {
  const resolvedSearch = await Promise.resolve(searchParams);

  const supabase = createClient();
  const { data: zones } = await supabase
    .from('delivery_zones')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('county', { ascending: true });

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0' }}>Delivery zones</h1>

      {resolvedSearch?.error && (
        <p className="alert err" role="alert" style={{ marginBottom: '1rem' }}>{resolvedSearch.error}</p>
      )}
      {resolvedSearch?.message && (
        <p className="alert ok" role="status" style={{ marginBottom: '1rem' }}>{resolvedSearch.message}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        <section className="admin-panel">
          <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Existing zones</h2>
          {!zones || zones.length === 0 ? (
            <p style={{ color: '#888' }}>No zones yet. Add one on the right.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>County</th>
                  <th>Town</th>
                  <th>Fee</th>
                  <th>ETA</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id}>
                    <td><strong>{z.county}</strong></td>
                    <td>{z.town || '—'}</td>
                    <td>{formatKSh(z.fee)}</td>
                    <td>{z.eta || '—'}</td>
                    <td>
                      <span className={`pill pill-${z.is_enabled ? 'ok' : 'bad'}`}>
                        {z.is_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <form action={deleteZone} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={z.id} />
                        <button
                          type="submit"
                          className="link-btn"
                          style={{ color: '#b00020' }}
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="admin-panel">
          <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Add new zone</h2>
          <form action={saveZone} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label className="field">
              <span>County *</span>
              <input name="county" required placeholder="e.g. Nairobi" className="input" />
            </label>

            <label className="field">
              <span>Town / Area (optional)</span>
              <input name="town" placeholder="e.g. Westlands" className="input" />
            </label>

            <label className="field">
              <span>Delivery fee (KSh) *</span>
              <input name="fee" type="number" min="0" step="1" defaultValue="0" required className="input" />
            </label>

            <label className="field">
              <span>ETA / delivery time</span>
              <input name="eta" placeholder="e.g. 1-2 days" className="input" />
            </label>

            <label className="field">
              <span>Sort order</span>
              <input name="sort_order" type="number" defaultValue="0" className="input" />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <input type="checkbox" name="is_enabled" defaultChecked />
              Enabled (visible to customers)
            </label>

            <button type="submit" className="btn btn-primary">Add zone</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
