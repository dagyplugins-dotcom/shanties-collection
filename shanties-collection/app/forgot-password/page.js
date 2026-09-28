import Link from 'next/link';
import { requestReset } from '../auth/actions';

export const metadata = { title: 'Reset password', robots: { index: false } };

export default function Forgot({ searchParams }) {
  return (
    <div className="container page narrow">
      <div className="auth-card">
        <h1>Reset your password</h1>
        <p className="muted">Enter your email and we&apos;ll send you a link to choose a new password.</p>
        {searchParams.message && <p className="alert ok" role="status">{searchParams.message}</p>}
        {searchParams.error && <p className="alert err" role="alert">{searchParams.error}</p>}
        <form action={requestReset} className="form">
          <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
          <button className="btn btn-primary btn-block btn-lg" type="submit">Send reset link</button>
        </form>
        <p className="auth-links"><Link href="/login">Back to log in</Link></p>
      </div>
    </div>
  );
}
