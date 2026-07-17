// @ts-nocheck
import { useEffect, useState } from "react";
import { AdminSettingsSection, sectionStyles } from "./AdminSettingsSection";
import { AdminSettingsTabs, type SettingsTab } from "./AdminSettingsTabs";
import { AdminIntegrationStatus } from "./AdminIntegrationStatus";
import { AdminPointRulesSettings } from "./AdminPointRulesSettings";
import { AdminTeamSettings } from "./AdminTeamSettings";
import { AdminPasswordSettings } from "./AdminPasswordSettings";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminSettings.module.css";

// Sección Ajustes del panel admin.
// AdminSettings mock. En producción estos valores deben persistirse en
// Supabase, Shopify o variables seguras según corresponda.
// No guardar credenciales reales en frontend.

export function AdminSettings() {
  const store = adminPanelRuntime.data?.storeInfo ?? null;
  const shopifyAdminUrl = adminPanelRuntime.data?.shopifyAdminUrl;
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
              description="Información comercial sincronizada directamente desde Shopify."
            >
              {store ? (
                <div className={styles.storeInfo}>
                  <dl className={styles.storeGrid}>
                    <div className={styles.storeField}>
                      <dt>Nombre</dt>
                      <dd>{store.name}</dd>
                    </div>
                    <div className={styles.storeField}>
                      <dt>Correo de contacto</dt>
                      <dd>{store.contactEmail || "No informado"}</dd>
                    </div>
                    <div className={styles.storeField}>
                      <dt>Teléfono</dt>
                      <dd>{store.phone || "No informado"}</dd>
                    </div>
                    <div className={styles.storeField}>
                      <dt>Moneda</dt>
                      <dd>{store.currencyCode}</dd>
                    </div>
                    <div className={`${styles.storeField} ${styles.storeWide}`}>
                      <dt>Dirección</dt>
                      <dd>{store.address || "No informada"}</dd>
                    </div>
                    <div className={`${styles.storeField} ${styles.storeWide}`}>
                      <dt>Dominio principal</dt>
                      <dd>
                        {store.domain ? (
                          <a
                            href={store.domain}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {store.domain}
                          </a>
                        ) : (
                          "No informado"
                        )}
                      </dd>
                    </div>
                  </dl>
                  {shopifyAdminUrl && (
                    <a
                      className={styles.shopifyLink}
                      href={`${shopifyAdminUrl}/settings/general`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Editar información en Shopify
                    </a>
                  )}
                </div>
              ) : (
                <div className={styles.infoBlock}>
                  <p>
                    Shopify no devolvió la información de la tienda. Revisa la
                    conexión de la Admin API en la pestaña Integraciones.
                  </p>
                </div>
              )}
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
