import { useEffect, useRef, useState } from "react";
import {
  ProductGallery,
  ProductInteriorPreview,
  RelatedProducts,
} from "../components/product";
import { Accordion, Button, QuantityStepper } from "../components/ui";
import { GiftIcon, type GiftIconName } from "../components/storefront";
import { useCart } from "../context/CartContext";
import { detailSectionsFor, interiorTabsFor } from "../data/productDetails";
import type { Product, ProductVariantSummary } from "../types";
import styles from "./ProductDetailPage.module.css";

interface ProductDetailPageProps {
  product: Product;
  relatedProducts: Product[]; // relacionados calculados sobre el catálogo real
  onProductClick: (product: Product) => void;
  onGoToTienda: () => void;
}

// Beneficios de apoyo a la compra — sutiles, integrados a la columna de info.
const BENEFITS: { icon: GiftIconName; label: string }[] = [
  { icon: "package", label: "Envíos a todo Chile" },
  { icon: "store", label: "Retiro gratis en Viña del Mar" },
  { icon: "palette", label: "Diseño ilustrado propio" },
  { icon: "heart", label: "Empacado a mano, con amor" },
];

function formatClp(value: number): string {
  return "$" + Math.round(value).toLocaleString("es-CL");
}

function optionValue(
  variant: ProductVariantSummary | undefined,
  optionName: string,
): string | undefined {
  return variant?.selectedOptions.find((option) => option.name === optionName)
    ?.value;
}

// Página de detalle de producto (/tienda/<slug>) — reemplaza al antiguo modal.
// Galería + info/compra en dos columnas, visor de interior tipo libro,
// acordeones de información extendida y productos relacionados.
export function ProductDetailPage({
  product,
  relatedProducts,
  onProductClick,
  onGoToTienda,
}: ProductDetailPageProps) {
  const { addToCart, openCart } = useCart();
  const [qty, setQty] = useState(1);
  const [colorIdx, setColorIdx] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variantId);
  const interiorRef = useRef<HTMLDivElement>(null);

  // Reset del estado de compra al cambiar de producto (relacionados).
  useEffect(() => {
    setQty(1);
    setColorIdx(0);
    setSelectedVariantId(product.variantId);
  }, [product.id]);

  const variants = product.variants ?? [];
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    variants.find((variant) => variant.id === product.variantId) ??
    variants[0];
  const selectedProduct: Product = selectedVariant
    ? {
        ...product,
        variantId: selectedVariant.id,
        price: formatClp(selectedVariant.price),
        n: selectedVariant.price,
        availableForSale:
          selectedVariant.availableForSale &&
          selectedVariant.quantityAvailable !== 0,
        quantityAvailable: selectedVariant.quantityAvailable,
      }
    : product;

  // Stock de la variante que se agrega al carrito. null = Shopify no expone
  // cantidad: no se inventa un número y la validación final es del servidor.
  const maxQty =
    typeof selectedProduct.quantityAvailable === "number" &&
    selectedProduct.quantityAvailable > 0
      ? selectedProduct.quantityAvailable
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
  const optionNames = [
    ...new Set(
      variants.flatMap((variant) =>
        variant.selectedOptions.map((option) => option.name),
      ),
    ),
  ];
  const variantOptionNames = new Set(
    optionNames.map((name) => name.toLocaleLowerCase("es")),
  );
  const visibleSpecs = product.specs.filter(
    (spec) => !variantOptionNames.has(spec.l.toLocaleLowerCase("es")),
  );

  const handleAddToCart = () => {
    addToCart(selectedProduct, qty);
    openCart();
  };

  const handleOptionSelect = (optionName: string, value: string) => {
    const otherSelections = new Map(
      selectedVariant?.selectedOptions
        .filter((option) => option.name !== optionName)
        .map((option) => [option.name, option.value]),
    );
    const exactMatch = variants.find(
      (variant) =>
        optionValue(variant, optionName) === value &&
        [...otherSelections].every(
          ([name, selectedValue]) =>
            optionValue(variant, name) === selectedValue,
        ),
    );
    const nextVariant =
      exactMatch ??
      variants.find((variant) => optionValue(variant, optionName) === value);

    if (nextVariant) {
      setSelectedVariantId(nextVariant.id);
      setQty(1);
    }
  };

  const scrollToInterior = () => {
    interiorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    interiorRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className={styles.wrap}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Estás en">
        <button
          type="button"
          className={styles.crumbLink}
          onClick={onGoToTienda}
        >
          Tienda
        </button>
        <span className={styles.crumbSep} aria-hidden="true">
          /
        </span>
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
          <div className={styles.price}>{selectedProduct.price}</div>
          <p className={styles.desc}>{product.desc}</p>

          {optionNames.map((optionName) => {
            const values = [
              ...new Set(
                variants
                  .map((variant) => optionValue(variant, optionName))
                  .filter((value): value is string => Boolean(value)),
              ),
            ];
            const selectedValue = optionValue(selectedVariant, optionName);

            return (
              <fieldset key={optionName} className={styles.variantGroup}>
                <legend className={styles.blockLabel}>{optionName}</legend>
                <div className={styles.variantOptions}>
                  {values.map((value) => {
                    const isSelected = selectedValue === value;
                    const isAvailable = variants.some(
                      (variant) =>
                        optionValue(variant, optionName) === value &&
                        variant.availableForSale &&
                        variant.quantityAvailable !== 0,
                    );

                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isSelected}
                        className={`${styles.variantOption} ${
                          isSelected ? styles.variantOptionActive : ""
                        } ${!isAvailable ? styles.variantOptionUnavailable : ""}`}
                        onClick={() => handleOptionSelect(optionName, value)}
                      >
                        {value}
                        {!isAvailable && (
                          <span className={styles.variantSoldOut}>Agotado</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

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
                    className={`${styles.swatch} ${idx === colorIdx ? styles.swatchActive : ""}`}
                    style={{ background: color.hex }}
                    onClick={() => setColorIdx(idx)}
                  />
                ))}
              </div>
            </div>
          )}

          {visibleSpecs.length > 0 && (
            <div className={styles.specs}>
              {visibleSpecs.map((spec) => (
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
              disabled={!selectedProduct.availableForSale}
            >
              {selectedProduct.availableForSale
                ? "Agregar al carrito"
                : "Agotado"}
            </Button>
          </div>

          {selectedProduct.availableForSale && maxQty !== undefined && (
            <p className={styles.stockNote}>
              {maxQty} disponible{maxQty === 1 ? "" : "s"}
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

          {interiorTabs.length > 0 && (
            <button
              type="button"
              className={styles.interiorCta}
              onClick={scrollToInterior}
            >
              <span>
                <strong>Mira cómo es por dentro</strong>
                Revisa sus páginas y detalles en formato libro
              </span>
              <span className={styles.interiorCtaArrow} aria-hidden="true">
                ↓
              </span>
            </button>
          )}

          <div className={styles.accordions}>
            <Accordion items={sections} />
          </div>
        </div>
      </div>

      {/* Visor de interior (solo productos con páginas/contenido interior). */}
      {interiorTabs.length > 0 && (
        <div ref={interiorRef} className={styles.interior} tabIndex={-1}>
          <ProductInteriorPreview product={product} tabs={interiorTabs} />
        </div>
      )}

      <div className={styles.related}>
        <RelatedProducts
          product={product}
          related={related}
          onProductClick={onProductClick}
        />
      </div>
    </div>
  );
}
