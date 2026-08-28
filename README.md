# Método Entrevista

Landing de venta con React/Vite y servidor Node/Express para Checkout Pro de Mercado Pago y entrega automática por correo.

## Desarrollo local

1. Copiar `.env.example` como `.env` y completar las variables.
2. Instalar dependencias con `npm install`.
3. En una terminal ejecutar `npm run server`.
4. En otra terminal ejecutar `npm run dev`.

Vite abre la landing en `http://localhost:5173` y deriva las solicitudes `/api` al servidor de `http://localhost:3001`.

## Flujo de la compra

1. El comprador ingresa obligatoriamente su correo en el modal.
2. El servidor crea una preferencia de Checkout Pro y lo redirige a Mercado Pago.
3. Mercado Pago notifica el pago mediante el webhook firmado.
4. El servidor consulta el pago y verifica estado `approved`, importe, moneda y referencia interna.
5. Recién entonces envía por correo los seis enlaces configurados.
6. La pantalla de regreso consulta el estado y muestra si los ebooks fueron enviados o están en proceso.

## Configuración de Mercado Pago

- Crear una aplicación de Checkout Pro en Mercado Pago Developers.
- Copiar el Access Token en `MERCADOPAGO_ACCESS_TOKEN`.
- En **Webhooks > Configurar notificaciones**, registrar `https://tudominio.com/api/mercadopago/webhook`.
- Seleccionar el evento **Payments** y copiar la firma secreta generada en `MERCADOPAGO_WEBHOOK_SECRET`.
- Probar primero con las credenciales y cuentas de prueba.
- El Access Token y la firma nunca deben guardarse en variables `VITE_` ni exponerse en el navegador.

## Google Drive y correo

- Subir los seis PDF a una carpeta de Drive y habilitar **Cualquier persona con el enlace: lector**.
- Pegar el enlace de la carpeta en `EBOOK_FOLDER_URL`. El correo tendrá un único botón **Abrir mis 6 ebooks**.
- Como alternativa, se pueden configurar seis enlaces separados mediante las variables `EBOOK_*_URL`.
- Para enviar desde Gmail, activar verificación en dos pasos y crear una contraseña de aplicación para `SMTP_PASS`.
- Los enlaces de Drive pueden ser compartidos por el comprador. Para enlaces privados de un solo uso se necesita almacenamiento con URLs firmadas, por ejemplo Amazon S3.

## Publicación en Lightsail

```bash
npm run build
npm start
```

El servidor sirve la carpeta `dist`, la API y el webhook desde un mismo proceso. El dominio debe tener HTTPS. Conviene ejecutar Node con un administrador de procesos como PM2 y usar Nginx como proxy inverso.

La guía exacta para `metodoentrevista.store`, incluyendo DNS, PM2, Nginx, Certbot y el webhook de Mercado Pago, está en [`deploy/DEPLOY_LIGHTSAIL.md`](deploy/DEPLOY_LIGHTSAIL.md).
