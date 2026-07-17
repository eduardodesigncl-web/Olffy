# TUU Pago Remoto POS

Este flujo permite enviar un cobro desde el dashboard OLFFY al POS TUU y cerrar la venta solo cuando TUU confirma el pago por webhook.

## Flujo

1. El cajero arma el carrito en `/admin/loyalty`.
2. Presiona `Enviar cobro a maquina TUU`.
3. El backend valida stock/precios en Shopify, calcula descuentos y puntos, guarda un snapshot de la venta y crea una solicitud en TUU Pago Remoto.
4. TUU muestra el monto en el POS configurado.
5. Cuando TUU confirma el pago, llama a `POST /api/payments/tuu/pos/webhook`.
6. El webhook crea o recupera la orden pagada en Shopify con descuento de inventario, registra la venta fisica, mueve puntos y guarda la transaccion operacional.

## Variables

```env
TUU_REMOTE_POS_ENABLED="true"
TUU_POS_API_KEY=""
TUU_POS_DEVICE_UUID=""
TUU_POS_DEVICE_SERIAL=""
TUU_POS_API_URL="https://integrations.payment.haulmer.com"
TUU_POS_CREATE_PATH="/RemotePayment/v2/Create"
TUU_POS_WEBHOOK_SECRET=""
```

No guardar claves reales en Git. Configurar esos valores en `.env.local` para pruebas locales y en Vercel para produccion.

## Configuracion externa

- En TUU, habilitar `Modo Integracion` para el comercio/dispositivo.
- Usar el numero de serie del POS en `TUU_POS_DEVICE_SERIAL`.
- Configurar como callback publico:
  `https://<dominio>/api/payments/tuu/pos/webhook`.
- Si TUU permite configurar un secreto de callback, usar el mismo valor en `TUU_POS_WEBHOOK_SECRET`.

## Referencias

- TUU Pago Remoto: `https://developers.tuu.cl/docs/pago-remoto`
- Crear solicitud remota: `https://developers.tuu.cl/reference/createremotepaymentrequest`
- OpenFactura / DTE: `https://docsapi-openfactura.haulmer.com/?version=latest`
