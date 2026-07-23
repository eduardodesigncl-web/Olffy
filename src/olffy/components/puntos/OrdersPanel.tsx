import { useState, type FormEvent } from "react";
import Image from "next/image";
import { GiftIcon } from "../storefront";
import styles from "./OrdersPanel.module.css";

// ── Tipos compatibles con la estructura del backend de "Mis pedidos" ──
export type OrderStatus =
  | "recibido"
  | "preparacion"
  | "listo_retiro"
  | "enviado"
  | "entregado"
  | "cancelado";
export type OrderDelivery = "retiro" | "envio";

export interface OrderItem {
  nombre: string;
  cantidad: number;
  imagen?: {
    url: string;
    alt: string;
  };
}

export interface OrderTracking {
  codigo: string;
  transportista: string;
  url?: string;
}

export interface Order {
  id: number;
  numero: string;
  fecha: string;
  total: string;
  estado: OrderStatus;
  entrega: OrderDelivery;
  items: OrderItem[];
  puntos: number;
  tracking?: OrderTracking;
  entregadoFecha?: string;
  sincronizadoEn?: string;
}

// Correo interno al que se derivan los comentarios post entrega.
// Único lugar configurable; cuando exista backend real, se reemplaza aquí.
export const SUPPORT_EMAIL = "contacto@olffy.cl";

const STORE_ADDRESS_SHORT = "2 Oriente 1145, Local 3, Viña del Mar";
const STORE_HOURS = "Lun a Vie, 10:00–19:00";

const STATUS_LABEL: Record<OrderStatus, string> = {
  recibido: "Pedido recibido",
  preparacion: "En preparación",
  listo_retiro: "Listo para retiro",
  enviado: "En paquetería",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  recibido: styles.stAmarillo!,
  preparacion: styles.stAmarillo!,
  listo_retiro: styles.stMorado!,
  enviado: styles.stMorado!,
  entregado: styles.stVerde!,
  cancelado: styles.stRojo!,
};

// Pasos del timeline según tipo de entrega.
const STEPS_ENVIO: { estado: OrderStatus; label: string; detail: string }[] = [
  {
    estado: "recibido",
    label: "Pedido recibido",
    detail: "Recibimos tu pedido y tu pago.",
  },
  {
    estado: "preparacion",
    label: "En preparación",
    detail: "Estamos preparando tus productos con cariño.",
  },
  {
    estado: "enviado",
    label: "En paquetería",
    detail: "Tu pedido va en camino con el transportista.",
  },
  {
    estado: "entregado",
    label: "Entregado",
    detail: "Tu pedido llegó a destino.",
  },
];

const STEPS_RETIRO: { estado: OrderStatus; label: string; detail: string }[] = [
  {
    estado: "recibido",
    label: "Pedido recibido",
    detail: "Recibimos tu pedido y tu pago.",
  },
  {
    estado: "preparacion",
    label: "En preparación",
    detail: "Estamos preparando tus productos con cariño.",
  },
  {
    estado: "listo_retiro",
    label: "Listo para retiro",
    detail: "Puedes pasar a buscarlo a la tienda.",
  },
  { estado: "entregado", label: "Retirado", detail: "Entregado en tienda." },
];

type StepState = "done" | "current" | "pending";

function stepsFor(
  order: Order,
): { label: string; detail: string; state: StepState }[] {
  if (order.estado === "cancelado") {
    return [
      {
        label: "Pedido cancelado",
        detail: "Este pedido figura como cancelado en Shopify.",
        state: "current",
      },
    ];
  }

  const steps = order.entrega === "envio" ? STEPS_ENVIO : STEPS_RETIRO;
  const idx = steps.findIndex((s) => s.estado === order.estado);
  return steps.map((s, i) => ({
    label: s.label,
    detail: s.detail,
    state:
      i < idx || order.estado === "entregado"
        ? "done"
        : i === idx
          ? "current"
          : "pending",
  }));
}

// Formulario de comentario post entrega (mock): el comentario representa un
// correo interno al equipo OLFFY (SUPPORT_EMAIL). Sin API todavía.
function OrderHelp({ orderNumber }: { orderNumber: string }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (comment.trim() === "") {
      setError(true);
      return;
    }
    setError(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className={styles.helpBox}>
        <p className={styles.helpSent} role="status">
          Recibimos tu comentario. El equipo OLFFY te responderá por correo.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.helpBox} onSubmit={handleSubmit} noValidate>
      <h4 className={styles.helpTitle}>
        ¿Tuviste algún problema con tu pedido?
      </h4>
      <p className={styles.helpText}>
        Cuéntanos qué pasó y te responderemos por correo.
      </p>
      <label className={styles.helpLabel} htmlFor={`help-${orderNumber}`}>
        Comentario
      </label>
      <textarea
        id={`help-${orderNumber}`}
        className={`${styles.helpTextarea} ${error ? styles.helpTextareaError : ""}`}
        rows={3}
        value={comment}
        onChange={(e) => {
          setComment(e.target.value);
          if (error) setError(false);
        }}
        aria-invalid={error}
      />
      {error && (
        <span className={styles.helpError}>
          Escribe tu comentario para poder ayudarte.
        </span>
      )}
      <div className={styles.helpFoot}>
        <button type="submit" className={styles.helpBtn}>
          Enviar comentario
        </button>
        <span className={styles.helpNote}>
          Se enviará al equipo OLFFY ({SUPPORT_EMAIL}).
        </span>
      </div>
    </form>
  );
}

interface OrdersPanelProps {
  orders: Order[];
}

// Mis pedidos (mock, estructura backend) — cards expandibles con timeline de
// seguimiento, tracking de envío, datos de retiro, puntos ganados y ayuda
// post entrega. Un pedido abierto a la vez.
export function OrdersPanel({ orders }: OrdersPanelProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (orders.length === 0) {
    return (
      <div className={styles.empty}>Todavía no tienes pedidos registrados.</div>
    );
  }

  return (
    <div className={styles.list}>
      {orders.map((order) => {
        const isOpen = order.id === openId;
        const steps = stepsFor(order);

        return (
          <article key={order.id} className={styles.card}>
            <button
              type="button"
              className={styles.head}
              onClick={() => setOpenId(isOpen ? null : order.id)}
              aria-expanded={isOpen}
            >
              <span className={styles.headIcon}>
                <GiftIcon
                  name="package"
                  size={20}
                  color="var(--olffy-morado)"
                />
              </span>
              <span className={styles.headInfo}>
                <span className={styles.headTitle}>{order.numero}</span>
                <span className={styles.headMeta}>
                  {order.fecha} · {order.total} ·{" "}
                  {order.entrega === "retiro"
                    ? "Retiro en tienda"
                    : "Envío a domicilio"}
                </span>
              </span>
              <span
                className={`${styles.status} ${STATUS_CLASS[order.estado]}`}
              >
                {STATUS_LABEL[order.estado]}
              </span>
              <span
                className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                aria-hidden="true"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div className={styles.body}>
                {/* Productos del pedido */}
                <div className={styles.itemsBox}>
                  <h4 className={styles.boxTitle}>Productos</h4>
                  <ul className={styles.items}>
                    {order.items.map((item, index) => (
                      <li
                        key={`${item.nombre}-${index}`}
                        className={styles.item}
                      >
                        <span className={styles.itemImage}>
                          {item.imagen ? (
                            <Image
                              src={item.imagen.url}
                              alt={item.imagen.alt}
                              width={58}
                              height={58}
                              className={styles.itemImageContent}
                            />
                          ) : (
                            <GiftIcon
                              name="package"
                              size={22}
                              color="var(--olffy-morado)"
                            />
                          )}
                        </span>
                        <span className={styles.itemDetails}>
                          <span className={styles.itemName}>{item.nombre}</span>
                          <span className={styles.itemQty}>
                            Cantidad: {item.cantidad}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <span className={styles.pointsChip}>
                    <GiftIcon name="star" size={13} color="#c8901a" />+
                    {order.puntos} pts por esta compra
                  </span>
                </div>

                {/* Timeline de seguimiento */}
                <div className={styles.trackBox}>
                  <div className={styles.trackHeading}>
                    <h4 className={styles.boxTitle}>Seguimiento</h4>
                    {order.sincronizadoEn && (
                      <span className={styles.syncStatus}>
                        <span className={styles.syncDot} aria-hidden="true" />
                        Shopify · {order.sincronizadoEn}
                      </span>
                    )}
                  </div>
                  <ol className={styles.timeline}>
                    {steps.map((step) => (
                      <li
                        key={step.label}
                        className={`${styles.step} ${styles[`step_${step.state}`]}`}
                      >
                        <span className={styles.stepDot} aria-hidden="true">
                          {step.state === "done" && (
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M4 12.5l5 5 11-11" />
                            </svg>
                          )}
                        </span>
                        <span className={styles.stepBody}>
                          <span className={styles.stepLabel}>
                            {step.label}
                            {step.state === "current" && (
                              <span className={styles.stepNow}>Ahora</span>
                            )}
                          </span>
                          <span className={styles.stepDetail}>
                            {step.detail}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>

                  {/* Info de envío con código de seguimiento */}
                  {order.entrega === "envio" && order.tracking && (
                    <div className={styles.extraBox}>
                      <span className={styles.extraLabel}>
                        Código de seguimiento
                      </span>
                      <span className={styles.trackingCode}>
                        {order.tracking.codigo}
                      </span>
                      <span className={styles.extraMeta}>
                        Transportista: {order.tracking.transportista}
                      </span>
                      {order.tracking.url && (
                        <a
                          className={styles.trackingLink}
                          href={order.tracking.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver seguimiento
                        </a>
                      )}
                    </div>
                  )}

                  {/* Info de retiro en tienda */}
                  {order.entrega === "retiro" &&
                    order.estado === "listo_retiro" && (
                      <div className={styles.extraBox}>
                        <span className={styles.extraLabel}>
                          Retiro en tienda
                        </span>
                        <span className={styles.extraMeta}>
                          {STORE_ADDRESS_SHORT}
                        </span>
                        <span className={styles.extraMeta}>
                          Horario: {STORE_HOURS}
                        </span>
                      </div>
                    )}

                  {order.estado === "entregado" && order.entregadoFecha && (
                    <p className={styles.deliveredNote}>
                      Entregado el {order.entregadoFecha}.
                    </p>
                  )}
                </div>

                {/* Ayuda post entrega */}
                {order.estado === "entregado" && (
                  <OrderHelp orderNumber={order.numero} />
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
