// @ts-nocheck
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminDashboard } from "./AdminDashboard";
import { AdminCustomerPage } from "./AdminCustomerPage";
import { AdminProductsPage } from "./AdminProductsPage";
import { AdminPointsPage } from "./AdminPointsPage";
import { AdminSalesPage } from "./AdminSalesPage";
import { AdminRewardsPage } from "./AdminRewardsPage";
import {
  adminLogin,
  adminLogout,
  adjustCustomerPoints,
  approveRedemption,
  rejectRedemption,
  registerTuuSale,
} from "../../adapters/frontend-actions";

const C = { orange: "#e94300", purple: "#5957b0" };
const T = {
  poppins: "'Poppins', sans-serif",
  piepie: "'PiepieW01-Regular', sans-serif",
};

type AdminSection =
  | "dashboard"
  | "clientes"
  | "puntos"
  | "productos"
  | "colecciones"
  | "ventas"
  | "canjes";

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await adminLogin(password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Contraseña incorrecta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white px-6">
      <div className="flex flex-col items-center gap-2">
        <p style={{ fontFamily: T.piepie, fontSize: 28, color: C.purple }}>
          OLFFY Admin
        </p>
        <p
          className="text-[14px] text-black/40"
          style={{ fontFamily: T.poppins }}
        >
          Acceso restringido
        </p>
      </div>
      {error && (
        <p
          className="text-[13px] text-red-500"
          style={{ fontFamily: T.poppins }}
        >
          {error}
        </p>
      )}
      <form
        className="flex flex-col gap-3 w-full max-w-xs"
        method="post"
        onSubmit={handleSubmit}
      >
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Contraseña de administrador"
            className="w-full px-4 py-3 pr-12 rounded-xl border border-black/12 text-[14px] outline-none focus:border-black/35"
            style={{ fontFamily: T.poppins }}
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="py-3 rounded-full text-white text-[15px]"
          style={{ fontFamily: T.poppins, background: C.orange }}
        >
          Entrar →
        </button>
      </form>
    </div>
  );
}

export function AdminShell({
  dashboard,
  customers: initialCustomers,
  products,
  physicalSales,
  redemptions: initialRedemptions,
  totalRedeemed = 0,
}: {
  dashboard: any;
  customers: any[];
  products: any[];
  physicalSales: any[];
  redemptions: any[];
  totalRedeemed?: number;
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [customers, setCustomers] = useState(initialCustomers);
  const [redemptions, setRedemptions] = useState(initialRedemptions);

  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;

  async function handleAdjustPoints(
    customerId: string,
    amount: number,
    reason: string,
  ) {
    await adjustCustomerPoints(
      customerId,
      amount,
      reason || "Ajuste manual de puntos",
    );
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              points: Math.max(0, c.points + amount),
              pointsBalance: Math.max(0, c.points + amount),
            }
          : c,
      ),
    );
  }
  async function handleApprove(id: string) {
    await approveRedemption(id, "OLFFY Admin");
    setRedemptions((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "approved" as const } : r,
      ),
    );
  }
  async function handleReject(id: string) {
    await rejectRedemption(
      id,
      "Canje rechazado por administración",
      "OLFFY Admin",
    );
    setRedemptions((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "cancelled" as const } : r,
      ),
    );
  }
  async function handleRegisterSale(
    customerEmail: string | null,
    amount: number,
  ) {
    await registerTuuSale({
      customerEmail: customerEmail ?? undefined,
      amount,
      operator: "OLFFY Admin",
    });
  }
  async function handleAdminLogout() {
    await adminLogout();
    setLoggedIn(false);
  }

  const content: Record<AdminSection, React.ReactNode> = {
    dashboard: <AdminDashboard data={dashboard} />,
    clientes: (
      <AdminCustomerPage
        customers={customers}
        onAdjustPoints={handleAdjustPoints}
        onCreateRedemption={() => {}}
      />
    ),
    puntos: (
      <AdminPointsPage
        totalIssued={dashboard.totalPointsIssued}
        totalRedeemed={totalRedeemed}
        pendingRedemptions={dashboard.pendingRedemptions}
        onManageRedemptions={() => setSection("canjes")}
      />
    ),
    productos: <AdminProductsPage products={products} />,
    colecciones: (
      <div className="p-6">
        <p style={{ fontFamily: T.poppins, color: "rgba(0,0,0,0.4)" }}>
          Colecciones — conectar con Shopify Admin API
        </p>
      </div>
    ),
    ventas: (
      <AdminSalesPage
        sales={physicalSales}
        onRegisterSale={handleRegisterSale}
      />
    ),
    canjes: (
      <AdminRewardsPage
        redemptions={redemptions}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    ),
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <AdminSidebar
        active={section}
        onNavigate={setSection}
        onLogout={handleAdminLogout}
      />
      <main className="flex-1 px-6 md:px-10 py-8 overflow-y-auto">
        {content[section]}
      </main>
    </div>
  );
}
