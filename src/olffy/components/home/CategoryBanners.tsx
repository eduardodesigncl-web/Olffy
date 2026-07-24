import type { PublicPage } from "../layout";
import styles from "./CategoryBanners.module.css";

interface CategoryBannersProps {
  onNavigate: (page: PublicPage) => void;
}

// Banda "explora por categoría": banners ilustrados (con texto propio) que
// llevan a la tienda. Las imágenes ya traen el título, por eso el <img> lleva
// alt descriptivo y el botón un aria-label.
const BANNERS: { src: string; label: string }[] = [
  { src: "/olffy/banners/kit-papeleria.webp", label: "Kit de Papelería" },
  {
    src: "/olffy/banners/planers-cuadernos.webp",
    label: "Planers y Cuadernos",
  },
  { src: "/olffy/banners/stickers.webp", label: "Stickers" },
];

export function CategoryBanners({ onNavigate }: CategoryBannersProps) {
  return (
    <section className={styles.section} aria-labelledby="cat-banners-title">
      <div className={styles.head}>
        <span className={styles.eyebrow}>EXPLORA POR CATEGORÍA</span>
        <h2 id="cat-banners-title" className={styles.title}>
          Encuentra lo tuyo
        </h2>
      </div>
      <div className={styles.grid}>
        {BANNERS.map((banner) => (
          <button
            key={banner.label}
            type="button"
            className={styles.banner}
            onClick={() => onNavigate("tienda")}
            aria-label={`Ver ${banner.label} en la tienda`}
          >
            <img
              className={styles.bannerImg}
              src={banner.src}
              alt={banner.label}
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
