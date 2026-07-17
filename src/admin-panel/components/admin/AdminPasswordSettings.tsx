import { AdminSettingsSection } from "./AdminSettingsSection";

interface AdminPasswordSettingsProps {
  onNotice: (message: string) => void;
}

export function AdminPasswordSettings(_props: AdminPasswordSettingsProps) {
  return (
    <AdminSettingsSection
      title="Acceso y contraseña de admin"
      description="Accesos individuales protegidos por Supabase Auth."
    >
      <div
        style={{ fontSize: 13, lineHeight: 1.6, color: "var(--olffy-cafe-68)" }}
      >
        <p style={{ margin: "0 0 10px" }}>
          Cada integrante inicia sesión con su email y contraseña. Las cuentas,
          roles y pestañas permitidas se crean y editan desde la sección{" "}
          <strong>Equipo</strong>.
        </p>
      </div>
    </AdminSettingsSection>
  );
}
