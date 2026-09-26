import './About.css'

const skills = ['JavaScript', 'HTML/CSS', 'React', 'Git', 'Vite']
const tools = ['VS Code', 'Claude Code', 'Higgsfield']

function About() {
  return (
    <section className="about section" id="about">
      <div className="shell about-grid">
        <div className="about-lead">
          <p className="eyebrow">About</p>
          <h2 className="about-title">A developer who learns by shipping.</h2>
        </div>

        <div className="about-body">
          <p className="about-text">
            I&rsquo;m a developer based in Kazakhstan, building my way into
            software through real, hands-on projects &mdash; you&rsquo;ve
            probably just scrolled past a few of them. I move fast and pick up
            new tools easily.
          </p>
          <p className="about-text">
            I care more about shipping something solid than something flashy:
            quality is non-negotiable for me, even on small builds. I work well
            with other people and communicate clearly, which matters to me as
            much as the code itself. Now looking for harder, more interesting
            problems to take on next.
          </p>

          <dl className="about-stack">
            <div className="about-stack-row">
              <dt className="about-stack-key">Skills</dt>
              <dd className="about-stack-value">
                {skills.map((skill) => (
                  <span key={skill} className="about-stack-item">
                    {skill}
                  </span>
                ))}
              </dd>
            </div>
            <div className="about-stack-row">
              <dt className="about-stack-key">Tools</dt>
              <dd className="about-stack-value">
                {tools.map((tool) => (
                  <span key={tool} className="about-stack-item">
                    {tool}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}

export default About
