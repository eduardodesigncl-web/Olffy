// @ts-nocheck
import { ADMIN_DATA } from "../../data/adminData.mock";
import styles from "./AdminActiveCustomersDetail.module.css";

interface AdminActiveCustomersDetailProps {
  onBack: () => void;
}

// Detalle "Clientes activos" (mock/local): mini listado con clientes registrados
// y también ventas sin cliente identificado.
interface ActiveRow {
  nombre: string;
  detalle: string;
  puntos: string;
  tipo: "Registrado" | "Anónimo";
}

const EXTRA_ANON: ActiveRow[] = [
  {
    nombre: "Venta sin cliente",
    detalle: "Punto físico · TUU-1041",
    puntos: "—",
    tipo: "Anónimo",
  },
  {
    nombre: "Cliente invitado",
    detalle: "Web / Shopify · #OLF-5208",
    puntos: "—",
    tipo: "Anónimo",
  },
];

export function AdminActiveCustomersDetail({
  onBack,
}: AdminActiveCustomersDetailProps) {
  const rows: ActiveRow[] = [
    ...ADMIN_DATA.clientes.map((c) => ({
      nombre: c.nombre,
      detalle: `${c.email} · ${c.estado}`,
      puntos: `${c.puntos.toLocaleString("es-CL")} pts`,
      tipo: "Registrado" as const,
    })),
    ...EXTRA_ANON,
  ];

  return (
    <div>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Volver al resumen
      </button>

      <div className={styles.header}>
        <div className={styles.eyebrow}>OLFFY ADMIN</div>
        <h1 className={styles.title}>Clientes activos</h1>
        <p className={styles.subtitle}>
          Clientes con actividad reciente, incluyendo ventas sin cliente
          identificado.
        </p>
      </div>

      <div className={styles.panel}>
        <div className={styles.list}>
          {rows.map((r) => (
            <div key={`${r.nombre}-${r.detalle}`} className={styles.item}>
              <span className={styles.avatar}>
                {r.nombre.charAt(0).toUpperCase()}
              </span>
              <div className={styles.info}>
                <div className={styles.name}>{r.nombre}</div>
                <div className={styles.detalle}>{r.detalle}</div>
              </div>
              <div className={styles.side}>
                <span className={styles.puntos}>{r.puntos}</span>
                <span
                  className={`${styles.tag} ${r.tipo === "Anónimo" ? styles.anon : styles.reg}`}
                >
                  {r.tipo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
