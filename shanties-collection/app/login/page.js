import Link from 'next/link';
import { signIn } from '../auth/actions';
import { safeNext } from '@/lib/utils';

export const metadata = { title: 'Log in', robots: { index: false } };

export default function Login({ searchParams }) {
  const next = safeNext(searchParams.next);
  return (
    <div className="container page narrow">
      <div className="auth-card">
        <h1>Log in</h1>
        {searchParams.message && <p className="alert ok" role="status">{searchParams.message}</p>}
        {searchParams.error && <p className="alert err" role="alert">{searchParams.error}</p>}
        <form action={signIn} className="form">
          <input type="hidden" name="next" value={next} />
          <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
          <label className="field"><span>Password</span><input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="btn btn-primary btn-block btn-lg" type="submit">Log in</button>
        </form>
        <p className="auth-links"><Link href="/forgot-password">Forgot your password?</Link></p>
        <p className="auth-links">New here? <Link href="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
