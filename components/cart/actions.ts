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

async function ensureCartCookie() {
  const cookieStore = await cookies();
  const existingCartId = cookieStore.get("cartId")?.value;

  if (existingCartId) return existingCartId;

  const cart = await createCart();
  cookieStore.set("cartId", cart.id!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return cart.id;
}

export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined,
) {
  if (!selectedVariantId) {
    return "Error adding item to cart";
  }

  try {
    await ensureCartCookie();
    await addToCart([{ merchandiseId: selectedVariantId, quantity: 1 }]);
    updateTag(TAGS.cart);
  } catch (e) {
    return "Error adding item to cart";
  }
}

export async function addItemFromForm(formData: FormData) {
  const selectedVariantId = formData.get("variantId");

  if (typeof selectedVariantId !== "string") return;

  await addItem(null, selectedVariantId);
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

export async function removeItemFromForm(formData: FormData) {
  const merchandiseId = formData.get("merchandiseId");

  if (typeof merchandiseId !== "string") return;

  await removeItem(null, merchandiseId);
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

export async function updateItemQuantityFromForm(formData: FormData) {
  const merchandiseId = formData.get("merchandiseId");
  const quantity = Number(formData.get("quantity"));

  if (typeof merchandiseId !== "string" || !Number.isFinite(quantity)) return;

  await updateItemQuantity(null, { merchandiseId, quantity });
}

// Versión sin argumentos, usable directamente como action de <form>.
export async function redirectToCheckout() {
  await redirectToCheckoutWithEmail();
}

export async function redirectToCheckoutWithEmail(guestEmail?: string) {
  const cart = await getCart();

  if (!cart) {
    throw new Error("No se pudo cargar el carrito");
  }

  if (isTuuOnlineEnabled()) {
    const cookieStore = await cookies();
    const requestId =
      cookieStore.get("tuu_payment_request_id")?.value ?? randomUUID();
    const account = await getCustomerAccountState();
    const normalizedGuestEmail = guestEmail?.trim().toLowerCase();
    const payment = await startOnlinePayment({
      requestId,
      customerEmail:
        account.status === "ready"
          ? account.customer.email
          : normalizedGuestEmail || undefined,
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
  await ensureCartCookie();
}
