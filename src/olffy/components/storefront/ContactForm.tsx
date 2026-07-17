import type { FormEvent } from 'react';
import { Button } from '../ui';
import styles from './ContactForm.module.css';

interface ContactFormProps {
  name: string;
  email: string;
  message: string;
  onChangeName: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangeMessage: (value: string) => void;
  sent: boolean;
  onSubmit: () => void;
}

// Formulario de contacto (mock, sin envío real) — alterna entre el form
// controlado y un mensaje de éxito una vez "enviado".
export function ContactForm({
  name,
  email,
  message,
  onChangeName,
  onChangeEmail,
  onChangeMessage,
  sent,
  onSubmit,
}: ContactFormProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  if (sent) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12.5l5 5 11-11" />
          </svg>
        </div>
        <h3 className={styles.successTitle}>¡Mensaje enviado!</h3>
        <p className={styles.successText}>
          Gracias por escribirnos — te responderemos a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Nombre</span>
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(e) => onChangeEmail(e.target.value)}
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Mensaje</span>
        <textarea
          className={styles.textarea}
          value={message}
          onChange={(e) => onChangeMessage(e.target.value)}
          required
        />
      </label>
      <Button type="submit" variant="primary" className={styles.submitBtn}>
        Enviar mensaje
      </Button>
    </form>
  );
}
