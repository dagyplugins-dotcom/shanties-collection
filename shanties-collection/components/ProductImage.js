import Image from 'next/image';

// Lazy-loaded, responsive product photo. Shows a neat placeholder until the owner uploads a photo.
export default function ProductImage({ image, name, sizes, priority = false }) {
  if (!image?.url) {
    return (
      <div className="ph" role="img" aria-label={name}>
        <span>{name.trim().charAt(0).toUpperCase()}</span>
      </div>
    );
  }
  return <Image src={image.url} alt={image.alt || name} fill sizes={sizes} priority={priority} className="cover" />;
}
