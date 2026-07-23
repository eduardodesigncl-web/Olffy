import { GiftIcon, type GiftIconName } from '../storefront';
import styles from './StoreLocation.module.css';

interface StoreLocationProps {
  onGoToTienda?: () => void;
}

// Datos de la tienda física (dirección real confirmada).
const STORE_ADDRESS = '2 Oriente 1145, Local 3, Viña del Mar, Valparaíso, Chile';
const STORE_ADDRESS_SHORT = '2 Oriente 1145, Local 3, Viña del Mar, Valparaíso';
const STORE_HOURS = 'Lun a Vie, 10:00–19:00 (horario referencial, por confirmar)';

const MAPS_QUERY = encodeURIComponent(STORE_ADDRESS);
// Google Maps embebido (sin API key).
const MAP_SRC = `https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`;
// "Cómo llegar": abre Google Maps en pestaña nueva con el pin de la tienda.
const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;

const MINI_DATA: { icon: GiftIconName; label: string }[] = [
  { icon: 'store', label: 'Retiro en tienda' },
  { icon: 'package', label: 'Envíos a todo Chile' },
  { icon: 'heart', label: 'Atención cercana' },
];

export function StoreLocation({ onGoToTienda }: StoreLocationProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.info}>
        <span className={styles.eyebrow}>NUESTRA TIENDA</span>
        <h2 className={styles.title}>Visítanos en Viña del Mar</h2>
        <p className={styles.text}>
          También puedes encontrarnos en Viña del Mar. Un espacio pensado para que puedas ver, tocar
          y enamorarte de cada producto antes de llevarlo a casa.
        </p>

        <ul className={styles.details}>
          <li className={styles.detail}>
            <span className={styles.detailIcon}>
              <GiftIcon name="pin" size={17} color="var(--olffy-morado)" />
            </span>
            <span>
              <span className={styles.detailLabel}>Dirección</span>
              {STORE_ADDRESS_SHORT}
            </span>
          </li>
          <li className={styles.detail}>
            <span className={styles.detailIcon}>
              <GiftIcon name="clock" size={17} color="var(--olffy-morado)" />
            </span>
            <span>
              <span className={styles.detailLabel}>Horario</span>
              {STORE_HOURS}
            </span>
          </li>
          <li className={styles.detail}>
            <span className={styles.detailIcon}>
              <GiftIcon name="store" size={17} color="var(--olffy-morado)" />
            </span>
            <span>
              <span className={styles.detailLabel}>Retiro</span>
              Coordina tu retiro sin costo por Instagram o correo.
            </span>
          </li>
        </ul>

        <div className={styles.actions}>
          <a className={styles.primaryBtn} href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">
            Cómo llegar
          </a>
          {onGoToTienda && (
            <button type="button" className={styles.secondaryBtn} onClick={onGoToTienda}>
              Ver tienda
            </button>
          )}
        </div>

        <ul className={styles.mini}>
          {MINI_DATA.map((m) => (
            <li key={m.label} className={styles.miniItem}>
              <GiftIcon name={m.icon} size={15} color="var(--olffy-naranjo)" />
              {m.label}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.mapCol}>
        <iframe
          className={styles.map}
          src={MAP_SRC}
          title="Mapa de la tienda OLFFY en Viña del Mar"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </div>
  );
}
