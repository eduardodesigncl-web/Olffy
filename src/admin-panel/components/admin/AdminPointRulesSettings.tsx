// @ts-nocheck
import { useState } from "react";
import { AdminSettingsSection, sectionStyles } from "./AdminSettingsSection";
import styles from "./AdminPointRulesSettings.module.css";

interface AdminPointRulesSettingsProps {
  onNotice: (message: string) => void;
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

// Reglas de puntos (mock local). No modifica la lógica real de Puntos ni de
// Ventas físicas; solo guarda valores en estado local para el demo.
export function AdminPointRulesSettings({
  onNotice,
}: AdminPointRulesSettingsProps) {
  const [montoBase, setMontoBase] = useState("1000");
  const [puntosBase, setPuntosBase] = useState("10");
  const [canjeMinimo, setCanjeMinimo] = useState("300");
  const [requiereCliente, setRequiereCliente] = useState("no");
  const [permitirSinCliente, setPermitirSinCliente] = useState("si");
  const [reversarDevolucion, setReversarDevolucion] = useState("si");

  const monto = Math.max(1, Number(montoBase) || 1000);
  const puntos = Math.max(0, Number(puntosBase) || 0);
  const ejemploMonto = 8990;
  const ejemploPuntos = Math.floor(ejemploMonto / monto) * puntos;

  const handleSave = () => onNotice("Reglas de puntos guardadas en modo demo.");

  // Restablece la regla base al valor inicial recomendado para OLFFY (mock).
  const handleReset = () => {
    setMontoBase("1000");
    setPuntosBase("10");
    setCanjeMinimo("300");
    setRequiereCliente("no");
    setPermitirSinCliente("si");
    setReversarDevolucion("si");
    onNotice("Reglas restablecidas a valores predeterminados en modo demo.");
  };

  return (
    <AdminSettingsSection
      title="Reglas de puntos"
      description="Parámetros de acumulación y canje del programa."
      headerAction={
        <div className={styles.headerAction}>
          <button
            type="button"
            className={sectionStyles.smallBtn}
            onClick={handleReset}
          >
            Ajustes predeterminados
          </button>
          <span className={styles.helpWrap}>
            <span className={styles.helpMark} aria-hidden="true">
              ?
            </span>
            <span className={styles.tooltip} role="tooltip">
              Restablece la regla base del programa de puntos al valor inicial
              definido para OLFFY. Úsalo si cambiaste la configuración y
              necesitas volver al sistema recomendado.
            </span>
          </span>
        </div>
      }
      footer={
        <button
          type="button"
          className={sectionStyles.saveBtn}
          onClick={handleSave}
        >
          Guardar reglas
        </button>
      }
    >
      <div className={sectionStyles.fieldRow}>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>Monto base</span>
          <input
            className={sectionStyles.input}
            type="number"
            min="1"
            value={montoBase}
            onChange={(e) => setMontoBase(e.target.value)}
          />
        </label>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>Puntos por monto base</span>
          <input
            className={sectionStyles.input}
            type="number"
            min="0"
            value={puntosBase}
            onChange={(e) => setPuntosBase(e.target.value)}
          />
        </label>
      </div>

      <label className={sectionStyles.field}>
        <span className={sectionStyles.label}>Canje mínimo (puntos)</span>
        <input
          className={sectionStyles.input}
          type="number"
          min="0"
          value={canjeMinimo}
          onChange={(e) => setCanjeMinimo(e.target.value)}
        />
      </label>

      <div className={sectionStyles.fieldRow}>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>
            Requiere cliente identificado
          </span>
          <select
            className={sectionStyles.select}
            value={requiereCliente}
            onChange={(e) => setRequiereCliente(e.target.value)}
          >
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className={sectionStyles.field}>
          <span className={sectionStyles.label}>
            Permitir venta sin cliente
          </span>
          <select
            className={sectionStyles.select}
            value={permitirSinCliente}
            onChange={(e) => setPermitirSinCliente(e.target.value)}
          >
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>

      <label className={sectionStyles.field}>
        <span className={sectionStyles.label}>
          Reversar puntos en devolución
        </span>
        <select
          className={sectionStyles.select}
          value={reversarDevolucion}
          onChange={(e) => setReversarDevolucion(e.target.value)}
        >
          <option value="si">Sí</option>
          <option value="no">No</option>
        </select>
      </label>

      <div className={styles.preview}>
        <div className={styles.previewRule}>
          Regla actual: {fmt(monto)} = {puntos} puntos
        </div>
        <div className={styles.previewExample}>
          Ejemplo: {fmt(ejemploMonto)} entrega {ejemploPuntos} puntos
        </div>
      </div>
    </AdminSettingsSection>
  );
}
