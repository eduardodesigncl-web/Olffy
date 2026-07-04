import "server-only";

function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} no esta configurado`);
  }

  return value;
}

export function isTuuOnlineEnabled() {
  return enabled(process.env.PAYMENTS_TUU_ENABLED);
}

export function isTuuRemotePosEnabled() {
  return enabled(process.env.TUU_REMOTE_POS_ENABLED);
}

export function getTuuOnlineConfig() {
  if (!isTuuOnlineEnabled()) {
    throw new Error("Los pagos TUU online estan deshabilitados");
  }

  return {
    environment: process.env.TUU_ONLINE_ENV?.trim() || "sandbox",
    accountId: required("TUU_ONLINE_ACCOUNT_ID"),
    secretKey: required("TUU_ONLINE_SECRET_KEY"),
    apiUrl: required("TUU_ONLINE_API_URL").replace(/\/$/, ""),
    callbackUrl: required("TUU_ONLINE_CALLBACK_URL"),
    completeUrl: required("TUU_ONLINE_COMPLETE_URL"),
    cancelUrl: required("TUU_ONLINE_CANCEL_URL"),
  };
}

export function getTuuRemotePosConfig() {
  if (!isTuuRemotePosEnabled()) {
    throw new Error("El pago remoto TUU esta deshabilitado");
  }

  return {
    apiKey: required("TUU_POS_API_KEY"),
    deviceUuid: required("TUU_POS_DEVICE_UUID"),
    deviceSerial: required("TUU_POS_DEVICE_SERIAL"),
    apiUrl:
      process.env.TUU_POS_API_URL?.trim().replace(/\/$/, "") ||
      "https://integrations.payment.haulmer.com",
    createPath:
      process.env.TUU_POS_CREATE_PATH?.trim() || "/RemotePayment/v2/Create",
    statusPathTemplate: process.env.TUU_POS_STATUS_PATH?.trim() || "",
    webhookSecret: process.env.TUU_POS_WEBHOOK_SECRET?.trim() || "",
    sourceName: process.env.TUU_POS_SOURCE_NAME?.trim() || "OLFFY Admin",
    sourceVersion: process.env.TUU_POS_SOURCE_VERSION?.trim() || "1.0.0",
  };
}
