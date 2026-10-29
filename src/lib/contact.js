// Contact details shared by the Contact and Services sections.
export const PHONE_NUMBER = '77784760435'
export const PHONE_DISPLAY = '+7 (778) 476 04 35'
export const EMAIL = 'dumich2003@gmail.com'
export const LINKEDIN_URL = 'https://www.linkedin.com/in/damiruali-dev/'
export const GITHUB_URL = 'https://github.com/damiruali014-lab'

// A WhatsApp chat link, optionally with the first message already typed.
export function whatsappLink(message) {
  const base = `https://wa.me/${PHONE_NUMBER}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
