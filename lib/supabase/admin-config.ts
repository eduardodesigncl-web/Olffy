export type SupabaseAdminKeySource =
  | "SUPABASE_SECRET_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY";

export type SupabaseAdminConfig = {
  url: string;
  key: string;
  source: SupabaseAdminKeySource;
  rejectedSources: SupabaseAdminKeySource[];
};

type Environment = Record<string, string | undefined>;

function projectRefFromUrl(url: URL): string | null {
  const match = url.hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
  return match?.[1] ?? null;
}

function decodeJwtPayload(key: string): Record<string, unknown> | null {
  const parts = key.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) return null;

  try {
    return JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function validateAdminKey(key: string, projectRef: string | null): boolean {
  if (/^sb_secret_[A-Za-z0-9_-]{20,}$/.test(key)) return true;
  if (key.startsWith("sb_publishable_")) return false;

  const payload = decodeJwtPayload(key);
  if (!payload || payload.role !== "service_role") return false;

  return !(
    projectRef &&
    typeof payload.ref === "string" &&
    payload.ref !== projectRef
  );
}

export function resolveSupabaseAdminConfig(
  env: Environment = process.env,
): SupabaseAdminConfig {
  const rawUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for Supabase admin");
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use http or https");
  }

  const projectRef = projectRefFromUrl(url);
  const candidates: Array<[SupabaseAdminKeySource, string | undefined]> = [
    ["SUPABASE_SECRET_KEY", env.SUPABASE_SECRET_KEY?.trim()],
    ["SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY?.trim()],
  ];
  const rejectedSources: SupabaseAdminKeySource[] = [];

  for (const [source, key] of candidates) {
    if (!key) continue;
    if (validateAdminKey(key, projectRef)) {
      return {
        url: url.toString().replace(/\/$/, ""),
        key,
        source,
        rejectedSources,
      };
    }
    rejectedSources.push(source);
  }

  if (rejectedSources.length) {
    throw new Error(
      `No valid Supabase admin key was found; rejected: ${rejectedSources.join(", ")}`,
    );
  }

  throw new Error(
    "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required for Supabase admin",
  );
}
