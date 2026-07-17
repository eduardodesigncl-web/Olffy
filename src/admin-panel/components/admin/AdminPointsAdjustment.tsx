import { useState } from "react";
import type { FormEvent } from "react";
import { adjustCustomerPoints } from "../../../adapters/frontend-actions";
import type { AdminCliente } from "../../data/adminData.mock";
import styles from "./AdminPointsAdjustment.module.css";

interface AdminPointsAdjustmentProps {
  clientes: AdminCliente[];
}

type MovementType = "sumar" | "descontar";

// Ajuste manual de puntos: registra una transacción auditable en Supabase
// (loyalty_transactions + audit_log) con motivo y responsable obligatorios.
// No existe edición directa de saldo.
export function AdminPointsAdjustment({
  clientes,
}: AdminPointsAdjustmentProps) {
  const [clienteId, setClienteId] = useState(
    clientes[0] ? String(clientes[0].idx) : "",
  );
  const [tipo, setTipo] = useState<MovementType>("sumar");
  const [puntos, setPuntos] = useState("");
  const [motivo, setMotivo] = useState("");
  const [responsable, setResponsable] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotice(null);
    setError(null);

    const amount = Math.trunc(Number(puntos));
    if (!clienteId) {
      setError("Selecciona un cliente.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Ingresa una cantidad de puntos mayor que cero.");
      return;
    }
    if (!motivo.trim() || !responsable.trim()) {
      setError("Motivo y responsable son obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const signed = tipo === "descontar" ? -amount : amount;
      await adjustCustomerPoints(
        clienteId,
        signed,
        motivo.trim(),
        responsable.trim(),
      );
      const cliente = clientes.find((c) => String(c.idx) === clienteId);
      if (cliente) {
        cliente.puntos = Math.max(0, cliente.puntos + signed);
      }
      setPuntos("");
      setMotivo("");
      setNotice(
        "Ajuste registrado en Supabase con auditoría. El movimiento aparecerá en el historial.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo registrar el ajuste.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Ajuste manual</h2>
      <p className={styles.subtitle}>
        Crea un movimiento auditable con motivo y responsable. No edita saldos
        directamente.
      </p>

      {notice && (
        <div className={styles.notice} role="status">
          <span className={styles.noticeText}>{notice}</span>
        </div>
      )}
      {error && (
        <div className={styles.notice} role="alert">
          <span className={styles.noticeText}>{error}</span>
        </div>
      )}

      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
        <label className={styles.field}>
          <span className={styles.label}>Cliente</span>
          <select
            className={styles.select}
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
          >
            {clientes.map((c) => (
              <option key={c.idx} value={c.idx}>
                {c.nombre} · {c.puntos.toLocaleString("es-CL")} pts
              </option>
            ))}
          </select>
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Tipo de movimiento</span>
            <select
              className={styles.select}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as MovementType)}
            >
              <option value="sumar">Sumar puntos</option>
              <option value="descontar">Descontar puntos</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Puntos</span>
            <input
              className={styles.input}
              type="number"
              min="1"
              value={puntos}
              onChange={(e) => setPuntos(e.target.value)}
              placeholder="0"
              required
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Motivo</span>
          <textarea
            className={styles.textarea}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: bono de cumpleaños, corrección de compra..."
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Responsable</span>
          <input
            className={styles.input}
            type="text"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Quién autoriza el ajuste"
            required
          />
        </label>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Registrando..." : "Registrar ajuste"}
        </button>
      </form>
    </div>
  );
}
