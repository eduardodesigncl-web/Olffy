import type {
  AdminCustomerContext,
  AdminCustomerSupportConversation,
  AdminPanelCustomer,
  UnifiedSale,
} from "./types";

export type CustomerSupportRelation = AdminCustomerSupportConversation & {
  customerId: number;
  customerEmail: string;
};

export function buildCustomerContexts(
  customers: AdminPanelCustomer[],
  sales: UnifiedSale[],
  supportRelations: CustomerSupportRelation[],
): Record<string, AdminCustomerContext> {
  const contexts: Record<string, AdminCustomerContext> = {};
  for (const customer of customers) {
    const email = customer.email.trim().toLowerCase();
    const customerSales = sales.filter(
      (sale) =>
        sale.customerId === customer.idx ||
        (Boolean(email) && sale.email.trim().toLowerCase() === email),
    );
    const supportConversations = supportRelations
      .filter(
        (conversation) =>
          conversation.customerId === customer.idx ||
          (Boolean(email) && conversation.customerEmail === email),
      )
      .map(
        ({ customerId: _customerId, customerEmail: _email, ...summary }) =>
          summary,
      );

    contexts[String(customer.idx)] = {
      purchaseCount: customerSales.length,
      purchases: customerSales.slice(0, 5).map((sale) => ({
        id: sale.id,
        folio: sale.folio,
        fecha: sale.fecha,
        fechaISO: sale.fechaISO,
        total: sale.total,
        totalN: sale.totalN,
        origen: sale.origen,
        origenLabel: sale.origenLabel,
        estadoPago: sale.estadoPago,
      })),
      supportCount: supportConversations.length,
      supportConversations: supportConversations.slice(0, 5),
    };
  }
  return contexts;
}
