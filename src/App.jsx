import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle, ArrowRight, AtSign, Check, CheckCircle2, ChevronDown, LoaderCircle,
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

const guides = [
  {
    kicker: 'GUÍA PRINCIPAL · DE PRINCIPIO A FIN', title: 'Método\nEntrevista', image: '/ebook-metodo-entrevista-tapa-blanda.png',
    description: 'El recorrido completo, explicado paso a paso: desde decidir qué trabajo buscar y preparar cómo vas a presentarte, hasta enviar postulaciones, hacer seguimiento y afrontar una entrevista con mayor preparación.',
    points: ['Definir qué trabajo buscar y organizar tu plan', 'Preparar tu CV, perfil y presentación', 'Postularte y hacer seguimiento sin perder oportunidades', 'Prepararte para la entrevista y los próximos pasos'],
  },
  {
    kicker: 'EBOOK INCLUIDO', title: 'CV listo para\npostularte', image: '/ebook-cv-listo-tapa-blanda.png', value: '$8.000',
    description: 'Aprendé a preparar un CV claro, estratégico y adaptado a las búsquedas laborales actuales.',
    points: ['Explicación y aplicación de filtros ATS', 'Adaptar tu CV a cada trabajo', 'Modelos y diseños estratégicos'],
  },
  {
    kicker: 'EBOOK INCLUIDO', title: 'IA aplicada a\nconseguir empleo', image: '/ebook-ia-trabajo-tapa-blanda.png', value: '$12.000',
    description: 'Usá herramientas gratuitas de inteligencia artificial para ahorrar tiempo y organizar mejor tu búsqueda.',
    points: ['Qué herramientas de IA gratuitas usar', 'Mensajes listos para copiar y enviar a la IA', 'Funciones para acelerar tu búsqueda laboral'],
  },
  {
    kicker: 'EBOOK INCLUIDO', title: 'LinkedIn\ndesde cero', image: '/ebook-linkedin-tapa-blanda.png', value: '$14.000',
    description: 'Creá tu perfil desde cero de manera fácil y empezá a crecer sin pagar publicidad.',
    points: ['Crear tu perfil paso a paso, fácil y rápido', 'Conseguir contactos orgánicos en poco tiempo', 'Plan de 15 minutos al día para crecer'],
  },
  {
    kicker: 'EBOOK INCLUIDO', title: 'Guía de\nempleos', image: '/ebook-donde-buscar-tapa-blanda.png', value: '$5.000',
    description: 'Ampliá tu búsqueda con páginas, empresas y lugares concretos donde encontrar oportunidades.',
    points: ['Portales de trabajo', 'Páginas de empresas', 'Cómo reconocer avisos dudosos'],
  },
  {
    kicker: 'EBOOK INCLUIDO', title: 'Preparación para\nentrevistas', image: '/ebook-entrevistas-tapa-blanda.png', value: '$7.000',
    description: 'Llegá al llamado con respuestas pensadas y más seguridad para contar lo que sabés hacer.',
    points: ['Preguntas frecuentes', 'Ejemplos de respuestas', 'Qué hacer antes y después'],
  },
]

const exampleReviews = [
  { name: 'Camila Benítez', age: 27, initials: 'CB', message: 'Me ayudó a ordenar mi búsqueda y entender qué tenía que cambiar en mi CV sin palabras complicadas.' },
  { name: 'Julián Romero', age: 34, initials: 'JR', message: 'LinkedIn siempre me parecía difícil. Con la guía pude armar mi perfil y empezar a generar contactos con un plan claro.' },
  { name: 'Mariana López', age: 42, initials: 'ML', message: 'Lo que más me sirvió fue tener ejemplos concretos para adaptar el CV y prepararme antes de una entrevista.' },
  { name: 'Lucía Ferreyra', age: 30, initials: 'LF', message: 'Pude dejar de mandar siempre el mismo currículum y aprendí una forma sencilla de adaptarlo a cada búsqueda.' },
  { name: 'Pablo Medina', age: 38, initials: 'PM', message: 'La parte de inteligencia artificial está explicada desde cero y me dio ideas concretas para practicar respuestas.' },
  { name: 'Rocío Álvarez', age: 24, initials: 'RA', message: 'Me gustó tener todas las páginas y pasos en un solo lugar. Antes no sabía por dónde empezar a buscar.' },
  { name: 'Sergio Duarte', age: 46, initials: 'SD', message: 'Las explicaciones son directas. Pude revisar mi experiencia y presentarla de una manera mucho más clara.' },
  { name: 'Natalia Acosta', age: 32, initials: 'NA', message: 'El plan de LinkedIn me resultó fácil de seguir y me ayudó a entender cómo crear contactos sin pagar publicidad.' },
  { name: 'Martín Sosa', age: 29, initials: 'MS', message: 'Las preguntas de entrevista y los ejemplos me sirvieron para practicar y llegar con las ideas más ordenadas.' },
]

const faqs = [
  ['¿Cómo recibo las guías?', 'Después de acreditarse el pago vas a recibir el acceso en el correo que uses para comprar. Podrás abrir y guardar todos los materiales.'],
  ['¿Puedo hacerlo desde el celular?', 'Sí. Las guías están pensadas para leerse desde el celular y los pasos indican qué herramientas usar. Para editar ciertos modelos de CV también podés utilizar una computadora si tenés acceso a una.'],
  ['¿Necesito saber usar LinkedIn o inteligencia artificial?', 'No. Ambos materiales empiezan desde cero, con explicaciones sencillas y ejemplos para seguir paso a paso.'],
  ['¿Sirve si tengo poca experiencia?', 'Sí. Incluye formas de mostrar estudios, tareas, trabajos informales y habilidades sin inventar información.'],
  ['¿Es un pago único?', 'Sí. Pagás una vez y conservás el acceso a los materiales, sin abonos mensuales.'],
  ['¿Método Entrevista garantiza que voy a conseguir trabajo?', 'No. Ninguna guía puede garantizar una contratación. Método Entrevista te ayuda a mejorar cómo te presentás, ampliar tu búsqueda y prepararte mejor para aumentar tus posibilidades.'],
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
  const reviewsTrackRef = useRef(null)
  const reviewsPausedRef = useRef(false)
  const heroBuyRef = useRef(null)

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
        body: JSON.stringify({ email: checkoutEmail }),
      })
      const result = await response.json()
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || 'No pudimos iniciar el pago.')
      window.location.assign(result.checkoutUrl)
    } catch (error) {
      setCheckoutState({ status: 'error', message: error.message })
    }
  }

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let animationFrame
    let previousTime = performance.now()
    let autoPosition = reviewsTrackRef.current?.scrollLeft || 0
    const animateReviews = (currentTime) => {
      const track = reviewsTrackRef.current
      const elapsed = Math.min(currentTime - previousTime, 50)
      previousTime = currentTime
      if (track && !reviewsPausedRef.current && !document.hidden) {
        const loopStart = track.querySelector('[data-loop-start]')?.offsetLeft
        autoPosition += 24 * (elapsed / 1000)
        if (loopStart && autoPosition >= loopStart) autoPosition -= loopStart
        track.scrollLeft = autoPosition
      } else if (track) {
        autoPosition = track.scrollLeft
      }
      animationFrame = window.requestAnimationFrame(animateReviews)
    }
    animationFrame = window.requestAnimationFrame(animateReviews)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [])

  return (
    <main>
      <div className="offer-strip" aria-label={`Oferta de hoy ${offerDay}: 55% de descuento y 5 ebooks de regalo`}>
        <div className="ticker-track">
          {tickerItems.map((item) => (
            <div className="ticker-item" key={item} aria-hidden={item > 0}>
              <span className="ticker-fire">🔥</span>
              <span>OFERTA DE HOY</span>
              <strong>{offerDay}</strong>
              <span className="strip-dot">•</span>
              <span>55% OFF + 5 EBOOKS DE REGALO</span>
              <span className="ticker-gift">🎁</span>
              <span className="strip-dot">•</span>
              <span>ACCESO INMEDIATO</span>
            </div>
          ))}
        </div>
      </div>

      <section className="hero relative isolate">
        <div className="hero-background" aria-hidden="true"><img src="/metodo-entrevista-6-guias-v2.png" alt="" /></div>
        <div className="hero-photo-ribbon"><span>SOLO POR HOY {offerDay}</span><strong>5 EBOOKS EXTRA GRATIS</strong></div>
        <div className="hero-orb hero-orb-one" aria-hidden="true"></div>
        <div className="hero-orb hero-orb-two" aria-hidden="true"></div>
        <div className="hero-inner section-shell">
          <div className="hero-copy relative z-10">
            <p className="eyebrow">TU BÚSQUEDA LABORAL, CON UN PLAN CLARO</p>
            <h1><span>Método Entrevista</span><em>La guía para conseguir ese trabajo.</em></h1>
            <p className="hero-lead">Un recorrido simple y paso a paso para mejorar cómo te presentás, encontrar más oportunidades y llegar mejor preparado cuando te llamen.</p>
            <div className="hero-bundle-chip"><span>OFERTA DE HOY</span><strong>Incluye 5 ebooks extra GRATIS</strong></div>
            <ul className="hero-benefits">
              <li><Check aria-hidden="true" /> Desde el primer paso hasta la entrevista</li>
              <li><Check aria-hidden="true" /> CV, IA, LinkedIn y lugares donde buscar</li>
              <li><Check aria-hidden="true" /> Fácil de entender, incluso desde tu celular</li>
            </ul>
            <div className="price-offer">
              <div className="regular-price"><span>Precio habitual</span><del>$19.990</del></div>
              <div className="launch-price"><span>OFERTA DE HOY {offerDay}</span><strong>$8.990</strong></div>
              <div className="saving-pill">AHORRÁS $11.000</div>
            </div>
            <div className="hero-primary-cta" ref={heroBuyRef}><BuyButton onClick={openCheckout}>Comprar por Mercado Pago</BuyButton></div>
            <div className="hero-trust"><span><ShieldCheck aria-hidden="true" />Compra protegida por Mercado Pago</span><span><LockKeyhole aria-hidden="true" />Un solo pago · acceso de por vida</span></div>
          </div>
        </div>
      </section>

      <section className="transformation-section">
        <div className="section-shell">
          <div className="transformation-heading"><p className="eyebrow">LO QUE HOY TE FRENA · LO QUE PODÉS CAMBIAR</p><h2>Pasa de esperar sin resultados<br /><em>a seguir un plan y conseguir entrevistas.</em></h2><p>No se trata de mandar más currículums, sino de mejorar cómo te presentás, dónde buscás y cómo te preparás para cada oportunidad.</p></div>
          <div className="transformation-grid">
            <div className="transform-card transform-before">
              <div className="transform-photo transform-photo-before"><img src="/comparativa-antes-busqueda.png" alt="Persona cansada frente a la computadora durante una búsqueda laboral sin resultados" /><span>ANTES</span></div>
              <span>SIN UN MÉTODO</span><h3>Errores que te alejan de una entrevista</h3>
              <ul><li>Mandar el mismo CV a todos los trabajos</li><li>No preparar el CV para los filtros ATS</li><li>Buscar siempre en los mismos lugares</li><li>No usar la IA para mejorar tu presentación y ahorrar tiempo</li><li>Postularte sin un plan ni seguimiento</li></ul>
            </div>
            <div className="transform-arrow"><ArrowRight aria-hidden="true" /></div>
            <div className="transform-card transform-after">
              <div className="transform-photo transform-photo-after"><img src="/comparativa-despues-trabajo.png" alt="Profesional feliz vestido de traje caminando hacia su trabajo" /><span>DESPUÉS</span></div>
              <span>CON MÉTODO ENTREVISTA</span><h3>El metodo infalible para conseguir empleo</h3>
              <ul><li>Un CV adaptado y más fácil de entender</li><li>Nuevos portales y empresas donde postularte</li><li>Usar IA gratuita para mejorar tu presentación y ahorrar tiempo</li><li>LinkedIn activo y contactos orgánicos</li><li>Más preparación para responder cuando te llamen</li></ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bundle-section section-shell">
        <div className="section-heading centered-heading"><p className="eyebrow">UNA COMPRA · SEIS GUÍAS</p><h2>Comprás Método Entrevista.<br /><em>Hoy te llevás los otros 5 gratis.</em></h2><p>Un paquete completo para trabajar tu CV, buscar oportunidades, usar IA, empezar en LinkedIn y prepararte para una entrevista.</p></div>
        <div className="bundle-overview">
          <div className="bundle-equation" aria-label="Método Entrevista más cinco ebooks incluidos">
            <figure className="overview-main-book"><img src={guides[0].image} alt="Libro de tapa blanda Método Entrevista" /><figcaption>GUÍA PRINCIPAL</figcaption></figure>
            <span className="overview-plus" aria-hidden="true">+</span>
            <div className="overview-mini-books">
              {guides.slice(1).map((guide) => <figure key={guide.title}><img src={guide.image} alt={guide.title.replace('\n', ' ')} /><figcaption>{guide.title.replace('\n', ' ')}</figcaption></figure>)}
            </div>
          </div>
          <div className="bundle-overview-copy"><p>TODO EN UNA SOLA COMPRA</p><h3>Método Entrevista <span>+ 5 ebooks</span></h3><strong>Hoy los recibís sin pagarlos aparte.</strong><small>Un recorrido completo desde el primer paso de tu búsqueda hasta la preparación para una entrevista.</small><div className="bundle-overview-price"><div><span>PRECIO HABITUAL</span><del>$19.990</del></div><span>TODO EL PACK POR</span><strong>$8.990</strong><small>UN SOLO PAGO</small></div><a href="#ebooks-incluidos">Ver ebooks incluidos <ChevronDown aria-hidden="true" /></a></div>
        </div>
        <div className="bundle-grid bonus-grid" id="ebooks-incluidos">
          {guides.slice(1).map((guide) => <article className="bundle-card" key={guide.title}>
            <div className="bundle-book-visual"><img src={guide.image} alt={`Libro de tapa blanda ${guide.title.replace('\n', ' ')}`} /><span>{guide.kicker}</span></div>
            <h3>{guide.title.replace('\n', ' ')}</h3>
            <div className="bonus-value"><div className="bonus-old-price"><span>VALOR INDIVIDUAL</span><del>{guide.value}</del></div><div className="bonus-free-price"><strong>GRATIS</strong><small>al adquirir Método Entrevista</small></div></div>
            <p>{guide.description}</p>
            <ul>{guide.points.map((point) => <li key={point}><Check aria-hidden="true" />{point}</li>)}</ul>
          </article>)}
        </div>
        <div className="bundle-final-offer">
          <div className="bundle-final-inner section-shell">
            <div className="bundle-final-label"><span>OFERTA DE HOY {offerDay}</span><strong>6</strong><small>GUÍAS<br />DIGITALES</small></div>
            <div className="bundle-final-message"><h3>Todo el método.<span>Todos los extras.</span></h3><p>Método Entrevista más cinco ebooks para trabajar tu CV, usar IA, comenzar en LinkedIn, buscar oportunidades y prepararte para una entrevista.</p><div className="bonus-crossed-value"><span>LOS 5 EBOOKS EXTRA VALEN</span><del>$46.000</del><strong>HOY VAN GRATIS</strong></div></div>
            <div className="bundle-final-buy"><div><span>PRECIO HABITUAL</span><del>$19.990</del></div><span>TE LLEVÁS TODO POR</span><strong>$8.990</strong><small>UN SOLO PAGO</small><BuyButton onClick={openCheckout}>Comprar por Mercado Pago</BuyButton><p><ShieldCheck aria-hidden="true" /> Compra protegida por Mercado Pago</p></div>
          </div>
        </div>
      </section>

      <section className="delivery-section">
        <div className="section-shell">
          <div className="section-heading centered-heading"><p className="eyebrow">COMPRA SIMPLE · ACCESO DIGITAL</p><h2>Comprás una vez.<br /><em>Recibís todo en tu correo.</em></h2><p>El proceso es sencillo y podés acceder a las seis guías desde el dispositivo que ya usás todos los días.</p></div>
          <div className="delivery-flow">
            <article><span><ShieldCheck aria-hidden="true" /></span><small>PASO 1</small><h3>Pagás de forma segura</h3><p>Realizás un único pago protegido a través de Mercado Pago.</p></article>
            <article><span><Mail aria-hidden="true" /></span><small>PASO 2</small><h3>Te llega todo por correo</h3><p>Recibís el acceso y la información necesaria para abrir las seis guías.</p></article>
            <article><span><MonitorSmartphone aria-hidden="true" /></span><small>PASO 3</small><h3>Lo ves donde quieras</h3><p>Podés leerlo desde tu celular, tablet, notebook o computadora.</p></article>
          </div>
          <figure className="delivery-devices"><img src="/acceso-dispositivos-6-ebooks.png" alt="Notebook, tablet y celular mostrando la biblioteca digital con los seis ebooks de Método Entrevista" /><figcaption><span>ACCESO DIGITAL</span><strong>Las seis guías disponibles en cualquier dispositivo</strong></figcaption></figure>
        </div>
      </section>

      <section className="reviews-section">
        <div className="section-shell">
          <div className="section-heading centered-heading"><p className="eyebrow">RESEÑAS DE NUESTROS USUARIOS</p><h2>Ellos eligieron el metodo<br /><em>para mejorar su búsqueda laboral.</em></h2></div>
          <div className="reviews-carousel-head"></div>
          <div className="reviews-track" ref={reviewsTrackRef} tabIndex="0" aria-label="Carrusel de casos" aria-live="off" onMouseEnter={() => { reviewsPausedRef.current = true }} onMouseLeave={() => { reviewsPausedRef.current = false }} onFocus={() => { reviewsPausedRef.current = true }} onBlur={() => { reviewsPausedRef.current = false }} onPointerDown={() => { reviewsPausedRef.current = true }} onPointerUp={() => { reviewsPausedRef.current = false }}>
            {[...exampleReviews, ...exampleReviews].map((review, index) => <article className="review-card" key={`${review.name}-${index}`} data-loop-start={index === exampleReviews.length ? '' : undefined} aria-hidden={index >= exampleReviews.length}>
              <div className="review-stars" aria-label="Cinco estrellas">★★★★★</div>
              <blockquote>“{review.message}”</blockquote>
              <div className="review-person"><span aria-hidden="true">{review.initials}</span><div><strong>{review.name}</strong><small>{review.age} años </small></div></div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="author-section">
        <div className="section-shell author-strip">
          <img className="author-avatar" src="/valeria-fursten.png" alt="Valeria Fursten, psicóloga y recruiter" />
          <div className="author-copy">
            <p className="eyebrow">CREADO POR UNA PROFESIONAL DE SELECCIÓN</p>
            <h2>Valeria Fursten</h2>
            <strong>Psicóloga y recruiter</strong>
            <p>Reuní herramientas prácticas para ayudarte a presentar mejor tu perfil y ordenar tu búsqueda laboral.</p>
          </div>
        </div>
      </section>

      <section className="faq-section section-shell">
        <div className="section-heading centered-heading"><p className="eyebrow">PREGUNTAS FRECUENTES</p><h2>Todo lo que necesitás saber<br /><em>antes de empezar.</em></h2></div>
        <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="checkout-section" id="comprar">
        <div className="section-shell checkout-card relative overflow-hidden">
          <div className="checkout-copy"><p className="eyebrow">OFERTA DE HOY {offerDay}</p><h2>Tu próxima oportunidad puede empezar por <em>cómo te presentás.</em></h2><p>Recibí Método Entrevista y las cinco guías adicionales en una sola compra.</p>
            <ul><li><Check />6 guías digitales</li><li><Check />Acceso inmediato</li><li><Check />Acceso de por vida</li></ul>
          </div>
          <div className="checkout-box"><span>OFERTA POR TIEMPO LIMITADO</span><del>$19.990</del><strong>$8.990</strong><small>Pago único · Ahorrás $11.000</small><div className="checkout-bonus">+ 5 EBOOKS GRATIS COMPRANDO AHORA</div><BuyButton inverse onClick={openCheckout}>Comprar ahora con Mercado Pago</BuyButton><p><LockKeyhole size={14} /> Pago protegido por Mercado Pago</p></div>
        </div>
      </section>

      <footer>
        <div className="section-shell footer-inner">
          <div className="footer-brand"><strong>MÉTODO ENTREVISTA</strong><p>Herramientas claras para ordenar y mejorar tu búsqueda laboral.</p></div>
          <div className="footer-contact"><span>CONTACTO Y RECLAMOS</span><a href="mailto:valeriafursten@gmail.com"><Mail aria-hidden="true" />valeriafursten@gmail.com</a><a href="https://instagram.com/psic.valeriafursten" target="_blank" rel="noreferrer"><AtSign aria-hidden="true" />@psic.valeriafursten</a></div>
          <div className="footer-bottom"><p>© {new Date().getFullYear()} Valeria Fursten</p><small>Método Entrevista brinda herramientas de orientación y preparación profesional. Los resultados pueden variar según la experiencia, el mercado laboral y la implementación de cada persona. No se garantiza la obtención de entrevistas ni de empleo.</small></div>
        </div>
      </footer>

      {checkoutOpen && <div className="purchase-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && checkoutState.status !== 'loading') setCheckoutOpen(false) }}>
        <section className="purchase-dialog" role="dialog" aria-modal="true" aria-labelledby="purchase-title">
          <button className="modal-close" type="button" aria-label="Cerrar" disabled={checkoutState.status === 'loading'} onClick={() => setCheckoutOpen(false)}><X /></button>
          <span className="modal-kicker">ÚLTIMO PASO ANTES DE PAGAR</span>
          <h2 id="purchase-title">¿A qué correo enviamos tus ebooks?</h2>
          <p>Escribí un correo al que tengas acceso. Ahí vas a recibir Método Entrevista y las otras cinco guías cuando Mercado Pago confirme la compra.</p>
          <form onSubmit={startCheckout}>
            <label htmlFor="checkout-email">Tu correo electrónico</label>
            <div className="email-field"><Mail aria-hidden="true" /><input id="checkout-email" type="email" autoComplete="email" required maxLength="254" placeholder="nombre@correo.com" value={checkoutEmail} onChange={(event) => setCheckoutEmail(event.target.value)} /></div>
            {checkoutState.status === 'error' && <div className="modal-error"><AlertCircle aria-hidden="true" />{checkoutState.message}</div>}
            <button className="modal-pay-button" type="submit" disabled={checkoutState.status === 'loading'}>{checkoutState.status === 'loading' ? <><LoaderCircle className="spin" />Preparando tu compra…</> : <>Continuar a Mercado Pago</>}</button>
          </form>
          <div className="modal-trust"><span><ShieldCheck />Compra protegida por Mercado Pago</span><span><LockKeyhole />Un solo pago de $8.990</span></div>
          <p className="purchase-help">¿Problemas con la compra? <a href="mailto:valeriafursten@gmail.com">Escribime a valeriafursten@gmail.com</a></p>
          <small>Usaremos este correo únicamente para gestionar tu compra y enviarte los materiales.</small>
        </section>
      </div>}

      {paymentNotice && <div className="purchase-modal payment-modal" role="presentation">
        <section className="purchase-dialog payment-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-status-title">
          <button className="modal-close" type="button" aria-label="Cerrar" onClick={closePaymentNotice}><X /></button>
          {paymentNotice.status === 'approved' ? <CheckCircle2 className="status-icon status-success" /> : paymentNotice.status === 'failure' ? <AlertCircle className="status-icon status-error" /> : <LoaderCircle className="status-icon status-pending spin" />}
          <h2 id="payment-status-title">{paymentNotice.status === 'approved' ? '¡Pago confirmado!' : paymentNotice.status === 'failure' ? 'El pago no se completó' : paymentNotice.status === 'checking' ? 'Estamos confirmando tu pago' : 'Tu pago está pendiente'}</h2>
          <p>{paymentNotice.status === 'approved' ? paymentNotice.delivered ? 'Tus seis ebooks ya fueron enviados al correo que ingresaste. Revisá también la carpeta de spam o promociones.' : 'Tus ebooks están en proceso de envío. En unos momentos los vas a recibir en el correo que ingresaste.' : paymentNotice.status === 'failure' ? 'No se realizó ningún envío. Podés volver a intentarlo cuando quieras.' : 'Mercado Pago todavía está procesando la operación. Cuando quede aprobada, enviaremos automáticamente los seis ebooks a tu correo.'}</p>
          <button className="modal-secondary-button" type="button" onClick={closePaymentNotice}>{paymentNotice.status === 'failure' ? 'Volver a la página' : 'Entendido'}</button>
        </section>
      </div>}

      {showMobileBuy && <div className="mobile-buy"><button type="button" onClick={openCheckout}>Comprar por $8.990</button></div>}
    </main>
  )
}

export default App
