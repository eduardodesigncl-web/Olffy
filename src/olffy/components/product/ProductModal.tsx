import { useState } from "react";
import { Badge, Button, Modal, ProductImage, QuantityStepper } from "../ui";
import { useCart } from "../../context/CartContext";
import type { Product } from "../../types";
import styles from "./ProductModal.module.css";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

// Vista rápida de producto — abierta desde ProductCard/ProductGrid vía
// onProductClick. Reemplaza al modal `showModal`/`selectedProduct` del
// original: galería (placeholder de color), colores, specs, bundle y
// selector de cantidad antes de agregar al carrito.
export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addToCart, openCart } = useCart();
  const [qty, setQty] = useState(1);
  const [colorIdx, setColorIdx] = useState(0);
  const [bundleSelected, setBundleSelected] = useState(false);

  const isOpen = product !== null;

  const handleClose = () => {
    setQty(1);
    setColorIdx(0);
    setBundleSelected(false);
    onClose();
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, qty);
    // Cierra el modal y abre el carrito para confirmar visualmente que se agregó
    // — mismo patrón del original (selectedProduct:null, cartOpen:true).
    handleClose();
    openCart();
  };

  if (!product) return null;

  const hasColors = product.colors.length > 0;
  const hasSpecs = product.specs.length > 0;
  const hasBundle = product.bundle !== null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className={styles.body}>
        <div className={styles.gallery}>
          <div className={styles.imageWrap}>
            <ProductImage
              src={product.image}
              alt={product.name}
              bg={product.bg}
              shape="rounded"
              aspectRatio="1 / 1"
              badge={product.tag ? <Badge label={product.tag} /> : undefined}
            />
          </div>
        </div>

        <div className={styles.info}>
          <div>
            <div className={styles.cat}>{product.cat}</div>
            <h2 className={styles.name}>{product.name}</h2>
            <div className={styles.price}>{product.price}</div>
            <p className={styles.desc}>{product.desc}</p>
          </div>

          {hasColors && (
            <div>
              <div className={styles.sectionLabel}>Color</div>
              <div className={styles.colorRow}>
                {product.colors.map((color, idx) => (
                  <button
                    key={color.name}
                    type="button"
                    title={color.name}
                    className={`${styles.colorSwatch} ${idx === colorIdx ? styles.active : ""}`}
                    style={{ background: color.hex }}
                    onClick={() => setColorIdx(idx)}
                  />
                ))}
              </div>
            </div>
          )}

          {hasSpecs && (
            <div className={styles.specsBox}>
              <div className={styles.specsGrid}>
                {product.specs.map((spec) => (
                  <div key={spec.l}>
                    <div className={styles.specLabel}>{spec.l}</div>
                    <div className={styles.specValue}>{spec.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasBundle && product.bundle && (
            <div>
              <div className={styles.sectionLabel}>✦ Combínalo con</div>
              <div
                className={`${styles.bundleBox} ${bundleSelected ? styles.active : ""}`}
                onClick={() => setBundleSelected((prev) => !prev)}
              >
                <div
                  className={`${styles.bundleRadio} ${bundleSelected ? styles.active : ""}`}
                />
                <div className={styles.bundleInfo}>
                  <div className={styles.bundleName}>{product.bundle.name}</div>
                  <div className={styles.bundleDesc}>{product.bundle.desc}</div>
                </div>
                <div className={styles.bundlePrice}>{product.bundle.price}</div>
              </div>
            </div>
          )}

          <div className={styles.footer}>
            <QuantityStepper value={qty} onChange={setQty} />
            <Button
              variant="primary"
              className={styles.addBtn}
              onClick={handleAddToCart}
              disabled={!product.availableForSale}
            >
              {product.availableForSale ? "Agregar al carrito" : "Agotado"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
