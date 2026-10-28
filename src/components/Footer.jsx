import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <p className="footer-name">Uali Damir</p>
        <p className="footer-meta">
          <span>Kazakhstan</span>
          <span aria-hidden="true">·</span>
          <span>{new Date().getFullYear()}</span>
          <span aria-hidden="true">·</span>
          <a href="https://damiruali014-lab.github.io/ugc-ads/">AI UGC video ads</a>
        </p>
      </div>
    </footer>
  )
}

export default Footer
