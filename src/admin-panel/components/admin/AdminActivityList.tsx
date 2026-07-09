// @ts-nocheck
import styles from "./AdminActivityList.module.css";

export type AdminActivityTone = "venta" | "puntos" | "canje" | "producto";

export interface AdminActivityItem {
  id: number;
  tipo: string;
  texto: string;
  tiempo: string;
  tone: AdminActivityTone;
  // Entidad relacionada (ej. id de producto) para navegación contextual.
  refId?: number;
}

interface AdminActivityListProps {
  items: AdminActivityItem[];
  // Si se pasa, cada item es accionable (cursor pointer + hover).
  onSelect?: (item: AdminActivityItem) => void;
}

function ActivityIcon({ tone }: { tone: AdminActivityTone }) {
  const c = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (tone) {
    case "venta":
      return (
        <svg {...c}>
          <path d="M4 9.5V20h16V9.5" />
          <path d="M3 9.5 4.5 4h15L21 9.5" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "puntos":
      return (
        <svg {...c}>
          <path d="M12 2.5l3.09 6.26L22 9.77l-5 4.87 1.18 6.86L12 18.27l-6.18 3.23L7 14.64l-5-4.87 6.91-1.01L12 2.5z" />
        </svg>
      );
    case "canje":
      return (
        <svg {...c}>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
        </svg>
      );
    case "producto":
      return (
        <svg {...c}>
          <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7z" />
          <path d="M3 8.5 12 14l9-5.5M12 14v7" />
        </svg>
      );
    default:
      return null;
  }
}

// Lista de actividad reciente del admin (mock). Accionable si se pasa onSelect.
export function AdminActivityList({ items, onSelect }: AdminActivityListProps) {
  return (
    <div className={styles.list}>
      {items.map((item) => {
        const inner = (
          <>
            <span className={`${styles.iconBox} ${styles[item.tone]}`}>
              <ActivityIcon tone={item.tone} />
            </span>
            <div className={styles.info}>
              <div className={styles.tipo}>{item.tipo}</div>
              <div className={styles.texto}>{item.texto}</div>
            </div>
            <span className={styles.time}>{item.tiempo}</span>
          </>
        );
        if (onSelect) {
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.item} ${styles.clickable}`}
              onClick={() => onSelect(item)}
            >
              {inner}
            </button>
          );
        }
        return (
          <div key={item.id} className={styles.item}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
