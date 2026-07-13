import "server-only";

import type {
  AdminIntegrationDiagnostic,
  AdminIntegrationDiagnosticCheck,
  AdminIntegrationDiagnosticId,
  AdminIntegrationDiagnosticStatus,
  AdminIntegrationDiagnosticTone,
} from "lib/admin/diagnostics-types";
import { getSupabaseAdmin } from "lib/supabase/admin";
import { getMarketingQueueSummary } from "lib/transactions/marketing";
import {
  checkAdminOrderAccess,
  checkAdminShopifyConnection,
} from "lib/shopify/admin";
import {
  getTuuOnlineConfig,
  getTuuRemotePosConfig,
  isTuuOnlineEnabled,
  isTuuRemotePosEnabled,
} from "lib/tuu/config";

type ProbeInput = {
  id: AdminIntegrationDiagnosticId;
  name: string;
  description: string;
  run: () => Promise<
    Omit<
      AdminIntegrationDiagnostic,
      "id" | "name" | "description" | "checkedAt" | "latencyMs"
    >
  >;
};

const STATUS_LABEL: Record<AdminIntegrationDiagnosticStatus, string> = {
  connected: "Conectado",
  degraded: "Revisar",
  pending: "Pendiente",
  missing: "Requiere conexión",
  error: "Error",
  mock: "Mock",
};

const TOKEN_PATTERNS = [
  /shpat_[A-Za-z0-9_]+/g,
  /shpss_[A-Za-z0-9_]+/g,
  /shpua_[A-Za-z0-9_]+/g,
  /sk_[A-Za-z0-9_-]+/g,
  /Klaviyo-API-Key\s+[A-Za-z0-9._-]+/gi,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /eyJ[A-Za-z0-9._-]+/g,
];

function envValue(name: string) {
  return process.env[name]?.trim() || "";
}

function hasEnv(name: string) {
  return Boolean(envValue(name));
}

function sanitizeMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Error desconocido";

  return TOKEN_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, "[secreto oculto]"),
    message,
  );
}

function statusFromError(message: string): AdminIntegrationDiagnosticStatus {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("environment variable is not set") ||
    normalized.includes("invalid supabaseurl") ||
    normalized.includes("no un admin api access token") ||
    normalized.includes("no esta configurado") ||
    normalized.includes("configura") ||
    normalized.includes("deshabilitado") ||
    normalized.includes("requiere")
  ) {
    return "missing";
  }

  if (
    normalized.includes("permission denied") ||
    normalized.includes("access_denied") ||
    normalized.includes("permisos")
  ) {
    return "degraded";
  }

  return "error";
}

function toneForStatus(
  status: AdminIntegrationDiagnosticStatus,
): AdminIntegrationDiagnosticTone {
  if (status === "connected") return "ok";
  if (status === "mock") return "mock";
  if (status === "pending" || status === "degraded") return "warning";
  return "error";
}

function check(label: string, ok: boolean, detail?: string) {
  return { label, ok, detail };
}

function makeResult(input: {
  status: AdminIntegrationDiagnosticStatus;
  details: string;
  checks: AdminIntegrationDiagnosticCheck[];
  label?: string;
  tone?: AdminIntegrationDiagnosticTone;
}) {
  return {
    status: input.status,
    tone: input.tone ?? toneForStatus(input.status),
    label: input.label ?? STATUS_LABEL[input.status],
    details: input.details,
    checks: input.checks,
  };
}

async function withProbeTiming(
  input: ProbeInput,
): Promise<AdminIntegrationDiagnostic> {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const result = await input.run();
    return {
      id: input.id,
      name: input.name,
      description: input.description,
      checkedAt,
      latencyMs: Math.max(Date.now() - startedAt, 0),
      ...result,
    };
  } catch (error) {
    const message = sanitizeMessage(error);
    const status = statusFromError(message);

    return {
      id: input.id,
      name: input.name,
      description: input.description,
      status,
      tone: toneForStatus(status),
      label: STATUS_LABEL[status],
      details: message,
      checkedAt,
      latencyMs: Math.max(Date.now() - startedAt, 0),
      checks: [check("Diagnóstico", false, message)],
    };
  }
}

async function probeShopify() {
  const envChecks = [
    check(
      "Dominio Admin",
      hasEnv("SHOPIFY_ADMIN_STORE_DOMAIN") ||
        hasEnv("SHOPIFY_ADMIN_API_STORE_DOMAIN") ||
        hasEnv("SHOPIFY_ADMIN_SHOP_DOMAIN") ||
        hasEnv("SHOPIFY_STORE_DOMAIN") ||
        hasEnv("SHOPIFY_s_SHOPIFY_STORE_DOMAIN"),
    ),
    check(
      "Token Admin API u OAuth",
      hasEnv("SHOPIFY_ADMIN_API_ACCESS_TOKEN") ||
        hasEnv("SHOPIFY_ADMIN_TOKEN") ||
        (hasEnv("SHOPIFY_ADMIN_API_CLIENT_ID") &&
          hasEnv("SHOPIFY_ADMIN_API_CLIENT_SECRET")) ||
        (hasEnv("SHOPIFY_API_KEY") && hasEnv("SHOPIFY_API_SECRET")),
    ),
  ];

  const shop = await checkAdminShopifyConnection();

  let orderAccess = false;
  let orderAccessDetail = "";

  try {
    orderAccess = await checkAdminOrderAccess();
  } catch (error) {
    orderAccessDetail = sanitizeMessage(error);
  }

  const checks = [
    ...envChecks,
    check("Admin GraphQL", true, `${shop.name} (${shop.myshopifyDomain})`),
    check("Permiso de órdenes POS", orderAccess, orderAccessDetail),
  ];

  if (!orderAccess) {
    return makeResult({
      status: "degraded",
      details:
        orderAccessDetail ||
        "Shopify responde, pero falta validar permisos de órdenes.",
      checks,
    });
  }

  return makeResult({
    status: "connected",
    details: `Shopify Admin responde para ${shop.name} (${shop.myshopifyDomain}).`,
    checks,
  });
}

async function probeSupabase() {
  const client = getSupabaseAdmin();
  const { count, error } = await client
    .from("loyalty_customers")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  return makeResult({
    status: "connected",
    details: `Supabase responde y la tabla loyalty_customers es accesible (${count ?? 0} registros).`,
    checks: [
      check("URL pública", hasEnv("NEXT_PUBLIC_SUPABASE_URL")),
      check(
        "Service role",
        hasEnv("SUPABASE_SECRET_KEY") || hasEnv("SUPABASE_SERVICE_ROLE_KEY"),
      ),
      check("Tabla loyalty_customers", true),
    ],
  });
}

async function probeTuu() {
  const checks: AdminIntegrationDiagnosticCheck[] = [];
  const onlineEnabled = isTuuOnlineEnabled();
  const posEnabled = isTuuRemotePosEnabled();

  checks.push(check("Pago online habilitado", onlineEnabled));
  checks.push(check("POS remoto habilitado", posEnabled));

  if (!onlineEnabled && !posEnabled) {
    return makeResult({
      status: "pending",
      details:
        "TUU no tiene pagos online ni POS remoto habilitados en variables de entorno.",
      checks,
    });
  }

  if (onlineEnabled) {
    const config = getTuuOnlineConfig();
    checks.push(check("Cuenta online", Boolean(config.accountId)));
    checks.push(check("Secret online", Boolean(config.secretKey)));
    checks.push(check("API online", isValidUrl(config.apiUrl), config.apiUrl));
    checks.push(check("Callback online", isValidUrl(config.callbackUrl)));
  }

  if (posEnabled) {
    const config = getTuuRemotePosConfig();
    checks.push(check("API key POS", Boolean(config.apiKey)));
    checks.push(check("Dispositivo POS", Boolean(config.deviceUuid)));
    checks.push(check("Serial POS", Boolean(config.deviceSerial)));
    checks.push(check("API POS", isValidUrl(config.apiUrl), config.apiUrl));
    checks.push(
      check(
        "Webhook POS",
        Boolean(config.webhookSecret),
        config.webhookSecret
          ? "Configurado"
          : "Recomendado para conciliación automática",
      ),
    );
  }

  const failedRequired = checks.some(
    (item) =>
      !item.ok &&
      !item.label.includes("Webhook") &&
      !item.label.includes("Pago online habilitado") &&
      !item.label.includes("POS remoto habilitado"),
  );

  return makeResult({
    status: failedRequired ? "degraded" : "connected",
    details:
      "Configuración TUU validada. No se genera un cobro durante este diagnóstico.",
    checks,
  });
}

type KlaviyoListProbe =
  | { status: "connected"; listName: string }
  | { status: "rate_limited"; retryAfterSeconds: number };

const KLAVIYO_PROBE_CACHE_MS = 60_000;
let klaviyoProbeCache:
  | {
      key: string;
      expiresAt: number;
      value: KlaviyoListProbe;
    }
  | undefined;
let klaviyoProbeInFlight:
  | { key: string; promise: Promise<KlaviyoListProbe> }
  | undefined;

function klaviyoErrorDetail(body: string) {
  try {
    const parsed = JSON.parse(body) as {
      errors?: Array<{ detail?: string; title?: string }>;
    };
    return (
      parsed.errors?.[0]?.detail ||
      parsed.errors?.[0]?.title ||
      "Respuesta no reconocida"
    ).slice(0, 300);
  } catch {
    return body.trim().slice(0, 300) || "Respuesta vacía";
  }
}

async function requestKlaviyoListProbe(input: {
  apiKey: string;
  listId: string;
  revision: string;
}): Promise<KlaviyoListProbe> {
  // No se solicita profile_count: ese campo adicional consume una cuota más
  // estricta y no es necesario para comprobar que la integración responde.
  const response = await fetch(
    `https://a.klaviyo.com/api/lists/${input.listId}`,
    {
      headers: {
        accept: "application/vnd.api+json",
        Authorization: `Klaviyo-API-Key ${input.apiKey}`,
        revision: input.revision,
      },
      cache: "no-store",
    },
  );

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after") ?? 1);
    return {
      status: "rate_limited",
      retryAfterSeconds: Number.isFinite(retryAfter)
        ? Math.min(Math.max(Math.ceil(retryAfter), 1), 300)
        : 1,
    };
  }

  if (!response.ok) {
    throw new Error(
      `Klaviyo respondió ${response.status}: ${klaviyoErrorDetail(
        await response.text(),
      )}`,
    );
  }

  const body = (await response.json()) as {
    data?: { attributes?: { name?: string } };
  };

  return {
    status: "connected",
    listName: body.data?.attributes?.name || "Newsletter",
  };
}

async function getCachedKlaviyoListProbe(input: {
  apiKey: string;
  listId: string;
  revision: string;
}) {
  const key = `${input.listId}:${input.revision}`;
  const now = Date.now();

  if (klaviyoProbeCache?.key === key && klaviyoProbeCache.expiresAt > now) {
    return klaviyoProbeCache.value;
  }

  if (klaviyoProbeInFlight?.key === key) {
    return klaviyoProbeInFlight.promise;
  }

  const promise = requestKlaviyoListProbe(input);
  klaviyoProbeInFlight = { key, promise };

  try {
    const value = await promise;
    const retryCacheMs =
      value.status === "rate_limited"
        ? value.retryAfterSeconds * 1000
        : KLAVIYO_PROBE_CACHE_MS;
    klaviyoProbeCache = {
      key,
      value,
      expiresAt: now + Math.max(retryCacheMs, KLAVIYO_PROBE_CACHE_MS),
    };
    return value;
  } finally {
    if (klaviyoProbeInFlight?.promise === promise) {
      klaviyoProbeInFlight = undefined;
    }
  }
}

async function probeEmail() {
  const provider = envValue("MARKETING_PROVIDER").toLowerCase() || "noop";

  if (provider === "noop") {
    return makeResult({
      status: "mock",
      details:
        "Email marketing está en modo noop: no envía eventos reales ni suscripciones.",
      checks: [check("Proveedor", true, "noop")],
    });
  }

  if (provider !== "klaviyo") {
    return makeResult({
      status: "missing",
      details: `Proveedor de marketing no soportado: ${provider}`,
      checks: [check("Proveedor soportado", false, provider)],
    });
  }

  const apiKey = envValue("KLAVIYO_PRIVATE_API_KEY");
  const listId = envValue("KLAVIYO_LIST_ID");
  const revision = envValue("KLAVIYO_REVISION") || "2026-04-15";
  const checks = [
    check("Proveedor", true, "klaviyo"),
    check("API key privada", Boolean(apiKey)),
    check("Lista newsletter", Boolean(listId)),
  ];

  if (!apiKey || !listId) {
    return makeResult({
      status: "missing",
      details: "Klaviyo requiere KLAVIYO_PRIVATE_API_KEY y KLAVIYO_LIST_ID.",
      checks,
    });
  }

  const [klaviyo, queue] = await Promise.all([
    getCachedKlaviyoListProbe({ apiKey, listId, revision }),
    getMarketingQueueSummary(),
  ]);
  const queueWaiting = queue.pending + queue.processing;

  if (klaviyo.status === "rate_limited") {
    return makeResult({
      status: "degraded",
      details: `Klaviyo limitó temporalmente el diagnóstico. Reintento disponible en ${klaviyo.retryAfterSeconds} s · cola: ${queueWaiting} pendientes, ${queue.failed} con error.`,
      checks: [
        ...checks,
        check(
          "API Klaviyo",
          false,
          `Límite temporal; respetar Retry-After (${klaviyo.retryAfterSeconds} s)`,
        ),
        check(
          "Cola sin errores",
          queue.failed === 0,
          `${queue.processed} procesados`,
        ),
      ],
    });
  }

  return makeResult({
    status: queue.failed > 0 ? "degraded" : "connected",
    details: `${klaviyo.listName} conectada · cola: ${queueWaiting} pendientes, ${queue.failed} con error.`,
    checks: [
      ...checks,
      check("API Klaviyo", true),
      check(
        "Cola sin errores",
        queue.failed === 0,
        `${queue.processed} procesados`,
      ),
    ],
  });
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export async function getAdminIntegrationDiagnostics() {
  return Promise.all([
    withProbeTiming({
      id: "shopify",
      name: "Shopify",
      description: "Catálogo y checkout",
      run: probeShopify,
    }),
    withProbeTiming({
      id: "supabase",
      name: "Supabase",
      description: "Base de datos y puntos",
      run: probeSupabase,
    }),
    withProbeTiming({
      id: "tuu",
      name: "TUU",
      description: "Pago presencial en tienda",
      run: probeTuu,
    }),
    withProbeTiming({
      id: "email",
      name: "Email",
      description: "Campañas y newsletter",
      run: probeEmail,
    }),
  ]);
}
