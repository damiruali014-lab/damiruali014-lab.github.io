/* =========================================================================
   Services: every price, feature and link for the Services section.
   Edit this file only; the section renders whatever is here.

   To launch UGC packages, fill `packages` in the `ugc` tab using the same
   shape as the website packages. A tab with no packages shows "Coming soon".
   ========================================================================= */

// Where every "Order on Fiverr" button goes.
export const FIVERR_URL = 'https://www.fiverr.com/s/9dd656j'

export const serviceTabs = [
  {
    id: 'websites',
    label: 'Websites',
    // Used in the prefilled message: "...in the Basic website package".
    messageNoun: 'website',
    example: {
      label: 'See an example site',
      href: 'https://sitescout-damir.vercel.app/p/demo-alm-1-en',
    },
    steps: [
      'Tell me about your business',
      'I send a design plan',
      'I build, you review',
      'Your site goes live',
    ],
    packages: [
      {
        id: 'basic',
        name: 'Basic',
        title: 'Starter Landing Page',
        price: 80,
        deliveryDays: 3,
        revisions: 2,
        features: [
          '1-page responsive website',
          'Contact form, map, social media links',
          'Speed optimization',
          'Hosting setup included',
          '1 plugin/integration (e.g. WhatsApp button or Google Analytics)',
        ],
      },
      {
        id: 'standard',
        name: 'Standard',
        title: 'Business Website',
        price: 150,
        deliveryDays: 5,
        revisions: 3,
        popular: true,
        features: [
          'Up to 5 pages (Home, About, Services, Gallery, Contact)',
          'Booking form + FAQ section',
          'Opt-in form',
          'Speed optimization + basic SEO',
          'Hosting setup included',
          'Up to 2 plugins/integrations',
        ],
      },
      {
        id: 'premium',
        name: 'Premium',
        title: 'Pro Website + AI',
        price: 350,
        deliveryDays: 10,
        revisions: 5,
        features: [
          'Up to 10 pages',
          'Online store with payments (up to 20 products)',
          'Admin panel to edit your content',
          'AI chatbot or API integration',
          'Autoresponder email setup',
          'Speed optimization + SEO, hosting setup',
          'Up to 5 plugins/integrations',
        ],
      },
    ],
  },
  {
    id: 'ugc',
    label: 'UGC Ads',
    messageNoun: 'UGC ad',
    comingSoon: 'UGC ad packages are on the way. Message me in the meantime for a quote.',
    steps: [],
    packages: [],
  },
]
