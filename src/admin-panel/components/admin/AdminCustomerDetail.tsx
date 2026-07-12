// @ts-nocheck
import { useEffect, useState } from "react";
import type {
  AdminCliente,
  AdminHistorialItem,
  AdminCanje,
} from "../../data/adminData.mock";
import {
  ADMIN_RESPONSIBLES_MOCK,
  responsibleLabel,
} from "../../data/adminResponsibles.mock";
import {
  adjustCustomerPoints,
  approveRedemption,
  createRedemption,
  rejectRedemption,
} from "../../../adapters/frontend-actions";
import { adminPanelRuntime } from "../../integration/hydrate-admin-panel-data";
import styles from "./AdminCustomerDetail.module.css";

// Customer detail drawer mock. En producción estos movimientos deben registrarse
// como transacciones auditables en Supabase y, para canjes, coordinarse con Shopify.

interface AdminCustomerDetailProps {
  customer: AdminCliente;
  historial: AdminHistorialItem[];
  canjes: AdminCanje[];
  onClose: () => void;
}

// "+2.000" / "-300" → número. Solo para derivar cifras del resumen (mock).
function parsePts(s: string): number {
  const n = Number(s.replace(/\./g, "").replace("+", ""));
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number): string {
  return n.toLocaleString("es-CL");
}

// Select de responsable reutilizable (lista mock compartida con Ventas físicas).
function ResponsibleSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      className={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Responsable"
    >
      <option value="">Seleccionar responsable</option>
      {ADMIN_RESPONSIBLES_MOCK.map((r) => (
        <option key={r.id} value={r.id}>
          {responsibleLabel(r)}
        </option>
      ))}
    </select>
  );
}

export function AdminCustomerDetail({
  customer,
  historial,
  canjes,
  onClose,
}: AdminCustomerDetailProps) {
  const [notice, setNotice] = useState<string | null>(null);

  // Feedback local dentro del drawer (~4s, sin persistir).
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Resumen de puntos (mock derivado del historial).
  const saldo = customer.puntos;
  const usados = historial.reduce(
    (s, h) => s + Math.max(0, -parsePts(h.puntos)),
    0,
  );
  const acumulados = saldo + usados;

  return (
    <div className={styles.detail}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar detalle"
        >
          ✕
        </button>
        <div className={styles.identity}>
          <span className={styles.avatar}>
            {customer.nombre.charAt(0).toUpperCase()}
          </span>
          <div>
            <div className={styles.name}>{customer.nombre}</div>
            <div className={styles.nivel}>
              Cliente OLFFY · {customer.estado}
            </div>
          </div>
        </div>
        <div className={styles.contact}>
          <span>{customer.email}</span>
        </div>
        <div className={styles.saldoRow}>
          <span className={styles.saldoValue}>{fmt(customer.puntos)}</span>
          <span className={styles.saldoLabel}>puntos disponibles</span>
        </div>
      </div>

      <div className={styles.body}>
        {notice && (
          <div className={styles.notice} role="status">
            <span>{notice}</span>
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

        {/* Resumen de puntos */}
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{fmt(saldo)}</span>
            <span className={styles.statLabel}>Saldo disponible</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{fmt(acumulados)}</span>
            <span className={styles.statLabel}>Puntos acumulados</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{fmt(usados)}</span>
            <span className={styles.statLabel}>Puntos usados</span>
          </div>
        </div>

        <AjusteManual customer={customer} onNotify={setNotice} />
        <CrearCanje customer={customer} onNotify={setNotice} />

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Canjes</div>
          {canjes.length === 0 ? (
            <div className={styles.empty}>Sin canjes pendientes.</div>
          ) : (
            <div className={styles.stack}>
              {canjes.map((canje, idx) => (
                <CanjeRow key={idx} canje={canje} onNotify={setNotice} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Historial de puntos</div>
          <div className={styles.stack}>
            {historial.map((h, idx) => (
              <HistRow key={idx} item={h} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ajuste manual (mock) ──
function AjusteManual({
  customer,
  onNotify,
}: {
  customer: AdminCliente;
  onNotify: (m: string) => void;
}) {
  const [puntos, setPuntos] = useState("");
  const [motivo, setMotivo] = useState("");
  const [responsable, setResponsable] = useState("");
  const [comprobante, setComprobante] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!puntos.trim() || !motivo.trim() || !responsable.trim()) {
      setError("Puntos, motivo y responsable son obligatorios.");
      return;
    }
    const amount = Number(puntos);
    if (!Number.isFinite(amount) || amount === 0) {
      setError("Ingresa una cantidad de puntos válida.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const responsible = ADMIN_RESPONSIBLES_MOCK.find(
        (r) => r.id === responsable,
      );
      await adjustCustomerPoints(
        String(customer.idx),
        amount,
        motivo,
        responsible ? responsibleLabel(responsible) : "OLFFY Admin",
        comprobante,
      );
      customer.puntos = Math.max(0, customer.puntos + amount);
      setPuntos("");
      setMotivo("");
      setResponsable("");
      setComprobante("");
      onNotify("Ajuste registrado en Supabase.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el ajuste.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.block}>
      <div className={styles.blockTitle}>Ajuste manual</div>
      <p className={styles.blockText}>
        Usa valores positivos para sumar y negativos para descontar.
      </p>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Puntos</span>
        <input
          className={styles.input}
          type="number"
          value={puntos}
          onChange={(e) => setPuntos(e.target.value)}
          placeholder="Ej: 200 o -100"
        />
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Motivo (obligatorio)</span>
        <input
          className={styles.input}
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Responsable</span>
        <ResponsibleSelect value={responsable} onChange={setResponsable} />
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>
          Comprobante o referencia (opcional)
        </span>
        <input
          className={styles.input}
          type="text"
          value={comprobante}
          onChange={(e) => setComprobante(e.target.value)}
        />
      </div>
      {error && <span className={styles.error}>{error}</span>}
      <button
        type="button"
        className={styles.primaryBtn}
        onClick={handle}
        disabled={loading}
      >
        {loading ? "Registrando..." : "Registrar ajuste"}
      </button>
    </div>
  );
}

// ── Crear canje: registra un reward_redemption real en Supabase ──
function CrearCanje({
  customer,
  onNotify,
}: {
  customer: AdminCliente;
  onNotify: (m: string) => void;
}) {
  const [recompensa, setRecompensa] = useState("");
  const [responsable, setResponsable] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const rewards = (adminPanelRuntime.data?.rewards ?? []).filter(
    (reward) => reward.estado === "Activa",
  );

  const handle = async () => {
    if (!recompensa || !responsable.trim()) {
      setError("Recompensa y responsable son obligatorios.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const responsible = ADMIN_RESPONSIBLES_MOCK.find(
        (r) => r.id === responsable,
      );
      await createRedemption(
        customer.idx,
        Number(recompensa),
        responsible ? responsibleLabel(responsible) : "OLFFY Admin",
      );
      setRecompensa("");
      setResponsable("");
      onNotify(
        "Canje solicitado: los puntos quedaron reservados. Apruébalo para generar el beneficio.",
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "No se pudo crear el canje.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.block}>
      <div className={styles.blockTitle}>Crear canje</div>
      <p className={styles.blockText}>
        Reserva los puntos del cliente y crea la solicitud de canje. El
        descuento Shopify se genera al aprobar el canje.
      </p>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Seleccionar recompensa</span>
        <select
          className={styles.select}
          value={recompensa}
          onChange={(e) => setRecompensa(e.target.value)}
        >
          <option value="">Seleccionar recompensa</option>
          {rewards.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre} — {r.puntos.toLocaleString("es-CL")} pts
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Responsable</span>
        <ResponsibleSelect value={responsable} onChange={setResponsable} />
      </div>
      {error && <span className={styles.error}>{error}</span>}
      <button
        type="button"
        className={styles.primaryBtn}
        onClick={() => void handle()}
        disabled={loading || rewards.length === 0}
      >
        {loading ? "Registrando..." : "Registrar canje"}
      </button>
      {rewards.length === 0 ? (
        <span className={styles.error}>
          No hay recompensas activas configuradas.
        </span>
      ) : null}
    </div>
  );
}

// ── Fila de canje pendiente con acciones mock ──
function CanjeRow({
  canje,
  onNotify,
}: {
  canje: AdminCanje;
  onNotify: (m: string) => void;
}) {
  const [aprobarResp, setAprobarResp] = useState("");
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [cancelResp, setCancelResp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const aprobar = async () => {
    if (!aprobarResp.trim()) {
      setError("Indica el responsable para aprobar.");
      return;
    }
    if (!canje.id) {
      setError("Este canje no tiene ID real para aprobar.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const responsible = ADMIN_RESPONSIBLES_MOCK.find(
        (r) => r.id === aprobarResp,
      );
      await approveRedemption(
        canje.id,
        responsible ? responsibleLabel(responsible) : "OLFFY Admin",
      );
      setAprobarResp("");
      onNotify("Canje aprobado en Supabase/Shopify.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "No se pudo aprobar el canje.",
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelar = async () => {
    if (!cancelMotivo.trim() || !cancelResp.trim()) {
      setError("Motivo y responsable son obligatorios para cancelar.");
      return;
    }
    if (!canje.id) {
      setError("Este canje no tiene ID real para cancelar.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const responsible = ADMIN_RESPONSIBLES_MOCK.find(
        (r) => r.id === cancelResp,
      );
      await rejectRedemption(
        canje.id,
        cancelMotivo,
        responsible ? responsibleLabel(responsible) : "OLFFY Admin",
      );
      setCancelMotivo("");
      setCancelResp("");
      onNotify("Canje cancelado en Supabase/Shopify.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cancelar el canje.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <div className={styles.cardTitle}>{canje.beneficio}</div>
          <div className={styles.cardMeta}>{canje.pts}</div>
        </div>
        <span className={styles.badge}>{canje.estado}</span>
      </div>

      <div className={styles.inlineForm}>
        <ResponsibleSelect value={aprobarResp} onChange={setAprobarResp} />
        <button
          type="button"
          className={styles.approveBtn}
          onClick={aprobar}
          disabled={loading}
        >
          {loading ? "Procesando..." : "Aprobar"}
        </button>
      </div>

      <div className={styles.inlineForm}>
        <input
          className={styles.input}
          type="text"
          value={cancelMotivo}
          onChange={(e) => setCancelMotivo(e.target.value)}
          placeholder="Motivo de cancelación"
        />
        <ResponsibleSelect value={cancelResp} onChange={setCancelResp} />
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={cancelar}
          disabled={loading}
        >
          Cancelar
        </button>
      </div>

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

// ── Fila de historial (solo lectura). Las correcciones se hacen con un
// ajuste manual, que exige motivo y responsable y queda auditado. ──
function HistRow({ item }: { item: AdminHistorialItem }) {
  const isPositive = item.puntos.trim().startsWith("+");

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <div className={styles.cardTitle}>{item.movimiento}</div>
          <div className={styles.cardMeta}>{item.detalle}</div>
          <div className={styles.cardSub}>
            {item.fecha} · Saldo: {item.saldo}
          </div>
        </div>
        <span
          className={`${styles.histPts} ${isPositive ? styles.histPtsPos : styles.histPtsNeg}`}
        >
          {item.puntos} pts
        </span>
      </div>
    </div>
  );
}
