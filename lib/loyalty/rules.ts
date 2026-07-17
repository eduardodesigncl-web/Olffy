import "server-only";

import { getSupabaseAdmin } from "lib/supabase/admin";
import type { LoyaltyRule } from "lib/loyalty/service";

// valid_from/created_by/notes existen después de aplicar la migración
// 20260710130000_versioned_loyalty_rules.sql.
export type LoyaltyRuleVersion = LoyaltyRule & {
  valid_from?: string | null;
  created_by?: string | null;
  notes?: string | null;
};

export type PublishLoyaltyRuleInput = {
  name: string;
  spendingUnitClp: number;
  pointsPerUnit: number;
  pointRedemptionValueClp: number;
  pointsExpiryMonths: number;
  redemptionExpiryDays: number;
  createdBy: string;
  notes?: string;
};

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

export async function listLoyaltyRuleVersions(
  limit = 20,
): Promise<LoyaltyRuleVersion[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("loyalty_rules")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) {
    fail("No se pudieron cargar las versiones de la regla", error);
  }

  return (data ?? []) as LoyaltyRuleVersion[];
}

// Publica una nueva versión de la regla de puntos. Nunca edita versiones
// anteriores: la regla vigente queda inactiva como historial y la nueva rige
// solo para eventos posteriores (no retroactiva). Auditado en audit_log.
export async function publishLoyaltyRule(
  input: PublishLoyaltyRuleInput,
): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc("publish_loyalty_rule", {
    p_name: input.name,
    p_spending_unit_clp: Math.trunc(input.spendingUnitClp),
    p_points_per_unit: Math.trunc(input.pointsPerUnit),
    p_point_redemption_value_clp: Math.trunc(input.pointRedemptionValueClp),
    p_points_expiry_months: Math.trunc(input.pointsExpiryMonths),
    p_redemption_expiry_days: Math.trunc(input.redemptionExpiryDays),
    p_created_by: input.createdBy,
    p_notes: input.notes ?? null,
  });

  if (error) {
    fail("No se pudo publicar la nueva versión de la regla", error);
  }

  return Number(data);
}
