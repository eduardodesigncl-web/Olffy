import { Button } from "../ui";
import styles from "./CheckoutSuccess.module.css";

interface CheckoutSuccessProps {
  orderNumber: string;
  itemCount: number;
  formattedTotal: string;
  onGoHome: () => void;
}

// Paso 4 del checkout — confirmación mock. El carrito ya se vació al llegar
// acá (ver CheckoutPage.handleFinish), por eso itemCount/formattedTotal
// llegan como snapshot en vez de leerse de CartContext.
export function CheckoutSuccess({
  orderNumber,
  itemCount,
  formattedTotal,
  onGoHome,
}: CheckoutSuccessProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>🎉</div>
      <h1 className={styles.title}>¡Compra confirmada!</h1>
      <p className={styles.text}>
        Gracias por tu pedido — te enviaremos un correo con los detalles de
        envío en las próximas horas.
      </p>

      <div className={styles.orderBox}>
        <div className={styles.orderLabel}>Número de orden</div>
        <div className={styles.orderNumber}>{orderNumber}</div>
        <div className={styles.summaryRow}>
          <span>
            {itemCount} producto{itemCount === 1 ? "" : "s"}
          </span>
          <span>{formattedTotal}</span>
        </div>
      </div>

      <Button variant="primary" className={styles.homeBtn} onClick={onGoHome}>
        Volver al inicio →
      </Button>
    </div>
  );
}
