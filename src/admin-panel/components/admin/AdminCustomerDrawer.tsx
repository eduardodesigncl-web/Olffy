// @ts-nocheck
import { Drawer } from "../ui";
import { AdminCustomerDetail } from "./AdminCustomerDetail";
import { ADMIN_DATA, type AdminCliente } from "../../data/adminData.mock";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import type { AdminCustomerContext } from "../../integration/types";
import styles from "./AdminCustomerDrawer.module.css";

interface AdminCustomerDrawerProps {
  customer: AdminCliente | null;
  onClose: () => void;
  onOpenSale: (saleId: string) => void;
  onOpenSupport: (conversationId: string, archived: boolean) => void;
}

// Sidebar unificado de detalle de cliente. Único patrón usado desde la tabla de
// Clientes y desde Clientes recientes del Dashboard (no duplicar drawers/modales).
// Customer detail drawer mock. En producción estos movimientos deben registrarse
// como transacciones auditables en Supabase y, para canjes, coordinarse con Shopify.
export function AdminCustomerDrawer({
  customer,
  onClose,
  onOpenSale,
  onOpenSupport,
}: AdminCustomerDrawerProps) {
  // Canjes pendientes del cliente abierto (match por nombre en mock).
  const canjes = customer
    ? ADMIN_DATA.canjesPendientes.filter((k) => k.cliente === customer.nombre)
    : [];
  const emptyContext: AdminCustomerContext = {
    purchaseCount: 0,
    purchases: [],
    supportCount: 0,
    supportConversations: [],
  };
  const context = customer
    ? (adminPanelRuntime.data?.customerContexts[String(customer.idx)] ??
      emptyContext)
    : emptyContext;

  return (
    <Drawer
      isOpen={customer !== null}
      onClose={onClose}
      side="right"
      panelClassName={styles.panel}
    >
      {customer && (
        <AdminCustomerDetail
          customer={customer}
          historial={ADMIN_DATA.historialCliente}
          canjes={canjes}
          onClose={onClose}
          context={context}
          onOpenSale={onOpenSale}
          onOpenSupport={onOpenSupport}
        />
      )}
    </Drawer>
  );
}
