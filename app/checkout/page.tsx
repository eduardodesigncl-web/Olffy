import { redirect } from "next/navigation";

export const metadata = { title: "Carrito y pago seguro" };

// El pre-checkout vive en el carrito. Shopify solicita dirección, despacho y
// pago en su checkout oficial; OLFFY no duplica esos datos sensibles.
export default function CheckoutPage() {
  redirect("/tienda?cart=open");
}
