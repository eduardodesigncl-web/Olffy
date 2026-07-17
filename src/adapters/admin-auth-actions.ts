"use client";

async function adminAuthRequest(method: "POST" | "DELETE", password?: string) {
  const response = await fetch("/api/admin/auth", {
    method,
    headers:
      method === "POST"
        ? {
            "Content-Type": "application/json",
          }
        : undefined,
    body: method === "POST" ? JSON.stringify({ password }) : undefined,
    credentials: "include",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "No se pudo autenticar el administrador");
  }

  return result;
}

export async function adminLogin(password: string) {
  return adminAuthRequest("POST", password);
}

export async function adminLogout() {
  return adminAuthRequest("DELETE");
}
