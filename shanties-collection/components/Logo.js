import Link from 'next/link';

export default function Logo({ store }) {
  const name = store?.name || 'Shanties Collection';
  const src = store?.logo_url || '/logo.png';

  return (
    <Link
      href="/"
      aria-label={`${name} home`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}
    >
      <span
        style={{
          display: 'block',
          width: 52,
          height: 52,
          borderRadius: 10,
          backgroundColor: '#c9205c',
          backgroundImage: `url(${src})`,
          backgroundSize: 'auto 240%',
          backgroundPosition: '35% 60%',
          backgroundRepeat: 'no-repeat',
          boxShadow: '0 1px 4px rgba(0,0,0,.08)',
        }}
        role="img"
        aria-label={name}
      />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '.04em', color: '#2a1417' }}>
          SHANTIES
        </span>
        <span style={{ fontWeight: 600, fontSize: '.7rem', letterSpacing: '.3em', color: '#c9205c', marginTop: 3 }}>
          COLLECTION
        </span>
      </span>
    </Link>
  );
}
