import { useEffect, useRef, useState } from 'react';
import { ProductImage } from '../ui';
import type { HeroSlide } from '../../types';
import styles from './HeroCarousel.module.css';

interface HeroCarouselProps {
  slides: HeroSlide[];
  onCtaClick: (ctaPage: string) => void;
  intervalMs?: number;
}

// Slides con fondo crema/amarillo/violeta claro usan puntos oscuros — el resto
// (morado, naranjo, violeta oscuro) usa puntos claros. Igual que el original.
const LIGHT_BG_SLIDES = new Set(['#F2E0CC', '#FAB405', '#DEDDF2']);

// Carrusel de hero de la Home — autoplay + flechas + dots, con fade al cambiar
// de slide. Reemplaza el HERO_SLIDES / advanceHero() del original.
export function HeroCarousel({ slides, onCtaClick, intervalMs = 5500 }: HeroCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToSlide = (next: number) => {
    setFading(true);
    setTimeout(() => {
      setActiveSlide(next);
      setFading(false);
    }, 350);
  };

  const restartTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActiveSlide((prev) => (prev + 1) % slides.length);
        setFading(false);
      }, 350);
    }, intervalMs);
  };

  useEffect(() => {
    restartTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, intervalMs]);

  const handlePrev = () => {
    restartTimer();
    goToSlide((activeSlide - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    restartTimer();
    goToSlide((activeSlide + 1) % slides.length);
  };

  const handleDot = (idx: number) => {
    if (idx === activeSlide) return;
    restartTimer();
    goToSlide(idx);
  };

  const slide = slides[activeSlide];
  if (!slide) return null;

  const isLightBg = LIGHT_BG_SLIDES.has(slide.bg);

  return (
    <div className={styles.hero} style={{ background: slide.bg }}>
      <div aria-hidden="true" className={styles.watermark} style={{ color: slide.wmColor }}>
        olffy
      </div>

      <div className={`${styles.content} ${fading ? styles.contentFading : ''}`}>
        <div className={styles.textCol}>
          <p className={styles.eyebrow} style={{ color: slide.mutedColor }}>
            {slide.eyebrow}
          </p>
          <h1 className={styles.headline}>
            <span className={styles.serif} style={{ color: slide.textColor }}>
              {slide.serif}
            </span>
            <span className={styles.display} style={{ color: slide.textColor }}>
              {slide.display}
            </span>
          </h1>
          <p className={styles.subtitle} style={{ color: slide.mutedColor }}>
            {slide.subtitle}
          </p>
          <button
            type="button"
            className={styles.cta}
            style={{ background: slide.ctaBg, color: slide.ctaColor }}
            onClick={() => onCtaClick(slide.ctaPage)}
          >
            {slide.cta}
          </button>
        </div>

        <div className={styles.visualCol}>
          <div className={styles.visualFrame}>
            <div className={styles.visualBox}>
              <ProductImage bg={slide.bg} shape="rounded" aspectRatio="auto" />
            </div>
          </div>
        </div>
      </div>

      <button type="button" className={`${styles.arrow} ${styles.arrowPrev}`} onClick={handlePrev} aria-label="Slide anterior">
        ‹
      </button>
      <button type="button" className={`${styles.arrow} ${styles.arrowNext}`} onClick={handleNext} aria-label="Slide siguiente">
        ›
      </button>

      <div className={styles.dots}>
        {slides.map((_, idx) => {
          const isActive = idx === activeSlide;
          return (
            <button
              key={idx}
              type="button"
              className={styles.dot}
              style={{
                width: isActive ? 28 : 7,
                background: isActive
                  ? isLightBg
                    ? '#E94300'
                    : '#fff'
                  : isLightBg
                    ? 'rgba(0,0,0,0.25)'
                    : 'rgba(255,255,255,0.35)',
              }}
              onClick={() => handleDot(idx)}
              aria-label={`Ir al slide ${idx + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
