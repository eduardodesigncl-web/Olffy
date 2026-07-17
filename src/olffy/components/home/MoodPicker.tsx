import { GiftIcon, type GiftIconName } from '../storefront';
import type { PublicPage } from '../layout';
import styles from './MoodPicker.module.css';

interface MoodPickerProps {
  onNavigate: (page: PublicPage) => void;
}

interface Mood {
  title: string;
  text: string;
  icon: GiftIconName;
  bg: string;
  accent: string;
  page: PublicPage;
}

// Compra por intención (no por categoría técnica): notas/papelitos con mood.
const MOODS: Mood[] = [
  { title: 'Para estudiar', text: 'Cuadernos y planners que ordenan tus apuntes.', icon: 'book', bg: 'var(--olffy-morado-suave)', accent: 'var(--olffy-morado)', page: 'tienda' },
  { title: 'Para regalar', text: 'Detalles bonitos para sorprender a quien quieres.', icon: 'gift', bg: 'var(--olffy-naranjo-suave)', accent: 'var(--olffy-naranjo)', page: 'regalos' },
  { title: 'Para journaling', text: 'Stickers y libretas para tu mundo creativo.', icon: 'sticker', bg: 'var(--olffy-amarillo-suave)', accent: '#c8901a', page: 'tienda' },
  { title: 'Para organizar tu semana', text: 'Planners y calendarios para no perder el ritmo.', icon: 'calendar', bg: '#d8ecd9', accent: '#2e7d32', page: 'tienda' },
];

export function MoodPicker({ onNavigate }: MoodPickerProps) {
  return (
    <section className={styles.section} aria-labelledby="mood-title">
      <div className={styles.head}>
        <span className={styles.eyebrow}>SIN PENSARLO DEMASIADO</span>
        <h2 id="mood-title" className={styles.title}>Elige según tu mood</h2>
      </div>

      <div className={styles.grid}>
        {MOODS.map((mood) => (
          <button
            key={mood.title}
            type="button"
            className={styles.note}
            style={{ background: mood.bg }}
            onClick={() => onNavigate(mood.page)}
          >
            <span className={styles.iconChip} style={{ color: mood.accent }}>
              <GiftIcon name={mood.icon} size={26} color={mood.accent} />
            </span>
            <h3 className={styles.noteTitle}>{mood.title}</h3>
            <p className={styles.noteText}>{mood.text}</p>
            <span className={styles.link} style={{ color: mood.accent }}>
              Ver opciones
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
