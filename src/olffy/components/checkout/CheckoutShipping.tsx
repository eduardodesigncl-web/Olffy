import type { FormEvent } from "react";
import { Button } from "../ui";
import styles from "./CheckoutShipping.module.css";

export interface ShippingForm {
  nombre: string;
  apellido: string;
  email: string;
  direccion: string;
  region: string;
  comuna: string;
}

interface CheckoutShippingProps {
  form: ShippingForm;
  onChange: (field: keyof ShippingForm, value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

// Paso 2 del checkout — formulario de envío (mock, sin validación de
// dirección real ni integración de transportista).
export function CheckoutShipping({
  form,
  onChange,
  onContinue,
  onBack,
}: CheckoutShippingProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onContinue();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Nombre</span>
          <input
            className={styles.input}
            type="text"
            value={form.nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Apellido</span>
          <input
            className={styles.input}
            type="text"
            value={form.apellido}
            onChange={(e) => onChange("apellido", e.target.value)}
            required
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          className={styles.input}
          type="email"
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Dirección</span>
        <input
          className={styles.input}
          type="text"
          value={form.direccion}
          onChange={(e) => onChange("direccion", e.target.value)}
          required
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Región</span>
          <input
            className={styles.input}
            type="text"
            value={form.region}
            onChange={(e) => onChange("region", e.target.value)}
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Comuna</span>
          <input
            className={styles.input}
            type="text"
            value={form.comuna}
            onChange={(e) => onChange("comuna", e.target.value)}
            required
          />
        </label>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onBack}>
          ← Volver a revisión
        </Button>
        <Button type="submit" variant="primary" className={styles.continueBtn}>
          Continuar al pago →
        </Button>
      </div>
    </form>
  );
}
