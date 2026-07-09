// @ts-nocheck
import { useState } from "react";
import { AdminSettingsSection, sectionStyles } from "./AdminSettingsSection";

interface AdminPasswordSettingsProps {
  onNotice: (message: string) => void;
}

// Cambio de contraseña admin (mock/local). No persiste ni valida contra backend.
// En producción, el cambio de contraseña debe ejecutarse en backend autenticado
// y nunca exponerse en frontend.
export function AdminPasswordSettings({
  onNotice,
}: AdminPasswordSettingsProps) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!actual.trim() || !nueva.trim() || !confirmar.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (nueva.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (nueva !== confirmar) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }
    setError(null);
    setActual("");
    setNueva("");
    setConfirmar("");
    onNotice("Contraseña de admin actualizada en modo demo.");
  };

  return (
    <AdminSettingsSection
      title="Cambiar contraseña de admin"
      description="Actualiza la contraseña de acceso interno del panel OLFFY. En producción, este cambio debe validarse desde el sistema de autenticación real."
      footer={
        <div className={sectionStyles.buttonRow}>
          <button
            type="button"
            className={sectionStyles.saveBtn}
            onClick={handleSave}
          >
            Guardar contraseña
          </button>
        </div>
      }
    >
      <label className={sectionStyles.field}>
        <span className={sectionStyles.label}>Contraseña actual</span>
        <input
          className={sectionStyles.input}
          type="password"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      <label className={sectionStyles.field}>
        <span className={sectionStyles.label}>Nueva contraseña</span>
        <input
          className={sectionStyles.input}
          type="password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      <label className={sectionStyles.field}>
        <span className={sectionStyles.label}>Confirmar nueva contraseña</span>
        <input
          className={sectionStyles.input}
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      {error && <span className={sectionStyles.error}>{error}</span>}
    </AdminSettingsSection>
  );
}
