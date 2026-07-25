"use client";

import { useRouter } from "next/navigation";
import styles from "./CategoryBanners.module.css";

// Banda "explora por categoría": banners ilustrados (con texto propio) que
// llevan a la tienda con el filtro de categoría ya aplicado. Las imágenes ya
// traen el título, por eso el <img> lleva alt descriptivo y el botón aria-label.
const BANNERS: { src: string; label: string; href: string }[] = [
  {
    src: "/olffy/banners/planers-cuadernos.webp",
    label: "Planers y Cuadernos",
    href: "/tienda?categoria=Cuadernos",
  },
  {
    src: "/olffy/banners/stickers.webp",
    label: "Stickers",
    href: "/tienda?categoria=Stickers",
  },
];

export function CategoryBanners() {
  const router = useRouter();

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
            onClick={() => router.push(banner.href)}
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
