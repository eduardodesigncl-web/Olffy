import { useState } from "react";
import { GiftQuiz, GiftIcon } from "../components/storefront";
import type { GiftIconName } from "../components/storefront";
import { Flower, Sparkle } from "../components/home/HomeDecor";
import { ProductGrid } from "../components/product";
import { Button } from "../components/ui";
import { QUIZ } from "../data/quiz.mock";
import type { Product } from "../types";
import styles from "./RegalosPage.module.css";

interface RegalosPageProps {
  products: Product[]; // catálogo real (Shopify) para el quiz
  giftProducts: Product[]; // selección de regalos (tag/categoría/precio)
  onProductClick: (product: Product) => void;
}

const QUIZ_CHIPS: { icon: GiftIconName; label: string }[] = [
  { icon: "users", label: "Para quién es" },
  { icon: "heart", label: "Qué le gusta" },
  { icon: "star", label: "Estilo" },
  { icon: "tag", label: "Presupuesto" },
];

const BENEFITS: { icon: GiftIconName; title: string; text: string }[] = [
  {
    icon: "gift",
    title: "Regalos listos para sorprender",
    text: "Elegidos y empacados con cariño",
  },
  {
    icon: "star",
    title: "Kits curados",
    text: "Combinaciones pensadas para regalar",
  },
  {
    icon: "pen",
    title: "Papelería ilustrada",
    text: "Diseños originales OLFFY",
  },
];

// Página de Regalos — sección de color única (sin card-in-card): intro con
// chips indicadores + CTA, y al activar el quiz este se despliega hacia abajo
// dentro de la misma sección con animación fade + slide.
export function RegalosPage({
  products,
  giftProducts,
  onProductClick,
}: RegalosPageProps) {
  const [quizActive, setQuizActive] = useState(false);

  return (
    <div className={styles.page}>
      {/* Hero superior de ancho completo (referencia: hero de Tienda). */}
      <section className={styles.hero}>
        <Flower
          className={`${styles.deco} ${styles.decoFlower}`}
          color="var(--olffy-naranjo)"
          size={62}
        />
        <Sparkle
          className={`${styles.deco} ${styles.decoSparkleA}`}
          color="var(--olffy-amarillo)"
          size={22}
        />
        <Sparkle
          className={`${styles.deco} ${styles.decoSparkleB}`}
          color="var(--olffy-morado)"
          size={15}
        />

        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>REGALOS OLFFY</span>
          <h1 className={styles.title}>Encuentra el detalle perfecto</h1>
          <p className={styles.subtitle}>
            Kits curados, papelería ilustrada y detalles especiales para regalar
            con cariño.
          </p>
        </div>
      </section>

      <div className={styles.wrap}>
        <section className={styles.quizSection}>
          <span
            aria-hidden="true"
            className={`${styles.blob} ${styles.blobOne}`}
          />
          <span
            aria-hidden="true"
            className={`${styles.blob} ${styles.blobTwo}`}
          />

          <div className={styles.quizIntro}>
            <span className={styles.quizEyebrow}>
              <GiftIcon name="sparkles" size={14} />
              Quiz de regalos
            </span>
            <h2 className={styles.quizTitle}>¿No sabes qué elegir?</h2>
            <p className={styles.quizText}>
              Responde {QUIZ.length} preguntas rápidas y te recomendamos
              productos OLFFY según para quién es, lo que le gusta, su estilo y
              tu presupuesto.
            </p>

            {!quizActive ? (
              <>
                <Button variant="primary" onClick={() => setQuizActive(true)}>
                  Comenzar quiz
                </Button>
                <div className={styles.chipsRow}>
                  {QUIZ_CHIPS.map((chip) => (
                    <span key={chip.label} className={styles.chip}>
                      <GiftIcon name={chip.icon} size={14} />
                      {chip.label}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <button
                type="button"
                className={styles.closeLink}
                onClick={() => setQuizActive(false)}
              >
                Cerrar quiz
              </button>
            )}
          </div>

          {quizActive && (
            <div className={styles.quizReveal}>
              <GiftQuiz
                questions={QUIZ}
                products={products}
                onProductClick={onProductClick}
              />
            </div>
          )}
        </section>

        <div className={styles.benefitsGrid}>
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <GiftIcon name={benefit.icon} size={20} />
              </div>
              <div>
                <div className={styles.benefitTitle}>{benefit.title}</div>
                <div className={styles.benefitText}>{benefit.text}</div>
              </div>
            </div>
          ))}
        </div>

        <figure className={styles.giftFeature}>
          <img
            className={styles.giftFeatureImg}
            src="/olffy/lifestyle/life-5.webp"
            alt="Bolsa de regalo OLFFY con papel de seda de la marca y cuadernos ilustrados, lista para regalar."
            loading="lazy"
          />
          <figcaption className={styles.giftFeatureCaption}>
            Cada pedido se empaca a mano y con cariño, listo para sorprender.
          </figcaption>
        </figure>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Ideas para regalar</h2>
          </div>
          <ProductGrid
            products={giftProducts.slice(0, 8)}
            onProductClick={onProductClick}
          />
        </section>
      </div>
    </div>
  );
}
