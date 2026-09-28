import Link from 'next/link';

export default function EmptyState({ icon, title, text, href, action }) {
  return (
    <div className="empty">
      {icon && <div className="empty-ico" aria-hidden="true">{icon}</div>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {href && <Link href={href} className="btn btn-primary">{action}</Link>}
    </div>
  );
}
