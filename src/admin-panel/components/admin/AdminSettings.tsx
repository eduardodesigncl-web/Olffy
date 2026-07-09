// @ts-nocheck
import { useEffect, useState } from "react";
import { AdminSettingsSection, sectionStyles } from "./AdminSettingsSection";
import { AdminSettingsTabs, type SettingsTab } from "./AdminSettingsTabs";
import { AdminIntegrationStatus } from "./AdminIntegrationStatus";
import { AdminPointRulesSettings } from "./AdminPointRulesSettings";
import { AdminTeamSettings } from "./AdminTeamSettings";
import { AdminPasswordSettings } from "./AdminPasswordSettings";
import styles from "./AdminSettings.module.css";

// Sección Ajustes del panel admin.
// AdminSettings mock. En producción estos valores deben persistirse en
// Supabase, Shopify o variables seguras según corresponda.
// No guardar credenciales reales en frontend.

export function AdminSettings() {
  const [notice, setNotice] = useState<string | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] =
    useState<SettingsTab>("tienda");

  // Toast: visible ~7s (se reinicia si llega otro), con cierre manual.
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // ── Información de tienda (estado local mock) ──
  const [nombre, setNombre] = useState("OLFFY");
  const [ciudad, setCiudad] = useState("Viña del Mar");
  const [retiro, setRetiro] = useState("si");
  const [envios, setEnvios] = useState("si");
  const [email, setEmail] = useState("contacto@olffy.cl");

  const handleSaveStore = () =>
    setNotice("Ajustes de tienda guardados en modo demo.");

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>OLFFY ADMIN</div>
        <h1 className={styles.title}>Ajustes</h1>
        <p className={styles.subtitle}>
          Configura parámetros operativos, reglas de puntos, integraciones y
          permisos internos del panel OLFFY.
        </p>
      </div>

      <div className={styles.layout}>
        <aside className={styles.menuCol}>
          <AdminSettingsTabs
            active={activeSettingsTab}
            onChange={setActiveSettingsTab}
          />
        </aside>

        <div className={styles.content}>
          {activeSettingsTab === "tienda" && (
            <AdminSettingsSection
              title="Información de tienda"
              description="Datos generales visibles en la operación."
              footer={
                <div className={sectionStyles.buttonRow}>
                  <button
                    type="button"
                    className={sectionStyles.saveBtn}
                    onClick={handleSaveStore}
                  >
                    Guardar cambios
                  </button>
                </div>
              }
            >
              <div className={sectionStyles.fieldRow}>
                <label className={sectionStyles.field}>
                  <span className={sectionStyles.label}>Nombre de tienda</span>
                  <input
                    className={sectionStyles.input}
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </label>
                <label className={sectionStyles.field}>
                  <span className={sectionStyles.label}>Ciudad</span>
                  <input
                    className={sectionStyles.input}
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                  />
                </label>
              </div>
              <div className={sectionStyles.fieldRow}>
                <label className={sectionStyles.field}>
                  <span className={sectionStyles.label}>Retiro en tienda</span>
                  <select
                    className={sectionStyles.select}
                    value={retiro}
                    onChange={(e) => setRetiro(e.target.value)}
                  >
                    <option value="si">Activado</option>
                    <option value="no">Desactivado</option>
                  </select>
                </label>
                <label className={sectionStyles.field}>
                  <span className={sectionStyles.label}>
                    Envíos a todo Chile
                  </span>
                  <select
                    className={sectionStyles.select}
                    value={envios}
                    onChange={(e) => setEnvios(e.target.value)}
                  >
                    <option value="si">Activado</option>
                    <option value="no">Desactivado</option>
                  </select>
                </label>
              </div>
              <label className={sectionStyles.field}>
                <span className={sectionStyles.label}>Email de contacto</span>
                <input
                  className={sectionStyles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </AdminSettingsSection>
          )}

          {activeSettingsTab === "tienda" && (
            <AdminPasswordSettings onNotice={setNotice} />
          )}
          {activeSettingsTab === "puntos" && (
            <AdminPointRulesSettings onNotice={setNotice} />
          )}
          {activeSettingsTab === "integraciones" && (
            <AdminIntegrationStatus onNotice={setNotice} />
          )}
          {activeSettingsTab === "equipo" && (
            <AdminTeamSettings onNotice={setNotice} />
          )}
        </div>
      </div>

      {notice && (
        <div className={styles.notice}>
          <svg
            className={styles.noticeIcon}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 8v5M12 16.5h.01" />
          </svg>
          <span className={styles.noticeText}>{notice}</span>
          <button
            type="button"
            className={styles.noticeClose}
            onClick={() => setNotice(null)}
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
