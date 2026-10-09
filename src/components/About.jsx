import './About.css'

function About() {
  return (
    <section className="about section" id="about" aria-labelledby="about-title">
      <div className="shell">
        <h2 className="eyebrow" id="about-title">
          About
        </h2>
        <div className="about-grid">
          <div className="about-col">
            <h3 className="about-label">AI work</h3>
            <p className="about-text">
              I build websites with AI, AI agents that automate routine work,
              and AI-generated videos. I learn tools fast and care about
              quality.
            </p>
          </div>
          <div className="about-col">
            <h3 className="about-label">Engineering</h3>
            <p className="about-text">
              Petroleum Engineering student at KBTU. Former exchange student at
              UTP, Malaysia.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
