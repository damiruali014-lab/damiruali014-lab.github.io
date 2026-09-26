import './Hero.css'

function Hero() {
  return (
    <section className="hero section" id="top">
      <div className="shell hero-inner">
        <p className="hero-label">
          <span className="hero-label-dot" aria-hidden="true" />
          Developer + AI collaborator
        </p>

        <h1 className="hero-title">
          Ideas become <span className="hero-title-accent">working systems.</span>
        </h1>

        <p className="hero-lede">
          I build real digital products by combining code, design thinking and
          AI-assisted execution.
        </p>

        <p className="hero-now">
          <span className="hero-now-key">Currently</span>
          Building software, learning fast and looking for the next difficult
          problem.
        </p>

        <div className="hero-actions">
          <a className="hero-action is-primary" href="#work">
            View selected work
          </a>
          <a className="hero-action is-ghost" href="#contact">
            Contact me
          </a>
        </div>
      </div>
    </section>
  )
}

export default Hero
