import "server-only";

import { getCustomerPortalDashboard } from "lib/admin/customer-dashboard";
import { getLoyaltyStats, listPhysicalSales } from "lib/loyalty/service";
import { getAdminCollections, getAdminProducts } from "lib/shopify/admin";
import type { AdminProduct } from "lib/shopify/admin-types";
import { getSupabaseAdmin } from "lib/supabase/admin";
import type { AdminDashboard, PhysicalSale } from "../contracts/admin.types";
import type { Customer } from "../contracts/customer.types";
import type { Redemption } from "../contracts/loyalty.types";
import type { Product } from "../contracts/product.types";

type AdminPhysicalSale = Awaited<ReturnType<typeof listPhysicalSales>>[number];

const DEFAULT_DATA_TIMEOUT_MS = 7000;

function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = DEFAULT_DATA_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} excedió ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function relation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function inventory(product: AdminProduct) {
  return product.variants.edges.reduce(
    (total, edge) => total + Number(edge.node.inventoryQuantity ?? 0),
    0,
  );
}

function price(product: AdminProduct) {
  return money(product.variants.edges[0]?.node.price);
}

function category(product: AdminProduct) {
  return product.tags[0] ?? "Accesorios";
}

function toProduct(product: AdminProduct): Product & {
  status: string;
  stock: number;
} {
  const stock = inventory(product);

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.descriptionHtml,
    price: price(product),
    currencyCode: "CLP",
    image: product.images.edges[0]?.node.url ?? "",
    images: product.images.edges.map((edge) => edge.node.url),
    category: category(product),
    tags: product.tags,
    availableForSale: product.status === "ACTIVE" && stock !== 0,
    quantityAvailable: stock,
    variantId: product.variants.edges[0]?.node.id ?? "",
    variants: product.variants.edges.map((edge) => ({
      id: edge.node.id,
      title: edge.node.title,
      price: money(edge.node.price),
      availableForSale: stock !== 0,
      quantityAvailable: edge.node.inventoryQuantity,
    })),
    status: product.status.toLowerCase(),
    stock,
    excludeFromPoints:
      product.excludeFromPoints?.jsonValue === true ||
      product.excludeFromPoints?.value === "true",
  };
}

function toCustomer(
  customer: Awaited<
    ReturnType<typeof getCustomerPortalDashboard>
  >["recentCustomers"][number],
): Customer & { name: string; points: number; createdAt: string } {
  return {
    id: String(customer.id),
    fullName: customer.full_name ?? customer.email,
    name: customer.full_name ?? customer.email,
    email: customer.email,
    phone: "",
    status: customer.status === "active" ? "active" : "inactive",
    pointsBalance: customer.points_balance,
    points: customer.points_balance,
    lifetimePointsEarned: 0,
    lifetimePointsRedeemed: 0,
    createdAt: customer.created_at,
  };
}

function toPhysicalSale(sale: AdminPhysicalSale): PhysicalSale & {
  items: string[];
  saleDate: string;
  pointsIssued: number;
} {
  const customer = relation(sale.loyalty_customers);

  return {
    id: String(sale.id),
    customerId: sale.customer_id ? String(sale.customer_id) : null,
    customerName: customer?.full_name ?? null,
    customerEmail: customer?.email ?? null,
    amount: money(sale.total),
    pointsEarned: sale.points_earned,
    pointsIssued: sale.points_earned,
    paymentMethod: "tuu",
    boletaStatus: "pending",
    boletaFolio: sale.receipt_number ?? undefined,
    date: sale.sold_at,
    saleDate: sale.sold_at,
    operatorName: sale.created_by ?? "OLFFY Admin",
    items: [sale.shopify_order_name, sale.notes].filter(
      (item): item is string => Boolean(item),
    ),
  };
}

async function getRedemptions(): Promise<Redemption[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("reward_redemptions")
    .select(
      "id, customer_id, reward_id, points_spent, status, redemption_code, shopify_discount_code, redeemed_at, fulfilled_at, expires_at, rewards(name)",
    )
    .order("redeemed_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`No se pudieron cargar los canjes: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, any>>).map((redemption) => ({
    id: String(redemption.id),
    customerId: String(redemption.customer_id),
    rewardId: String(redemption.reward_id),
    rewardTitle: relation(redemption.rewards)?.name ?? "Recompensa OLFFY",
    pointsCost: money(redemption.points_spent),
    pointsUsed: money(redemption.points_spent),
    status:
      redemption.status === "fulfilled"
        ? "delivered"
        : redemption.status === "cancelled"
          ? "cancelled"
          : redemption.status === "approved"
            ? "approved"
            : "requested",
    code: redemption.shopify_discount_code ?? redemption.redemption_code,
    requestedAt: redemption.redeemed_at,
    createdAt: redemption.redeemed_at,
    approvedAt: redemption.fulfilled_at ?? undefined,
    expiresAt: redemption.expires_at ?? undefined,
  })) as Redemption[];
}

export async function getFrontendAdminData() {
  const [
    dashboard,
    stats,
    sales,
    redemptions,
    adminProductsResult,
    collectionsResult,
  ] = await Promise.allSettled([
    withTimeout(getCustomerPortalDashboard(), "Dashboard de clientes"),
    withTimeout(getLoyaltyStats(), "Estadísticas de puntos"),
    withTimeout(listPhysicalSales(50), "Ventas físicas"),
    withTimeout(getRedemptions(), "Canjes"),
    withTimeout(getAdminProducts(), "Productos Shopify", 9000),
    withTimeout(getAdminCollections(), "Colecciones Shopify", 5000),
  ]);

  const adminProducts =
    adminProductsResult.status === "fulfilled" ? adminProductsResult.value : [];
  const collections =
    collectionsResult.status === "fulfilled" ? collectionsResult.value : [];
  const loyaltyStats =
    stats.status === "fulfilled"
      ? stats.value
      : {
          customersCount: 0,
          activeCustomersCount: 0,
          outstandingPoints: 0,
          lifetimePointsEarned: 0,
          lifetimePointsRedeemed: 0,
          physicalSalesCount: 0,
          physicalSalesTotal: 0,
          activeRewardsCount: 0,
          redemptionsCount: 0,
        };
  const physicalSales = sales.status === "fulfilled" ? sales.value : [];
  const mappedSales = physicalSales.map(toPhysicalSale);
  const today = new Date().toDateString();
  const salesToday = mappedSales
    .filter((sale) => new Date(sale.saleDate).toDateString() === today)
    .reduce((total, sale) => total + sale.amount, 0);
  const pendingRedemptions =
    redemptions.status === "fulfilled"
      ? redemptions.value.filter(
          (redemption) => redemption.status === "requested",
        ).length
      : 0;
  const adminDashboard: AdminDashboard & Record<string, any> = {
    productsCount: adminProducts.length,
    activeProducts: adminProducts.filter(
      (product) => product.status === "ACTIVE",
    ).length,
    draftProducts: adminProducts.filter((product) => product.status === "DRAFT")
      .length,
    collectionsCount: collections.length,
    customersCount: loyaltyStats.customersCount,
    activeCustomersCount: loyaltyStats.activeCustomersCount,
    physicalSalesCount: loyaltyStats.physicalSalesCount,
    physicalSalesTotal: loyaltyStats.physicalSalesTotal,
    outstandingPoints: loyaltyStats.outstandingPoints,
    redemptionsCount: loyaltyStats.redemptionsCount,
    pendingRedemptions,
    recentSales: mappedSales,
    lowStockProducts: adminProducts
      .map((product) => ({
        id: product.id,
        title: product.title,
        stock: inventory(product),
      }))
      .filter((product) => product.stock <= 5)
      .slice(0, 5),
    salesToday,
    salesMonth: loyaltyStats.physicalSalesTotal,
    totalCustomers: loyaltyStats.customersCount,
    ordersToday: mappedSales.filter(
      (sale) => new Date(sale.saleDate).toDateString() === today,
    ).length,
    totalPointsIssued: loyaltyStats.lifetimePointsEarned,
  };

  return {
    dashboard: adminDashboard,
    customers:
      dashboard.status === "fulfilled"
        ? dashboard.value.recentCustomers.map(toCustomer)
        : [],
    products: adminProducts.map(toProduct),
    collections,
    physicalSales: mappedSales,
    redemptions: redemptions.status === "fulfilled" ? redemptions.value : [],
    totalRedeemed: loyaltyStats.lifetimePointsRedeemed,
  };
}
