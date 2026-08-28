import 'dotenv/config'

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import express from 'express'
import helmet from 'helmet'
import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  Payment,
  Preference,
  WebhookSignatureValidator,
} from 'mercadopago'
import nodemailer from 'nodemailer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const dataDirectory = path.join(projectRoot, 'data')
const ordersPath = path.join(dataDirectory, 'orders.json')
const port = Number(process.env.PORT || 3001)
const host = process.env.HOST || '127.0.0.1'
const productPrice = 12990
const productCurrency = 'ARS'
const contactEmail = 'valeriafursten@gmail.com'

const ebookLinks = [
  ['Método Entrevista', process.env.EBOOK_METODO_URL],
  ['CV listo para postularte', process.env.EBOOK_CV_URL],
  ['IA aplicada a conseguir empleo', process.env.EBOOK_IA_URL],
  ['LinkedIn desde cero', process.env.EBOOK_LINKEDIN_URL],
  ['Guía de empleos', process.env.EBOOK_EMPLEOS_URL],
  ['Preparación para entrevistas', process.env.EBOOK_ENTREVISTAS_URL],
]

const app = express()
app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json({ limit: '20kb' }))
app.use((req, res, next) => {
  if (req.hostname === 'www.metodoentrevista.store') {
    return res.redirect(301, `https://metodoentrevista.store${req.originalUrl}`)
  }
  return next()
})

let storeQueue = Promise.resolve()

async function readOrders() {
  try {
    return JSON.parse(await fs.readFile(ordersPath, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return {}
    throw error
  }
}

function withStore(callback) {
  const operation = storeQueue.then(async () => {
    await fs.mkdir(dataDirectory, { recursive: true })
    const orders = await readOrders()
    const result = await callback(orders)
    await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2), 'utf8')
    return result
  })
  storeQueue = operation.catch(() => undefined)
  return operation
}

const getOrder = (orderId) => storeQueue.then(async () => (await readOrders())[orderId] || null)
const saveOrder = (order) => withStore((orders) => { orders[order.id] = order; return order })
const updateOrder = (orderId, update) => withStore((orders) => {
  if (!orders[orderId]) return null
  orders[orderId] = { ...orders[orderId], ...update, updatedAt: new Date().toISOString() }
  return orders[orderId]
})

function isValidEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function publicUrl() {
  const value = String(process.env.PUBLIC_URL || '').replace(/\/$/, '')
  if (!/^https:\/\//i.test(value) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(value)) {
    throw new Error('PUBLIC_URL debe ser una URL HTTPS pública (o localhost durante el desarrollo).')
  }
  return value
}

function mercadoPagoClients() {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) throw new Error('Falta MERCADOPAGO_ACCESS_TOKEN.')
  const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN })
  return { preference: new Preference(client), payment: new Payment(client) }
}

function mailTransport() {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) throw new Error('Faltan SMTP_USER o SMTP_PASS.')
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: { user, pass },
  })
}

function configuredDelivery() {
  if (process.env.EBOOK_FOLDER_URL) {
    return { folderUrl: process.env.EBOOK_FOLDER_URL, links: ebookLinks.map(([name]) => name) }
  }
  const missing = ebookLinks.filter(([, url]) => !url)
  if (missing.length) throw new Error(`Faltan enlaces de ebooks: ${missing.map(([name]) => name).join(', ')}.`)
  return { folderUrl: null, links: ebookLinks }
}

async function sendEbooks(order) {
  const delivery = configuredDelivery()
  const list = delivery.links.map((item) => {
    const [name, url] = Array.isArray(item) ? item : [item, null]
    return `<li style="margin:0 0 10px">${url ? `<a href="${url}" style="color:#d94c35;font-weight:700">Abrir ${name}</a>` : name}</li>`
  }).join('')
  const accessText = delivery.folderUrl
    ? `Abrí tu biblioteca completa: ${delivery.folderUrl}`
    : delivery.links.map(([name, url]) => `${name}: ${url}`).join('\n')
  const accessButton = delivery.folderUrl
    ? `<p style="margin:28px 0"><a href="${delivery.folderUrl}" style="display:inline-block;padding:15px 22px;border-radius:9px;background:#e85d43;color:#fff;font-weight:800;text-decoration:none">Abrir mis 6 ebooks</a></p>`
    : ''
  await mailTransport().sendMail({
    from: process.env.SMTP_FROM || `Método Entrevista <${process.env.SMTP_USER}>`,
    replyTo: contactEmail,
    to: order.email,
    subject: 'Tus 6 ebooks de Método Entrevista',
    text: `¡Gracias por tu compra! Tus ebooks están listos:\n\n${accessText}\n\nIncluye:\n${delivery.links.map((item) => `- ${Array.isArray(item) ? item[0] : item}`).join('\n')}\n\nConsultas: ${contactEmail}`,
    html: `<div style="max-width:620px;margin:auto;padding:32px;font-family:Arial,sans-serif;color:#13223a"><h1 style="font-family:Georgia,serif">Tu compra fue confirmada</h1><p>Ya podés acceder a Método Entrevista y los cinco ebooks incluidos:</p>${accessButton}<ul style="padding-left:20px">${list}</ul><p style="margin-top:28px;color:#5f6b7d">Guardá este correo. Si necesitás ayuda, escribinos a <a href="mailto:${contactEmail}">${contactEmail}</a>.</p></div>`,
  })
}

async function claimDelivery(orderId) {
  return withStore((orders) => {
    const order = orders[orderId]
    if (!order || order.deliveredAt) return null
    const sendingStarted = order.sendingAt ? Date.parse(order.sendingAt) : 0
    if (sendingStarted && Date.now() - sendingStarted < 10 * 60 * 1000) return null
    order.status = 'approved'
    order.sendingAt = new Date().toISOString()
    order.updatedAt = order.sendingAt
    return { ...order }
  })
}

async function processApprovedPayment(paymentId) {
  const { payment: paymentClient } = mercadoPagoClients()
  const payment = await paymentClient.get({ id: paymentId })
  const orderId = payment.external_reference
  if (!orderId) return
  const order = await getOrder(orderId)
  if (!order) return

  const amountMatches = Number(payment.transaction_amount) === productPrice
  const currencyMatches = payment.currency_id === productCurrency
  if (payment.status !== 'approved' || !amountMatches || !currencyMatches) {
    await updateOrder(orderId, { status: payment.status || 'unknown', paymentId: String(payment.id || paymentId) })
    return
  }

  const delivery = await claimDelivery(orderId)
  if (!delivery) return
  try {
    await sendEbooks(delivery)
    await updateOrder(orderId, {
      status: 'approved',
      paymentId: String(payment.id || paymentId),
      deliveredAt: new Date().toISOString(),
      sendingAt: null,
    })
  } catch (error) {
    await updateOrder(orderId, { deliveryError: error.message, sendingAt: null })
    throw error
  }
}

const checkoutRequests = new Map()
function checkoutRateLimit(req, res, next) {
  const now = Date.now()
  const attempts = (checkoutRequests.get(req.ip) || []).filter((time) => now - time < 10 * 60 * 1000)
  if (attempts.length >= 10) return res.status(429).json({ error: 'Demasiados intentos. Esperá unos minutos.' })
  attempts.push(now)
  checkoutRequests.set(req.ip, attempts)
  next()
}

app.post('/api/checkout', checkoutRateLimit, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Ingresá un correo válido.' })

    const baseUrl = publicUrl()
    const orderId = crypto.randomUUID()
    const statusToken = crypto.randomBytes(24).toString('hex')
    const returnQuery = `order=${encodeURIComponent(orderId)}&token=${encodeURIComponent(statusToken)}`
    const { preference } = mercadoPagoClients()
    const result = await preference.create({
      body: {
        items: [{ id: 'metodo-entrevista-pack', title: 'Método Entrevista + 5 ebooks', quantity: 1, currency_id: productCurrency, unit_price: productPrice }],
        payer: { email },
        external_reference: orderId,
        metadata: { order_id: orderId },
        back_urls: {
          success: `${baseUrl}/?purchase=success&${returnQuery}`,
          pending: `${baseUrl}/?purchase=pending&${returnQuery}`,
          failure: `${baseUrl}/?purchase=failure&${returnQuery}`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        statement_descriptor: 'METODO ENTREVISTA',
      },
      requestOptions: { idempotencyKey: orderId },
    })

    await saveOrder({
      id: orderId,
      email,
      statusToken,
      status: 'created',
      preferenceId: result.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return res.status(201).json({ checkoutUrl: result.init_point })
  } catch (error) {
    console.error('No se pudo crear la compra:', error)
    return res.status(503).json({ error: 'No pudimos iniciar el pago. Intentá nuevamente en unos minutos.' })
  }
})

app.post('/api/mercadopago/webhook', (req, res) => {
  const dataId = req.query['data.id'] || req.body?.data?.id
  const notificationType = req.query.type || req.body?.type
  try {
    if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) throw new Error('Falta MERCADOPAGO_WEBHOOK_SECRET.')
    WebhookSignatureValidator.validate({
      xSignature: req.headers['x-signature'],
      xRequestId: req.headers['x-request-id'],
      dataId,
      secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      toleranceSeconds: 300,
    })
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) return res.sendStatus(401)
    console.error('Webhook no configurado:', error)
    return res.sendStatus(503)
  }

  res.sendStatus(200)
  if (notificationType === 'payment' && dataId) {
    processApprovedPayment(String(dataId)).catch((error) => console.error('Error procesando el pago:', error))
  }
})

app.get('/api/orders/:orderId/status', async (req, res) => {
  const order = await getOrder(req.params.orderId)
  if (!order || req.query.token !== order.statusToken) return res.status(404).json({ error: 'Compra no encontrada.' })
  return res.json({ status: order.status, delivered: Boolean(order.deliveredAt) })
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

const distDirectory = path.join(projectRoot, 'dist')
app.use('/assets', express.static(path.join(distDirectory, 'assets'), { maxAge: '1y', immutable: true }))
app.use(express.static(distDirectory, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache')
  },
}))
app.get(/^(?!\/api).*/, (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  return res.sendFile(path.join(distDirectory, 'index.html'))
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Ocurrió un error inesperado.' })
})

app.listen(port, host, () => console.log(`Método Entrevista disponible en http://${host}:${port}`))
