import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle, Check, CheckCircle2, ChevronDown, LoaderCircle,
  LockKeyhole, Mail, MonitorSmartphone, ShieldCheck, X,
} from 'lucide-react'
import './App.css'

const getOfferDay = () => new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  timeZone: 'America/Argentina/Buenos_Aires',
}).format(new Date()).toUpperCase()
const getInitialPaymentNotice = () => {
  const params = new URLSearchParams(window.location.search)
  const purchase = params.get('purchase')
  if (!purchase) return null
  if (purchase === 'failure' || !params.get('order') || !params.get('token')) return { status: 'failure', delivered: false }
  return { status: purchase === 'pending' ? 'pending' : 'checking', delivered: false }
}
const tickerItems = Array.from({ length: 8 }, (_, index) => index)
const metaProduct = {
  content_ids: ['cv-resultados-reales'],
  content_name: 'CV para resultados reales + 2 ebooks de regalo',
  content_type: 'product',
  currency: 'ARS',
  value: 14900,
}

const getCookie = (name) => document.cookie.split('; ').find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1) || null

function initializeMetaPixel(pixelId) {
  if (!pixelId || window.__metodoEntrevistaMetaPixel) return
  const fbq = window.fbq || function metaPixelQueue(...args) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue.push(args)
  }
  if (!window.fbq) {
    window.fbq = fbq
    window._fbq = fbq
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }
  window.fbq('init', pixelId)
  window.__metodoEntrevistaMetaPixel = pixelId
}

function trackMetaEvent(name, data, eventId) {
  if (!window.fbq) return
  if (eventId) window.fbq('track', name, data || {}, { eventID: eventId })
  else if (data) window.fbq('track', name, data)
  else window.fbq('track', name)
}

const programSteps = [
  ['01', 'Encontrá tu objetivo de postulación', 'Elegí la vacante concreta a la que querés aplicar para trabajar con una dirección clara.'],
  ['02', 'Compartí la vacante y tu información con la IA', 'Ingresá los requisitos del empleo junto con tu experiencia, estudios y habilidades relevantes.'],
  ['03', 'Usá los prompts adecuados', 'Aplicá instrucciones listas para adaptar el contenido y crear un CV específico para esa oportunidad.'],
  ['04', 'Revisá el CV contra filtros ATS', 'Comprobá su estructura, palabras clave y aspectos importantes, y corregí lo que pueda frenarlo.'],
  ['05', 'Descargá tu nuevo CV en PDF', 'Guardá una versión profesional, ordenada y personalizada, lista para compartir.'],
  ['06', 'Postulate al empleo', 'Enviá el CV creado especialmente para esa vacante y completá tu postulación.'],
  ['07', 'Repetí el proceso con cada vacante', 'Volvé a usar el método para generar nuevas versiones sin empezar otra vez desde cero.'],
]

const faqs = [
  ['¿Cómo recibo los ebooks?', 'Después de acreditarse el pago vas a recibir en tu correo el acceso a CV para resultados reales, LinkedIn desde cero y Preparación para entrevistas. Podrás abrirlos y guardarlos.'],
  ['¿Sirve si nunca hice un CV?', 'Sí. El contenido empieza desde una hoja en blanco y explica cada sección de manera simple, sin asumir conocimientos previos.'],
  ['¿Y si ya tengo experiencia o un CV armado?', 'También sirve. Vas a aprender a revisar lo que ya tenés, destacar resultados y adaptar el contenido a cada vacante.'],
  ['¿Necesito pagar una herramienta de inteligencia artificial?', 'No. El método está pensado para utilizar opciones gratuitas. No necesitás contratar suscripciones ni programas adicionales.'],
  ['¿Sirve para cualquier edad?', 'Sí. La lógica de construcción y adaptación se puede aplicar en diferentes etapas laborales, con poca o mucha experiencia.'],
  ['¿Qué son los filtros ATS?', 'Son sistemas que algunas empresas utilizan para ordenar y leer postulaciones. El ebook explica cómo preparar un CV claro y compatible, sin prometer resultados automáticos.'],
  ['¿Qué ebooks están incluidos de regalo?', 'Por tiempo limitado recibís LinkedIn desde cero, valuado en $12.000, y Preparación para entrevistas, valuado en $7.000, sin costo adicional.'],
  ['¿Es un pago único?', 'Sí. Pagás una vez y conservás el acceso a los materiales, sin abonos mensuales.'],
  ['¿El ebook garantiza que voy a conseguir trabajo?', 'No. Ningún material puede garantizar una contratación. CV para resultados reales te enseña a presentar mejor tu perfil y postularte con una estrategia más clara.'],
]

function BuyButton({ children = 'Quiero recibir el kit completo', inverse = false, onClick }) {
  return (
    <button className={`buy-button ${inverse ? 'button-inverse' : ''}`} type="button" onClick={onClick}>
      <span>{children}</span>
    </button>
  )
}

function App() {
  const [offerDay, setOfferDay] = useState(getOfferDay)
  const [showMobileBuy, setShowMobileBuy] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutEmail, setCheckoutEmail] = useState('')
  const [checkoutState, setCheckoutState] = useState({ status: 'idle', message: '' })
  const [paymentNotice, setPaymentNotice] = useState(getInitialPaymentNotice)
  const [metaConfig, setMetaConfig] = useState({ pixelId: null })
  const [approvedPurchaseEventId, setApprovedPurchaseEventId] = useState(null)
  const heroBuyRef = useRef(null)
  const metaPageTrackedRef = useRef(false)

  useEffect(() => {
    let stopped = false
    fetch('/api/config')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((config) => { if (!stopped) setMetaConfig({ pixelId: config.metaPixelId || null }) })
      .catch(() => { if (!stopped) setMetaConfig({ pixelId: null }) })
    return () => { stopped = true }
  }, [])

  useEffect(() => {
    if (!metaConfig.pixelId || metaPageTrackedRef.current) return
    initializeMetaPixel(metaConfig.pixelId)
    trackMetaEvent('PageView')
    trackMetaEvent('ViewContent', metaProduct)
    metaPageTrackedRef.current = true
  }, [metaConfig.pixelId])

  useEffect(() => {
    if (!approvedPurchaseEventId || !metaConfig.pixelId) return
    const storageKey = `meta_purchase_${approvedPurchaseEventId}`
    try {
      if (window.localStorage.getItem(storageKey)) return
      initializeMetaPixel(metaConfig.pixelId)
      trackMetaEvent('Purchase', metaProduct, approvedPurchaseEventId)
      window.localStorage.setItem(storageKey, 'sent')
    } catch {
      initializeMetaPixel(metaConfig.pixelId)
      trackMetaEvent('Purchase', metaProduct, approvedPurchaseEventId)
    }
  }, [approvedPurchaseEventId, metaConfig.pixelId])

  useEffect(() => {
    const refreshOfferDay = window.setInterval(() => setOfferDay(getOfferDay()), 30000)
    return () => window.clearInterval(refreshOfferDay)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const purchase = params.get('purchase')
    const orderId = params.get('order')
    const token = params.get('token')
    if (!purchase || purchase === 'failure' || !orderId || !token) return undefined

    let stopped = false
    let attempts = 0
    let timeout
    const checkOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status?token=${encodeURIComponent(token)}`)
        if (!response.ok) throw new Error('No se pudo consultar la compra.')
        const order = await response.json()
        if (stopped) return
        if (order.status === 'approved') {
          if (order.purchaseEventId) setApprovedPurchaseEventId(order.purchaseEventId)
          setPaymentNotice({ status: 'approved', delivered: order.delivered })
          return
        }
        if (['rejected', 'cancelled'].includes(order.status)) {
          setPaymentNotice({ status: 'failure', delivered: false })
          return
        }
        attempts += 1
        if (attempts >= 24) {
          setPaymentNotice({ status: 'pending', delivered: false })
          return
        }
        timeout = window.setTimeout(checkOrder, 2500)
      } catch {
        if (!stopped) setPaymentNotice({ status: 'pending', delivered: false })
      }
    }
    checkOrder()
    return () => {
      stopped = true
      window.clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    let animationFrame
    const updateMobileBuy = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        const heroBuy = heroBuyRef.current
        const isMobile = window.matchMedia('(max-width: 600px)').matches
        setShowMobileBuy(Boolean(isMobile && heroBuy && heroBuy.getBoundingClientRect().bottom < 42))
      })
    }
    updateMobileBuy()
    window.addEventListener('scroll', updateMobileBuy, { passive: true })
    window.addEventListener('resize', updateMobileBuy)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', updateMobileBuy)
      window.removeEventListener('resize', updateMobileBuy)
    }
  }, [])

  const openCheckout = () => {
    setCheckoutState({ status: 'idle', message: '' })
    setCheckoutOpen(true)
  }

  const closePaymentNotice = () => {
    setPaymentNotice(null)
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`)
  }

  const startCheckout = async (event) => {
    event.preventDefault()
    setCheckoutState({ status: 'loading', message: '' })
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: checkoutEmail,
          fbp: getCookie('_fbp'),
          fbc: getCookie('_fbc'),
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || 'No pudimos iniciar el pago.')
      trackMetaEvent('InitiateCheckout', { ...metaProduct, num_items: 1 }, result.orderId ? `checkout-${result.orderId}` : undefined)
      window.location.assign(result.checkoutUrl)
    } catch (error) {
      setCheckoutState({ status: 'error', message: error.message })
    }
  }

  return (
    <main>
      <div className="offer-strip" aria-label={`Oferta de hoy ${offerDay}: 50% de descuento y dos ebooks de regalo`}>
        <div className="ticker-track">
          {tickerItems.map((item) => (
            <div className="ticker-item" key={item} aria-hidden={item > 0}>
              <span className="ticker-fire">🔥</span>
              <span>OFERTA DE HOY</span>
              <strong>{offerDay}</strong>
              <span className="strip-dot">•</span>
              <span>50% OFF + 2 EBOOKS DE REGALO</span>
              <span className="ticker-gift">🎁</span>
              <span className="strip-dot">•</span>
              <span>ACCESO INMEDIATO</span>
            </div>
          ))}
        </div>
      </div>

      <section className="cv2-hero relative isolate">
        <div className="section-shell cv2-hero-grid">
          <div className="cv2-copy">
            <p className="eyebrow">NECESITAS UN CV PARA CADA POSTULACIÓN.</p>
            <h1>La guía para crear<strong>CV´s para cada empleo en segundos.</strong></h1>
            <p className="cv2-lead">Aprendé a generar una versión personalizada para cada empleo al que quieras postularte, usando herramientas simples y gratuitas.</p>

            <div className="cv2-social-proof"><span aria-hidden="true"></span><strong>+457</strong> ya saben crear CV en segundos</div>

            <div className="cv2-highlight" aria-label="A quién está dirigida la guía">
              <span><Check />No importa tu edad</span>
              <span><Check />Con mucha o poca experiencia</span>
              <span><Check />Fácil y rápido</span>
            </div>

            <p className="cv2-includes"><b>Todo explicado dentro de la guía:</b> IA gratuita, adaptación del contenido, filtros ATS, diseños y enlaces directos para buscar trabajo. Sin aplicaciones pagas ni costos extra.</p>

            <div className="cv2-buy-row">
              <div className="cv-price-row"><div><small>Precio habitual</small><del>$29.900</del></div><div><small>OFERTA DE HOY</small><strong>$14.900</strong></div><span>50% OFF</span></div>
              <div className="cv-hero-action" ref={heroBuyRef}><BuyButton onClick={openCheckout}>Comprar por Mercado Pago</BuyButton></div>
            </div>
            <div className="cv2-trust"><span><Check />Pago por Mercado Pago</span><span><Check />Acceso de por vida</span><span><Check />2 ebooks de regalo</span></div>
          </div>

          <div className="cv2-visual" role="img" aria-label="CV para resultados reales con LinkedIn desde cero y Preparación para entrevistas">
            <img src="/cv-productos-hero.png" alt="" width="1536" height="1536" decoding="async" />
            <span className="cv2-float-tag tag-ats">Filtros ATS</span>
            <span className="cv2-float-tag tag-ia">Prompts IA</span>
            <span className="cv2-float-tag tag-fast">Fácil y rápido</span>
            <span className="cv2-float-tag tag-all">Para todos</span>
            <span className="cv2-float-tag tag-noexp">Sin experiencia</span>
            <span className="cv2-float-tag tag-custom">CV personalizado</span>
          </div>
        </div>
      </section>

      <section className="cv-pain-section">
        <div className="section-shell">
          <div className="cv-pain-heading">
            <p className="eyebrow">EL PROBLEMA NO ES TU EXPERIENCIA</p>
            <h2>¿Por qué la guía<br /><em>es tan efectiva?</em></h2>
            <p className="parrafo-uno">Porque corrige lo que está haciendo que no te entrevisten.<span aria-hidden="true">↓</span></p>
          </div>

          <div className="cv-pain-grid">
            <figure className="cv-pain-example">
              <div className="cv-pain-image">
                <img src="/cv-generico-ejemplo.jpg" alt="Ejemplo ilustrativo de un currículum genérico con diseño complejo" width="600" height="800" loading="lazy" decoding="async" />
                <span><X aria-hidden="true" />CV GENÉRICO</span>
              </div>
              <figcaption><strong>NUNCA USES ESTAS PLANTILLAS</strong><p>Pueden verse atractivos, pero su estructura compleja dificulta la lectura automática y no se adapta a cada vacante.</p></figcaption>
            </figure>

            <div className="cv-pain-points">
              <article><span>x</span><div><h3>Los filtros ATS te descartan</h3><p>Sin una estructura y palabras clave adecuadas, tu CV puede quedar afuera antes de que lo lea una persona.</p></div></article>
              <article><span>x</span><div><h3>Tener un unico CV general</h3><p>Enviar siempre el mismo documento ignora lo que cada empresa y cada propuesta están buscando.</p></div></article>
              <article><span>x</span><div><h3>No conocer las herramientas</h3><p>Vas a aprender qué opciones gratuitas usar para crear y adaptar tus versiones sin pagar aplicaciones extra.</p></div></article>
              <article><span>x</span><div><h3>Presentas mal tu experiencia</h3><p>Tengas mucha o poca información, la diferencia está en cómo la ordenás, la explicás y la enfocás.</p></div></article>
              <article className="cv-pain-solution"><span>05</span><div><h3>La IA se convierte en tu aliada</h3><p>Usada correctamente, de forma gratuita te permite personalizar cada CV en segundos y aumentar tus posibilidades de conseguir empleo.</p></div></article>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-bonus-section" id="ebooks-incluidos">
        <div className="section-shell">
          <div className="section-heading centered-heading light-heading"><p className="eyebrow">UNA COMPRA · TRES RECURSOS</p><h2>El CV es el centro.<br /><em>Los regalos completan tu recorrido.</em></h2><p>Primero conseguí una presentación sólida. Después fortalecé tu perfil en LinkedIn y preparate para cuando llegue la entrevista.</p></div>
          <div className="cv-bonus-grid">
            <article className="cv-bonus-main"><span>PRODUCTO PRINCIPAL</span><div className="cv-bonus-main-image"><img src="/cv-resultados-book-realista.png" alt="Libro CV para resultados reales" width="1214" height="1295" loading="lazy" decoding="async" /></div><div><h3>Todo lo necesario para crear y adaptar tu CV</h3><p>Desde cero, con ATS, IA gratuita, portales de empleo y un sistema reutilizable.</p><div className="cv-card-price cv-main-price"><small>VALOR HABITUAL</small><div><del>$29.900</del><strong>50% OFF</strong></div></div></div></article>
            <article className="cv-bonus-card"><span>REGALO 1</span><img src="/ebook-linkedin-tapa-blanda.png" alt="LinkedIn desde cero" width="1536" height="1024" loading="lazy" decoding="async" /><div><h3>LinkedIn desde cero</h3><p>Armá tu perfil y aprendé una rutina simple para desarrollar tu presencia profesional.</p><div className="cv-card-price cv-free-price"><del>$12.000</del><strong>GRATIS</strong></div></div></article>
            <article className="cv-bonus-card"><span>REGALO 2</span><img src="/ebook-entrevistas-tapa-blanda.png" alt="Preparación para entrevistas" width="1536" height="1024" loading="lazy" decoding="async" /><div><h3>Preparación para entrevistas</h3><p>Ordená tus respuestas y preparate mejor para contar lo que sabés hacer.</p><div className="cv-card-price cv-free-price"><del>$7.000</del><strong>GRATIS</strong></div></div></article>
          </div>
          <div className="cv-value-box"><div><small>VALOR TOTAL DE LOS 3 EBOOKS</small><del>$48.900</del></div><div><small>HOY, EN UN SOLO PAGO</small><strong>$14.900</strong><span>AHORRÁS $34.000</span></div><BuyButton onClick={openCheckout}>Acceder a la oferta</BuyButton></div>
        </div>
      </section>

      <section className="cv-program-section section-shell">
        <div className="section-heading centered-heading"><p className="eyebrow">DE LA HOJA EN BLANCO A TU PRÓXIMA POSTULACIÓN</p><h2>Lo vas a hacer paso a paso.<br /><em>Y después vas a poder repetirlo.</em></h2></div>
        <div className="cv-program-list">{programSteps.map(([number, title, text]) => <article key={number}><strong>{number}</strong><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
      </section>

      <section className="delivery-section">
        <div className="section-shell">
          <div className="section-heading centered-heading"><p className="eyebrow">COMPRA SIMPLE · ACCESO DIGITAL</p><h2>Comprás una vez.<br /><em>Recibís los 3 ebooks en tu correo.</em></h2><p>El proceso es sencillo y podés acceder a los materiales desde el dispositivo que ya usás todos los días.</p></div>
          <div className="delivery-flow">
            <article><span><ShieldCheck aria-hidden="true" /></span><small>PASO 1</small><h3>Pagás de forma segura</h3><p>Realizás un único pago protegido a través de Mercado Pago.</p></article>
            <article><span><Mail aria-hidden="true" /></span><small>PASO 2</small><h3>Te llega todo por correo</h3><p>Recibís el acceso a CV para resultados reales y a los dos ebooks de regalo.</p></article>
            <article><span><MonitorSmartphone aria-hidden="true" /></span><small>PASO 3</small><h3>Lo ves donde quieras</h3><p>Podés leerlo desde tu celular, tablet, notebook o computadora.</p></article>
          </div>
          <div className="cv-device-note"><MonitorSmartphone /><div><span>ACCESO DIGITAL Y DE POR VIDA</span><strong>Leé, aplicá y volvé a consultar los materiales cada vez que quieras adaptar tu CV.</strong></div></div>
        </div>
      </section>

      <section className="faq-section section-shell">
        <div className="section-heading centered-heading"><p className="eyebrow">PREGUNTAS FRECUENTES</p><h2>Todo lo que necesitás saber<br /><em>antes de empezar.</em></h2></div>
        <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="checkout-section" id="comprar">
        <div className="section-shell checkout-card relative overflow-hidden">
          <div className="checkout-copy"><p className="eyebrow">OFERTA DE HOY {offerDay}</p><h2>Dejá de enviar el mismo CV.<br /><em>Aprendé a adaptarlo a cada oportunidad.</em></h2><p>Recibí CV para resultados reales más LinkedIn desde cero y Preparación para entrevistas.</p>
            <ul><li><Check />3 ebooks digitales</li><li><Check />IA gratuita, sin gastos extra</li><li><Check />Acceso inmediato y de por vida</li></ul>
          </div>
          <div className="checkout-box"><span>OFERTA POR TIEMPO LIMITADO</span><del>$29.900</del><strong>$14.900</strong><small>Pago único · Ahorrás $15.000</small><div className="checkout-bonus">+ 2 EBOOKS GRATIS COMPRANDO AHORA</div><BuyButton inverse onClick={openCheckout}>Comprar ahora con Mercado Pago</BuyButton><p><LockKeyhole size={14} /> Pago protegido por Mercado Pago</p></div>
        </div>
      </section>

      <footer>
        <div className="section-shell footer-inner">
          <div className="footer-brand"><strong>CV PARA RESULTADOS REALES</strong><p>Herramientas claras para crear, adaptar y mejorar tu currículum.</p></div>
          <div className="footer-contact"><span>CONTACTO Y RECLAMOS</span><a href="mailto:valeriafursten@gmail.com"><Mail aria-hidden="true" />valeriafursten@gmail.com</a></div>
          <div className="footer-bottom"><p>© {new Date().getFullYear()} Valeria Fursten</p><small>CV para resultados reales brinda herramientas de orientación y preparación profesional. Los resultados pueden variar según la experiencia, el mercado laboral y la implementación de cada persona. No se garantiza la obtención de entrevistas ni de empleo. Este sitio utiliza herramientas de Meta para medir visitas, inicios de compra y compras confirmadas.</small></div>
        </div>
      </footer>

      {checkoutOpen && <div className="purchase-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && checkoutState.status !== 'loading') setCheckoutOpen(false) }}>
        <section className="purchase-dialog" role="dialog" aria-modal="true" aria-labelledby="purchase-title">
          <button className="modal-close" type="button" aria-label="Cerrar" disabled={checkoutState.status === 'loading'} onClick={() => setCheckoutOpen(false)}><X /></button>
          <span className="modal-kicker">ÚLTIMO PASO ANTES DE PAGAR</span>
          <h2 id="purchase-title">¿A qué correo enviamos tus ebooks?</h2>
          <p>Escribí un correo al que tengas acceso. Ahí vas a recibir CV para resultados reales y los dos ebooks de regalo cuando Mercado Pago confirme la compra.</p>
          <div className="modal-order-summary" aria-label="Resumen de tu compra">
            <strong>Esto es todo lo que te llevás</strong>
            <div className="modal-summary-row"><span>CV para resultados reales</span><span><del>$29.900</del> <b>$14.900</b></span></div>
            <div className="modal-summary-row"><span>LinkedIn + Entrevistas</span><span><del>$19.000</del> <b>GRATIS</b></span></div>
            <div className="modal-summary-total"><span>Total a pagar</span><strong>$14.900</strong></div>
          </div>
          <form onSubmit={startCheckout}>
            <label htmlFor="checkout-email">Tu correo electrónico</label>
            <div className="email-field"><Mail aria-hidden="true" /><input id="checkout-email" type="email" autoComplete="email" required maxLength="254" placeholder="nombre@correo.com" value={checkoutEmail} onChange={(event) => setCheckoutEmail(event.target.value)} /></div>
            {checkoutState.status === 'error' && <div className="modal-error"><AlertCircle aria-hidden="true" />{checkoutState.message}</div>}
            <button className="modal-pay-button" type="submit" disabled={checkoutState.status === 'loading'}>{checkoutState.status === 'loading' ? <><LoaderCircle className="spin" />Preparando tu compra…</> : <>Continuar a Mercado Pago</>}</button>
          </form>
          <div className="modal-trust"><span><ShieldCheck />Compra protegida por Mercado Pago</span><span><LockKeyhole />Un solo pago de $14.900</span></div>
          <p className="purchase-help">¿Problemas con la compra? <a href="mailto:valeriafursten@gmail.com">Escribime a valeriafursten@gmail.com</a></p>
          <small>Usaremos este correo únicamente para gestionar tu compra y enviarte los materiales.</small>
        </section>
      </div>}

      {paymentNotice && <div className="purchase-modal payment-modal" role="presentation">
        <section className="purchase-dialog payment-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-status-title">
          <button className="modal-close" type="button" aria-label="Cerrar" onClick={closePaymentNotice}><X /></button>
          {paymentNotice.status === 'approved' ? <CheckCircle2 className="status-icon status-success" /> : paymentNotice.status === 'failure' ? <AlertCircle className="status-icon status-error" /> : <LoaderCircle className="status-icon status-pending spin" />}
          <h2 id="payment-status-title">{paymentNotice.status === 'approved' ? '¡Pago confirmado!' : paymentNotice.status === 'failure' ? 'El pago no se completó' : paymentNotice.status === 'checking' ? 'Estamos confirmando tu pago' : 'Tu pago está pendiente'}</h2>
          <p>{paymentNotice.status === 'approved' ? paymentNotice.delivered ? 'Tus tres ebooks ya fueron enviados al correo que ingresaste. Revisá también la carpeta de spam o promociones.' : 'Tus ebooks están en proceso de envío. En unos momentos los vas a recibir en el correo que ingresaste.' : paymentNotice.status === 'failure' ? 'No se realizó ningún envío. Podés volver a intentarlo cuando quieras.' : 'Mercado Pago todavía está procesando la operación. Cuando quede aprobada, enviaremos automáticamente los tres ebooks a tu correo.'}</p>
          <button className="modal-secondary-button" type="button" onClick={closePaymentNotice}>{paymentNotice.status === 'failure' ? 'Volver a la página' : 'Entendido'}</button>
        </section>
      </div>}

      {showMobileBuy && <div className="mobile-buy"><button type="button" onClick={openCheckout}>Comprar por $14.900</button></div>}
    </main>
  )
}

export default App
