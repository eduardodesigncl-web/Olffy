import type { Category } from "../../types";
import styles from "./CategoryChips.module.css";

interface CategoryChipsProps {
  categories: Category[];
  activeCategories: Category[];
  onSelect: (category: Category) => void;
}

// Chips de filtro por categoría — usado en Tienda (y reutilizable en
// Novedades u otras páginas de catálogo).
export function CategoryChips({
  categories,
  activeCategories,
  onSelect,
}: CategoryChipsProps) {
  return (
    <div className={styles.row} aria-label="Filtrar por categorías">
      {categories.map((cat) => {
        const isActive =
          cat === "Todos"
            ? activeCategories.length === 0
            : activeCategories.includes(cat);

        return (
          <button
            key={cat}
            type="button"
            aria-pressed={isActive}
            className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
            onClick={() => onSelect(cat)}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
