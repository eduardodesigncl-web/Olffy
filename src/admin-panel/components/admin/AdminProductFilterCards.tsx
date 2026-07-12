// @ts-nocheck
import type { AdminMetricTone } from "./AdminMetricCard";
import styles from "./AdminProductFilterCards.module.css";

export type ProductFilter =
  | "all"
  | "active"
  | "lowStock"
  | "draft"
  | "archived";

export interface ProductFilterCardDef {
  label: string;
  value: string | number;
  tone: AdminMetricTone;
  // Filtro que aplica al clickear. `undefined` = card solo informativa (ej.
  // Precio promedio): no clickeable, sin hint ni estado activo.
  filter?: ProductFilter;
}

interface AdminProductFilterCardsProps {
  cards: ProductFilterCardDef[];
  activeFilter: ProductFilter;
  onSelect: (filter: ProductFilter) => void;
}

// Cards de métrica que además funcionan como filtros de la tabla de Productos.
// Propias de AdminProducts para no afectar AdminMetricCard de otras secciones.
export function AdminProductFilterCards({
  cards,
  activeFilter,
  onSelect,
}: AdminProductFilterCardsProps) {
  return (
    <div className={styles.grid}>
      {cards.map((card) => {
        // Card informativa (sin filtro): div estático, no interactivo.
        if (card.filter === undefined) {
          return (
            <div
              key={card.label}
              className={`${styles.card} ${styles[card.tone]}`}
            >
              <div className={styles.label}>{card.label}</div>
              <div className={styles.value}>{card.value}</div>
            </div>
          );
        }

        const filter = card.filter;
        // 'all' limpia el filtro / muestra todos: nunca se ve seleccionada.
        const isActive = filter !== "all" && filter === activeFilter;
        const hint =
          filter === "all"
            ? "Ver todos"
            : isActive
              ? "Filtro activo"
              : "Filtrar";
        return (
          <button
            key={card.label}
            type="button"
            className={`${styles.card} ${styles.interactive} ${styles[card.tone]} ${isActive ? styles.active : ""}`}
            onClick={() => onSelect(filter)}
            aria-pressed={isActive}
          >
            <div className={styles.label}>{card.label}</div>
            <div className={styles.value}>{card.value}</div>
            <div className={styles.hint}>{hint}</div>
          </button>
        );
      })}
    </div>
  );
}
