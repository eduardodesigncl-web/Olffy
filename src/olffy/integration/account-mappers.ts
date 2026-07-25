// Mapea los datos reales de la cuenta (Supabase) a los tipos del panel de
// cliente del frontend oficial (src/olffy/components/puntos y account).
import type {
  CustomerRedemption,
  CustomerReward,
  CustomerRule,
  CustomerTransaction,
} from "lib/customer/account";
import type { CustomerAccount } from "lib/customer/auth";
import type {
  Redemption,
  RewardTier,
  Transaction,
} from "../components/puntos";
import type { PuntosCustomerData, PuntosRuleInfo } from "../pages/PuntosPage";

function formatClp(value: number): string {
  return "$" + Math.round(value).toLocaleString("es-CL");
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "America/Santiago",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "long",
      timeZone: "America/Santiago",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function toPuntosCustomer(
  customer: CustomerAccount,
): PuntosCustomerData {
  return {
    nombre: customer.full_name?.trim() || customer.email,
    email: customer.email,
    telefono: customer.phone ?? "",
    estado: customer.status === "active" ? "activa" : "bloqueada",
    creadaEl: formatLongDate(customer.created_at),
    saldo: customer.points_balance,
    acumulados: customer.lifetime_points_earned,
    usados: customer.lifetime_points_redeemed,
  };
}

function transactionLabel(transaction: CustomerTransaction): string {
  if (transaction.transaction_type === "expired") {
    return "Vencimiento de puntos";
  }
  if (transaction.transaction_type === "redeemed") {
    return "Canje recompensa";
  }
  if (transaction.transaction_type === "reversed") {
    return "Reversa por devolución";
  }

  switch (transaction.source) {
    case "shopify_order":
      return "Compra online";
    case "physical_sale":
      return "Compra tienda física TUU";
    case "reward_redemption":
      return "Canje recompensa";
    case "manual":
      return "Ajuste manual";
    default:
      return transaction.transaction_type === "earned"
        ? "Puntos acumulados"
        : "Movimiento de puntos";
  }
}

function transactionState(transaction: CustomerTransaction): string {
  if (transaction.transaction_type === "redeemed") return "Usado";
  if (transaction.transaction_type === "expired") return "Vencido";
  return "Aprobado";
}

export function toPuntosTransactions(
  transactions: CustomerTransaction[],
): Transaction[] {
  return transactions.map((transaction) => ({
    id: transaction.id,
    tipo: transactionLabel(transaction),
    fecha: formatDate(transaction.created_at),
    descripcion: transaction.description ?? "Movimiento de puntos",
    puntos: transaction.points,
    estado: transactionState(transaction),
  }));
}

export function toPuntosRewards(rewards: CustomerReward[]): RewardTier[] {
  return rewards.map((reward) => ({
    id: reward.id,
    puntos: reward.points_cost,
    label: reward.name,
    descuentoClp: reward.discount_amount_clp ?? undefined,
    desc:
      reward.description?.trim() ||
      (reward.minimum_purchase_clp > 0
        ? `Úsalo en compras desde ${formatClp(reward.minimum_purchase_clp)}.`
        : "Aplícalo en tu próxima compra online o en tienda."),
  }));
}

function redemptionState(
  redemption: CustomerRedemption,
): Redemption["estado"] {
  switch (redemption.status) {
    case "fulfilled":
      return "Usado";
    case "approved":
      return "Aprobado";
    case "cancelled":
    case "cancelling":
    case "expired":
      return "Cancelado";
    default:
      return "Solicitado";
  }
}

export function toPuntosRedemptions(
  redemptions: CustomerRedemption[],
): Redemption[] {
  return redemptions.map((redemption) => {
    const estado = redemptionState(redemption);
    const codigo =
      redemption.shopify_discount_code ?? redemption.redemption_code;

    return {
      id: redemption.id,
      recompensa: redemption.rewards?.name ?? "Recompensa OLFFY",
      fecha: formatDate(redemption.redeemed_at),
      puntos: redemption.points_spent,
      descuentoClp: redemption.rewards?.discount_amount_clp ?? undefined,
      estado,
      ...(codigo && (estado === "Aprobado" || estado === "Usado")
        ? { codigo }
        : {}),
      ...(redemption.fulfilled_at
        ? { usadoFecha: formatDate(redemption.fulfilled_at) }
        : {}),
      ...(redemption.cancellation_reason
        ? { motivo: redemption.cancellation_reason }
        : {}),
    };
  });
}

export function toPuntosRules(rule: CustomerRule): string[] {
  const unit = rule.spending_unit_clp;
  const points = rule.points_per_unit;

  const rules = [
    `${formatClp(unit)} gastados equivalen a ${points} punto${points === 1 ? "" : "s"}.`,
    "Los puntos se calculan sobre el total efectivamente pagado.",
    "Si usas un descuento, acumulas puntos sobre el monto restante.",
    `Cada punto vale ${formatClp(rule.point_redemption_value_clp)} al canjear recompensas.`,
    "Los canjes descuentan puntos de tu saldo disponible.",
    "Las devoluciones reversan los puntos acumulados en esa compra.",
  ];

  if (rule.points_expiry_months) {
    rules.push(
      `Los puntos vencen ${rule.points_expiry_months} meses después de acumularse.`,
    );
  }
  if (rule.redemption_expiry_days) {
    rules.push(
      `Los cupones de canje duran ${rule.redemption_expiry_days} días desde su emisión.`,
    );
  }

  return rules;
}

export function toPuntosRuleInfo(rule: CustomerRule): PuntosRuleInfo {
  return {
    earning: `${formatClp(rule.spending_unit_clp)} gastados equivalen a ${rule.points_per_unit} punto${rule.points_per_unit === 1 ? "" : "s"}.`,
    validity: rule.points_expiry_months
      ? `Los puntos vencen ${rule.points_expiry_months} meses después de acumularse.`
      : "La vigencia puede variar según las reglas activas de la tienda.",
  };
}
