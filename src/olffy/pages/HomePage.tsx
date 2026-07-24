import {
  HomeHero,
  CategoryStickers,
  ProductCarousel,
  FeaturedCollection,
  CategoryBanners,
  MoodPicker,
  StorySection,
  LifestyleGallery,
  BenefitsStrip,
  InstagramFeed,
  CommunitySignup,
  Reveal,
} from "../components/home";
import { Button } from "../components/ui";
import type { PublicPage } from "../components/layout";
import type { Product } from "../types";
import styles from "./HomePage.module.css";

interface HomePageProps {
  products: Product[]; // catálogo real (Shopify), más nuevos primero
  onProductClick: (product: Product) => void;
  onNavigate: (page: PublicPage) => void;
}

// Home del storefront — experiencia de marca: hero, categorías sticker, carrusel
// de novedades, colección editorial, "elige según tu mood", escena editorial de
// "Conoce OLFFY", beneficios, Instagram simulado y comunidad. Apariciones suaves
// con <Reveal>.
export function HomePage({
  products,
  onProductClick,
  onNavigate,
}: HomePageProps) {
  const featuredProducts = products.slice(0, 6);
  return (
    <>
      <HomeHero onNavigate={onNavigate} />

      <Reveal>
        <CategoryStickers onNavigate={onNavigate} />
      </Reveal>

      <Reveal>
        <section className={styles.productsScene}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <div className={styles.eyebrow}>RECIÉN LLEGADOS</div>
                <h2 className={styles.sectionTitle}>Nuevos productos</h2>
              </div>
              <Button variant="outline" onClick={() => onNavigate("tienda")}>
                Ver todos
              </Button>
            </div>
            <ProductCarousel
              products={featuredProducts}
              onProductClick={onProductClick}
            />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <FeaturedCollection onNavigate={onNavigate} />
      </Reveal>

      <Reveal>
        <CategoryBanners />
      </Reveal>

      <Reveal>
        <MoodPicker onNavigate={onNavigate} />
      </Reveal>

      <Reveal>
        <StorySection onNavigate={onNavigate} />
      </Reveal>

      <Reveal>
        <LifestyleGallery />
      </Reveal>

      <Reveal>
        <BenefitsStrip />
      </Reveal>

      <Reveal>
        <InstagramFeed />
      </Reveal>

      <Reveal>
        <CommunitySignup />
      </Reveal>
    </>
  );
}
