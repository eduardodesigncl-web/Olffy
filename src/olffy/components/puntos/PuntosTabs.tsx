import styles from './PuntosTabs.module.css';

export type PuntosTab = 'resumen' | 'historial' | 'recompensas' | 'canjes' | 'reglas' | 'configuracion';

interface PuntosTabsProps {
  activeTab: PuntosTab;
  onChange: (tab: PuntosTab) => void;
}

const TABS: { id: PuntosTab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'historial', label: 'Historial' },
  { id: 'recompensas', label: 'Recompensas' },
  { id: 'canjes', label: 'Canjes' },
  { id: 'reglas', label: 'Reglas' },
  { id: 'configuracion', label: 'Configuración' },
];

// Navegación de la cuenta cliente — 5 tabs. Estado (activeTab) vive en
// PuntosPage; esto solo lo pinta y notifica cambios.
export function PuntosTabs({ activeTab, onChange }: PuntosTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Secciones de mi cuenta">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
