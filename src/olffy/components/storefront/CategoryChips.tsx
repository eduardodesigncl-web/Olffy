import type { Category } from '../../types';
import styles from './CategoryChips.module.css';

interface CategoryChipsProps {
  categories: Category[];
  activeCategory: Category;
  onSelect: (category: Category) => void;
}

// Chips de filtro por categoría — usado en Tienda (y reutilizable en
// Novedades u otras páginas de catálogo).
export function CategoryChips({ categories, activeCategory, onSelect }: CategoryChipsProps) {
  return (
    <div className={styles.row}>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          className={`${styles.chip} ${cat === activeCategory ? styles.chipActive : ''}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
