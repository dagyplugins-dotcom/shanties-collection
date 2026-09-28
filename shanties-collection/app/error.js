'use client';

// Friendly fallback: customers never see raw server errors.
export default function Error({ reset }) {
  return (
    <div className="container page">
      <div className="empty">
        <h2>Something went wrong</h2>
        <p>Please check your internet connection and try again.</p>
        <button type="button" className="btn btn-primary" onClick={reset}>Try again</button>
      </div>
    </div>
  );
}
