# Publicar CV para resultados reales en Lightsail

Esta configuración ejecuta Node solamente en `127.0.0.1:3002`. Nginx recibe las visitas públicas y las deriva al proceso, incluyendo `/api/checkout` y `/api/mercadopago/webhook`. Es independiente de los otros sitios alojados en la misma instancia.

## 1. Dominio y red

1. Crear registros `A` para `metodoentrevista.store` y `www.metodoentrevista.store` apuntando a la IP estática de Lightsail.
2. En la pestaña **Networking** de Lightsail, habilitar los puertos TCP `80` y `443`.
3. Esperar a que el dominio resuelva hacia la instancia.

## 2. Copiar y preparar el proyecto

Ejemplo de directorio recomendado:

```bash
sudo mkdir -p /var/www/metodoentrevista
sudo chown -R "$USER":"$USER" /var/www/metodoentrevista
cd /var/www/metodoentrevista
```

Copiar aquí el contenido del proyecto y luego ejecutar:

```bash
npm ci
npm run build
```

Completar `.env` directamente en el servidor. Nunca subirlo a Git ni copiar las claves a archivos públicos.

La base de producción debe incluir:

```dotenv
PUBLIC_URL=https://metodoentrevista.store
HOST=127.0.0.1
PORT=3002
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
META_PIXEL_ID=
META_CONVERSIONS_API_TOKEN=
META_GRAPH_API_VERSION=v23.0
META_TEST_EVENT_CODE=
SMTP_PASS=
EBOOK_FOLDER_URL=https://drive.google.com/drive/folders/1iEi-eEwWg4M6z1hOfwKu4Js0krM3tEVk?usp=sharing
```

## 3. Mantener Node activo con systemd

```bash
sudo cp deploy/metodoentrevista.service /etc/systemd/system/metodoentrevista.service
sudo systemctl daemon-reload
sudo systemctl enable --now metodoentrevista.service
sudo systemctl status metodoentrevista.service --no-pager
```

Comprobación local dentro del servidor:

```bash
curl http://127.0.0.1:3002/api/health
```

Debe responder `{"ok":true}`.

## 4. Configurar Nginx

```bash
sudo cp deploy/nginx-metodoentrevista.conf /etc/nginx/sites-available/metodoentrevista.store
sudo ln -s /etc/nginx/sites-available/metodoentrevista.store /etc/nginx/sites-enabled/metodoentrevista.store
sudo nginx -t
sudo systemctl reload nginx
```

Si el enlace simbólico ya existe, no hace falta crearlo otra vez. Esta configuración es un bloque separado y no reemplaza las otras páginas que ya estén alojadas en Nginx.

## 5. Activar HTTPS

Con el dominio resolviendo correctamente:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d metodoentrevista.store -d www.metodoentrevista.store
```

Elegir la redirección automática de HTTP a HTTPS y comprobar:

```bash
curl https://metodoentrevista.store/api/health
sudo certbot renew --dry-run
```

## 6. Conectar Mercado Pago

En la aplicación de Mercado Pago:

1. Abrir **Webhooks > Configurar notificaciones**.
2. Usar `https://metodoentrevista.store/api/mercadopago/webhook` como URL de producción.
3. Seleccionar el evento **Payments**.
4. Guardar y copiar la firma secreta generada en `MERCADOPAGO_WEBHOOK_SECRET`.
5. Colocar el Access Token de producción en `MERCADOPAGO_ACCESS_TOKEN`.
6. Reiniciar el proceso con `sudo systemctl restart metodoentrevista.service`.

Probar primero con credenciales y cuentas de prueba. La entrega se ejecuta únicamente después de que el webhook esté firmado y la API confirme pago aprobado, importe de `$14.900` y moneda `ARS`.

## Meta Pixel y Conversions API

1. Crear un origen de datos web en el Administrador de eventos de Meta.
2. Copiar su identificador en `META_PIXEL_ID`.
3. Generar un token de Conversions API y guardarlo en `META_CONVERSIONS_API_TOKEN`.
4. Durante las pruebas, copiar el código de "Probar eventos" en `META_TEST_EVENT_CODE`.
5. Reiniciar el servicio después de editar `.env`.
6. Verificar `PageView`, `ViewContent`, `InitiateCheckout` y `Purchase` en "Probar eventos".
7. Vaciar `META_TEST_EVENT_CODE` y reiniciar el servicio antes de activar la campaña real.

El navegador carga el Pixel al ingresar. La compra se envía también desde el servidor una vez que Mercado Pago confirma estado, importe y moneda. Navegador y servidor comparten el mismo `event_id` para que Meta deduplique el evento `Purchase`.

## 7. Activar el envío desde Gmail

1. Activar verificación en dos pasos en `berrinohernan@gmail.com`.
2. Crear una contraseña de aplicación para correo.
3. Guardarla en `SMTP_PASS` dentro de `.env`.
4. Reiniciar con `sudo systemctl restart metodoentrevista.service`.

## 8. Activar Cloudflare sin interrumpir pagos

1. Agregar `metodoentrevista.store` a Cloudflare y revisar que haya importado todos los registros DNS existentes.
2. Cambiar en el registrador los nameservers por los dos asignados por Cloudflare.
3. En DNS usar `A @ -> 56.125.210.159` y `CNAME www -> metodoentrevista.store`, ambos en modo **Proxied** y TTL **Auto**.
4. En **SSL/TLS > Overview** elegir **Full (strict)**. Nunca usar Flexible.
5. Mantener **Rocket Loader desactivado** y activar Brotli.
6. En **Rules > Redirect Rules**, crear una redirección 301 cuando el hostname sea `www.metodoentrevista.store`. Usar como destino dinámico `concat("https://metodoentrevista.store", http.request.uri.path)` y activar **Preserve query string**.
7. Crear una regla de caché con URI Path que comience por `/api/` y elegir **Bypass cache**.
8. No activar desafíos automáticos ni reglas agresivas sobre `/api/mercadopago/webhook`.
9. Cuando Cloudflare marque el dominio como activo, volver a simular una notificación desde Mercado Pago y comprobar que responde `200`.

La redirección permanente de `www` hacia el dominio sin `www` se realiza en Nginx y también está respaldada por la aplicación.

## Actualizaciones futuras

```bash
cd /var/www/metodoentrevista
npm ci
npm run build
sudo systemctl restart metodoentrevista.service
curl https://metodoentrevista.store/api/health
```

Logs útiles:

```bash
sudo journalctl -u metodoentrevista.service --since "10 minutes ago" --no-pager
sudo tail -f /var/log/nginx/metodoentrevista.error.log
```
