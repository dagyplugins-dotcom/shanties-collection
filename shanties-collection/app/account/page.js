import { requireUser } from '@/lib/auth';
import { signOut, updateProfile } from '../auth/actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My account', robots: { index: false } };

const SOON = ['My Orders', 'Wishlist', 'My Addresses', 'Payment Methods', 'Delivery Tracking', 'My Reviews', 'Notifications', 'Help & Support'];

export default async function Account({ searchParams }) {
  const { user, profile } = await requireUser('/account');
  return (
    <div className="container page narrow">
      <h1>My account</h1>
      {searchParams.message && <p className="alert ok" role="status">{searchParams.message}</p>}
      {searchParams.error && <p className="alert err" role="alert">{searchParams.error}</p>}

      <section className="auth-card">
        <h2>My profile</h2>
        <form action={updateProfile} className="form">
          <label className="field"><span>Full name</span><input name="full_name" defaultValue={profile?.full_name || ''} required minLength={2} maxLength={80} /></label>
          <label className="field"><span>Email</span><input value={user.email || ''} readOnly aria-readonly="true" /></label>
          <label className="field"><span>Phone number (M-Pesa)</span><input name="phone" type="tel" inputMode="tel" defaultValue={profile?.phone || ''} required /></label>
          <button className="btn btn-primary" type="submit">Save changes</button>
        </form>
      </section>

      <section className="auth-card">
        <h2>Coming in the next step</h2>
        <ul className="soon">{SOON.map((s) => <li key={s}>{s}</li>)}</ul>
      </section>

      <form action={signOut}><button className="btn btn-ghost btn-block" type="submit">Log out</button></form>
    </div>
  );
}
