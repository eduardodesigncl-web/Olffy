import { Button, ProductImage } from '../ui';
import styles from './FeatureBanner.module.css';

interface FeatureBannerProps {
  eyebrow: string;
  serif: string;
  display: string;
  subtitle: string;
  ctaLabel: string;
  onCtaClick: () => void;
  bg?: string;
}

// Bloque editorial texto + imagen — usado en "Lanzamientos nuevos" de la Home
// (y reutilizable para otros banners destacados de colección).
export function FeatureBanner({ eyebrow, serif, display, subtitle, ctaLabel, onCtaClick, bg = '#F2E0CC' }: FeatureBannerProps) {
  return (
    <section className={styles.section}>
      <div className={styles.textCol}>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <h2 className={styles.headline}>
          <span className={styles.serif}>{serif}</span>
          <span className={styles.display}>{display}</span>
        </h2>
        <p className={styles.subtitle}>{subtitle}</p>
        <Button variant="primary" className={styles.ctaBtn} onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      </div>
      <div className={styles.visualCol}>
        <div className={styles.visualFrame}>
          <div className={styles.visualBox}>
            <ProductImage bg={bg} shape="rect" aspectRatio="auto" />
          </div>
        </div>
      </div>
    </section>
  );
}
