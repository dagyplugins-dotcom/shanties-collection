import { redirect } from 'next/navigation';
import { updatePassword } from '../auth/actions';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Choose a new password', robots: { index: false } };

export default async function ResetPassword({ searchParams }) {
  const user = await getUser();
  if (!user) redirect(`/forgot-password?error=${encodeURIComponent('That link has expired. Request a new one.')}`);
  return (
    <div className="container page narrow">
      <div className="auth-card">
        <h1>Choose a new password</h1>
        {searchParams.error && <p className="alert err" role="alert">{searchParams.error}</p>}
        <form action={updatePassword} className="form">
          <label className="field"><span>New password</span><input name="password" type="password" autoComplete="new-password" required minLength={8} /><small>At least 8 characters.</small></label>
          <button className="btn btn-primary btn-block btn-lg" type="submit">Save password</button>
        </form>
      </div>
    </div>
  );
}
