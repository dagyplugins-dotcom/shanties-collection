'use client';
import Image from 'next/image';
import { useRef, useState } from 'react';
import Icon from './Icon';

export default function ProductGallery({ images, name }) {
  const list = images?.length ? images : [null];
  const n = list.length;
  const track = useRef(null);
  const [i, setI] = useState(0);

  const go = (k) => {
    const el = track.current;
    if (el) el.scrollTo({ left: ((k + n) % n) * el.clientWidth, behavior: 'smooth' });
  };
  const onScroll = () => {
    const el = track.current;
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="gallery">
      <div className="g-main">
        <div className="g-track" ref={track} onScroll={onScroll} tabIndex={n > 1 ? 0 : undefined} aria-label={`${name} photos`}>
          {list.map((img, k) => (
            <div key={img?.id || k} className="g-slide">
              {img ? (
                <Image src={img.url} alt={img.alt || `${name} photo ${k + 1}`} fill priority={k === 0} sizes="(max-width: 900px) 100vw, 560px" className="cover" />
              ) : (
                <div className="ph" role="img" aria-label={name}><span>{name.trim().charAt(0).toUpperCase()}</span></div>
              )}
            </div>
          ))}
        </div>
        {n > 1 && (
          <>
            <button type="button" className="car-arrow prev" aria-label="Previous photo" onClick={() => go(i - 1)}><Icon name="left" /></button>
            <button type="button" className="car-arrow next" aria-label="Next photo" onClick={() => go(i + 1)}><Icon name="right" /></button>
            <div className="dots g-dots" aria-hidden="true">
              {list.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}
            </div>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="g-thumbs">
          {list.map((img, k) => (
            <button key={img.id} type="button" className={k === i ? 'on' : ''} onClick={() => go(k)} aria-label={`Show photo ${k + 1}`}>
              <Image src={img.url} alt="" fill sizes="72px" className="cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
