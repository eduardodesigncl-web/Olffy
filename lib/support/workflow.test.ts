import { describe, expect, it } from "vitest";
import {
  adminHandlerUpdate,
  buildSupportCustomerEmailBody,
  formatSupportDate,
  isCustomerOnline,
  isValidSupportSubcategory,
  normalizeSupportIssueCategory,
  normalizeSupportStatus,
  sanitizeSupportEmailError,
  statusAfterAdminReply,
  statusAfterCustomerMessage,
  supportDeliveryForPresence,
  supportDateKey,
  supportEmailIdempotencyKey,
  supportIssueCategoryLabel,
} from "./workflow";

describe("support workflow", () => {
  it("clasifica presencia usando la ventana de 120 segundos", () => {
    const now = Date.parse("2026-07-17T17:00:00.000Z");
    expect(isCustomerOnline("2026-07-17T16:59:01.000Z", now)).toBe(true);
    expect(isCustomerOnline("2026-07-17T16:57:59.000Z", now)).toBe(false);
    expect(isCustomerOnline(null, now)).toBe(false);
  });

  it("elige chat sin correo en línea y chat con correo fuera de línea", () => {
    const now = Date.parse("2026-07-17T17:00:00.000Z");
    expect(supportDeliveryForPresence("2026-07-17T16:59:30.000Z", now)).toEqual(
      {
        online: true,
        deliveryChannel: "chat",
        emailStatus: "not_required",
      },
    );
    expect(supportDeliveryForPresence("2026-07-17T16:50:00.000Z", now)).toEqual(
      {
        online: false,
        deliveryChannel: "chat_and_email",
        emailStatus: "pending",
      },
    );
  });

  it("deriva encargado exclusivamente de la identidad autenticada", () => {
    expect(
      adminHandlerUpdate({
        accountId: "admin-real",
        name: "Edu",
        email: "edu@olffy.cl",
      }),
    ).toEqual({
      handled_by_admin_id: "admin-real",
      handled_by_admin_name: "Edu",
      handled_by_admin_email: "edu@olffy.cl",
      last_replied_by_admin_id: "admin-real",
    });
  });

  it("crea una clave de correo estable a partir del mensaje persistido", () => {
    expect(supportEmailIdempotencyKey(77)).toBe("support-admin-message-77");
    expect(() => supportEmailIdempotencyKey(0)).toThrow();
  });

  it("mantiene solamente los cuatro estados y migra los antiguos", () => {
    expect(normalizeSupportStatus("answered")).toBe("in_progress");
    expect(normalizeSupportStatus("closed")).toBe("resolved");
    expect(statusAfterAdminReply("new")).toBe("in_progress");
    expect(statusAfterCustomerMessage("resolved")).toBe("in_progress");
  });

  it("valida el diagnóstico guiado contra opciones controladas", () => {
    expect(normalizeSupportIssueCategory("order")).toBe("order");
    expect(normalizeSupportIssueCategory("instrucción inventada")).toBeNull();
    expect(isValidSupportSubcategory("order", "No ha llegado")).toBe(true);
    expect(isValidSupportSubcategory("order", "Cobro duplicado")).toBe(false);
    expect(supportIssueCategoryLabel("points")).toBe("Puntos y recompensas");
  });

  it("contextualiza el correo con caso, motivo, pedido y respuesta", () => {
    expect(
      buildSupportCustomerEmailBody({
        customerName: "Milenka",
        message: "Tu pedido ya está en reparto.",
        reference: "#SUP-1001",
        category: "order",
        subcategory: "No ha llegado",
        orderName: "#1053",
      }),
    ).toContain(
      "Hola, Milenka:\n\nTe respondemos sobre tu consulta #SUP-1001.\n\nMotivo: Pedido o despacho · No ha llegado\n\nPedido relacionado: #1053\n\nRespuesta del equipo OLFFY:\n\nTu pedido ya está en reparto.",
    );
  });

  it("formatea en es-CL con la zona America/Santiago", () => {
    const value = "2026-07-17T17:07:00.000Z";
    expect(formatSupportDate(value)).toMatch(/17.*07.*2026|17.*jul.*2026/i);
    expect(formatSupportDate(value)).toMatch(/1:07|13:07/);
    expect(supportDateKey(value)).toBe("2026-07-17");
  });

  it("preserva ISO UTC como fuente de verdad", () => {
    expect(new Date("2026-07-17T17:07:00.000Z").toISOString()).toBe(
      "2026-07-17T17:07:00.000Z",
    );
  });

  it("oculta credenciales en errores de correo", () => {
    expect(sanitizeSupportEmailError("Bearer secret.token re_live_key")).toBe(
      "Bearer [oculto] re_[oculto]",
    );
  });
});
