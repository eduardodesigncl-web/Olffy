import { HeroCarousel, FeatureBanner, BenefitsStrip } from "../components/home";
import { ProductGrid } from "../components/product";
import { Button, ProductImage } from "../components/ui";
import type { PublicPage } from "../components/layout";
import { HERO_SLIDES } from "../data/heroSlides.mock";
import type { Product } from "../types";
import styles from "./HomePage.module.css";

interface HomePageProps {
  products: Product[]; // catálogo real (Shopify), más nuevos primero
  onProductClick: (product: Product) => void;
  onNavigate: (page: PublicPage) => void;
}

const VALUES = [
  {
    icon: "🖌️",
    bg: "var(--olffy-crema)",
    iconBg: "var(--olffy-amarillo)",
    title: "Diseño ilustrado",
    desc: "Cada producto nace de una ilustración hecha a mano, con cariño y mucho color.",
  },
  {
    icon: "📓",
    bg: "var(--olffy-morado-suave)",
    iconBg: "var(--olffy-morado)",
    title: "Papelería con propósito",
    desc: "Cuadernos y planners pensados para acompañarte a crear y organizar tus días.",
  },
  {
    icon: "💛",
    bg: "var(--olffy-naranjo-suave)",
    iconBg: "var(--olffy-naranjo)",
    title: "Hecho con amor",
    desc: "Empacamos cada pedido a mano en Viña del Mar, listo para llegar a todo Chile.",
  },
];

// Home real del storefront — reemplaza el placeholder central de App.tsx.
// Compone HeroCarousel, FeatureBanner ("Lanzamientos"), ProductGrid
// ("Recién llegados"), la sección editorial "Conoce OLFFY" y BenefitsStrip.
export function HomePage({
  products,
  onProductClick,
  onNavigate,
}: HomePageProps) {
  const featuredProducts = products.slice(0, 6);

  return (
    <>
      <HeroCarousel
        slides={HERO_SLIDES}
        onCtaClick={(page) => onNavigate(page as PublicPage)}
      />

      <FeatureBanner
        eyebrow="COLECCIÓN ACTUAL"
        serif="Lanzamientos"
        display="Nuevos"
        subtitle="Explora nuestros productos más recientes, diseñados para inspirarte cada día."
        ctaLabel="Explorar tienda →"
        onCtaClick={() => onNavigate("tienda")}
        bg="#FFE9A8"
      />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <div className={styles.eyebrow}>RECIÉN LLEGADOS</div>
            <h2 className={styles.sectionTitle}>Nuevos productos</h2>
          </div>
          <Button variant="outline" onClick={() => onNavigate("tienda")}>
            Ver todos
          </Button>
        </div>
        <ProductGrid
          products={featuredProducts}
          onProductClick={onProductClick}
        />
      </section>

      <section className={styles.aboutSection}>
        <div className={styles.aboutInner}>
          <div className={styles.aboutRow}>
            <div className={styles.aboutTextCol}>
              <div className={styles.eyebrow}>NUESTRA HISTORIA</div>
              <h2 className={styles.aboutHeadline}>
                <span className={styles.aboutSerif}>Conoce</span>
                <span className={styles.aboutDisplay}>OLFFY</span>
              </h2>
              <p className={styles.aboutText}>
                Descubre la historia detrás de OLFFY y cómo creamos productos
                únicos para organizar tu mundo con magia.
              </p>
              <Button
                variant="outline"
                style={{ marginTop: 24 }}
                onClick={() => onNavigate("historia")}
              >
                Ver nuestra historia →
              </Button>
            </div>
            <div className={styles.aboutVisualCol}>
              <div className={styles.aboutVisualFrame}>
                <div className={styles.aboutVisualBox}>
                  <ProductImage bg="#DEDDF2" shape="rect" aspectRatio="auto" />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.valuesGrid}>
            {VALUES.map((value) => (
              <div
                key={value.title}
                className={styles.valueCard}
                style={{ background: value.bg }}
              >
                <div
                  className={styles.valueIcon}
                  style={{ background: value.iconBg }}
                >
                  {value.icon}
                </div>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDesc}>{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BenefitsStrip />
    </>
  );
}
