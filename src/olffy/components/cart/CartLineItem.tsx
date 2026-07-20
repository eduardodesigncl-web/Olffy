import { ProductImage, QuantityStepper } from "../ui";
import type { CartItem } from "../../types";
import styles from "./CartLineItem.module.css";

interface CartLineItemProps {
  item: CartItem;
  // Mutación en curso para esta línea: atenúa solo esta fila, sin bloquear
  // el resto del carrito.
  pending?: boolean;
  onIncrement: (lineId: string) => void;
  onDecrement: (lineId: string) => void;
  onRemove: (lineId: string) => void;
}

function formatClp(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

// Línea individual del CartDrawer: thumbnail, nombre, categoría, precio
// unitario, stepper de cantidad, subtotal y botón eliminar.
export function CartLineItem({
  item,
  pending = false,
  onIncrement,
  onDecrement,
  onRemove,
}: CartLineItemProps) {
  return (
    <div
      className={`${styles.row} ${pending ? styles.rowPending : ""}`}
      aria-busy={pending}
    >
      <div className={styles.thumb}>
        <ProductImage
          src={item.image}
          alt={item.name}
          bg={item.bg}
          shape="rounded"
          aspectRatio="1 / 1"
        />
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{item.name}</div>
        <div className={styles.cat}>{item.cat}</div>
        <div className={styles.bottomRow}>
          <QuantityStepper
            value={item.qty}
            onChange={(next) =>
              next > item.qty
                ? onIncrement(item.lineId)
                : onDecrement(item.lineId)
            }
            {...(typeof item.quantityAvailable === "number"
              ? { max: item.quantityAvailable }
              : {})}
          />
          <span className={styles.subtotal}>
            {formatClp(item.n * item.qty)}
          </span>
          <span className={styles.unitPrice}>({item.price} c/u)</span>
        </div>
      </div>
      <button
        type="button"
        className={styles.removeBtn}
        onClick={() => onRemove(item.lineId)}
        aria-label={`Eliminar ${item.name} del carrito`}
      >
        ✕
      </button>
    </div>
  );
}
