import { useRef, useState } from 'react'
import './Services.css'
import { FIVERR_URL, serviceTabs } from '../lib/services.js'
import { whatsappLink } from '../lib/contact.js'

// Smooth-scroll to another section without touching location.hash.
function jumpTo(event, id) {
  const target = document.getElementById(id)
  if (!target) return

  event.preventDefault()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
}

function PackageCard({ pkg, messageNoun }) {
  const message = `Hi Damir, I'm interested in the ${pkg.name} ${messageNoun} package`
  const titleId = `package-${pkg.id}-title`

  return (
    <li className={`service-card${pkg.popular ? ' is-popular' : ''}`}>
      <article className="service-card-inner" aria-labelledby={titleId}>
        <div className="service-card-top">
          <p className="service-card-name">{pkg.name}</p>
          {pkg.popular && <span className="service-card-badge">Most popular</span>}
        </div>
        <h3 className="service-card-title" id={titleId}>
          {pkg.title}
        </h3>
        <p className="service-card-price">${pkg.price}</p>

        <dl className="service-card-terms">
          <div>
            <dt>Delivery</dt>
            <dd>{pkg.deliveryDays} days</dd>
          </div>
          <div>
            <dt>Revisions</dt>
            <dd>{pkg.revisions}</dd>
          </div>
        </dl>

        <ul className="service-card-features">
          {pkg.features.map((feature) => (
            <li key={feature}>
              <span className="service-check" aria-hidden="true">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <div className="service-card-actions">
          <a
            className="service-button is-primary"
            href={FIVERR_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Order on Fiverr
            <span className="visually-hidden">
              {' '}
              ({pkg.name} package, opens in a new tab)
            </span>
          </a>
          <a
            className="service-button"
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message me
            <span className="visually-hidden">
              {' '}
              about the {pkg.name} package on WhatsApp (opens in a new tab)
            </span>
          </a>
        </div>
      </article>
    </li>
  )
}

function ServicePanel({ tab }) {
  if (tab.packages.length === 0) {
    return (
      <div className="services-soon">
        <p className="services-soon-label">Coming soon</p>
        <p className="services-soon-text">{tab.comingSoon}</p>
        <a
          className="service-button"
          href="#contact"
          onClick={(event) => jumpTo(event, 'contact')}
        >
          Get in touch
        </a>
      </div>
    )
  }

  return (
    <>
      <ul className="services-grid">
        {tab.packages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} messageNoun={tab.messageNoun} />
        ))}
      </ul>

      {tab.example && (
        <p className="services-example">
          <a href={tab.example.href} target="_blank" rel="noopener noreferrer">
            {tab.example.label} <span aria-hidden="true">→</span>
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </p>
      )}

      <div className="services-custom">
        <div>
          <h3 className="services-custom-title">Need something custom?</h3>
          <p className="services-custom-text">
            Bigger project, web app or AI tool? Tell me what you need and
            I&rsquo;ll send you a custom quote.
          </p>
        </div>
        <a
          className="service-button is-primary"
          href="#contact"
          onClick={(event) => jumpTo(event, 'contact')}
        >
          Get a quote
        </a>
      </div>

      {tab.steps.length > 0 && (
        <div className="services-steps">
          <h3 className="services-steps-title">How it works</h3>
          <ol className="services-steps-list">
            {tab.steps.map((step, index) => (
              <li key={step} className="services-step">
                <span className="services-step-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  )
}

function Services() {
  const [activeId, setActiveId] = useState(serviceTabs[0].id)
  const tabRefs = useRef({})

  // Arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern).
  function handleKeyDown(event) {
    const index = serviceTabs.findIndex((tab) => tab.id === activeId)
    const last = serviceTabs.length - 1
    const nextIndex = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key]
    if (nextIndex === undefined) return

    event.preventDefault()
    const nextId = serviceTabs[nextIndex].id
    setActiveId(nextId)
    tabRefs.current[nextId]?.focus()
  }

  return (
    <section className="services section" id="services" aria-labelledby="services-title">
      <div className="shell">
        <div className="services-head">
          <div>
            <p className="eyebrow">Services</p>
            <h2 className="section-title" id="services-title">
              Work with me.
            </h2>
          </div>

          <div
            className="services-tabs"
            role="tablist"
            aria-label="Service type"
            onKeyDown={handleKeyDown}
          >
            {serviceTabs.map((tab) => {
              const selected = tab.id === activeId
              return (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[tab.id] = node
                  }}
                  type="button"
                  role="tab"
                  id={`services-tab-${tab.id}`}
                  className={`services-tab${selected ? ' is-active' : ''}`}
                  aria-selected={selected}
                  aria-controls={`services-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveId(tab.id)}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {serviceTabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`services-panel-${tab.id}`}
            className="services-panel"
            aria-labelledby={`services-tab-${tab.id}`}
            hidden={tab.id !== activeId}
          >
            {tab.id === activeId && <ServicePanel tab={tab} />}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Services
