import { useState } from "react";
import type { FormEvent } from "react";
import styles from "./AdminRewardForm.module.css";

type RewardType = "discount" | "product" | "experience" | "other";

// Formulario de nueva recompensa: persiste en Supabase (tabla rewards) vía
// /api/admin/loyalty/rewards. Los canjes usan estos valores para validar
// saldo, compra mínima y vigencia del beneficio.
export function AdminRewardForm({ onCreated }: { onCreated?: () => void }) {
  const [nombre, setNombre] = useState("");
  const [puntos, setPuntos] = useState("");
  const [tipo, setTipo] = useState<RewardType>("discount");
  const [montoDescuento, setMontoDescuento] = useState("");
  const [compraMinima, setCompraMinima] = useState("0");
  const [vigenciaDias, setVigenciaDias] = useState("30");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<"activa" | "pausada">("activa");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotice(null);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/loyalty/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: nombre,
          description: descripcion,
          rewardType: tipo,
          pointsCost: Number(puntos),
          discountAmountClp:
            tipo === "discount" ? Number(montoDescuento) : undefined,
          minimumPurchaseClp: Number(compraMinima),
          validityDays: Number(vigenciaDias),
          isActive: estado === "activa",
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear la recompensa");
      }
      setNombre("");
      setPuntos("");
      setMontoDescuento("");
      setCompraMinima("0");
      setDescripcion("");
      setNotice(
        "Recompensa creada en Supabase. Estará disponible para canjes según su estado.",
      );
      onCreated?.();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo crear la recompensa",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Nueva recompensa</h2>
      <p className={styles.subtitle}>
        Se guarda en Supabase y queda disponible para el programa de canjes.
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
              min="1"
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
              <option value="discount">Descuento</option>
              <option value="product">Producto / regalo</option>
              <option value="experience">Experiencia</option>
              <option value="other">Otro beneficio</option>
            </select>
          </label>
        </div>

        <div className={styles.row}>
          {tipo === "discount" ? (
            <label className={styles.field}>
              <span className={styles.label}>Monto del descuento (CLP)</span>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={montoDescuento}
                onChange={(e) => setMontoDescuento(e.target.value)}
                placeholder="Ej: 3000"
                required
              />
            </label>
          ) : null}
          <label className={styles.field}>
            <span className={styles.label}>Compra mínima elegible (CLP)</span>
            <input
              className={styles.input}
              type="number"
              min="0"
              value={compraMinima}
              onChange={(e) => setCompraMinima(e.target.value)}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Vigencia del beneficio (días)</span>
          <input
            className={styles.input}
            type="number"
            min="1"
            value={vigenciaDias}
            onChange={(e) => setVigenciaDias(e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Descripción</span>
          <textarea
            className={styles.textarea}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Breve descripción del beneficio..."
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Estado inicial</span>
          <select
            className={styles.select}
            value={estado}
            onChange={(e) => setEstado(e.target.value as "activa" | "pausada")}
          >
            <option value="activa">Activa</option>
            <option value="pausada">Pausada</option>
          </select>
        </label>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creando..." : "Crear recompensa"}
        </button>
      </form>
    </div>
  );
}
