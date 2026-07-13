# Autenticación de clientes en producción

El código implementa inicio de sesión, registro con confirmación, reenvío de
confirmación, recuperación y cambio de contraseña. La puesta en producción
requiere completar también la configuración externa de Supabase Auth.

## Separación de proveedores

- Supabase Auth envía confirmaciones, recuperaciones y avisos de seguridad por
  el SMTP transaccional configurado. Klaviyo no participa en estos flujos.
- Klaviyo queda reservado para newsletter, campañas y fidelización: compras,
  puntos ganados, beneficios disponibles, puntos por vencer y automatizaciones
  de carrito abandonado conectadas con Shopify.
- Sólo `Newsletter Signup` suscribe un perfil. Los eventos operativos de puntos
  nunca vuelven a suscribir a una persona que se dio de baja en Klaviyo.

## Dominio y redirecciones

1. Configura `CUSTOMER_AUTH_SITE_URL` con el origen HTTPS de esta aplicación
   Next.js, sin barra final.
2. En Supabase, Authentication > URL Configuration, usa ese mismo origen como
   Site URL.
3. Agrega estas Redirect URLs:
   - `https://DOMINIO/auth/confirm`
   - Para previews controlados, el patrón Vercel correspondiente.
4. No uses `www.olffy.cl` mientras ese dominio continúe sirviendo la tienda
   Shopify y no esta aplicación.

## Plantillas SSR recomendadas

Si el plan y el proveedor SMTP permiten personalizar plantillas, usa enlaces
con `token_hash`. Así la confirmación funciona aunque el correo se abra en otro
dispositivo y no depende del verificador PKCE del navegador que inició el flujo.

Confirm signup:

```html
<a
  href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/cuenta"
>
  Confirmar mi cuenta
</a>
```

Reset password:

```html
<a
  href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/cuenta/restablecer"
>
  Crear una contraseña nueva
</a>
```

## Correo transaccional

Configura SMTP personalizado en Supabase antes de abrir el registro al público.
El correo `olffy.contact@gmail.com` puede utilizarse provisionalmente como
destinatario de QA o como remitente solo si el proveedor SMTP autoriza esa
dirección. Si se usa Gmail como SMTP, habilita la verificación en dos pasos y
genera una contraseña de aplicación exclusiva; no uses ni almacenes la
contraseña normal de la cuenta. Para producción se recomienda una dirección
del dominio de OLFFY, por ejemplo `no-reply@auth.olffy.cl`, con SPF, DKIM y
DMARC.

Desactiva el seguimiento de enlaces del proveedor para los correos Auth y
mantén habilitada la confirmación de correo. Configura además CAPTCHA y revisa
los límites de envío en Authentication > Rate Limits antes del lanzamiento.
