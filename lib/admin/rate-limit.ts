import "server-only";

import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { getAdminSessionSecret } from "./session";

const memoryAttempts = new Map<string, number[]>();

function settings() {
  return {
    maxAttempts: Math.max(Number(process.env.ADMIN_LOGIN_MAX_ATTEMPTS ?? 5), 1),
    windowSeconds: Math.max(
      Number(process.env.ADMIN_LOGIN_WINDOW_SECONDS ?? 900),
      60,
    ),
  };
}

function hasAdminDatabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_SECRET_KEY?.trim() ||
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
  );
}

export function adminLoginIpHash(ip: string) {
  return createHash("sha256")
    .update(`${getAdminSessionSecret()}:${ip}`)
    .digest("hex");
}

export async function checkAdminLoginRateLimit(ipHash: string) {
  const { maxAttempts, windowSeconds } = settings();
  const since = new Date(Date.now() - windowSeconds * 1000);

  if (hasAdminDatabaseConfig()) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("admin_login_attempts")
        .select("succeeded, attempted_at")
        .eq("ip_hash", ipHash)
        .gte("attempted_at", since.toISOString())
        .order("attempted_at", { ascending: false })
        .limit(maxAttempts + 10);

      if (error) {
        throw new Error(error.message);
      }

      const failuresSinceSuccess = [];
      for (const attempt of data ?? []) {
        if (attempt.succeeded) break;
        failuresSinceSuccess.push(attempt);
      }

      return {
        allowed: failuresSinceSuccess.length < maxAttempts,
        retryAfter: windowSeconds,
      };
    } catch (error) {
      console.warn(
        "No se pudo validar el rate limit admin en Supabase; usando memoria local:",
        error,
      );
    }
  }

  const attempts = (memoryAttempts.get(ipHash) ?? []).filter(
    (timestamp) => timestamp >= since.getTime(),
  );
  memoryAttempts.set(ipHash, attempts);

  return {
    allowed: attempts.length < maxAttempts,
    retryAfter: windowSeconds,
  };
}

export async function recordAdminLoginAttempt(
  ipHash: string,
  succeeded: boolean,
) {
  if (hasAdminDatabaseConfig()) {
    try {
      const { error } = await getSupabaseAdmin()
        .from("admin_login_attempts")
        .insert({ ip_hash: ipHash, succeeded });

      if (!error) {
        return;
      }

      console.error("No se pudo registrar el intento de login admin:", error);
    } catch (error) {
      console.error(
        "No se pudo registrar el intento de login admin; usando memoria local:",
        error,
      );
    }
  }

  if (succeeded) {
    memoryAttempts.delete(ipHash);
  } else {
    memoryAttempts.set(ipHash, [
      ...(memoryAttempts.get(ipHash) ?? []),
      Date.now(),
    ]);
  }
}
