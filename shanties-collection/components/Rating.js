import Icon from './Icon';

export default function Rating({ value = 0, count = 0, size = 14 }) {
  const r = Math.round(Number(value));
  return (
    <div className="rating" role="img" aria-label={`Rated ${Number(value).toFixed(1)} out of 5 from ${count} reviews`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} fill={n <= r ? 'currentColor' : 'none'} />
      ))}
      {count > 0 && <span>({count})</span>}
    </div>
  );
}
