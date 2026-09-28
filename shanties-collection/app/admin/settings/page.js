import { createClient } from '@/lib/supabase/server';
import { saveSettings } from './actions';

export const metadata = { title: 'Settings — Admin' };

const TABS = [
  { key: 'payments', label: 'Payments (M-Pesa)' },
  { key: 'contact', label: 'Contact' },
  { key: 'store', label: 'Store' },
  { key: 'social', label: 'Social' },
];

const SOCIAL_BASE = {
  facebook: 'https://facebook.com/',
  instagram: 'https://instagram.com/',
  tiktok: 'https://tiktok.com/@',
  x: 'https://x.com/',
  youtube: 'https://youtube.com/@',
};

function toUsername(fullUrl, base) {
  if (!fullUrl) return '';
  return String(fullUrl)
    .replace(base, '')
    .replace(/^https?:\/\/[^/]+\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '');
}

function SocialField({ label, name, value, prefix }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        border: '1px solid #ddd',
        borderRadius: 6,
        overflow: 'hidden',
        background: '#fff',
      }}>
        <span style={{
          padding: '.6rem .7rem',
          background: '#f6f6f6',
          borderRight: '1px solid #eee',
          color: '#666',
          fontSize: '.88rem',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
        }}>
          {prefix}
        </span>
        <input
          name={name}
          defaultValue={value}
          placeholder="username"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '.6rem .7rem',
            fontSize: '1rem',
            background: 'transparent',
          }}
        />
      </div>
    </label>
  );
}

export default async function AdminSettingsPage({ searchParams }) {
  const resolvedSearch = await Promise.resolve(searchParams);
  const tab = resolvedSearch?.tab || 'payments';

  const supabase = createClient();
  const { data: rows } = await supabase
    .from('admin_settings')
    .select('key, value')
    .in('key', ['payments', 'contact', 'store', 'social']);

  const settings = {};
  (rows || []).forEach((r) => { settings[r.key] = r.value || {}; });

  const payments = settings.payments || {};
  const contact = settings.contact || {};
  const store = settings.store || {};
  const social = settings.social || {};

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem 0' }}>Settings</h1>

      {resolvedSearch?.error && (
        <p className="alert err" role="alert" style={{ marginBottom: '1rem' }}>{resolvedSearch.error}</p>
      )}
      {resolvedSearch?.message && (
        <p className="alert ok" role="status" style={{ marginBottom: '1rem' }}>{resolvedSearch.message}</p>
      )}

      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`/admin/settings?tab=${t.key}`}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '.85rem', padding: '.4rem .85rem' }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {tab === 'payments' && (
        <form action={saveSettings} className="admin-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 560 }}>
          <input type="hidden" name="group" value="payments" />

          <fieldset style={{ border: '1px solid #eee', borderRadius: 8, padding: '1rem' }}>
            <legend style={{ padding: '0 .4rem', color: '#666', fontSize: '.85rem' }}>Payment methods</legend>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <input type="checkbox" name="stk_enabled" defaultChecked={payments.stk_enabled !== false} />
                Enable STK Push
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <input type="checkbox" name="manual_enabled" defaultChecked={payments.manual_enabled !== false} />
                Enable manual payment
              </label>
            </div>
          </fieldset>

          <label className="field">
            <span>Paybill number</span>
            <input name="paybill" defaultValue={payments.paybill || ''} placeholder="e.g. 247247" className="input" />
          </label>

          <label className="field">
            <span>Till number</span>
            <input name="till" defaultValue={payments.till || ''} placeholder="e.g. 5123456" className="input" />
          </label>

          <label className="field">
            <span>Business phone (for confirmation SMS)</span>
            <input name="business_phone" defaultValue={payments.business_phone || ''} placeholder="e.g. 0712 345 678" className="input" />
          </label>

          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', padding: '.75rem 1rem', borderRadius: 8, fontSize: '.85rem', color: '#8a6d00' }}>
            ⚠️ These are the <strong>public</strong> M-Pesa details shown to customers. Your <strong>API secrets</strong> (Consumer Key, Secret, Passkey) live in <code>.env.local</code> and are never edited here.
          </div>

          <button type="submit" className="btn btn-primary">Save payment settings</button>
        </form>
      )}

      {tab === 'contact' && (
        <form action={saveSettings} className="admin-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 560 }}>
          <input type="hidden" name="group" value="contact" />

          <label className="field">
            <span>Phone</span>
            <input name="phone" defaultValue={contact.phone || ''} placeholder="0712 345 678" className="input" />
          </label>

          <label className="field">
            <span>WhatsApp</span>
            <input name="whatsapp" defaultValue={contact.whatsapp || ''} placeholder="254712345678" className="input" />
          </label>

          <label className="field">
            <span>Email</span>
            <input name="email" type="email" defaultValue={contact.email || ''} placeholder="hello@shanties.com" className="input" />
          </label>

          <label className="field">
            <span>Business address</span>
            <input name="address" defaultValue={contact.address || ''} placeholder="e.g. Moi Avenue, Nairobi" className="input" />
          </label>

          <label className="field">
            <span>Business hours</span>
            <input name="hours" defaultValue={contact.hours || ''} placeholder="Mon-Sat 9am - 6pm" className="input" />
          </label>

          <button type="submit" className="btn btn-primary">Save contact info</button>
        </form>
      )}

      {tab === 'store' && (
        <form action={saveSettings} className="admin-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 560 }}>
          <input type="hidden" name="group" value="store" />

          <label className="field">
            <span>Store name</span>
            <input name="name" defaultValue={store.name || ''} className="input" />
          </label>

          <label className="field">
            <span>Short description</span>
            <textarea name="description" rows="3" defaultValue={store.description || ''} className="input" />
          </label>

          <button type="submit" className="btn btn-primary">Save store info</button>
        </form>
      )}

      {tab === 'social' && (
        <form action={saveSettings} className="admin-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 560 }}>
          <input type="hidden" name="group" value="social" />

          <p style={{ color: '#666', fontSize: '.88rem', marginTop: 0 }}>
            Just enter your <strong>username</strong>. We'll add the rest of the URL automatically.
          </p>

          <SocialField label="Facebook" name="facebook" value={toUsername(social.facebook, SOCIAL_BASE.facebook)} prefix="facebook.com/" />
          <SocialField label="Instagram" name="instagram" value={toUsername(social.instagram, SOCIAL_BASE.instagram)} prefix="instagram.com/" />
          <SocialField label="TikTok" name="tiktok" value={toUsername(social.tiktok, SOCIAL_BASE.tiktok)} prefix="tiktok.com/@" />
          <SocialField label="X (Twitter)" name="x" value={toUsername(social.x, SOCIAL_BASE.x)} prefix="x.com/" />
          <SocialField label="YouTube" name="youtube" value={toUsername(social.youtube, SOCIAL_BASE.youtube)} prefix="youtube.com/@" />

          <button type="submit" className="btn btn-primary">Save social links</button>
        </form>
      )}
    </div>
  );
}
