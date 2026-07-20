import { useEffect, useState } from 'react';
import { ProductGallery, ProductInteriorPreview, RelatedProducts } from '../components/product';
import { Accordion, Button, QuantityStepper } from '../components/ui';
import { GiftIcon, type GiftIconName } from '../components/storefront';
import { useCart } from '../context/CartContext';
import { detailSectionsFor, interiorTabsFor } from '../data/productDetails';
import type { Product } from '../types';
import styles from './ProductDetailPage.module.css';

interface ProductDetailPageProps {
  product: Product;
  relatedProducts: Product[]; // relacionados calculados sobre el catálogo real
  onProductClick: (product: Product) => void;
  onGoToTienda: () => void;
}

// Beneficios de apoyo a la compra — sutiles, integrados a la columna de info.
const BENEFITS: { icon: GiftIconName; label: string }[] = [
  { icon: 'package', label: 'Envíos a todo Chile' },
  { icon: 'store', label: 'Retiro gratis en Viña del Mar' },
  { icon: 'palette', label: 'Diseño ilustrado propio' },
  { icon: 'heart', label: 'Empacado a mano, con amor' },
];

// Página de detalle de producto (/tienda/<slug>) — reemplaza al antiguo modal.
// Galería + info/compra en dos columnas, visor de interior tipo libro,
// acordeones de información extendida y productos relacionados.
export function ProductDetailPage({ product, relatedProducts, onProductClick, onGoToTienda }: ProductDetailPageProps) {
  const { addToCart, openCart } = useCart();
  const [qty, setQty] = useState(1);
  const [colorIdx, setColorIdx] = useState(0);

  // Reset del estado de compra al cambiar de producto (relacionados).
  useEffect(() => {
    setQty(1);
    setColorIdx(0);
  }, [product.id]);

  // Stock de la variante que se agrega al carrito. null = Shopify no expone
  // cantidad: no se inventa un número y la validación final es del servidor.
  const maxQty =
    typeof product.quantityAvailable === 'number' && product.quantityAvailable > 0
      ? product.quantityAvailable
      : undefined;

  // Si el stock bajó (revalidación) y la cantidad elegida lo supera, se
  // corrige al máximo disponible en vez de dejar pasar una cantidad inválida.
  useEffect(() => {
    if (maxQty !== undefined) {
      setQty((current) => Math.min(current, maxQty));
    }
  }, [maxQty]);

  const interiorTabs = interiorTabsFor(product);
  const related = relatedProducts;
  const sections = detailSectionsFor(product);

  const handleAddToCart = () => {
    addToCart(product, qty);
    openCart();
  };

  return (
    <div className={styles.wrap}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Estás en">
        <button type="button" className={styles.crumbLink} onClick={onGoToTienda}>
          Tienda
        </button>
        <span className={styles.crumbSep} aria-hidden="true">/</span>
        <span className={styles.crumbCurrent}>{product.name}</span>
      </nav>

      <div className={styles.main}>
        {/* Columna izquierda: galería. */}
        <div className={styles.galleryCol}>
          <ProductGallery product={product} />
        </div>

        {/* Columna derecha: información y compra. */}
        <div className={styles.infoCol}>
          <span className={styles.cat}>{product.cat}</span>
          <h1 className={styles.name}>{product.name}</h1>
          <div className={styles.price}>{product.price}</div>
          <p className={styles.desc}>{product.desc}</p>

          {product.colors.length > 0 && (
            <div className={styles.block}>
              <span className={styles.blockLabel}>Color</span>
              <div className={styles.colorRow}>
                {product.colors.map((color, idx) => (
                  <button
                    key={color.name}
                    type="button"
                    title={color.name}
                    aria-label={`Color ${color.name}`}
                    aria-pressed={idx === colorIdx}
                    className={`${styles.swatch} ${idx === colorIdx ? styles.swatchActive : ''}`}
                    style={{ background: color.hex }}
                    onClick={() => setColorIdx(idx)}
                  />
                ))}
              </div>
            </div>
          )}

          {product.specs.length > 0 && (
            <div className={styles.specs}>
              {product.specs.map((spec) => (
                <div key={spec.l} className={styles.spec}>
                  <span className={styles.specLabel}>{spec.l}</span>
                  <span className={styles.specValue}>{spec.v}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.buyRow}>
            <QuantityStepper
              value={qty}
              onChange={setQty}
              {...(maxQty !== undefined ? { max: maxQty } : {})}
            />
            <Button
              variant="primary"
              className={styles.addBtn}
              onClick={handleAddToCart}
              disabled={!product.availableForSale}
            >
              {product.availableForSale ? 'Agregar al carrito' : 'Agotado'}
            </Button>
          </div>

          {product.availableForSale && maxQty !== undefined && (
            <p className={styles.stockNote}>
              {maxQty} disponible{maxQty === 1 ? '' : 's'}
            </p>
          )}

          <ul className={styles.benefits}>
            {BENEFITS.map((b) => (
              <li key={b.label} className={styles.benefit}>
                <GiftIcon name={b.icon} size={15} color="var(--olffy-morado)" />
                {b.label}
              </li>
            ))}
          </ul>

          <div className={styles.accordions}>
            <Accordion items={sections} />
          </div>
        </div>
      </div>

      {/* Visor de interior (solo productos con páginas/contenido interior). */}
      {interiorTabs.length > 0 && (
        <div className={styles.interior}>
          <ProductInteriorPreview product={product} tabs={interiorTabs} />
        </div>
      )}

      <div className={styles.related}>
        <RelatedProducts product={product} related={related} onProductClick={onProductClick} />
      </div>
    </div>
  );
}
