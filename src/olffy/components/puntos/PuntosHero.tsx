import type { ReactNode } from 'react';
import { GiftIcon, type GiftIconName } from '../storefront';
import { Flower, Sparkle } from '../home/HomeDecor';
import styles from './PuntosHero.module.css';

interface PuntosHeroProps {
  // Panel de acceso (columna derecha): el login/registro real lo provee la
  // integración; el diseño del hero no cambia.
  children: ReactNode;
}

const BENEFITS: { icon: GiftIconName; label: string }[] = [
  { icon: 'checklist', label: 'Seguimiento de pedidos' },
  { icon: 'star', label: 'Puntos acumulados' },
  { icon: 'tag', label: 'Cupones y recompensas' },
  { icon: 'users', label: 'Comunidad OLFFY' },
];

// Entrada al Club OLFFY — sección morada integrada de 2 columnas: editorial
// (izquierda) + panel de acceso/registro mock (derecha), en un solo bloque.
export function PuntosHero({ children }: PuntosHeroProps) {
  return (
    <section className={styles.hero}>
      <span aria-hidden="true" className={`${styles.blob} ${styles.blobOne}`} />
      <span aria-hidden="true" className={`${styles.blob} ${styles.blobTwo}`} />
      <Flower className={`${styles.deco} ${styles.flower}`} color="rgba(255,255,255,0.1)" size={140} />
      <Sparkle className={`${styles.deco} ${styles.sparkleA}`} color="var(--olffy-amarillo)" size={22} />
      <Sparkle className={`${styles.deco} ${styles.sparkleB}`} color="rgba(255,255,255,0.5)" size={15} />

      <div className={styles.grid}>
        <div className={styles.editorial}>
          <div className={styles.eyebrow}>Club OLFFY</div>
          <h1 className={styles.title}>Bienvenida al Club OLFFY</h1>
          <p className={styles.text}>
            Aquí podrás hacer seguimiento de tus pedidos, revisar tus puntos acumulados,
            obtener cupones y formar parte de la comunidad OLFFY.
          </p>
          <ul className={styles.benefits}>
            {BENEFITS.map((benefit) => (
              <li key={benefit.label} className={styles.benefit}>
                <span className={styles.benefitIcon}>
                  <GiftIcon name={benefit.icon} size={18} />
                </span>
                <span className={styles.benefitLabel}>{benefit.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>{children}</div>
      </div>
    </section>
  );
}
