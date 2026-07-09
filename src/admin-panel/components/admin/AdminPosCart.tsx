// @ts-nocheck
import styles from "./AdminPosCart.module.css";

export interface PosCartItem {
  id: number;
  variantId?: string;
  name: string;
  cat: string;
  n: number; // precio unitario en CLP
  price: string; // precio unitario formateado
  qty: number;
}

interface AdminPosCartProps {
  items: PosCartItem[];
  onInc: (id: number) => void;
  onDec: (id: number) => void;
  onRemove: (id: number) => void;
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

// Carrito local del POS (independiente del CartContext público). Solo maneja
// cantidades/subtotales visuales; no descuenta stock real.
export function AdminPosCart({
  items,
  onInc,
  onDec,
  onRemove,
}: AdminPosCartProps) {
  const total = items.reduce((s, i) => s + i.n * i.qty, 0);

  return (
    <div className={styles.panel}>
      <div className={styles.titleRow}>
        <span className={styles.stepBadge}>4</span>
        <h2 className={styles.title}>Venta en curso</h2>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          Agrega productos para iniciar una venta.
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {items.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.info}>
                  <div className={styles.name}>{item.name}</div>
                  <div className={styles.unit}>{item.price} c/u</div>
                </div>
                <div className={styles.qty}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => onDec(item.id)}
                    aria-label="Disminuir"
                  >
                    −
                  </button>
                  <span className={styles.qtyValue}>{item.qty}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => onInc(item.id)}
                    aria-label="Aumentar"
                  >
                    +
                  </button>
                </div>
                <span className={styles.subtotal}>
                  {fmt(item.n * item.qty)}
                </span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => onRemove(item.id)}
                  aria-label="Quitar producto"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>{fmt(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}
