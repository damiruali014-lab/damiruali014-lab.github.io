import { FaGithub, FaLinkedin, FaWhatsapp } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import './Contact.css'
import {
  EMAIL,
  GITHUB_URL,
  LINKEDIN_URL,
  PHONE_DISPLAY,
  whatsappLink,
} from '../lib/contact.js'

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
    label: 'damiruali-dev',
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
    href: whatsappLink(),
    external: true,
  },
]

function Contact() {
  return (
    <section className="contact section" id="contact">
      <div className="shell">
        <p className="eyebrow">Contact</p>
        <h2 className="contact-title">Want your project on this stage?</h2>

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
                {external && <span className="visually-hidden">(opens in a new tab)</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Contact
