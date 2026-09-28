import Link from 'next/link';

export default function Logo({ store }) {
  const name = store?.name || 'Shanties Collection';
  const [first, ...rest] = name.split(' ');
  return (
    <Link href="/" className="logo" aria-label={`${name} home`}>
      {store?.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.logo_url} alt={name} className="logo-img" height="40" />
      ) : (
        <>
          <span className="logo-mark" aria-hidden="true">{first.charAt(0).toUpperCase()}</span>
          <span className="logo-text">
            <span className="logo-a">{first.toUpperCase()}</span>
            {rest.length > 0 && <span className="logo-b">{rest.join(' ').toUpperCase()}</span>}
          </span>
        </>
      )}
    </Link>
  );
}
