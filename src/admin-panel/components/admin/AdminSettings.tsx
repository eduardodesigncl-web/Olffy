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
              description="Dónde se administra cada dato operativo de OLFFY."
            >
              <div className={styles.infoBlock}>
                <p>
                  <strong>Nombre, contacto y políticas de envío/retiro</strong>:
                  se configuran en Shopify (Configuración → Información de la
                  tienda) y en las variables del proyecto (SITE_NAME,
                  COMPANY_NAME) en Vercel.
                </p>
                <p>
                  <strong>Catálogo, precios y stock</strong>: Shopify es la
                  fuente oficial. <strong>Puntos y fidelización</strong>: se
                  administran en la pestaña Puntos de estos Ajustes.
                </p>
              </div>
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
