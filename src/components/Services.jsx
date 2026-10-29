import { useRef, useState } from 'react'
import './Services.css'
import { FIVERR_URL, serviceTabs } from '../lib/services.js'
import { whatsappLink } from '../lib/contact.js'

// Smooth-scroll to another section without touching location.hash.
function jumpTo(event, id) {
  const target = document.getElementById(id)
  if (!target) return

  event.preventDefault()
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
}

// The card selected on load: the "Most popular" package, else the first one.
function defaultPackageId(tab) {
  return (tab.packages.find((pkg) => pkg.popular) ?? tab.packages[0])?.id
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// A quick squeeze-then-settle on the card that was just picked.
function pop(card) {
  if (prefersReducedMotion() || !card.animate) return
  card.animate(
    [
      { transform: 'translateY(-6px) scale(0.98)' },
      { transform: 'translateY(-6px) scale(1.03)' },
    ],
    { duration: 300, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
  )
}

function PackageCard({ pkg, messageNoun, isSelected, onSelect, onKeyDown, cardRef }) {
  const message = `Hi Damir, I'm interested in the ${pkg.name} ${messageNoun} package`
  const nameId = `package-${pkg.id}-name`
  const titleId = `package-${pkg.id}-title`

  return (
    <li
      ref={cardRef}
      className={`service-card${isSelected ? ' is-selected' : ''}`}
      role="radio"
      aria-checked={isSelected}
      aria-labelledby={`${nameId} ${titleId}`}
      tabIndex={isSelected ? 0 : -1}
      // Clicks on the buttons bubble up here too, so ordering also selects.
      onClick={(event) => onSelect(pkg.id, event.currentTarget)}
      onKeyDown={(event) => onKeyDown(event, pkg.id)}
    >
      <div className="service-card-inner">
        <div className="service-card-top">
          <p className="service-card-name" id={nameId}>
            {pkg.name}
          </p>
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
      </div>
    </li>
  )
}

// One radio group of package cards; works for any tab's packages.
function PackageGroup({ tab, selectedId, onSelect }) {
  const cardRefs = useRef({})

  function select(id, card) {
    if (id === selectedId) return
    onSelect(id)
    pop(card)
  }

  function handleKeyDown(event, id) {
    // Keys pressed on the buttons inside a card belong to those buttons.
    if (event.target !== event.currentTarget) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      select(id, event.currentTarget)
      return
    }

    const index = tab.packages.findIndex((pkg) => pkg.id === id)
    const last = tab.packages.length - 1
    const nextIndex = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key]
    if (nextIndex === undefined) return

    event.preventDefault()
    const nextId = tab.packages[nextIndex].id
    const nextCard = cardRefs.current[nextId]
    select(nextId, nextCard)
    nextCard?.focus()
  }

  return (
    <ul
      className="services-grid"
      role="radiogroup"
      aria-label={`${tab.label} packages`}
    >
      {tab.packages.map((pkg) => (
        <PackageCard
          key={pkg.id}
          pkg={pkg}
          messageNoun={tab.messageNoun}
          isSelected={pkg.id === selectedId}
          onSelect={select}
          onKeyDown={handleKeyDown}
          cardRef={(node) => {
            cardRefs.current[pkg.id] = node
          }}
        />
      ))}
    </ul>
  )
}

function ServicePanel({ tab, selectedId, onSelect }) {
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
      <PackageGroup tab={tab} selectedId={selectedId} onSelect={onSelect} />

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
  // Each tab remembers its own selected package.
  const [selected, setSelected] = useState(() =>
    Object.fromEntries(serviceTabs.map((tab) => [tab.id, defaultPackageId(tab)])),
  )
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
            {tab.id === activeId && (
              <ServicePanel
                tab={tab}
                selectedId={selected[tab.id]}
                onSelect={(id) => setSelected((current) => ({ ...current, [tab.id]: id }))}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Services
