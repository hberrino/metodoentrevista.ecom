# Publicar Método Entrevista en Lightsail

Esta configuración ejecuta Node solamente en `127.0.0.1:3001`. Nginx recibe las visitas públicas y las deriva al proceso, incluyendo `/api/checkout` y `/api/mercadopago/webhook`.

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

Variables todavía pendientes:

```dotenv
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
SMTP_PASS=
```

## 3. Mantener Node activo con PM2

```bash
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

El último comando mostrará una instrucción adicional con `sudo`; ejecutarla y volver a correr `pm2 save`.

Comprobación local dentro del servidor:

```bash
curl http://127.0.0.1:3001/api/health
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
6. Reiniciar el proceso con `pm2 restart metodo-entrevista --update-env`.

Probar primero con credenciales y cuentas de prueba. La entrega se ejecuta únicamente después de que el webhook esté firmado y la API confirme pago aprobado, importe de `$8.990` y moneda `ARS`.

## 7. Activar el envío desde Gmail

1. Activar verificación en dos pasos en `valeriafursten@gmail.com`.
2. Crear una contraseña de aplicación para correo.
3. Guardarla en `SMTP_PASS` dentro de `.env`.
4. Reiniciar con `pm2 restart metodo-entrevista --update-env`.

## Actualizaciones futuras

```bash
cd /var/www/metodoentrevista
npm ci
npm run build
pm2 restart metodo-entrevista --update-env
```

Logs útiles:

```bash
pm2 logs metodo-entrevista
sudo tail -f /var/log/nginx/metodoentrevista.error.log
```
