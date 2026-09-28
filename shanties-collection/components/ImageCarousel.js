'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';

const FALLBACK = [{ id: 'welcome', title: 'Welcome to Shanties Collection', subtitle: 'Fashion, beauty, home and more, delivered across Kenya', button_text: 'Shop now', button_link: '/categories' }];

export default function ImageCarousel({ banners }) {
  const slides = banners?.length ? banners : FALLBACK;
  const n = slides.length;
  const track = useRef(null);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);

  const go = useCallback((k) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: ((k + n) % n) * el.clientWidth, behavior: 'smooth' });
  }, [n]);

  const onScroll = () => {
    const el = track.current;
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth));
  };

  // Auto-rotate; pauses on hover/touch/focus, via the pause button, and for reduced-motion users.
  useEffect(() => {
    if (!playing || held || n < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => go(i + 1), 5500);
    return () => clearTimeout(t);
  }, [i, playing, held, n, go]);

  return (
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-label="Promotions"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <div className="slides" ref={track} onScroll={onScroll} tabIndex={0} aria-live={playing && !held ? 'off' : 'polite'}>
        {slides.map((s, k) => (
          <div key={s.id} className={`slide${s.image_url ? '' : ' kanga'}`} role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`}>
            {s.image_url && (
              <Image src={s.image_url} alt="" fill priority={k === 0} sizes="100vw" className="cover" />
            )}
            {(s.title || s.subtitle || s.button_text) && (
              <div className={`slide-text${s.image_url ? ' on-image' : ''}`}>
                {s.title && <h2>{s.title}</h2>}
                {s.subtitle && <p>{s.subtitle}</p>}
                {s.button_text && s.button_link && <Link href={s.button_link} className="btn btn-sun">{s.button_text}</Link>}
              </div>
            )}
          </div>
        ))}
      </div>
      {n > 1 && (
        <>
          <button type="button" className="car-arrow prev" aria-label="Previous banner" onClick={() => go(i - 1)}><Icon name="left" /></button>
          <button type="button" className="car-arrow next" aria-label="Next banner" onClick={() => go(i + 1)}><Icon name="right" /></button>
          <div className="car-ctrl">
            <button type="button" className="car-play" aria-label={playing ? 'Pause banner rotation' : 'Play banner rotation'} onClick={() => setPlaying((p) => !p)}>
              <Icon name={playing ? 'pause' : 'play'} size={14} />
            </button>
            <div className="dots">
              {slides.map((s, k) => (
                <button key={s.id} type="button" className={k === i ? 'on' : ''} aria-label={`Go to banner ${k + 1}`} aria-current={k === i} onClick={() => go(k)} />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
