// @ts-nocheck
import styles from "./AdminCatalogStatusBadge.module.css";

interface AdminCatalogStatusBadgeProps {
  estado: string;
  lowStock?: boolean;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Normaliza los estados de catálogo (Shopify usa ACTIVE/DRAFT/ARCHIVED; las
// colecciones usan Activa/Pausada/Borrador) a una etiqueta legible y su color.
// `lowStock` renderiza un badge complementario.
function resolve(estado: string): { label: string; cls: string } {
  const e = estado.toLowerCase();
  if (e.includes("pausad")) return { label: "Pausada", cls: styles.pausada };
  if (e === "active" || e.includes("activ")) {
    return {
      label: e === "active" ? "Activo" : capitalize(estado),
      cls: styles.activo,
    };
  }
  if (e === "draft" || e.includes("borrad"))
    return { label: "Borrador", cls: styles.borrador };
  if (e.includes("archiv"))
    return { label: "Archivado", cls: styles.archivado };
  return { label: capitalize(estado), cls: styles.archivado };
}

export function AdminCatalogStatusBadge({
  estado,
  lowStock,
}: AdminCatalogStatusBadgeProps) {
  const { label, cls } = resolve(estado);
  return (
    <>
      <span className={`${styles.badge} ${cls}`}>
        <span className={styles.dot} />
        {label}
      </span>
      {lowStock && (
        <span className={`${styles.badge} ${styles.lowStock}`}>
          <span className={styles.dot} />
          Stock bajo
        </span>
      )}
    </>
  );
}
