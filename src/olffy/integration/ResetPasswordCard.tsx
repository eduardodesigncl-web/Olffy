"use client";

// Restablecer contraseña (enlace de recuperación) con el estilo del panel de
// acceso del frontend oficial.
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerPasswordAction } from "app/cuenta/actions";
import { Button } from "../components/ui";
import { PasswordInput } from "src/shared/PasswordInput";
import styles from "../components/puntos/PuntosLoginMock.module.css";

export function ResetPasswordCard() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Usa al menos 8 caracteres.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const result = await updateCustomerPasswordAction({
        password,
        passwordConfirmation,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.replace("/cuenta/login?passwordUpdated=1");
      router.refresh();
    } catch {
      setError("No pudimos actualizar la contraseña. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <span className={styles.cardBadge}>Recuperación</span>
      <p className={styles.intro}>
        Crea una contraseña nueva. Usa al menos 8 caracteres y evita reutilizar
        contraseñas.
      </p>
      <form
        className={styles.form}
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor="customer-reset-password">
            Contraseña nueva
          </label>
          <PasswordInput
            id="customer-reset-password"
            className={styles.input}
            value={password}
            minLength={8}
            maxLength={128}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            autoComplete="new-password"
          />
        </div>
        <div className={styles.field}>
          <label
            className={styles.label}
            htmlFor="customer-reset-password-confirmation"
          >
            Repite la contraseña nueva
          </label>
          <PasswordInput
            id="customer-reset-password-confirmation"
            className={styles.input}
            value={passwordConfirmation}
            minLength={8}
            maxLength={128}
            onChange={(e) => {
              setPasswordConfirmation(e.target.value);
              setError(null);
            }}
            autoComplete="new-password"
          />
        </div>
        {error && <span className={styles.error}>{error}</span>}
        <Button
          type="submit"
          variant="primary"
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading ? "Actualizando…" : "Guardar contraseña"}
        </Button>
      </form>
    </div>
  );
}
