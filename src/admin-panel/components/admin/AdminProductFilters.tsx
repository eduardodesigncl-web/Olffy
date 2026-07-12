// @ts-nocheck
import type { ProductFilter } from "./AdminProductFilterCards";
import styles from "./AdminProductFilters.module.css";

const CHIPS: { id: ProductFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "lowStock", label: "Stock bajo" },
  { id: "draft", label: "Borrador" },
  { id: "archived", label: "Archivado" },
];

interface AdminProductFiltersProps {
  active: ProductFilter;
  counts: Record<ProductFilter, number>;
  onSelect: (filter: ProductFilter) => void;
}

// Chips rápidos de filtrado del catálogo (mock/local). Comparten el mismo estado
// de filtro que las metric cards superiores.
export function AdminProductFilters({
  active,
  counts,
  onSelect,
}: AdminProductFiltersProps) {
  return (
    <div
      className={styles.chips}
      role="tablist"
      aria-label="Filtros de catálogo"
    >
      {CHIPS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="tab"
          aria-selected={active === c.id}
          className={`${styles.chip} ${active === c.id ? styles.active : ""}`}
          onClick={() => onSelect(c.id)}
        >
          {c.label}
          <span className={styles.count}>{counts[c.id]}</span>
        </button>
      ))}
    </div>
  );
}
