import type {
  Cart as ShopifyCart,
  CartItem,
  Product as ShopifyProduct,
  ProductVariant as ShopifyProductVariant,
} from "lib/shopify/types";
import type {
  CustomerRedemption,
  CustomerReward,
  CustomerTransaction,
} from "lib/customer/account";
import type { CustomerAccount } from "lib/customer/auth";
import type { CartLine } from "../contracts/cart.types";
import type {
  Product,
  ProductOption,
  ProductVariant,
} from "../contracts/product.types";
import type { Customer, PointsTransaction } from "../contracts/customer.types";
import type { Redemption, Reward } from "../contracts/loyalty.types";

const fallbackImage =
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80";

function money(value: string | number | undefined | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function primaryVariant(product: ShopifyProduct) {
  return (
    product.variants.find((variant) => variant.availableForSale) ??
    product.variants[0]
  );
}

function totalInventory(variants: ShopifyProductVariant[]) {
  const quantities = variants
    .map((variant) => variant.quantityAvailable)
    .filter((value): value is number => typeof value === "number");

  if (!quantities.length) return 0;

  return quantities.reduce((sum, value) => sum + value, 0);
}

function categoryFromTags(product: ShopifyProduct) {
  const visibleTag = product.tags.find(
    (tag) =>
      !["new", "nuevo", "favorito", "regalo"].includes(tag.toLowerCase()),
  );

  return visibleTag ?? "Accesorios";
}

function visibleTags(product: ShopifyProduct, quantityAvailable: number) {
  const normalized = product.tags.map((tag) => tag.toLowerCase());
  const tags = [...product.tags];

  if (
    (normalized.includes("new") || normalized.includes("nuevo")) &&
    !tags.includes("Nuevo")
  ) {
    tags.push("Nuevo");
  }

  if (normalized.includes("favorito") && !tags.includes("Favorito")) {
    tags.push("Favorito");
  }

  if (!product.availableForSale || quantityAvailable === 0) {
    tags.push("Agotado");
  }

  return tags;
}

export function toFrontendProduct(product: ShopifyProduct): Product {
  const variant = primaryVariant(product);
  const quantityAvailable = totalInventory(product.variants);
  const image = product.featuredImage?.url ?? product.images[0]?.url ?? "";
  const price =
    money(variant?.price.amount) ||
    money(product.priceRange.minVariantPrice.amount);

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    price,
    currencyCode:
      variant?.price.currencyCode ??
      product.priceRange.minVariantPrice.currencyCode,
    image: image || fallbackImage,
    images: product.images.map((item) => item.url),
    category: categoryFromTags(product),
    tags: visibleTags(product, quantityAvailable),
    availableForSale: product.availableForSale && quantityAvailable !== 0,
    quantityAvailable,
    variantId: variant?.id ?? "",
    variants: product.variants.map(toFrontendVariant),
    options: product.options.map(toFrontendOption),
  };
}

function toFrontendVariant(variant: ShopifyProductVariant): ProductVariant {
  return {
    id: variant.id,
    title: variant.title,
    price: money(variant.price.amount),
    availableForSale: variant.availableForSale,
    quantityAvailable: variant.quantityAvailable ?? 0,
  };
}

function toFrontendOption(
  option: ShopifyProduct["options"][number],
): ProductOption {
  return {
    name: option.name,
    values: option.values,
  };
}

export function toFrontendProducts(products: ShopifyProduct[]): Product[] {
  return products.map(toFrontendProduct).filter((product) => product.variantId);
}

export function toFrontendCartLines(cart?: ShopifyCart): CartLine[] {
  return (cart?.lines ?? []).map(toFrontendCartLine);
}

function toFrontendCartLine(line: CartItem): CartLine {
  return {
    lineId: line.id ?? line.merchandise.id,
    productId: line.merchandise.product.id,
    variantId: line.merchandise.id,
    title: line.merchandise.product.title,
    image: line.merchandise.product.featuredImage?.url ?? "",
    quantity: line.quantity,
    price: money(line.cost.totalAmount.amount) / Math.max(line.quantity, 1),
  };
}

export function toFrontendCustomer(
  customer: CustomerAccount,
  counts: { ordersCount?: number; redemptionsCount?: number } = {},
): Customer & {
  name: string;
  points: number;
  ordersCount: number;
  redemptionsCount: number;
} {
  return {
    id: String(customer.id),
    fullName: customer.full_name ?? customer.email,
    name: customer.full_name ?? customer.email,
    email: customer.email,
    phone: customer.phone ?? "",
    status: customer.status === "active" ? "active" : "inactive",
    pointsBalance: customer.points_balance,
    points: customer.points_balance,
    lifetimePointsEarned: customer.lifetime_points_earned,
    lifetimePointsRedeemed: customer.lifetime_points_redeemed,
    ordersCount: counts.ordersCount ?? 0,
    redemptionsCount: counts.redemptionsCount ?? 0,
  };
}

export function toFrontendTransactions(
  transactions: CustomerTransaction[],
): PointsTransaction[] {
  return transactions.map((transaction) => ({
    id: String(transaction.id),
    type:
      transaction.transaction_type === "earned"
        ? ("earn" as PointsTransaction["type"])
        : transaction.transaction_type,
    points: transaction.points,
    balanceAfter: transaction.balance_after,
    description: transaction.description ?? "Movimiento de puntos",
    source:
      transaction.source === "physical_sale"
        ? "tuu_sale"
        : transaction.source === "reward_redemption"
          ? "redemption"
          : transaction.source,
    date: transaction.created_at,
    createdAt: transaction.created_at,
    status: "completed",
  })) as PointsTransaction[];
}

export function toFrontendRewards(rewards: CustomerReward[]): Reward[] {
  return rewards.map((reward) => ({
    id: String(reward.id),
    title: reward.name,
    description: reward.description ?? "Beneficio especial OLFFY",
    pointsCost: reward.points_cost,
    discountAmount: reward.discount_amount_clp ?? 0,
    minimumPurchase: reward.minimum_purchase_clp,
    validityDays: reward.validity_days,
    available: reward.is_active,
  }));
}

export function toFrontendRedemptions(
  redemptions: CustomerRedemption[],
): Redemption[] {
  return redemptions.map((redemption) => ({
    id: String(redemption.id),
    customerId: String(redemption.customer_id),
    rewardId: String(redemption.reward_id),
    rewardTitle: redemption.rewards?.name ?? "Recompensa OLFFY",
    pointsCost: redemption.points_spent,
    pointsUsed: redemption.points_spent,
    status: mapRedemptionStatus(redemption.status),
    code:
      redemption.shopify_discount_code ??
      redemption.redemption_code ??
      undefined,
    requestedAt: redemption.redeemed_at,
    createdAt: redemption.redeemed_at,
    approvedAt: redemption.fulfilled_at ?? undefined,
    expiresAt: redemption.expires_at ?? undefined,
  })) as Redemption[];
}

function mapRedemptionStatus(status: CustomerRedemption["status"]) {
  if (status === "fulfilled") return "delivered";
  if (status === "cancelled") return "cancelled";
  if (status === "approved") return "approved";
  return "requested";
}
