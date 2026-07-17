import { useState, type FormEvent } from 'react';
import { GiftIcon, type GiftIconName } from '../components/storefront';
import { Flower, Sparkle } from '../components/home/HomeDecor';
import { Accordion } from '../components/ui';
import { FAQ } from '../data/faq.mock';
import styles from './ContactoPage.module.css';
import { INSTAGRAM_HANDLE, INSTAGRAM_PROFILE_LINK } from '../config/social';

// Dirección real de la tienda (misma que en "Nuestra historia").
const STORE_ADDRESS = '2 Oriente 11-45, Local 3, Viña del Mar, Valparaíso, Chile';
const STORE_ADDRESS_SHORT = '2 Oriente 11-45, Local 3, Viña del Mar, Valparaíso';
const MAPS_QUERY = encodeURIComponent(STORE_ADDRESS);
// Google Maps embebido (sin API key) + enlace "Cómo llegar" con el pin real.
const MAP_SRC = `https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`;
const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;

// Canales de contacto — cada uno con ícono, título, texto y (opcional) enlace.
type Channel = {
  icon?: GiftIconName;
  glyph?: 'instagram';
  accent: string;
  bg: string;
  title: string;
  text: string;
  href?: string;
};

const CHANNELS: Channel[] = [
  {
    icon: 'pin',
    accent: '#c8901a',
    bg: 'var(--olffy-amarillo-suave)',
    title: 'Ubicación',
    text: STORE_ADDRESS_SHORT,
  },
  {
    icon: 'clock',
    accent: 'var(--olffy-morado)',
    bg: 'var(--olffy-morado-suave)',
    title: 'Horario',
    text: 'Lun a Vie, 10:00–19:00',
  },
  {
    glyph: 'instagram',
    accent: 'var(--olffy-naranjo)',
    bg: 'var(--olffy-naranjo-suave)',
    title: 'Instagram',
    text: `@${INSTAGRAM_HANDLE}`,
    href: INSTAGRAM_PROFILE_LINK,
  },
  {
    icon: 'mail',
    accent: 'var(--olffy-morado)',
    bg: 'var(--olffy-morado-suave)',
    title: 'Email',
    text: 'hola@olffy.cl',
    href: 'mailto:hola@olffy.cl',
  },
  {
    icon: 'store',
    accent: '#2e7d32',
    bg: 'var(--olffy-amarillo-suave)',
    title: 'Retiro en tienda',
    text: 'Coordina tu retiro sin costo por Instagram o correo.',
  },
];

const FAQ_ITEMS = FAQ.map((item) => ({ id: item.id, question: item.q, answer: item.a }));

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function InstagramGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
interface ContactoPageProps {
  // Envío real del mensaje (tabla contact_messages en Supabase). Sin él,
  // el formulario solo valida localmente.
  onSubmit?: (input: {
    name: string;
    email: string;
    message: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

// Página de Contacto — hero, formulario con validación local + envío real,
// canales de contacto, mapa interactivo de Google Maps (dirección real) y FAQ.
export function ContactoPage({ onSubmit }: ContactoPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: boolean; email?: boolean; message?: boolean }>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = {
      name: name.trim() === '',
      email: !EMAIL_RE.test(email.trim()),
      message: message.trim() === '',
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email || nextErrors.message) return;

    if (!onSubmit) {
      setSent(true);
      return;
    }

    setSending(true);
    setSubmitError(null);
    try {
      const result = await onSubmit({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      if (!result.success) {
        throw new Error(result.error || 'No se pudo enviar el mensaje.');
      }
      setSent(true);
    } catch (cause) {
      setSubmitError(
        cause instanceof Error ? cause.message : 'No se pudo enviar el mensaje.',
      );
    } finally {
      setSending(false);
    }
  };

  const clearError = (field: 'name' | 'email' | 'message') => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: false } : prev));
  };

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <Flower className={`${styles.deco} ${styles.heroFlower}`} color="var(--olffy-naranjo)" size={60} />
        <Sparkle className={`${styles.deco} ${styles.heroSparkleA}`} color="var(--olffy-amarillo)" size={22} />
        <Sparkle className={`${styles.deco} ${styles.heroSparkleB}`} color="var(--olffy-morado)" size={15} />
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>CONTACTO</span>
          <h1 className={styles.title}>Hablemos</h1>
          <p className={styles.subtitle}>
            ¿Tienes dudas sobre tu pedido, un producto o quieres coordinar algo especial?
            Escríbenos, te respondemos con cariño.
          </p>
        </div>
      </section>

      <div className={styles.wrap}>
        {/* ── Formulario + canales ── */}
        <div className={styles.grid}>
          <div className={styles.formCard}>
            {sent ? (
              <div className={styles.success}>
                <span className={styles.successIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 12.5l5 5 11-11" />
                  </svg>
                </span>
                <h2 className={styles.successTitle}>Mensaje recibido</h2>
                <p className={styles.successText}>
                  Gracias, recibimos tu mensaje. Te responderemos pronto.
                </p>
              </div>
            ) : (
              <form className={styles.form} onSubmit={(event) => void handleSubmit(event)} noValidate>
                <h2 className={styles.formHeading}>Envíanos un mensaje</h2>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="cf-name">Nombre</label>
                  <input
                    id="cf-name"
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearError('name'); }}
                    aria-invalid={errors.name}
                    autoComplete="name"
                  />
                  {errors.name && <span className={styles.errorMsg}>Cuéntanos tu nombre.</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="cf-email">Email</label>
                  <input
                    id="cf-email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                    aria-invalid={errors.email}
                    autoComplete="email"
                  />
                  {errors.email && <span className={styles.errorMsg}>Escribe un correo válido.</span>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="cf-message">Mensaje</label>
                  <textarea
                    id="cf-message"
                    className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); clearError('message'); }}
                    aria-invalid={errors.message}
                    rows={5}
                  />
                  {errors.message && <span className={styles.errorMsg}>Escribe tu mensaje.</span>}
                </div>

                <button type="submit" className={styles.submitBtn} disabled={sending}>
                  {sending ? 'Enviando…' : 'Enviar mensaje'}
                </button>
                {submitError && (
                  <span className={styles.errorMsg} role="alert">
                    {submitError}
                  </span>
                )}
              </form>
            )}
          </div>

          <div className={styles.channels}>
            <h2 className={styles.channelsHeading}>Otras formas de contacto</h2>
            <ul className={styles.channelList}>
              {CHANNELS.map((c) => {
                const iconEl = (
                  <span className={styles.channelIcon} style={{ background: c.bg, color: c.accent }}>
                    {c.glyph === 'instagram'
                      ? <InstagramGlyph size={18} />
                      : <GiftIcon name={c.icon ?? 'heart'} size={18} color={c.accent} />}
                  </span>
                );
                return (
                  <li key={c.title} className={styles.channel}>
                    {iconEl}
                    <div className={styles.channelBody}>
                      <span className={styles.channelTitle}>{c.title}</span>
                      {c.href ? (
                        <a
                          className={styles.channelLink}
                          href={c.href}
                          {...(c.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                          {c.text}
                        </a>
                      ) : (
                        <span className={styles.channelText}>{c.text}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ── Mapa interactivo ── */}
        <section className={styles.mapSection}>
          <div className={styles.mapHead}>
            <div>
              <span className={styles.mapEyebrow}>NUESTRA TIENDA</span>
              <h2 className={styles.mapTitle}>Visítanos en Viña del Mar</h2>
              <p className={styles.mapText}>{STORE_ADDRESS_SHORT}</p>
            </div>
            <a className={styles.directionsBtn} href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">
              <GiftIcon name="pin" size={16} color="#fff" />
              Cómo llegar
            </a>
          </div>
          <iframe
            className={styles.map}
            src={MAP_SRC}
            title="Mapa de OLFFY en Viña del Mar"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </section>

        {/* ── Preguntas frecuentes ── */}
        <section className={styles.faqSection}>
          <div className={styles.faqHead}>
            <span className={styles.mapEyebrow}>DUDAS COMUNES</span>
            <h2 className={styles.faqTitle}>Preguntas frecuentes</h2>
          </div>
          <Accordion items={FAQ_ITEMS} />
        </section>
      </div>
    </div>
  );
}
