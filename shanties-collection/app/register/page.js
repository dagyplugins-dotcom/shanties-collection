import Link from 'next/link';
import { signUp } from '../auth/actions';

export const metadata = { title: 'Create account', robots: { index: false } };

export default function Register({ searchParams }) {
  return (
    <div className="container page narrow">
      <div className="auth-card">
        <h1>Create your account</h1>
        {searchParams.error && <p className="alert err" role="alert">{searchParams.error}</p>}
        <form action={signUp} className="form">
          <label className="field"><span>Full name</span><input name="full_name" autoComplete="name" required minLength={2} maxLength={80} /></label>
          <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
          <label className="field"><span>Phone number (M-Pesa)</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" required /></label>
          <label className="field"><span>Password</span><input name="password" type="password" autoComplete="new-password" required minLength={8} /><small>At least 8 characters.</small></label>
          <button className="btn btn-primary btn-block btn-lg" type="submit">Create account</button>
        </form>
        <p className="auth-links">Already have an account? <Link href="/login">Log in</Link></p>
      </div>
    </div>
  );
}
