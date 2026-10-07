import { FaGithub, FaLinkedin, FaWhatsapp } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import './Contact.css'

const PHONE_NUMBER = '77784760435'
const PHONE_DISPLAY = '+7 (778) 476 04 35'
const EMAIL = 'dumich2003@gmail.com'
const LINKEDIN_URL = 'https://www.linkedin.com/in/damir-uali-930135409/'
const GITHUB_URL = 'https://github.com/damiruali014-lab'

const links = [
  {
    key: 'email',
    icon: MdEmail,
    name: 'Email',
    label: EMAIL,
    href: `mailto:${EMAIL}`,
    external: false,
  },
  {
    key: 'linkedin',
    icon: FaLinkedin,
    name: 'LinkedIn',
    label: 'damir-uali',
    href: LINKEDIN_URL,
    external: true,
  },
  {
    key: 'github',
    icon: FaGithub,
    name: 'GitHub',
    label: 'damiruali014-lab',
    href: GITHUB_URL,
    external: true,
  },
  {
    key: 'whatsapp',
    icon: FaWhatsapp,
    name: 'WhatsApp',
    label: PHONE_DISPLAY,
    href: `https://wa.me/${PHONE_NUMBER}`,
    external: true,
  },
]

function Contact() {
  return (
    <section className="contact section" id="contact">
      <div className="shell">
        <p className="eyebrow">Contact</p>
        <h2 className="contact-title">
          Have a difficult idea? <span className="contact-title-accent">Let&rsquo;s make it work.</span>
        </h2>

        <ul className="contact-links">
          {links.map(({ key, icon: Icon, name, label, href, external }) => (
            <li key={key} className="contact-item">
              <a
                className="contact-link"
                href={href}
                {...(external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                <Icon className="contact-icon" aria-hidden="true" />
                <span className="contact-name">{name}</span>
                <span className="contact-value">{label}</span>
                <span className="contact-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Contact
