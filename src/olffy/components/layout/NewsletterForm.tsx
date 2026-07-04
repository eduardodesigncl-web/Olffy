import { useState, type FormEvent } from "react";
import { Button } from "../ui";
import styles from "./NewsletterForm.module.css";

interface NewsletterFormProps {
  onSubscribe?: (email: string) => void;
}

// Form de suscripción del footer. Mock local — no llama backend, solo
// resuelve a un estado "suscrito" en memoria (igual que el original).
export function NewsletterForm({ onSubscribe }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSubscribe?.(email);
    setSubscribed(true);
  };

  if (subscribed) {
    return <p className={styles.subscribed}>🎉 ¡Gracias por suscribirte!</p>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu email"
        className={styles.input}
      />
      <Button type="submit" variant="primary" size="sm">
        Unirme
      </Button>
    </form>
  );
}
