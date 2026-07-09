import { useCallback, useEffect, useState } from "react";
import type {
  AdminIntegrationDiagnostic,
  AdminIntegrationDiagnosticsResponse,
} from "lib/admin/diagnostics-types";

export type AdminDiagnosticsState = {
  diagnostics: AdminIntegrationDiagnostic[] | null;
  checkedAt: string | null;
  loading: boolean;
  error: string | null;
};

export function useAdminDiagnostics(enabled = true) {
  const [state, setState] = useState<AdminDiagnosticsState>({
    diagnostics: null,
    checkedAt: null,
    loading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch("/api/admin/diagnostics", {
        cache: "no-store",
        credentials: "include",
      });
      const body = (await response.json()) as
        | AdminIntegrationDiagnosticsResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in body && body.error
            ? body.error
            : "No se pudo ejecutar el diagnóstico.",
        );
      }

      if (!("diagnostics" in body)) {
        throw new Error("La API devolvió una respuesta inesperada.");
      }

      setState({
        diagnostics: body.diagnostics,
        checkedAt: body.checkedAt,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return { ...state, refresh };
}
