// @ts-nocheck
import styles from "./AdminSettingsTabs.module.css";

// Navegación interna de Ajustes (mock/local). Solo cambia la tab visible; no
// altera datos ni lógica de negocio.
export type SettingsTab = "tienda" | "puntos" | "integraciones" | "equipo";

const TABS: { id: SettingsTab; label: string; hint: string }[] = [
  { id: "tienda", label: "Tienda", hint: "Datos generales" },
  { id: "puntos", label: "Puntos", hint: "Reglas de fidelización" },
  { id: "integraciones", label: "Integraciones", hint: "Servicios externos" },
  { id: "equipo", label: "Equipo", hint: "Responsables" },
];

interface AdminSettingsTabsProps {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

// Menú interno de ajustes: columna vertical en desktop, tabs con scroll en mobile.
export function AdminSettingsTabs({
  active,
  onChange,
}: AdminSettingsTabsProps) {
  return (
    <nav
      className={styles.menu}
      role="tablist"
      aria-label="Secciones de ajustes"
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`${styles.item} ${active === t.id ? styles.active : ""}`}
          onClick={() => onChange(t.id)}
        >
          <span className={styles.label}>{t.label}</span>
          <span className={styles.hint}>{t.hint}</span>
        </button>
      ))}
    </nav>
  );
}
