// @ts-nocheck
import { useEffect, useState } from "react";
import { AdminMetricCard, type AdminMetricCardData } from "./AdminMetricCard";
import { AdminCustomerSelector } from "./AdminCustomerSelector";
import {
  AdminResponsibleSelector,
  type AdminResponsible,
} from "./AdminResponsibleSelector";
import { AdminPosProductSearch } from "./AdminPosProductSearch";
import { AdminPosCart, type PosCartItem } from "./AdminPosCart";
import { AdminSaleSummary } from "./AdminSaleSummary";
import { AdminSaleSuccessMock, type SaleResult } from "./AdminSaleSuccessMock";
import {
  AdminSaleHistoryMock,
  type SaleHistoryEntry,
} from "./AdminSaleHistoryMock";
import type { AdminCliente } from "../../data/adminData.mock";
import { ADMIN_RESPONSIBLES_MOCK } from "../../data/adminResponsibles.mock";
import type { Product } from "../../types";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminPhysicalSales.module.css";

// Sección Ventas físicas (POS) del panel admin.
// AdminPhysicalSales mock. En producción debe validar pago con TUU, descontar
// stock en Shopify y registrar puntos auditables en Supabase.
// El carrito POS es local e independiente del CartContext público: no usa el
// carrito del storefront ni modifica ADMIN_DATA / PRODUCTS / stock / puntos.

// Deriva la lista base del mock compartido (ids numéricos para la lógica local
// de agregar responsables con Date.now()).
const SEED_RESPONSIBLES: AdminResponsible[] = ADMIN_RESPONSIBLES_MOCK.map(
  (r, i) => ({
    id: i + 1,
    nombre: r.nombre,
    cargo: r.cargo,
  }),
);
const DEFAULT_RESPONSIBLE_ID = 2; // Equipo OLFFY

function fmt(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

// Regla mock de acumulación: $1.000 gastados = 10 puntos.
function estimatePoints(total: number): number {
  return Math.floor(total / 1000) * 10;
}

export function AdminPhysicalSales() {
  const runtime = adminPanelRuntime.data;
  const [customer, setCustomer] = useState<AdminCliente | null>(null);
  const [customerChosen, setCustomerChosen] = useState(false);
  const [responsibles] = useState<AdminResponsible[]>(SEED_RESPONSIBLES);
  const [selectedResponsibleId, setSelectedResponsibleId] = useState(
    DEFAULT_RESPONSIBLE_ID,
  );
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [history, setHistory] = useState<SaleHistoryEntry[]>(
    runtime?.physicalSalesHistory ?? [],
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [sale, setSale] = useState<SaleResult | null>(null);
  const [registering, setRegistering] = useState(false);

  // El toast desaparece solo tras 7s (se reinicia si llega otro); el botón
  // cerrar permite ocultarlo antes.
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const total = cart.reduce((s, i) => s + i.n * i.qty, 0);
  const puntos = estimatePoints(total);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);
  const metrics: AdminMetricCardData[] = [
    { label: "Ventas físicas hoy", value: history.length, tone: "morado" },
    {
      label: "Total vendido hoy",
      value: fmt(
        history.reduce(
          (sum, sale) => sum + Number(sale.total.replace(/[$.]/g, "")),
          0,
        ),
      ),
      tone: "naranjo",
    },
    {
      label: "Puntos estimados hoy",
      value: history.length
        ? (history[0]?.pts.replace("+", "") ?? "0 pts")
        : "0 pts",
      tone: "amarillo",
    },
    {
      label: "Clientes asociados",
      value: history.filter((sale) => sale.cliente !== "Venta sin cliente")
        .length,
      tone: "verde",
    },
  ];

  const responsible =
    responsibles.find((r) => r.id === selectedResponsibleId) ?? responsibles[0];
  const responsableLabel = `${responsible.nombre} — ${responsible.cargo}`;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [
        ...prev,
        {
          id: product.id,
          variantId: product.variantId,
          name: product.name,
          cat: product.cat,
          n: product.n,
          price: product.price,
          qty: 1,
        },
      ];
    });
    setNotice("Producto agregado a la venta.");
  };

  const inc = (id: number) =>
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)),
    );
  const dec = (id: number) =>
    setCart((prev) =>
      prev.flatMap((i) =>
        i.id === id ? (i.qty - 1 <= 0 ? [] : [{ ...i, qty: i.qty - 1 }]) : [i],
      ),
    );
  const remove = (id: number) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  const handleSelect = (c: AdminCliente) => {
    setCustomer(c);
    setCustomerChosen(true);
  };
  const handleContinueWithout = () => {
    setCustomer(null);
    setCustomerChosen(true);
  };
  const handleResetCustomer = () => setCustomerChosen(false);

  const handleRegister = async () => {
    if (cart.length === 0) {
      setNotice("Agrega al menos un producto.");
      return;
    }
    if (cart.some((item) => !item.variantId)) {
      setNotice(
        "Hay productos sin variante Shopify sincronizada. Sincroniza el catálogo antes de vender.",
      );
      return;
    }
    setRegistering(true);
    setNotice(null);
    const clienteNombre = customer?.nombre ?? null;
    const tuuTransactionId = `manual-${Date.now()}`;
    try {
      const response = await fetch("/api/admin/loyalty/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          paymentConfirmed: true,
          customerId: customer ? customer.idx : null,
          items: cart.map((item) => ({
            variantId: item.variantId,
            quantity: item.qty,
          })),
          benefitType: "none",
          tuuTransactionId,
          receiptNumber: tuuTransactionId,
          responsible: responsableLabel,
          notes: "Venta registrada desde OLFFY Admin",
        }),
      });
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || "No se pudo registrar la venta.");
      }
      const folio =
        result.shopifyOrderName ||
        String(result.physicalSaleId || tuuTransactionId);
      const points = Number(result.pointsEarned ?? puntos);
      setSale({
        folio,
        total,
        puntos: points,
        clienteNombre,
        responsable: responsableLabel,
        itemCount,
      });
      setHistory((prev) => [
        {
          id: Number(result.physicalSaleId) || Date.now(),
          folio,
          total: fmt(total),
          pts: `+${points} pts`,
          cliente: clienteNombre ?? "Venta sin cliente",
          responsable: responsableLabel,
        },
        ...prev,
      ]);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la venta.",
      );
    } finally {
      setRegistering(false);
    }
  };

  // "Nueva venta" limpia el carrito y reinicia el flujo (recién aquí).
  const handleNewSale = () => {
    setSale(null);
    setCart([]);
    setCustomer(null);
    setCustomerChosen(false);
  };

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.eyebrow}>OLFFY ADMIN</div>
        <h1 className={styles.title}>Ventas físicas</h1>
        <p className={styles.subtitle}>
          Registra ventas presenciales, asocia clientas y calcula puntos
          estimados para el programa OLFFY.
        </p>
      </div>

      {sale ? (
        // Vista final: solo la confirmación de venta (sin métricas, POS ni historial).
        <div className={styles.successWrap}>
          <AdminSaleSuccessMock
            sale={sale}
            onNewSale={handleNewSale}
            onViewPoints={() =>
              setNotice("Disponible cuando se conecte Supabase.")
            }
          />
        </div>
      ) : (
        <>
          <div className={styles.metrics}>
            {metrics.map((m) => (
              <AdminMetricCard key={m.label} metric={m} />
            ))}
          </div>

          <div className={styles.grid}>
            <div className={styles.col}>
              <AdminCustomerSelector
                customer={customer}
                chosen={customerChosen}
                onSelect={handleSelect}
                onContinueWithout={handleContinueWithout}
                onReset={handleResetCustomer}
              />
              <AdminResponsibleSelector
                responsibles={responsibles}
                selectedId={selectedResponsibleId}
                onSelect={setSelectedResponsibleId}
              />
              <AdminPosProductSearch onAdd={addToCart} />
            </div>
            <div className={styles.col}>
              <AdminPosCart
                items={cart}
                onInc={inc}
                onDec={dec}
                onRemove={remove}
              />
              <AdminSaleSummary
                total={total}
                puntos={puntos}
                clienteNombre={
                  customerChosen ? (customer?.nombre ?? null) : null
                }
                responsableLabel={responsableLabel}
                canRegister={cart.length > 0 && !registering}
                onRegister={handleRegister}
              />
            </div>
          </div>

          <AdminSaleHistoryMock sales={history} />
        </>
      )}

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
