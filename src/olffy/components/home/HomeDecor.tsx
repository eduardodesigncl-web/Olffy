// Recursos gráficos de marca (SVG inline, sin assets externos): flores,
// chispas, blobs y garabatos para dar el mundo ilustrado de OLFFY.
// Todos son decorativos (aria-hidden) y no capturan eventos.

interface DecorProps {
  className?: string;
  color?: string;
  size?: number;
}

// Flor tipo margarita: 8 pétalos simétricos (elipses rotadas) + centro claro.
// Simple pero bien resuelta y consistente con el estilo OLFFY.
const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function Flower({ className, color = 'var(--olffy-naranjo)', size = 60 }: DecorProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <g fill={color}>
        {PETAL_ANGLES.map((angle) => (
          <ellipse key={angle} cx="50" cy="25" rx="12" ry="21" transform={`rotate(${angle} 50 50)`} />
        ))}
      </g>
      <circle cx="50" cy="50" r="15" fill="var(--olffy-amarillo)" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(42,28,16,0.10)" strokeWidth="1.5" />
    </svg>
  );
}

// Chispa / estrella de 4 puntas.
export function Sparkle({ className, color = 'var(--olffy-amarillo)', size = 26 }: DecorProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <path d="M12 1.5l1.9 6.8L20.5 12l-6.6 3.7L12 22.5l-1.9-6.8L3.5 12l6.6-3.7L12 1.5z" />
    </svg>
  );
}

// Blob orgánico suave (fondo decorativo).
export function Blob({ className, color = 'var(--olffy-morado-suave)', size = 200 }: DecorProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 200 200" fill={color} aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <path d="M42 -66C56 -58 71 -49 78 -35C85 -21 84 -2 79 15C74 32 65 47 52 58C39 69 22 76 3 74C-16 72 -37 61 -53 46C-69 31 -80 12 -79 -7C-78 -26 -65 -45 -49 -57C-33 -69 -14 -74 3 -76C20 -78 28 -74 42 -66Z" transform="translate(100 100)" />
    </svg>
  );
}

// Garabato ondulado (separador dibujado a mano).
export function Squiggle({ className, color = 'var(--olffy-morado)', size = 120 }: DecorProps) {
  return (
    <svg className={className} width={size} height={size * 0.2} viewBox="0 0 120 24" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <path d="M3 14C13 4 23 4 33 14S53 24 63 14 83 4 93 14s20 10 24 0" />
    </svg>
  );
}
