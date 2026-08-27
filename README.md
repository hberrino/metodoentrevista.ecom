# Método Entrevista

Landing de venta construida con React, Vite y Tailwind CSS.

## Desarrollo local

```bash
npm install
npm run dev
```

## Configurar el botón de Mercado Pago

1. Copiar `.env.example` como `.env`.
2. Crear un Link de pago en Mercado Pago.
3. Pegar la URL en `VITE_MERCADOPAGO_URL`.
4. Reiniciar el servidor local.

El Link de pago permite validar las primeras ventas sin backend. No guardar un Access Token en variables que empiecen con `VITE_`, porque esas variables se publican en el navegador.

## Compilar para Lightsail

```bash
npm run build
```

La versión lista para publicar queda en `dist/`. El servidor web debe redirigir las rutas de la aplicación hacia `index.html` y servir el sitio con HTTPS.

## Siguiente etapa de Mercado Pago

Cuando se necesite confirmar pagos y entregar los archivos automáticamente, agregar un backend Node/Express que:

- cree la preferencia de Checkout Pro;
- mantenga el Access Token únicamente en el servidor;
- reciba notificaciones de Mercado Pago;
- verifique el pago aprobado antes de habilitar la descarga;
- configure páginas de éxito, pago pendiente y error.

Antes de publicar, reemplazar las rutas relativas de `og:image` y `twitter:image` en `index.html` por la URL absoluta del dominio definitivo.
