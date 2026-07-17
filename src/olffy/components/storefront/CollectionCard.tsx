import { ProductImage } from '../ui';
import styles from './CollectionCard.module.css';

interface CollectionCardProps {
  title: string;
  description: string;
  bg: string;
  onClick: () => void;
}

// Card de colección destacada — usada en Novedades ("Colección Primavera",
// "Edición Violeta", "Kits Regalo"). Al hacer click navega a Tienda (no hay
// filtrado real por colección todavía, es un mock de navegación).
export function CollectionCard({ title, description, bg, onClick }: CollectionCardProps) {
  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <div className={styles.imageWrap}>
        <ProductImage bg={bg} shape="rect" aspectRatio="auto" />
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{title}</div>
        <div className={styles.desc}>{description}</div>
      </div>
    </button>
  );
}
