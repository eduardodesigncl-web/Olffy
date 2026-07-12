import { useState, type FormEvent } from "react";
import { Button } from "../ui";
import styles from "./NewsletterForm.module.css";

interface NewsletterFormProps {
  onSubscribe?: (email: string) => Promise<{
    success: boolean;
    error?: string;
    pending?: boolean;
  }>;
}

export function NewsletterForm({ onSubscribe }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!onSubscribe) {
      setError("La suscripción no está disponible en este momento.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await onSubscribe(email);
      if (!result.success) {
        throw new Error(result.error || "No se pudo completar la suscripción");
      }
      setPending(Boolean(result.pending));
      setSubscribed(true);
      setEmail("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo completar la suscripción",
      );
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <p className={styles.subscribed} role="status">
        {pending
          ? "¡Solicitud recibida! La estamos sincronizando con Klaviyo."
          : "¡Gracias! Revisa tu correo para confirmar la suscripción."}
      </p>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu email"
        className={styles.input}
      />
      <Button type="submit" variant="primary" size="sm" disabled={loading}>
        {loading ? "Enviando..." : "Unirme"}
      </Button>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
