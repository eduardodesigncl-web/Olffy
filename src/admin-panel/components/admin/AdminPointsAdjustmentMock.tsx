// @ts-nocheck
import { useState, type SubmitEvent } from "react";
import styles from "./AdminPointsAdjustmentMock.module.css";

interface AdminPointsAdjustmentMockProps {
  clientes: string[];
}

type MovementType = "sumar" | "descontar" | "reversa";

// Formulario de ajuste manual de puntos — MOCK. No modifica ningún dato,
// no toca ADMIN_DATA/PUNTOS_USER ni persiste nada: solo simula la acción.
// En producción esto requiere permisos internos y registro de auditoría.
export function AdminPointsAdjustmentMock({
  clientes,
}: AdminPointsAdjustmentMockProps) {
  const [cliente, setCliente] = useState(clientes[0] ?? "");
  const [tipo, setTipo] = useState<MovementType>("sumar");
  const [puntos, setPuntos] = useState("");
  const [motivo, setMotivo] = useState("");
  const [simulated, setSimulated] = useState(false);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Solo feedback visual: no se altera ningún array ni saldo.
    setSimulated(true);
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Ajuste manual</h2>
      <p className={styles.subtitle}>
        Simulación interna — no modifica saldos ni registra movimientos todavía.
      </p>

      {simulated && (
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
          <span className={styles.noticeText}>
            Ajuste simulado. En producción esto requiere permisos internos y
            registro de auditoría.
          </span>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Cliente</span>
          <select
            className={styles.select}
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          >
            {clientes.map((c) => (
              <option key={c} value={c}>
                {c}
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
              <option value="reversa">Reversa</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Puntos</span>
            <input
              className={styles.input}
              type="number"
              min="0"
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

        <button type="submit" className={styles.submitBtn}>
          Simular ajuste
        </button>
      </form>
    </div>
  );
}
