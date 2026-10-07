import './About.css'

function About() {
  return (
    <section className="about section" id="about">
      <div className="shell">
        <p className="eyebrow">About</p>
        <div className="about-grid">
          <div className="about-col">
            <h2 className="about-label">AI work</h2>
            <p className="about-text">
              I build websites with AI, AI agents that automate routine work,
              and AI-generated videos. I learn tools fast and care about
              quality.
            </p>
          </div>
          <div className="about-col">
            <h2 className="about-label">Engineering</h2>
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
