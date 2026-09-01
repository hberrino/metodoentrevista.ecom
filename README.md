# CV para resultados reales

CV para resultados reales es un e-commerce de productos digitales orientado a la búsqueda laboral. La propuesta incluye el ebook principal para crear y adaptar un CV, más dos ebooks de regalo: LinkedIn desde cero y Preparación para entrevistas.

## Arquitectura

El frontend es una aplicación web desarrollada con React y Vite, con una interfaz responsive optimizada para desktop y dispositivos móviles. El backend utiliza Node.js y Express y funciona como API, servidor de archivos estáticos y punto de recepción de notificaciones externas.

La aplicación se ejecuta como un único servicio y está compuesta por:

- React 19, Vite y Tailwind CSS para la interfaz.
- Node.js y Express para la lógica del servidor.
- Mercado Pago Checkout Pro para procesar los pagos.
- Webhooks firmados para confirmar las operaciones directamente con Mercado Pago.
- Nodemailer y Gmail SMTP para el envío automático de los accesos.
- Google Drive como biblioteca de entrega de los tres ebooks.
- Persistencia local de órdenes para registrar el estado del pago y evitar entregas duplicadas.
- Helmet, validación de datos y límites de solicitudes para reforzar la seguridad de la API.

## Flujo de compra

El comprador ingresa su correo y es redirigido a Mercado Pago. Cuando la operación es aprobada, Mercado Pago notifica al servidor mediante un webhook firmado. El backend consulta la operación y valida el estado, el importe, la moneda y la referencia de la orden antes de enviar por correo el enlace de acceso a la biblioteca digital.

La entrega sólo se registra como completada después de que el proveedor de correo confirma el envío, y cada orden aprobada se procesa una única vez.

## Infraestructura

El proyecto está alojado en una instancia Ubuntu de Amazon Lightsail y se encuentra publicado en [metodoentrevista.store](https://metodoentrevista.store). Nginx funciona como proxy inverso, el proceso de Node.js es administrado por systemd y el dominio utiliza HTTPS mediante un certificado de Let's Encrypt.

## Contenido y posicionamiento

Además del flujo de comercio electrónico, el sitio incluye metadatos para buscadores y redes sociales, datos estructurados de producto y preguntas frecuentes, sitemap, reglas para rastreadores y recursos gráficos optimizados para compartir la página.
