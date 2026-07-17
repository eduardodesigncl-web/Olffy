"use server";

import { TAGS } from "lib/constants";
import { requestRewardAction, signOutCustomerAction } from "app/cuenta/actions";
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart,
} from "lib/shopify";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirectToCheckout } from "components/cart/actions";

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

export async function addToCartAction(
  _productId: string,
  variantId: string,
  quantity = 1,
) {
  if (!variantId) return { success: false };

  await ensureCartCookie();
  await addToCart([{ merchandiseId: variantId, quantity }]);
  updateTag(TAGS.cart);

  return { success: true };
}

export async function removeCartLineAction(lineId: string) {
  if (!lineId) return { success: false };

  await removeFromCart([lineId]);
  updateTag(TAGS.cart);

  return { success: true };
}

export async function incrementCartLineAction(lineId: string) {
  const cart = await getCart();
  const line = cart?.lines.find((item) => item.id === lineId);

  if (!line?.id) return { success: false };

  await updateCart([
    {
      id: line.id,
      merchandiseId: line.merchandise.id,
      quantity: line.quantity + 1,
    },
  ]);
  updateTag(TAGS.cart);

  return { success: true };
}

export async function decrementCartLineAction(lineId: string) {
  const cart = await getCart();
  const line = cart?.lines.find((item) => item.id === lineId);

  if (!line?.id) return { success: false };

  if (line.quantity <= 1) {
    await removeFromCart([line.id]);
  } else {
    await updateCart([
      {
        id: line.id,
        merchandiseId: line.merchandise.id,
        quantity: line.quantity - 1,
      },
    ]);
  }

  updateTag(TAGS.cart);

  return { success: true };
}

export async function goCheckoutAction() {
  await redirectToCheckout();
}

export async function requestRewardByIdAction(rewardId: string) {
  const formData = new FormData();
  formData.set("rewardId", rewardId);
  formData.set("requestId", crypto.randomUUID());

  await requestRewardAction(formData);
}

export async function signOutAction() {
  await signOutCustomerAction();
}
