"use server";

import { TAGS } from "lib/constants";
import { getCustomerAccountState } from "lib/customer/auth";
import { issueStorefrontCartRewardRedemption } from "lib/loyalty/automatic-redemptions";
import { cancelShopifyRewardRedemption } from "lib/loyalty/redemptions";
import {
  calculatePointsForAmount,
  getActiveLoyaltyRule,
  getActiveStorefrontCartRedemption,
  getCustomerBalance,
  listRewards,
  type LoyaltyReward,
  type LoyaltyRule,
  type RewardRedemption,
} from "lib/loyalty/service";
import {
  getCart,
  updateCartBuyerEmail,
  updateCartDiscountCodes,
} from "lib/shopify";
import { prepareOnlineSale } from "lib/transactions/online";
import { updateTag } from "next/cache";
import { getSupabaseServer } from "lib/supabase/server";
import type {
  AppliedCheckoutReward,
  StorefrontLoyaltyActionResult,
  StorefrontLoyaltyState,
} from "src/olffy/types";

function clp(value: string | number | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(Math.round(number), 0) : 0;
}

function publicMessage(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "Error inesperado";
  if (message.toLowerCase().includes("insufficient points")) {
    return "No tienes puntos suficientes para esta recompensa.";
  }
  if (message.toLowerCase().includes("another active reward")) {
    return "Este carrito ya tiene otro beneficio activo. Quítalo antes de cambiarlo.";
  }
  return message;
}

function activeRewardView(
  redemption: RewardRedemption | null,
  discountCodes: Array<{ code: string; applicable: boolean }>,
) {
  if (
    !redemption ||
    redemption.status !== "approved" ||
    !redemption.shopify_discount_code
  ) {
    return null;
  }

  return {
    redemptionId: redemption.id,
    rewardId: redemption.reward_id,
    name: redemption.rewards?.name ?? "Beneficio OLFFY",
    code: redemption.shopify_discount_code,
    pointsSpent: redemption.points_spent,
    discountAmountClp: clp(redemption.rewards?.discount_amount_clp),
    expiresAt: redemption.shopify_discount_ends_at,
    applicable:
      discountCodes.find(
        ({ code }) =>
          code.toLowerCase() ===
          redemption.shopify_discount_code?.toLowerCase(),
      )?.applicable === true,
  };
}

function rewardViews(input: {
  rewards: LoyaltyReward[];
  pointsBalance: number;
  subtotal: number;
}) {
  return input.rewards
    .filter(
      (reward) =>
        reward.is_active &&
        reward.reward_type === "discount" &&
        clp(reward.discount_amount_clp) > 0,
    )
    .sort((a, b) => a.points_cost - b.points_cost)
    .map((reward) => {
      const missingPoints = Math.max(
        reward.points_cost - input.pointsBalance,
        0,
      );
      const minimumMissingClp = Math.max(
        reward.minimum_purchase_clp - input.subtotal,
        0,
      );
      return {
        id: reward.id,
        name: reward.name,
        description: reward.description,
        pointsCost: reward.points_cost,
        discountAmountClp: clp(reward.discount_amount_clp),
        minimumPurchaseClp: reward.minimum_purchase_clp,
        eligible: missingPoints === 0 && minimumMissingClp === 0,
        missingPoints,
        minimumMissingClp,
      };
    });
}

export async function getStorefrontLoyaltyStateAction(): Promise<StorefrontLoyaltyState> {
  const [account, cart, rewards, rule] = await Promise.all([
    getCustomerAccountState(),
    getCart(),
    listRewards(true),
    getActiveLoyaltyRule().catch((error): LoyaltyRule | null => {
      console.error("No se pudo cargar la regla de puntos:", error);
      return null;
    }),
  ]);
  const subtotal = clp(cart?.cost.subtotalAmount.amount);
  const shopifyTotal = clp(cart?.cost.totalAmount.amount);
  // Shopify incluye impuestos/despacho estimados en `totalAmount`, por lo que
  // `subtotal - total` NO representa el descuento de puntos (puede dar 0 o
  // negativo y ocultar el descuento en el resumen). Se usa solo como respaldo
  // para códigos de descuento externos cuando no hay una recompensa aplicada.
  const externalDiscount = Math.max(subtotal - shopifyTotal, 0);

  const earnRate = rule
    ? {
        spendingUnitClp: rule.spending_unit_clp,
        pointsPerUnit: rule.points_per_unit,
      }
    : null;

  if (account.status !== "ready") {
    const total = Math.max(subtotal - externalDiscount, 0);
    return {
      accountStatus: account.status,
      pointsBalance: 0,
      subtotal,
      discount: externalDiscount,
      total,
      pointsToEarn: rule ? calculatePointsForAmount(total, rule) : 0,
      earnRate,
      rewards: [],
      activeReward: null,
    };
  }

  const active = cart?.id
    ? await getActiveStorefrontCartRedemption({
        customerId: account.customer.id,
        storefrontCartId: cart.id,
      })
    : null;
  const activeReward = activeRewardView(active, cart?.discountCodes ?? []);
  // El descuento del resumen proviene de la recompensa aplicada (fuente
  // confiable e independiente de impuestos). Si la recompensa no aplica al
  // carrito, se recurre al descuento externo del carrito de Shopify.
  const discount =
    activeReward?.applicable && activeReward.discountAmountClp > 0
      ? activeReward.discountAmountClp
      : externalDiscount;
  // Total estimado del mini-resumen: subtotal menos el descuento de puntos.
  // Impuestos y despacho se finalizan en el checkout de Shopify.
  const total = Math.max(subtotal - discount, 0);
  // Puntos que acumula la compra: estimación sobre el total a pagar (tras
  // descuentos). Los puntos definitivos se confirman al completar el pago.
  const pointsToEarn = rule ? calculatePointsForAmount(total, rule) : 0;
  const displayName =
    account.customer.full_name?.trim() ||
    account.customer.email.split("@")[0] ||
    "Cliente OLFFY";

  return {
    accountStatus: account.customer.status === "active" ? "ready" : "blocked",
    displayName,
    initial: displayName.charAt(0).toLocaleUpperCase("es-CL"),
    pointsBalance: account.customer.points_balance,
    subtotal,
    discount,
    total,
    pointsToEarn,
    earnRate,
    rewards: rewardViews({
      rewards,
      pointsBalance: account.customer.points_balance,
      subtotal,
    }),
    activeReward,
  };
}

export async function signOutStorefrontAction() {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
}

export async function applyCartRewardAction(input: {
  rewardId: number;
  requestId: string;
}): Promise<StorefrontLoyaltyActionResult> {
  let issued:
    | Awaited<ReturnType<typeof issueStorefrontCartRewardRedemption>>
    | undefined;
  let previousCodes: string[] = [];
  let actor = "customer:storefront";

  try {
    if (!Number.isSafeInteger(input.rewardId) || input.rewardId <= 0) {
      throw new Error("La recompensa seleccionada no es válida.");
    }
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(input.requestId)) {
      throw new Error("La solicitud de canje no es válida.");
    }

    const account = await getCustomerAccountState();
    if (account.status !== "ready") {
      throw new Error("Inicia sesión para usar tus puntos en esta compra.");
    }
    if (account.customer.status !== "active") {
      throw new Error("Tu cuenta de puntos no está activa.");
    }

    const cart = await getCart();
    if (!cart?.id || cart.lines.length === 0) {
      throw new Error("Tu carrito está vacío o ya no está disponible.");
    }

    const [snapshot, rewards, existing] = await Promise.all([
      prepareOnlineSale({
        customerEmail: account.customer.email,
        items: cart.lines.map((line) => ({
          variantId: line.merchandise.id,
          quantity: line.quantity,
        })),
      }),
      listRewards(true),
      getActiveStorefrontCartRedemption({
        customerId: account.customer.id,
        storefrontCartId: cart.id,
      }),
    ]);
    const reward = rewards.find((candidate) => candidate.id === input.rewardId);

    if (existing && existing.reward_id !== input.rewardId) {
      throw new Error(
        "Este carrito ya tiene otro beneficio activo. Quítalo antes de cambiarlo.",
      );
    }
    if (
      !reward ||
      !reward.is_active ||
      reward.reward_type !== "discount" ||
      clp(reward.discount_amount_clp) <= 0
    ) {
      throw new Error("Esta recompensa no está disponible para pago online.");
    }
    if (reward.points_cost > account.customer.points_balance && !existing) {
      throw new Error("No tienes puntos suficientes para esta recompensa.");
    }
    if (snapshot.subtotal < reward.minimum_purchase_clp) {
      throw new Error(
        `Esta recompensa requiere una compra mínima de $${reward.minimum_purchase_clp.toLocaleString("es-CL")}.`,
      );
    }

    const identifiedCart = await updateCartBuyerEmail(account.customer.email);
    actor = `customer:storefront:${account.user.id}`;
    issued = await issueStorefrontCartRewardRedemption({
      customerId: account.customer.id,
      rewardId: reward.id,
      storefrontCartId: cart.id,
      requestId: input.requestId,
      createdBy: actor,
      metadata: { source: "cart_before_shopify_checkout" },
    });
    previousCodes = (identifiedCart.discountCodes ?? []).map(
      ({ code }) => code,
    );
    const updatedCart = await updateCartDiscountCodes([
      ...previousCodes.filter(
        (code) => code.toLowerCase() !== issued!.code.toLowerCase(),
      ),
      issued.code,
    ]);
    const applied = updatedCart.discountCodes.find(
      ({ code }) => code.toLowerCase() === issued!.code.toLowerCase(),
    );

    if (!applied?.applicable) {
      throw new Error(
        "Shopify no pudo aplicar esta recompensa al contenido actual del carrito.",
      );
    }

    updateTag(TAGS.cart);
    return {
      ok: true,
      state: await getStorefrontLoyaltyStateAction(),
      message: issued.alreadyExists
        ? "El beneficio vigente volvió a aplicarse al carrito."
        : "Beneficio aplicado. Tus puntos quedaron reservados hasta el pago.",
    };
  } catch (cause) {
    if (issued && !issued.alreadyExists) {
      try {
        await updateCartDiscountCodes(previousCodes);
        await cancelShopifyRewardRedemption({
          redemptionId: issued.redemptionId,
          reason: "No se pudo aplicar el canje al carrito online",
          createdBy: actor,
        });
        updateTag(TAGS.cart);
      } catch (rollbackError) {
        console.error("El canje online requiere conciliación:", rollbackError);
        return {
          ok: false,
          message:
            "No se pudo aplicar el beneficio y la reversa requiere revisión. Contacta a OLFFY antes de reintentar.",
        };
      }
    }

    return { ok: false, message: publicMessage(cause) };
  }
}

export async function removeCartRewardAction(): Promise<StorefrontLoyaltyActionResult> {
  try {
    const account = await getCustomerAccountState();
    if (account.status !== "ready") {
      throw new Error("La sesión del cliente ya no está activa.");
    }
    const cart = await getCart();
    if (!cart?.id) throw new Error("No se pudo cargar el carrito.");
    const active = await getActiveStorefrontCartRedemption({
      customerId: account.customer.id,
      storefrontCartId: cart.id,
    });
    if (!active) {
      return { ok: true, state: await getStorefrontLoyaltyStateAction() };
    }
    if (!active.shopify_discount_code) {
      throw new Error(
        "El canje todavía se está procesando. Intenta nuevamente.",
      );
    }

    const remainingCodes = (cart.discountCodes ?? [])
      .map(({ code }) => code)
      .filter(
        (code) =>
          code.toLowerCase() !== active.shopify_discount_code!.toLowerCase(),
      );
    await updateCartDiscountCodes(remainingCodes);
    await cancelShopifyRewardRedemption({
      redemptionId: active.id,
      reason: "Cliente quitó el beneficio antes del checkout",
      createdBy: `customer:storefront:${account.user.id}`,
    });
    updateTag(TAGS.cart);

    return {
      ok: true,
      state: await getStorefrontLoyaltyStateAction(),
      message: "Beneficio quitado y puntos devueltos.",
    };
  } catch (cause) {
    return { ok: false, message: publicMessage(cause) };
  }
}

// El storefront siempre termina en el checkout oficial de Shopify. Dirección,
// despacho y pago se capturan allí; POS y el flujo TUU conservan sus rutas.
export async function startCheckoutAction(_guestEmail?: string) {
  const cart = await getCart();
  if (!cart || cart.lines.length === 0) {
    throw new Error("No se pudo cargar el carrito.");
  }
  const account = await getCustomerAccountState();
  const customerEmail =
    account.status === "ready" ? account.customer.email : undefined;

  if (account.status === "ready" && cart.id) {
    const active = await getActiveStorefrontCartRedemption({
      customerId: account.customer.id,
      storefrontCartId: cart.id,
    });
    if (active?.shopify_discount_code) {
      const applied = cart.discountCodes.find(
        ({ code }) =>
          code.toLowerCase() === active.shopify_discount_code?.toLowerCase(),
      );
      if (!applied?.applicable) {
        throw new Error(
          "Tu beneficio ya no aplica al carrito actual. Vuelve a aplicarlo o quítalo antes de pagar.",
        );
      }
    }
  }

  await prepareOnlineSale({
    customerEmail,
    discount: Math.max(
      clp(cart.cost.subtotalAmount.amount) - clp(cart.cost.totalAmount.amount),
      0,
    ),
    items: cart.lines.map((line) => ({
      variantId: line.merchandise.id,
      quantity: line.quantity,
    })),
  });
  const checkoutUrl = new URL(cart.checkoutUrl);
  if (checkoutUrl.protocol !== "https:") {
    throw new Error("Shopify devolvió una dirección de pago no segura.");
  }

  // La navegación externa debe ocurrir en el cliente. Si se usa redirect()
  // dentro de una Server Action, una redirección posterior de Shopify (por
  // ejemplo /password mientras la tienda está protegida) puede resolverse
  // erróneamente contra el dominio de Vercel.
  return checkoutUrl.toString();
}

export async function estimateCheckoutPointsAction(guestEmail?: string) {
  const cart = await getCart();
  if (!cart) throw new Error("No se pudo cargar el carrito");
  const snapshot = await prepareOnlineSale({
    customerEmail: guestEmail,
    discount: Math.max(
      clp(cart.cost.subtotalAmount.amount) - clp(cart.cost.totalAmount.amount),
      0,
    ),
    items: cart.lines.map((line) => ({
      variantId: line.merchandise.id,
      quantity: line.quantity,
    })),
  });
  return {
    points:
      Math.floor(snapshot.eligibleTotal / snapshot.rule.spendingUnitClp) *
      snapshot.rule.pointsPerUnit,
    eligibleTotal: snapshot.eligibleTotal,
    excludedTotal: snapshot.excludedTotal,
    rule: snapshot.rule,
  };
}

// Compatibilidad del componente antiguo mientras /checkout redirige al carrito.
export async function applyCheckoutRewardAction(
  rewardId: number,
): Promise<AppliedCheckoutReward> {
  const result = await applyCartRewardAction({
    rewardId,
    requestId: crypto.randomUUID(),
  });
  if (!result.ok || !result.state.activeReward) {
    throw new Error(result.message ?? "No se pudo aplicar el beneficio.");
  }
  const active = result.state.activeReward;
  return {
    rewardId: active.rewardId,
    name: active.name,
    code: active.code,
    pointsSpent: active.pointsSpent,
    pointsBalance: result.state.pointsBalance,
    discountAmountClp: active.discountAmountClp,
    total: result.state.total,
  };
}
