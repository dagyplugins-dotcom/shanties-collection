import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatKSh } from '@/lib/utils';

export default async function AdminProductsPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, name, slug, price, previous_price, stock_quantity,
      is_active, is_featured, is_popular, created_at,
      categories ( name ),
      subcategories ( name ),
      product_images ( url, is_primary )
    `)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Products</h1>
        <Link href="/admin/products/new" className="btn btn-primary">+ Add product</Link>
      </div>

      {!products || products.length === 0 ? (
        <div className="admin-table-wrap" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#888' }}>No products yet.</p>
          <Link href="/admin/products/new" className="btn btn-primary">Add your first product</Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const primary = p.product_images?.find((i) => i.is_primary) || p.product_images?.[0];
                return (
                  <tr key={p.id}>
                    <td>
                      {primary?.url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={primary.url}
                          alt=""
                          width={44}
                          height={44}
                          style={{ objectFit: 'cover', borderRadius: 6, display: 'block' }}
                        />
                      ) : (
                        <span style={{ display: 'inline-block', width: 44, height: 44, background: '#eee', borderRadius: 6, textAlign: 'center', lineHeight: '44px', color: '#999' }}>
                          ?
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{p.name}</strong>
                      <br />
                      <small style={{ color: '#888' }}>/{p.slug}</small>
                    </td>
                    <td>
                      {p.categories?.name || '—'}
                      {p.subcategories?.name ? <><br /><small style={{ color: '#888' }}>{p.subcategories.name}</small></> : null}
                    </td>
                    <td>
                      {formatKSh(p.price)}
                      {p.previous_price ? (
                        <>
                          <br />
                          <small style={{ textDecoration: 'line-through', color: '#999' }}>{formatKSh(p.previous_price)}</small>
                        </>
                      ) : null}
                    </td>
                    <td>
                      {p.stock_quantity > 0 ? p.stock_quantity : <span style={{ color: '#b00020' }}>Out of stock</span>}
                    </td>
                    <td>
                      <span className={`pill pill-${p.is_active ? 'ok' : 'bad'}`}>
                        {p.is_active ? 'Active' : 'Hidden'}
                      </span>
                      {p.is_featured && <span className="pill pill-wait" style={{ marginLeft: 4 }}>Featured</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/admin/products/${p.id}`} className="btn btn-ghost">Edit</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
