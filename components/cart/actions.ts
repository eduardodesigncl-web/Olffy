"use server";

import { randomUUID } from "node:crypto";
import { TAGS } from "lib/constants";
import { getCustomerAccountState } from "lib/customer/auth";
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart,
} from "lib/shopify";
import { startOnlinePayment } from "lib/transactions/online";
import { isTuuOnlineEnabled } from "lib/tuu/config";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined,
) {
  if (!selectedVariantId) {
    return "Error adding item to cart";
  }

  try {
    await addToCart([{ merchandiseId: selectedVariantId, quantity: 1 }]);
    updateTag(TAGS.cart);
  } catch (e) {
    return "Error adding item to cart";
  }
}

export async function removeItem(prevState: any, merchandiseId: string) {
  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );

    if (lineItem && lineItem.id) {
      await removeFromCart([lineItem.id]);
      updateTag(TAGS.cart);
    } else {
      return "Item not found in cart";
    }
  } catch (e) {
    return "Error removing item from cart";
  }
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  },
) {
  const { merchandiseId, quantity } = payload;

  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart([lineItem.id]);
      } else {
        await updateCart([
          {
            id: lineItem.id,
            merchandiseId,
            quantity,
          },
        ]);
      }
    } else if (quantity > 0) {
      // If the item doesn't exist in the cart and quantity > 0, add it
      await addToCart([{ merchandiseId, quantity }]);
    }

    updateTag(TAGS.cart);
  } catch (e) {
    console.error(e);
    return "Error updating item quantity";
  }
}

export async function redirectToCheckout() {
  const cart = await getCart();

  if (!cart) {
    throw new Error("No se pudo cargar el carrito");
  }

  if (isTuuOnlineEnabled()) {
    const cookieStore = await cookies();
    const requestId =
      cookieStore.get("tuu_payment_request_id")?.value ?? randomUUID();
    const account = await getCustomerAccountState();
    const payment = await startOnlinePayment({
      requestId,
      customerEmail:
        account.status === "ready" ? account.customer.email : undefined,
      items: cart.lines.map((line) => ({
        variantId: line.merchandise.id,
        quantity: line.quantity,
      })),
    });

    cookieStore.set("tuu_payment_request_id", requestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
    redirect(payment.paymentUrl);
  }

  redirect(cart!.checkoutUrl);
}

export async function createCartAndSetCookie() {
  let cart = await createCart();
  (await cookies()).set("cartId", cart.id!);
}
