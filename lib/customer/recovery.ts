import "server-only";

export const CUSTOMER_RECOVERY_COOKIE = "olffy_password_recovery";
export const CUSTOMER_RECOVERY_COOKIE_VALUE = "authorized";
export const CUSTOMER_RECOVERY_MAX_AGE_SECONDS = 15 * 60;

type CustomerAuthOriginInput = {
  nodeEnv: string | undefined;
  customerAuthSiteUrl: string | undefined;
  requestOrigin?: string | null;
  forwardedHost?: string | null;
  forwardedProtocol?: string | null;
};

function validOrigin(value: string, allowHttp: boolean) {
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    (url.protocol !== "https:" && (!allowHttp || url.protocol !== "http:"))
  ) {
    throw new Error("El origen de autenticación no es válido.");
  }
  return url.origin;
}

export function resolveCustomerAuthOrigin(input: CustomerAuthOriginInput) {
  const isProduction = input.nodeEnv === "production";
  const configured = input.customerAuthSiteUrl?.trim();

  if (isProduction) {
    if (!configured) {
      throw new Error("CUSTOMER_AUTH_SITE_URL no está configurada.");
    }
    return validOrigin(configured, false);
  }

  if (input.requestOrigin) {
    return validOrigin(input.requestOrigin, true);
  }

  if (input.forwardedHost) {
    const protocol = input.forwardedProtocol === "https" ? "https" : "http";
    return validOrigin(`${protocol}://${input.forwardedHost}`, true);
  }

  if (configured) {
    return validOrigin(configured, true);
  }

  throw new Error("No se pudo determinar la URL del sitio.");
}

export function buildCustomerConfirmationRedirect(origin: string) {
  return `${origin}/auth/confirm?next=/cuenta`;
}

export function buildCustomerRecoveryRedirect(origin: string) {
  return `${origin}/auth/confirm?next=/cuenta/restablecer`;
}
