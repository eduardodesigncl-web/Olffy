import styles from './AnnouncementBar.module.css';

interface AnnouncementBarProps {
  messages: string[];
}

// Cinta superior con texto en loop infinito. El contenido se duplica una vez
// para que la animación (olffy-marquee, definida en global.css) haga un loop
// sin salto visible: anima translateX(0 -> -50%) sobre el doble de contenido.
export function AnnouncementBar({ messages }: AnnouncementBarProps) {
  const group = (key: string) => (
    <div className={styles.group} aria-hidden={key === 'b'}>
      {messages.map((msg, i) => (
        <span key={`${key}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '28px' }}>
          <span>{msg}</span>
          <span className={styles.dot}>·</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={styles.bar}>
      <div className={`${styles.track} olffy-marquee`}>
        {group('a')}
        {group('b')}
      </div>
    </div>
  );
}
