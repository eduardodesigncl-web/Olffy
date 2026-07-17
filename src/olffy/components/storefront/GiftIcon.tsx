import styles from './GiftIcon.module.css';

export type GiftIconName =
  | 'gift'
  | 'heart'
  | 'book'
  | 'users'
  | 'tag'
  | 'calendar'
  | 'star'
  | 'pen'
  | 'sparkles'
  | 'notebook'
  | 'sticker'
  | 'scissors'
  | 'palette'
  | 'checklist'
  | 'family'
  | 'package'
  | 'store'
  | 'bulb'
  | 'ruler'
  | 'pin'
  | 'clock'
  | 'camera'
  | 'mail'
  | 'card'
  | 'bank';

interface GiftIconProps {
  name: GiftIconName;
  size?: number;
  color?: string;
}

// Set de íconos SVG inline (line icons, sin librerías externas) — reemplaza
// los emojis usados antes en el quiz y bloques de beneficios de Regalos.
export function GiftIcon({ name, size = 22, color = 'currentColor' }: GiftIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: styles.icon,
  };

  switch (name) {
    case 'gift':
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <path d="M12 8H8.5a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8zM12 8h3.5a2.5 2.5 0 1 0 0-5C13 3 12 8 12 8z" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'tag':
      return (
        <svg {...common}>
          <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <circle cx="7" cy="7" r="1.2" fill={color} stroke="none" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
          <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
          <path d="m8.5 14 2 2 4-4" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path d="M12 2.5l3.09 6.26L22 9.77l-5 4.87 1.18 6.86L12 18.27l-6.18 3.23L7 14.64l-5-4.87 6.91-1.01L12 2.5z" />
        </svg>
      );
    case 'pen':
      return (
        <svg {...common}>
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...common}>
          <path d="M12 3l1.4 4.2L18 8.6l-4.6 1.4L12 14.2l-1.4-4.2L6 8.6l4.6-1.4L12 3z" />
          <path d="M19 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
        </svg>
      );
    case 'notebook':
      return (
        <svg {...common}>
          <rect x="5" y="2.5" width="15" height="19" rx="2" />
          <path d="M9 2.5v19M2.5 7H5M2.5 12H5M2.5 17H5M13 8h3.5" />
        </svg>
      );
    case 'sticker':
      return (
        <svg {...common}>
          <path d="M12 3a9 9 0 1 0 9 9h-5a4 4 0 0 1-4-4V3z" />
          <path d="M12 3a9 9 0 0 1 9 9" strokeDasharray="2.5 3" />
        </svg>
      );
    case 'scissors':
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="6" cy="18" r="2.5" />
          <path d="M8.1 7.8 20 19M8.1 16.2 20 5M14.7 12.5l-2.2-.5" />
        </svg>
      );
    case 'palette':
      return (
        <svg {...common}>
          <path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 1.4-3.4 2 2 0 0 1 1.4-3.4H19a3 3 0 0 0 3-3c0-4.6-4.5-8.2-10-8.2z" />
          <circle cx="7.5" cy="10.5" r="1" fill={color} stroke="none" />
          <circle cx="12" cy="7.5" r="1" fill={color} stroke="none" />
          <circle cx="16.5" cy="9.5" r="1" fill={color} stroke="none" />
        </svg>
      );
    case 'checklist':
      return (
        <svg {...common}>
          <path d="M3.5 5.5 5 7l2.5-2.5M3.5 11.5 5 13l2.5-2.5M3.5 17.5 5 19l2.5-2.5" />
          <path d="M11 6h9.5M11 12h9.5M11 18h9.5" />
        </svg>
      );
    case 'family':
      return (
        <svg {...common}>
          <circle cx="8" cy="6.5" r="3" />
          <circle cx="17" cy="8.5" r="2.2" />
          <path d="M2.5 21v-1.5a5.5 5.5 0 0 1 11 0V21" />
          <path d="M15.5 21v-1a4 4 0 0 1 6-3.5" />
        </svg>
      );
    case 'package':
      return (
        <svg {...common}>
          <path d="M21 8.5 12 3 3 8.5v7L12 21l9-5.5v-7z" />
          <path d="M3 8.5 12 14l9-5.5M12 14v7M7.5 5.75l9 5.5" />
        </svg>
      );
    case 'store':
      return (
        <svg {...common}>
          <path d="M4 9.5V20h16V9.5" />
          <path d="M3 9.5 4.5 4h15L21 9.5a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 9.5z" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case 'bulb':
      return (
        <svg {...common}>
          <path d="M9.5 18h5M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
        </svg>
      );
    case 'ruler':
      return (
        <svg {...common}>
          <path d="M15.5 3 21 8.5 8.5 21 3 15.5 15.5 3z" />
          <path d="M14 6.5 15.5 8M11 9.5 12.5 11M8 12.5 9.5 14" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      );
    case 'camera':
      return (
        <svg {...common}>
          <path d="M3 8.5a2 2 0 0 1 2-2h1.5l1.2-2h6.6l1.2 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <circle cx="12" cy="12.5" r="3.2" />
        </svg>
      );
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3.5 7 8.5 6 8.5-6" />
        </svg>
      );
    case 'card':
      return (
        <svg {...common}>
          <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
          <path d="M2.5 9.5h19M6 15h4" />
        </svg>
      );
    case 'bank':
      return (
        <svg {...common}>
          <path d="M4 10h16M5.5 10v7M9.5 10v7M14.5 10v7M18.5 10v7M3.5 20h17" />
          <path d="M12 3 4 7.5h16L12 3z" />
        </svg>
      );
    default:
      return null;
  }
}
