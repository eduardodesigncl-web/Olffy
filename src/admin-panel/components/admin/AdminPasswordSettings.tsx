import { AdminSettingsSection } from "./AdminSettingsSection";

interface AdminPasswordSettingsProps {
  onNotice: (message: string) => void;
}

// Acceso admin: la contraseña se administra como variable de entorno
// (ADMIN_PASSWORD en Vercel), no desde esta pantalla. No se simula un cambio
// que el sistema no puede persistir. La recuperación por enlace de correo
// (gabri.dayan16@gmail.com) requiere migrar a un proveedor de autenticación
// con recovery links y está documentada como pendiente en el plan.
export function AdminPasswordSettings(_props: AdminPasswordSettingsProps) {
  return (
    <AdminSettingsSection
      title="Acceso y contraseña de admin"
      description="Cómo se administra hoy la credencial del panel."
    >
      <div
        style={{ fontSize: 13, lineHeight: 1.6, color: "var(--olffy-cafe-68)" }}
      >
        <p style={{ margin: "0 0 10px" }}>
          La contraseña del panel se define con la variable de entorno{" "}
          <strong>ADMIN_PASSWORD</strong> del proyecto en Vercel. Para
          cambiarla: actualizar la variable, redeployar y las sesiones activas
          anteriores dejarán de renovarse.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Pendiente:</strong> recuperación de contraseña mediante enlace
          de un solo uso al correo administrativo. Requiere migrar el login a
          Supabase Auth (u otro proveedor con recovery links); hasta entonces
          esta pantalla no ofrece un flujo simulado.
        </p>
      </div>
    </AdminSettingsSection>
  );
}
