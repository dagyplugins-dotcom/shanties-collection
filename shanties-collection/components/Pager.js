import Link from 'next/link';

export default function Pager({ page, total, pageSize, basePath, params = {} }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const href = (p) => {
    const q = new URLSearchParams();
    Object.entries({ ...params, page: p > 1 ? p : '' }).forEach(([k, v]) => { if (v) q.set(k, v); });
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 ? <Link className="btn btn-ghost" href={href(page - 1)} rel="prev">Previous</Link> : <span />}
      <span>Page {page} of {pages}</span>
      {page < pages ? <Link className="btn btn-ghost" href={href(page + 1)} rel="next">Next</Link> : <span />}
    </nav>
  );
}
