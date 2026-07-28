const PROFILES = new Set(["ci", "preview", "staging", "production"]);

const CORE_GROUPS = [
  ["NEXT_PUBLIC_SITE_URL"],
  ["ADMIN_PASSWORD"],
  ["ADMIN_SESSION_SECRET"],
  ["NEXT_PUBLIC_SUPABASE_URL"],
  ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  ["SHOPIFY_STORE_DOMAIN", "SHOPIFY_s_SHOPIFY_STORE_DOMAIN"],
  [
    "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
    "SHOPIFY_s_SHOPIFY_STOREFRONT_ACCESS_TOKEN",
    "SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN",
    "SHOPIFY_STOREFRONT_PUBLIC_ACCESS_TOKEN",
  ],
  ["SHOPIFY_ADMIN_STORE_DOMAIN"],
  ["CRON_SECRET"],
];

const SAFE_VALUES = {
  PAYMENTS_TUU_ENABLED: "false",
  TUU_REMOTE_POS_ENABLED: "false",
  DTE_PROVIDER: "noop",
  MARKETING_PROVIDER: "noop",
};

function value(env, key) {
  return env[key]?.trim() ?? "";
}

function hasAny(env, keys) {
  return keys.some((key) => value(env, key));
}

function looksPlaceholder(raw) {
  const candidate = raw.toLowerCase();
  return ["tu_", "tu-", "example", "changeme", "replace", "placeholder"].some(
    (marker) => candidate.includes(marker),
  );
}

/**
 * @param {string} profile
 * @param {Record<string, string | undefined>} env
 */
export function validateEnvironment(profile, env = process.env) {
  const errors = [];

  if (!PROFILES.has(profile)) {
    return [`perfil desconocido: ${profile || "(vacío)"}`];
  }

  for (const [key, expected] of Object.entries(SAFE_VALUES)) {
    const actual = value(env, key).toLowerCase();
    if (actual !== expected) {
      errors.push(`${key} debe ser ${expected} durante Gate A`);
    }
  }

  if (profile === "staging" || profile === "production") {
    for (const group of CORE_GROUPS) {
      if (!hasAny(env, group)) {
        errors.push(`falta ${group.join(" o ")}`);
      }
    }

    const adminToken = value(env, "SHOPIFY_ADMIN_API_ACCESS_TOKEN");
    const adminClientPair =
      value(env, "SHOPIFY_ADMIN_API_CLIENT_ID") &&
      value(env, "SHOPIFY_ADMIN_API_CLIENT_SECRET");
    if (!adminToken && !adminClientPair) {
      errors.push(
        "falta SHOPIFY_ADMIN_API_ACCESS_TOKEN o el par SHOPIFY_ADMIN_API_CLIENT_ID/SHOPIFY_ADMIN_API_CLIENT_SECRET",
      );
    }

    const siteUrl = value(env, "NEXT_PUBLIC_SITE_URL");
    if (!/^https:\/\//i.test(siteUrl)) {
      errors.push("NEXT_PUBLIC_SITE_URL debe usar HTTPS");
    }

    const sessionSecret = value(env, "ADMIN_SESSION_SECRET");
    if (sessionSecret && sessionSecret.length < 32) {
      errors.push("ADMIN_SESSION_SECRET debe tener al menos 32 caracteres");
    }

    for (const group of CORE_GROUPS) {
      for (const key of group) {
        const candidate = value(env, key);
        if (candidate && looksPlaceholder(candidate)) {
          errors.push(`${key} contiene un valor placeholder`);
        }
      }
    }
  }

  if (profile === "preview") {
    const coupledGroups = [
      ["NEXT_PUBLIC_SUPABASE_URL"],
      ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
      ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    ];
    const configured = coupledGroups.some((group) => hasAny(env, group));
    if (configured && !coupledGroups.every((group) => hasAny(env, group))) {
      errors.push("Supabase Preview está configurado parcialmente");
    }
  }

  return [...new Set(errors)];
}

const invokedDirectly = process.argv[1]?.endsWith("validate-environment.mjs");
if (invokedDirectly) {
  const profile = process.argv[2] ?? "preview";
  const errors = validateEnvironment(profile);
  if (errors.length > 0) {
    console.error(`Contrato de ambiente ${profile}: FAIL`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Contrato de ambiente ${profile}: PASS`);
  }
}
