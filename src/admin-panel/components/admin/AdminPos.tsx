import { useEffect, useMemo, useRef, useState } from "react";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import type {
  AdminPanelCustomer,
  AdminPanelData,
  PosProductVariant,
} from "../../integration/types";
import styles from "./AdminPos.module.css";

type PosProduct = AdminPanelData["products"][number];

type PosCartLine = {
  variantId: string;
  productName: string;
  variantTitle: string;
  unitPrice: number;
  qty: number;
  maxQty: number;
  image?: string;
  bg: string;
  /** Producto marcado "Sin puntos": no acumula ni recibe descuento de puntos. */
  excluded: boolean;
};

type BenefitType = "none" | "points" | "discount_code" | "manual_discount";

type ChargePhase =
  | "idle"
  | "sending"
  | "waiting"
  | "success"
  | "failed"
  | "reconciliation";

type ChargeState = {
  phase: ChargePhase;
  reference: string;
  statusLabel: string;
  error: string;
  orderName: string;
  physicalSaleId: number | null;
};

const IDLE_CHARGE: ChargeState = {
  phase: "idle",
  reference: "",
  statusLabel: "",
  error: "",
  orderName: "",
  physicalSaleId: null,
};

const OPERATOR_STORAGE_KEY = "olffy-pos-operadora";

function clp(value: number) {
  return `$${Math.round(value).toLocaleString("es-CL")}`;
}

function amount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

// Tienda POS de OLFFY — interfaz de caja inspirada en Shopify POS: catálogo en
// tiles a la izquierda, venta en curso a la derecha y cobro por la máquina TUU.
// El cobro SIEMPRE se confirma vía webhook TUU en el backend: esta interfaz no
// puede marcar un pago como aprobado por sí misma.
export function AdminPos() {
  const runtime = adminPanelRuntime.data;
  const products = runtime?.products ?? [];
  const customers = runtime?.adminData.clientes ?? [];
  const rule = runtime?.loyaltyRule ?? null;

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<PosCartLine[]>([]);
  const [customer, setCustomer] = useState<AdminPanelCustomer | null>(null);
  const [benefitType, setBenefitType] = useState<BenefitType>("none");
  const [pointsToUse, setPointsToUse] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [benefitAmount, setBenefitAmount] = useState("");
  const [manualDiscountReason, setManualDiscountReason] = useState("");
  const [responsible, setResponsible] = useState("Equipo OLFFY");
  const [overlay, setOverlay] = useState<
    | { kind: "none" }
    | { kind: "customer" }
    | { kind: "variants"; product: PosProduct }
    | { kind: "benefit" }
  >({ kind: "none" });
  const [customerQuery, setCustomerQuery] = useState("");
  const [charge, setCharge] = useState<ChargeState>(IDLE_CHARGE);
  const pollTokenRef = useRef(0);

  useEffect(() => {
    const stored = window.localStorage.getItem(OPERATOR_STORAGE_KEY);
    if (stored?.trim()) setResponsible(stored);
  }, []);

  useEffect(() => {
    if (responsible.trim()) {
      window.localStorage.setItem(OPERATOR_STORAGE_KEY, responsible.trim());
    }
  }, [responsible]);

  // Detiene el polling si la operadora abandona la pantalla.
  useEffect(() => {
    return () => {
      pollTokenRef.current += 1;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.cat.toLowerCase().includes(q) ||
        (product.handle ?? "").toLowerCase().includes(q),
    );
  }, [products, query]);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (item) =>
        item.nombre.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.tel.toLowerCase().includes(q),
    );
  }, [customers, customerQuery]);

  const subtotal = cart.reduce(
    (sum, line) => sum + line.unitPrice * line.qty,
    0,
  );
  // Carrito mixto: solo los productos que participan en OLFFY Puntos suman
  // para acumulación y soportan el descuento por puntos.
  const eligibleSubtotal = cart.reduce(
    (sum, line) => (line.excluded ? sum : sum + line.unitPrice * line.qty),
    0,
  );
  const pointsDiscount =
    benefitType === "points" && rule
      ? Math.trunc(amount(pointsToUse)) * rule.pointRedemptionValueClp
      : 0;
  const discount =
    benefitType === "points"
      ? pointsDiscount
      : benefitType === "none"
        ? 0
        : amount(benefitAmount);
  const total = Math.max(subtotal - discount, 0);
  const eligibleTotal = Math.max(
    Math.min(eligibleSubtotal - discount, total),
    0,
  );
  const pointsEarned =
    customer && rule
      ? Math.floor(eligibleTotal / rule.spendingUnitClp) * rule.pointsPerUnit
      : 0;
  const maxPointsForSale =
    customer && rule
      ? Math.max(
          0,
          Math.min(
            customer.puntos,
            Math.floor(
              Math.max(eligibleSubtotal - 1, 0) / rule.pointRedemptionValueClp,
            ),
          ),
        )
      : 0;
  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0);

  const benefitInvalid =
    (benefitType === "points" &&
      (!customer ||
        !rule ||
        amount(pointsToUse) <= 0 ||
        amount(pointsToUse) > maxPointsForSale)) ||
    (benefitType === "discount_code" &&
      (!discountCode.trim() ||
        amount(benefitAmount) <= 0 ||
        amount(benefitAmount) >= subtotal)) ||
    (benefitType === "manual_discount" &&
      (!manualDiscountReason.trim() ||
        amount(benefitAmount) <= 0 ||
        amount(benefitAmount) >= subtotal));

  const chargeDisabled =
    charge.phase === "sending" ||
    charge.phase === "waiting" ||
    cart.length === 0 ||
    total <= 0 ||
    benefitInvalid ||
    !responsible.trim();

  function addVariantToCart(product: PosProduct, variant: PosProductVariant) {
    const maxQty = Math.max(Number(variant.quantityAvailable ?? 0), 0);
    if (maxQty <= 0) return;
    setCart((current) => {
      const existing = current.find((line) => line.variantId === variant.id);
      if (existing) {
        return current.map((line) =>
          line.variantId === variant.id
            ? { ...line, qty: Math.min(line.qty + 1, line.maxQty) }
            : line,
        );
      }
      return [
        ...current,
        {
          variantId: variant.id,
          productName: product.name,
          variantTitle: variant.title === "Default Title" ? "" : variant.title,
          unitPrice: variant.price || product.n,
          qty: 1,
          maxQty,
          image: product.image,
          bg: product.bg,
          excluded: product.sinPuntos === true,
        },
      ];
    });
  }

  function handleProductTile(product: PosProduct) {
    const variants = (product.variants ?? []).filter((variant) => variant.id);
    if (variants.length <= 1) {
      const variant: PosProductVariant = variants[0] ?? {
        id: product.variantId ?? "",
        title: "Default Title",
        price: product.n,
        availableForSale: (product.stock ?? 0) > 0,
        quantityAvailable: product.stock ?? 0,
      };
      if (!variant.id) return;
      addVariantToCart(product, variant);
      return;
    }
    setOverlay({ kind: "variants", product });
  }

  function updateQty(variantId: string, qty: number) {
    setCart((current) =>
      current.flatMap((line) => {
        if (line.variantId !== variantId) return [line];
        const next = Math.min(Math.max(qty, 0), line.maxQty);
        return next <= 0 ? [] : [{ ...line, qty: next }];
      }),
    );
  }

  function resetSale() {
    pollTokenRef.current += 1;
    setCart([]);
    setCustomer(null);
    setBenefitType("none");
    setPointsToUse("");
    setDiscountCode("");
    setBenefitAmount("");
    setManualDiscountReason("");
    setCharge(IDLE_CHARGE);
  }

  function salePayload() {
    return {
      customerId: customer?.idx ?? null,
      items: cart.map((line) => ({
        variantId: line.variantId,
        quantity: line.qty,
      })),
      benefitType,
      pointsToUse: Math.trunc(amount(pointsToUse)),
      benefitAmount: amount(benefitAmount),
      discountCode,
      manualDiscountReason,
      responsible: responsible.trim(),
      notes: "Venta Tienda POS OLFFY",
    };
  }

  async function pollRemotePayment(reference: string, token: number) {
    for (let attempt = 0; attempt < 36; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      if (pollTokenRef.current !== token) return;

      let data: {
        error?: string;
        status?: string;
        remotePaymentStatus?: string;
        shopifyOrderName?: string;
        physicalSaleId?: number;
        lastError?: string;
      };

      try {
        const response = await fetch(
          `/api/admin/loyalty/sales/remote-payment?reference=${encodeURIComponent(reference)}`,
          { cache: "no-store", credentials: "include" },
        );
        data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "No se pudo consultar el cobro TUU");
        }
      } catch (cause) {
        if (pollTokenRef.current !== token) return;
        setCharge((current) => ({
          ...current,
          phase: "failed",
          error:
            cause instanceof Error
              ? cause.message
              : "No se pudo consultar el cobro TUU",
        }));
        return;
      }

      if (pollTokenRef.current !== token) return;

      if (data.status === "completed") {
        setCharge((current) => ({
          ...current,
          phase: "success",
          orderName: data.shopifyOrderName || "",
          physicalSaleId: data.physicalSaleId ?? null,
        }));
        return;
      }

      if (data.status === "failed") {
        setCharge((current) => ({
          ...current,
          phase: "failed",
          error: data.lastError || "El cobro TUU fue rechazado o expiró",
        }));
        return;
      }

      if (data.remotePaymentStatus === "reconciliation_required") {
        setCharge((current) => ({
          ...current,
          phase: "reconciliation",
          error:
            "El pago requiere conciliación manual. Revisa Operaciones antes de reintentar.",
        }));
        return;
      }

      setCharge((current) => ({
        ...current,
        statusLabel:
          data.remotePaymentStatus === "paid"
            ? "Pago aprobado, creando orden Shopify..."
            : `Esperando confirmación TUU (${data.remotePaymentStatus || "enviado"})`,
      }));
    }

    if (pollTokenRef.current !== token) return;
    setCharge((current) => ({
      ...current,
      phase: "reconciliation",
      error:
        "El cobro sigue sin confirmación del webhook TUU. Si el pago fue aprobado en la máquina, la venta quedará pendiente de sincronización y puede recuperarse desde Operaciones sin volver a cobrar.",
    }));
  }

  async function sendCharge() {
    const token = pollTokenRef.current + 1;
    pollTokenRef.current = token;
    setCharge({
      ...IDLE_CHARGE,
      phase: "sending",
      statusLabel: "Enviando cobro a la máquina TUU...",
    });

    try {
      const response = await fetch("/api/admin/loyalty/sales/remote-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(salePayload()),
      });
      const data = (await response.json()) as {
        error?: string;
        paymentReference?: string;
        alreadyCompleted?: boolean;
        shopifyOrderName?: string;
        physicalSaleId?: number;
      };

      if (!response.ok || !data.paymentReference) {
        throw new Error(data.error || "No se pudo enviar el cobro TUU");
      }

      if (data.alreadyCompleted) {
        setCharge({
          ...IDLE_CHARGE,
          phase: "success",
          reference: data.paymentReference,
          orderName: data.shopifyOrderName || "",
          physicalSaleId: data.physicalSaleId ?? null,
        });
        return;
      }

      setCharge({
        ...IDLE_CHARGE,
        phase: "waiting",
        reference: data.paymentReference,
        statusLabel: "Esperando aprobación en la máquina TUU...",
      });
      void pollRemotePayment(data.paymentReference, token);
    } catch (cause) {
      setCharge({
        ...IDLE_CHARGE,
        phase: "failed",
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudo enviar el cobro TUU",
      });
    }
  }

  const benefitSummary =
    benefitType === "points"
      ? `${Math.trunc(amount(pointsToUse)).toLocaleString("es-CL")} pts`
      : benefitType === "discount_code"
        ? `Código ${discountCode || "—"}`
        : benefitType === "manual_discount"
          ? "Descuento manual"
          : null;

  return (
    <div className={styles.pos}>
      {/* Columna izquierda: catálogo */}
      <div className={styles.catalog}>
        <div className={styles.searchBar}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar productos"
            aria-label="Buscar productos"
          />
        </div>

        <div className={styles.tileGrid}>
          <button
            type="button"
            className={`${styles.actionTile}`}
            onClick={() => setOverlay({ kind: "customer" })}
          >
            <span className={styles.actionIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M19 8v6M22 11h-6" />
              </svg>
            </span>
            {customer ? "Cambiar cliente" : "Agregar cliente"}
          </button>

          <button
            type="button"
            className={styles.actionTile}
            onClick={() => setOverlay({ kind: "benefit" })}
            disabled={cart.length === 0}
          >
            <span className={styles.actionIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
                <circle cx="7.5" cy="7.5" r="1" />
              </svg>
            </span>
            {benefitType === "none" ? "Aplicar descuento" : "Editar descuento"}
          </button>

          {filteredProducts.map((product) => {
            const outOfStock = (product.stock ?? 0) <= 0;
            return (
              <button
                key={product.shopifyId ?? product.id}
                type="button"
                className={styles.productTile}
                onClick={() => handleProductTile(product)}
                disabled={outOfStock}
              >
                <span
                  className={styles.tileImage}
                  style={
                    product.image
                      ? { backgroundImage: `url(${product.image})` }
                      : { backgroundColor: product.bg }
                  }
                >
                  <span
                    className={`${styles.stockBadge} ${outOfStock ? styles.stockOut : ""}`}
                  >
                    {outOfStock ? "Sin stock" : product.stock}
                  </span>
                </span>
                <span className={styles.tileInfo}>
                  <span className={styles.tileName}>{product.name}</span>
                  <span className={styles.tilePrice}>
                    {product.price}
                    {product.sinPuntos ? (
                      <span className={styles.noPointsBadge}>Sin puntos</span>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })}

          {filteredProducts.length === 0 ? (
            <div className={styles.catalogEmpty}>
              {products.length === 0
                ? "No hay productos sincronizados desde Shopify."
                : "Sin resultados para la búsqueda."}
            </div>
          ) : null}
        </div>
      </div>

      {/* Columna derecha: venta en curso */}
      <div className={styles.orderPanel}>
        {charge.phase === "success" ? (
          <div className={styles.result}>
            <div className={styles.resultIcon} aria-hidden="true">
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2 className={styles.resultTitle}>Venta completada</h2>
            <p className={styles.resultAmount}>{clp(total)}</p>
            <div className={styles.resultRows}>
              {charge.orderName ? (
                <div className={styles.resultRow}>
                  <span>Orden Shopify</span>
                  <span>{charge.orderName}</span>
                </div>
              ) : null}
              {charge.physicalSaleId ? (
                <div className={styles.resultRow}>
                  <span>Registro OLFFY</span>
                  <span>#{charge.physicalSaleId}</span>
                </div>
              ) : null}
              {charge.reference ? (
                <div className={styles.resultRow}>
                  <span>Referencia TUU</span>
                  <span className={styles.mono}>{charge.reference}</span>
                </div>
              ) : null}
              {customer && pointsEarned > 0 ? (
                <div className={styles.resultRow}>
                  <span>Puntos para {customer.nombre}</span>
                  <span>+{pointsEarned.toLocaleString("es-CL")} pts</span>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={resetSale}
            >
              Nueva venta
            </button>
          </div>
        ) : (
          <>
            <div className={styles.orderHeader}>
              <div>
                <h2 className={styles.orderTitle}>Nueva venta</h2>
                <span className={styles.orderMeta}>
                  {itemCount === 1 ? "1 artículo" : `${itemCount} artículos`}
                </span>
              </div>
              {cart.length > 0 ? (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={resetSale}
                  aria-label="Vaciar venta"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              ) : null}
            </div>

            <button
              type="button"
              className={styles.customerRow}
              onClick={() => setOverlay({ kind: "customer" })}
            >
              <span className={styles.customerAvatar} aria-hidden="true">
                {customer ? customer.nombre.charAt(0).toUpperCase() : "?"}
              </span>
              <span className={styles.customerInfo}>
                <span className={styles.customerName}>
                  {customer ? customer.nombre : "Venta anónima"}
                </span>
                <span className={styles.customerDetail}>
                  {customer
                    ? `${customer.email} · ${customer.puntos.toLocaleString("es-CL")} pts`
                    : "Sin puntos — toca para asociar cliente"}
                </span>
              </span>
            </button>

            <div className={styles.lines}>
              {cart.map((line) => (
                <div key={line.variantId} className={styles.line}>
                  <span
                    className={styles.lineThumb}
                    style={
                      line.image
                        ? { backgroundImage: `url(${line.image})` }
                        : { backgroundColor: line.bg }
                    }
                    aria-hidden="true"
                  />
                  <span className={styles.lineInfo}>
                    <span className={styles.lineName}>{line.productName}</span>
                    {line.variantTitle ? (
                      <span className={styles.lineVariant}>
                        {line.variantTitle}
                      </span>
                    ) : null}
                    {line.excluded ? (
                      <span className={styles.noPointsBadge}>Sin puntos</span>
                    ) : null}
                    <span className={styles.lineQty}>
                      <button
                        type="button"
                        onClick={() => updateQty(line.variantId, line.qty - 1)}
                        aria-label={`Quitar una unidad de ${line.productName}`}
                      >
                        −
                      </button>
                      <span>{line.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(line.variantId, line.qty + 1)}
                        disabled={line.qty >= line.maxQty}
                        aria-label={`Agregar una unidad de ${line.productName}`}
                      >
                        +
                      </button>
                    </span>
                  </span>
                  <span className={styles.lineTotal}>
                    {clp(line.unitPrice * line.qty)}
                  </span>
                </div>
              ))}
              {cart.length === 0 ? (
                <p className={styles.linesEmpty}>
                  Toca un producto del catálogo para comenzar la venta.
                </p>
              ) : null}
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{clp(subtotal)}</span>
              </div>
              {discount > 0 ? (
                <div className={styles.summaryRow}>
                  <span>
                    Descuento{benefitSummary ? ` · ${benefitSummary}` : ""}
                  </span>
                  <span>−{clp(discount)}</span>
                </div>
              ) : null}
              {subtotal > eligibleSubtotal ? (
                <div className={`${styles.summaryRow} ${styles.summaryMuted}`}>
                  <span>Productos sin puntos</span>
                  <span>{clp(subtotal - eligibleSubtotal)}</span>
                </div>
              ) : null}
              {customer && rule ? (
                <div className={`${styles.summaryRow} ${styles.summaryMuted}`}>
                  <span>Puntos a acumular</span>
                  <span>+{pointsEarned.toLocaleString("es-CL")} pts</span>
                </div>
              ) : null}
              <div className={styles.operatorRow}>
                <label htmlFor="pos-operadora">Operadora</label>
                <input
                  id="pos-operadora"
                  value={responsible}
                  onChange={(event) => setResponsible(event.target.value)}
                  placeholder="Nombre de quien vende"
                />
              </div>

              {charge.phase === "waiting" || charge.phase === "sending" ? (
                <div className={styles.chargeStatus} role="status">
                  <span className={styles.spinner} aria-hidden="true" />
                  <span>
                    {charge.statusLabel}
                    {charge.reference ? (
                      <span className={styles.mono}> · {charge.reference}</span>
                    ) : null}
                  </span>
                </div>
              ) : null}
              {charge.phase === "failed" ? (
                <div className={styles.chargeError} role="alert">
                  {charge.error}
                </div>
              ) : null}
              {charge.phase === "reconciliation" ? (
                <div className={styles.chargeWarning} role="alert">
                  {charge.error}
                </div>
              ) : null}

              <button
                type="button"
                className={styles.checkoutBtn}
                disabled={chargeDisabled}
                onClick={() => void sendCharge()}
              >
                <span>
                  {charge.phase === "sending"
                    ? "Enviando cobro..."
                    : charge.phase === "waiting"
                      ? "Esperando TUU..."
                      : "Cobrar con TUU"}
                </span>
                <span>{clp(total)}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Overlay: selección de cliente */}
      {overlay.kind === "customer" ? (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Seleccionar cliente"
        >
          <div className={styles.sheet}>
            <div className={styles.sheetHeader}>
              <h3>Cliente</h3>
              <button
                type="button"
                onClick={() => setOverlay({ kind: "none" })}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <input
              className={styles.sheetSearch}
              type="search"
              value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
              placeholder="Buscar por nombre, correo o teléfono"
              autoFocus
            />
            <div className={styles.sheetList}>
              <button
                type="button"
                className={styles.sheetItem}
                onClick={() => {
                  setCustomer(null);
                  if (benefitType === "points") setBenefitType("none");
                  setPointsToUse("");
                  setOverlay({ kind: "none" });
                }}
              >
                <span className={styles.sheetItemTitle}>Venta anónima</span>
                <span className={styles.sheetItemMeta}>
                  Sin acumulación de puntos
                </span>
              </button>
              {filteredCustomers.map((item) => (
                <button
                  key={item.idx}
                  type="button"
                  className={styles.sheetItem}
                  disabled={item.estado !== "Activo"}
                  onClick={() => {
                    setCustomer(item);
                    setPointsToUse("");
                    setOverlay({ kind: "none" });
                  }}
                >
                  <span className={styles.sheetItemTitle}>{item.nombre}</span>
                  <span className={styles.sheetItemMeta}>
                    {item.email} · {item.puntos.toLocaleString("es-CL")} pts
                    {item.estado !== "Activo" ? " · Bloqueado" : ""}
                  </span>
                </button>
              ))}
              {filteredCustomers.length === 0 ? (
                <p className={styles.sheetEmpty}>
                  No hay clientes que coincidan con la búsqueda.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Overlay: selección de variante */}
      {overlay.kind === "variants" ? (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Variantes de ${overlay.product.name}`}
        >
          <div className={styles.sheet}>
            <div className={styles.sheetHeader}>
              <h3>{overlay.product.name}</h3>
              <button
                type="button"
                onClick={() => setOverlay({ kind: "none" })}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className={styles.sheetList}>
              {(overlay.product.variants ?? []).map((variant) => {
                const stock = Math.max(
                  Number(variant.quantityAvailable ?? 0),
                  0,
                );
                return (
                  <button
                    key={variant.id}
                    type="button"
                    className={styles.sheetItem}
                    disabled={stock <= 0}
                    onClick={() => {
                      addVariantToCart(overlay.product, variant);
                      setOverlay({ kind: "none" });
                    }}
                  >
                    <span className={styles.sheetItemTitle}>
                      {variant.title === "Default Title"
                        ? overlay.product.name
                        : variant.title}
                    </span>
                    <span className={styles.sheetItemMeta}>
                      {clp(variant.price || overlay.product.n)} ·{" "}
                      {stock > 0 ? `${stock} disponibles` : "Sin stock"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Overlay: beneficio / descuento */}
      {overlay.kind === "benefit" ? (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Aplicar beneficio"
        >
          <div className={styles.sheet}>
            <div className={styles.sheetHeader}>
              <h3>Beneficio de la venta</h3>
              <button
                type="button"
                onClick={() => setOverlay({ kind: "none" })}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className={styles.benefitOptions}>
              {(
                [
                  ["none", "Sin beneficio"],
                  ["points", "Usar puntos OLFFY"],
                  ["discount_code", "Código de descuento"],
                  ["manual_discount", "Descuento manual autorizado"],
                ] as Array<[BenefitType, string]>
              ).map(([value, label]) => (
                <label key={value} className={styles.benefitOption}>
                  <input
                    type="radio"
                    name="pos-benefit"
                    value={value}
                    checked={benefitType === value}
                    disabled={value === "points" && (!customer || !rule)}
                    onChange={() => setBenefitType(value)}
                  />
                  {label}
                </label>
              ))}
            </div>

            {benefitType === "points" && customer && rule ? (
              <div className={styles.benefitFields}>
                <label>
                  Puntos a usar (máx. {maxPointsForSale.toLocaleString("es-CL")}
                  )
                  <input
                    type="number"
                    min="1"
                    max={maxPointsForSale}
                    value={pointsToUse}
                    onChange={(event) => setPointsToUse(event.target.value)}
                  />
                </label>
                <p className={styles.benefitHint}>
                  Cada punto descuenta {clp(rule.pointRedemptionValueClp)}.
                </p>
              </div>
            ) : null}

            {benefitType === "discount_code" ? (
              <div className={styles.benefitFields}>
                <label>
                  Código
                  <input
                    value={discountCode}
                    onChange={(event) => setDiscountCode(event.target.value)}
                  />
                </label>
                <label>
                  Monto que descuenta
                  <input
                    type="number"
                    min="1"
                    value={benefitAmount}
                    onChange={(event) => setBenefitAmount(event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            {benefitType === "manual_discount" ? (
              <div className={styles.benefitFields}>
                <label>
                  Monto autorizado
                  <input
                    type="number"
                    min="1"
                    value={benefitAmount}
                    onChange={(event) => setBenefitAmount(event.target.value)}
                  />
                </label>
                <label>
                  Autorización y motivo
                  <textarea
                    rows={2}
                    value={manualDiscountReason}
                    onChange={(event) =>
                      setManualDiscountReason(event.target.value)
                    }
                  />
                </label>
              </div>
            ) : null}

            <button
              type="button"
              className={styles.sheetConfirm}
              onClick={() => setOverlay({ kind: "none" })}
            >
              Listo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
