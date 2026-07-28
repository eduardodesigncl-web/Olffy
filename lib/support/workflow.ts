import type { SupportIssueCategory, SupportStatus } from "./types";

export const SUPPORT_TIME_ZONE = "America/Santiago";
export const SUPPORT_ONLINE_WINDOW_MS = 120_000;

export const SUPPORT_DIAGNOSTIC_OPTIONS: ReadonlyArray<{
  value: SupportIssueCategory;
  label: string;
  question: string;
  options: readonly string[];
}> = [
  {
    value: "order",
    label: "Pedido o despacho",
    question: "¿Qué ocurre con tu pedido?",
    options: [
      "No ha llegado",
      "Necesito el seguimiento",
      "Llegó incompleto o dañado",
      "Cambio o devolución",
    ],
  },
  {
    value: "payment",
    label: "Pago o compra",
    question: "¿Qué problema tuviste al comprar?",
    options: [
      "Pago rechazado",
      "Cobro duplicado",
      "No recibí comprobante",
      "No pude finalizar la compra",
    ],
  },
  {
    value: "points",
    label: "Puntos y recompensas",
    question: "¿Qué necesitas revisar?",
    options: [
      "Puntos no abonados",
      "Problema con un canje",
      "Saldo incorrecto",
      "Reglas o vencimiento",
    ],
  },
  {
    value: "account",
    label: "Cuenta y acceso",
    question: "¿Qué ocurre con tu cuenta?",
    options: [
      "No puedo ingresar",
      "Recuperar contraseña",
      "Actualizar mis datos",
      "Cuenta bloqueada",
    ],
  },
  {
    value: "product",
    label: "Producto o garantía",
    question: "¿Cómo podemos ayudarte con el producto?",
    options: [
      "Producto defectuoso",
      "Consulta de uso",
      "Disponibilidad",
      "Cambio o garantía",
    ],
  },
  {
    value: "other",
    label: "Otra consulta",
    question: "¿Qué tipo de ayuda necesitas?",
    options: [
      "Información general",
      "Sugerencia o reclamo",
      "Venta empresa",
      "Otro motivo",
    ],
  },
] as const;

export function normalizeSupportIssueCategory(
  value: unknown,
): SupportIssueCategory | null {
  return SUPPORT_DIAGNOSTIC_OPTIONS.some((option) => option.value === value)
    ? (value as SupportIssueCategory)
    : null;
}

export function supportIssueCategoryLabel(
  category: SupportIssueCategory | null | undefined,
) {
  return (
    SUPPORT_DIAGNOSTIC_OPTIONS.find((option) => option.value === category)
      ?.label ?? "Sin clasificar"
  );
}

export function isValidSupportSubcategory(
  category: SupportIssueCategory,
  subcategory: unknown,
) {
  if (typeof subcategory !== "string") return false;
  return Boolean(
    SUPPORT_DIAGNOSTIC_OPTIONS.find(
      (option) =>
        option.value === category && option.options.includes(subcategory),
    ),
  );
}

export function buildSupportCustomerEmailBody(input: {
  customerName: string | null;
  message: string;
  reference: string;
  category: SupportIssueCategory | null;
  subcategory: string | null;
  orderName: string | null;
}) {
  const topic = input.category
    ? `${supportIssueCategoryLabel(input.category)}${
        input.subcategory ? ` · ${input.subcategory}` : ""
      }`
    : "Consulta general";

  return [
    `Hola, ${input.customerName || "cliente OLFFY"}:`,
    `Te respondemos sobre tu consulta ${input.reference}.`,
    `Motivo: ${topic}`,
    input.orderName ? `Pedido relacionado: ${input.orderName}` : null,
    `Respuesta del equipo OLFFY:\n\n${input.message}`,
    "Puedes continuar la conversación desde el botón de este correo. Tu respuesta quedará asociada al mismo caso.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function normalizeSupportStatus(value: unknown): SupportStatus {
  if (
    value === "new" ||
    value === "in_progress" ||
    value === "waiting_information" ||
    value === "resolved"
  ) {
    return value;
  }

  if (value === "closed") return "resolved";
  if (value === "open" || value === "answered") return "in_progress";
  return "new";
}

export function isCustomerOnline(
  lastSeenAt: string | null | undefined,
  now = Date.now(),
) {
  if (!lastSeenAt) return false;
  const seenAt = Date.parse(lastSeenAt);
  return Number.isFinite(seenAt) && now - seenAt <= SUPPORT_ONLINE_WINDOW_MS;
}

export function supportDeliveryForPresence(
  lastSeenAt: string | null | undefined,
  now = Date.now(),
) {
  const online = isCustomerOnline(lastSeenAt, now);
  return online
    ? ({
        online,
        deliveryChannel: "chat",
        emailStatus: "not_required",
      } as const)
    : ({
        online,
        deliveryChannel: "chat_and_email",
        emailStatus: "pending",
      } as const);
}

export function supportDeliveryForAdminAction(
  action: "reply" | "reply_chat" | "reply_chat_email",
  lastSeenAt: string | null | undefined,
  now = Date.now(),
) {
  if (action === "reply_chat") {
    return {
      online: isCustomerOnline(lastSeenAt, now),
      deliveryChannel: "chat",
      emailStatus: "not_required",
    } as const;
  }

  if (action === "reply_chat_email") {
    return {
      online: isCustomerOnline(lastSeenAt, now),
      deliveryChannel: "chat_and_email",
      emailStatus: "pending",
    } as const;
  }

  return supportDeliveryForPresence(lastSeenAt, now);
}

export function resolveSupportSiteOrigin(input: {
  nodeEnv: string | undefined;
  siteUrl: string | undefined;
  nextPublicSiteUrl: string | undefined;
  requestOrigin: string;
}) {
  const isProduction = input.nodeEnv === "production";
  const configured = input.siteUrl?.trim() || input.nextPublicSiteUrl?.trim();
  const candidate = isProduction
    ? configured
    : input.requestOrigin || configured;

  if (!candidate) {
    throw new Error("SITE_URL o NEXT_PUBLIC_SITE_URL no está configurada.");
  }

  const url = new URL(candidate);
  if (
    url.username ||
    url.password ||
    (url.protocol !== "https:" && (isProduction || url.protocol !== "http:"))
  ) {
    throw new Error("La URL canónica de soporte no es válida.");
  }
  return url.origin;
}

export function supportEmailIdempotencyKey(messageId: number) {
  if (!Number.isSafeInteger(messageId) || messageId <= 0) {
    throw new Error("Id de mensaje inválido");
  }
  return `support-admin-message-${messageId}`;
}

export function adminHandlerUpdate(admin: {
  accountId: string;
  name: string;
  email: string;
}) {
  return {
    handled_by_admin_id: admin.accountId,
    handled_by_admin_name: admin.name,
    handled_by_admin_email: admin.email,
    last_replied_by_admin_id: admin.accountId,
  } as const;
}

export function statusAfterAdminReply(status: SupportStatus): SupportStatus {
  return status === "new" ? "in_progress" : status;
}

export function statusAfterCustomerMessage(
  status: SupportStatus,
): SupportStatus {
  return status === "resolved" ? "in_progress" : status;
}

export function supportStatusLabel(status: SupportStatus) {
  return {
    new: "Nueva",
    in_progress: "En atención",
    waiting_information: "Esperando información",
    resolved: "Resuelta",
  }[status];
}

export function formatSupportDate(value: string | Date) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: SUPPORT_TIME_ZONE,
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function supportDateKey(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: SUPPORT_TIME_ZONE,
  }).formatToParts(typeof value === "string" ? new Date(value) : value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function sanitizeSupportEmailError(value: unknown) {
  const message = value instanceof Error ? value.message : String(value ?? "");
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [oculto]")
    .replace(/re_[A-Za-z0-9_-]+/g, "re_[oculto]")
    .replace(/((?:api|secret)[_-]?key\s*[:=]\s*)[^\s,;]+/gi, "$1[oculto]")
    .slice(0, 500);
}
