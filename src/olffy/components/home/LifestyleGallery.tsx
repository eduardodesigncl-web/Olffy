import styles from "./LifestyleGallery.module.css";

// Galería de fotos reales de la marca para darle vida a la Home. Cada imagen
// lleva alt descriptivo (SEO) con palabras clave del negocio y su ubicación.
const PHOTOS: { src: string; alt: string }[] = [
  {
    src: "/olffy/lifestyle/life-1.webp",
    alt: "Perrito golden retriever en el taller de OLFFY, papelería creativa hecha a mano en Viña del Mar, Chile.",
  },
  {
    src: "/olffy/lifestyle/life-3.webp",
    alt: "Cuaderno ilustrado OLFFY con lápices de colores y cámara instantánea sobre un escritorio de madera.",
  },
  {
    src: "/olffy/lifestyle/life-4.webp",
    alt: "Cuaderno ilustrado de perrito OLFFY guardado en una tote bag rosada de algodón de la marca.",
  },
  {
    src: "/olffy/lifestyle/life-6.webp",
    alt: "Lámina de stickers ilustrados de ranitas OLFFY junto a una taza de café.",
  },
];

export function LifestyleGallery() {
  return (
    <section className={styles.section} aria-labelledby="lifestyle-title">
      <div className={styles.head}>
        <span className={styles.eyebrow}>EL MUNDO OLFFY</span>
        <h2 id="lifestyle-title" className={styles.title}>
          Papelería para acompañar tu día a día
        </h2>
      </div>
      <div className={styles.grid}>
        {PHOTOS.map((photo) => (
          <figure key={photo.src} className={styles.item}>
            <img
              className={styles.img}
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
