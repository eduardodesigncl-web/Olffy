import { useState, type FormEvent } from 'react';
import styles from './CommunitySignup.module.css';

// Bloque de comunidad / newsletter (mock local, sin backend). Sección
// protagonista con fondo morado OLFFY y decoración sutil (mismo lenguaje que
// la sección del quiz). No es un popup.
function Sparkle({ className }: { className: string }) {
  return (
    <svg className={className} width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.6 5.8L19.5 9l-5.9 1.2L12 16l-1.6-5.8L4.5 9l5.9-1.2L12 2z" />
    </svg>
  );
}

export function CommunitySignup() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  return (
    <section className={styles.section} aria-labelledby="community-title">
      <div className={styles.panel}>
        {/* Decoración: blobs suaves + chispas. */}
        <span className={`${styles.blob} ${styles.blobOne}`} aria-hidden="true" />
        <span className={`${styles.blob} ${styles.blobTwo}`} aria-hidden="true" />
        <Sparkle className={`${styles.sparkle} ${styles.sparkleOne}`} />
        <Sparkle className={`${styles.sparkle} ${styles.sparkleTwo}`} />
        <Sparkle className={`${styles.sparkle} ${styles.sparkleThree}`} />

        <div className={styles.content}>
          <span className={styles.eyebrow}>COMUNIDAD OLFFY</span>
          <h2 id="community-title" className={styles.title}>
            Sé parte del mundo OLFFY
          </h2>
          <p className={styles.text}>
            Suscríbete y entérate primero de nuestras novedades, nuevos productos, colecciones,
            lanzamientos e ideas creativas para inspirar tus días.
          </p>

          {subscribed ? (
            <p className={styles.success}>¡Bienvenida a la comunidad OLFFY! Ya eres parte de la familia.</p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo electrónico"
                className={styles.input}
                aria-label="Correo electrónico"
              />
              <button type="submit" className={styles.submitBtn}>
                Suscribirme
              </button>
            </form>
          )}

          <p className={styles.trust}>Sin spam, solo cosas bonitas y novedades con cariño.</p>
        </div>
      </div>
    </section>
  );
}
