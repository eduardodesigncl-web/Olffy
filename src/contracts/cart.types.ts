export interface CartLine {
  lineId: string;
  productId: string;
  variantId: string;
  title: string;
  image: string;
  quantity: number;
  price: number;
}

export interface Cart {
  cartId: string;
  lines: CartLine[];
  subtotal: number;
  total: number;
  checkoutUrl: string;
}
