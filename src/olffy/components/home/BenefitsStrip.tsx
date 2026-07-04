import styles from "./BenefitsStrip.module.css";

interface BenefitItem {
  icon: string;
  title: string;
  desc: string;
  bg: string;
  iconBg: string;
}

const BENEFITS: BenefitItem[] = [
  {
    icon: "📦",
    title: "Envíos a todo Chile",
    desc: "Rápido y seguro",
    bg: "var(--olffy-crema)",
    iconBg: "var(--olffy-amarillo)",
  },
  {
    icon: "🏬",
    title: "Retiro gratis en tienda",
    desc: "En Viña del Mar",
    bg: "var(--olffy-morado-suave)",
    iconBg: "var(--olffy-morado)",
  },
  {
    icon: "🎨",
    title: "Papelería ilustrada",
    desc: "Diseños propios",
    bg: "var(--olffy-naranjo-suave)",
    iconBg: "var(--olffy-naranjo)",
  },
  {
    icon: "💛",
    title: "Hecho con amor",
    desc: "A mano, claro",
    bg: "var(--olffy-amarillo-suave)",
    iconBg: "#c8901a",
  },
];

// Franja de 4 beneficios de marca — cierre de la Home, igual que el original.
export function BenefitsStrip() {
  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {BENEFITS.map((item) => (
          <div
            key={item.title}
            className={styles.item}
            style={{ background: item.bg }}
          >
            <div className={styles.iconBox} style={{ background: item.iconBg }}>
              {item.icon}
            </div>
            <div>
              <div className={styles.title}>{item.title}</div>
              <div className={styles.desc}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
