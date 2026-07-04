export interface CheckoutForm {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  deliveryMethod: "shipping" | "pickup";
  discountCode?: string;
}

export interface CheckoutSummary {
  lines: import("./cart.types").CartLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  discountCode?: string;
}
