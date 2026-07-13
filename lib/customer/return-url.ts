export function safeCustomerReturnUrl(
  value: string | null | undefined,
  fallback = "/cuenta",
) {
  if (!value?.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "https://olffy.local");
    return url.origin === "https://olffy.local"
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
