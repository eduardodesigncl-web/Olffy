// @ts-nocheck
import { useState, type SubmitEvent } from "react";
import styles from "./AdminRewardFormMock.module.css";

type RewardType = "descuento" | "envio" | "producto" | "especial";
type RewardInitialStatus = "activa" | "pausada";

// Formulario de nueva recompensa — MOCK. No crea ni persiste datos, no toca
// ADMIN_DATA/PUNTOS_USER: solo simula la acción con feedback visual.
export function AdminRewardFormMock() {
  const [nombre, setNombre] = useState("");
  const [puntos, setPuntos] = useState("");
  const [tipo, setTipo] = useState<RewardType>("descuento");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<RewardInitialStatus>("activa");
  const [simulated, setSimulated] = useState(false);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Solo feedback visual: no se crea ni guarda ninguna recompensa.
    setSimulated(true);
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Nueva recompensa</h2>
      <p className={styles.subtitle}>
        Simulación interna — no crea ni guarda recompensas todavía.
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
            Recompensa simulada. En producción se guardará con permisos internos
            y trazabilidad.
          </span>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Nombre de recompensa</span>
          <input
            className={styles.input}
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: $3.000 de descuento"
            required
          />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Puntos requeridos</span>
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
          <label className={styles.field}>
            <span className={styles.label}>Tipo</span>
            <select
              className={styles.select}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as RewardType)}
            >
              <option value="descuento">Descuento</option>
              <option value="envio">Envío</option>
              <option value="producto">Producto / regalo</option>
              <option value="especial">Beneficio especial</option>
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Descripción</span>
          <textarea
            className={styles.textarea}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Breve descripción del beneficio..."
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Estado inicial</span>
          <select
            className={styles.select}
            value={estado}
            onChange={(e) => setEstado(e.target.value as RewardInitialStatus)}
          >
            <option value="activa">Activa</option>
            <option value="pausada">Pausada</option>
          </select>
        </label>

        <button type="submit" className={styles.submitBtn}>
          Simular creación
        </button>
      </form>
    </div>
  );
}
