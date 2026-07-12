import { AdminSettingsSection } from "./AdminSettingsSection";
import styles from "./AdminTeamSettings.module.css";

interface AdminTeamSettingsProps {
  onNotice: (message: string) => void;
}

// La administración de equipo requiere identidades y permisos reales. No se
// mantiene una lista local distinta por navegador ni identificadores personales.
export function AdminTeamSettings(_props: AdminTeamSettingsProps) {
  return (
    <AdminSettingsSection
      title="Equipo y responsables"
      description="No disponible en esta versión."
    >
      <div className={styles.unavailable} role="status">
        La gestión de personas se habilitará cuando existan cuentas
        individuales, roles y auditoría server-side. No se guardan responsables
        ni RUT en este dispositivo.
      </div>
    </AdminSettingsSection>
  );
}
