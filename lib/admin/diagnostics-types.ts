export type AdminIntegrationDiagnosticStatus =
  | "connected"
  | "degraded"
  | "pending"
  | "missing"
  | "error"
  | "mock";

export type AdminIntegrationDiagnosticTone =
  | "ok"
  | "warning"
  | "error"
  | "mock";

export type AdminIntegrationDiagnosticId =
  | "shopify"
  | "supabase"
  | "tuu"
  | "email";

export type AdminIntegrationDiagnosticCheck = {
  label: string;
  ok: boolean;
  detail?: string;
};

export type AdminIntegrationDiagnostic = {
  id: AdminIntegrationDiagnosticId;
  name: string;
  description: string;
  status: AdminIntegrationDiagnosticStatus;
  tone: AdminIntegrationDiagnosticTone;
  label: string;
  details: string;
  checkedAt: string;
  latencyMs: number;
  checks: AdminIntegrationDiagnosticCheck[];
};

export type AdminIntegrationDiagnosticsResponse = {
  checkedAt: string;
  diagnostics: AdminIntegrationDiagnostic[];
};
