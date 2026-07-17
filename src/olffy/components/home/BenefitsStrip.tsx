import { GiftIcon, type GiftIconName } from '../storefront';
import { Sparkle } from './HomeDecor';
import styles from './BenefitsStrip.module.css';

interface BenefitItem {
  icon: GiftIconName;
  title: string;
  desc: string;
  accent: string;
}

// Beneficios como fila de sellos/badges (cinta decorativa), distinta de las
// cards de "Conoce OLFFY".
const BENEFITS: BenefitItem[] = [
  { icon: 'package', title: 'Envíos a todo Chile', desc: 'Rápido y seguro', accent: '#c8901a' },
  { icon: 'store', title: 'Retiro gratis en tienda', desc: 'En Viña del Mar', accent: 'var(--olffy-morado)' },
  { icon: 'palette', title: 'Papelería ilustrada', desc: 'Diseños propios', accent: 'var(--olffy-naranjo)' },
  { icon: 'heart', title: 'Hecho con amor', desc: 'Empacado a mano', accent: '#2e7d32' },
];

export function BenefitsStrip() {
  return (
    <div className={styles.wrap}>
      <div className={styles.ribbon}>
        <Sparkle className={`${styles.deco} ${styles.decoLeft}`} color="var(--olffy-amarillo)" size={20} />
        <Sparkle className={`${styles.deco} ${styles.decoRight}`} color="var(--olffy-naranjo)" size={16} />
        <ul className={styles.list}>
          {BENEFITS.map((item) => (
            <li key={item.title} className={styles.item}>
              <span className={styles.stamp} style={{ color: item.accent }}>
                <GiftIcon name={item.icon} size={24} color={item.accent} />
              </span>
              <span className={styles.textCol}>
                <span className={styles.title}>{item.title}</span>
                <span className={styles.desc}>{item.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
