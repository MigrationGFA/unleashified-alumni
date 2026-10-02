import { useTranslation } from 'react-i18next';
import { Facebook, Github, Instagram, Linkedin, Twitter } from 'lucide-react';
import { Container } from './container';
import { BrandLogo } from './brand';

// ============================================================
// Footer — dark navy site footer (ported from the original
// alumni app with the Unleashified brand).
// ============================================================
export function Footer() {
  const { t } = useTranslation();

  const linkColumns = [
    {
      title: t('Footer.product.title'),
      links: [
        { label: t('Footer.product.features'), href: '#professional' },
        { label: t('Footer.product.marketplace'), href: '#community' },
        { label: t('Footer.product.mentorship'), href: '#professional' },
        { label: t('Footer.product.learning'), href: '#everything' },
        { label: t('Footer.product.pricing'), href: '#join' },
      ],
    },
    {
      title: t('Footer.company.title'),
      links: [
        { label: t('Footer.company.aboutUs'), href: '#professional' },
        { label: t('Footer.company.careers'), href: '#join' },
        { label: t('Footer.company.blog'), href: '#everything' },
        { label: t('Footer.company.pressKit'), href: '#support' },
        { label: t('Footer.company.contact'), href: '#support' },
      ],
    },
    {
      title: t('Footer.legal.title'),
      links: [
        { label: t('Footer.legal.privacyPolicy'), href: '#' },
        { label: t('Footer.legal.termsOfService'), href: '#' },
        { label: t('Footer.legal.cookiePolicy'), href: '#' },
        { label: t('Footer.legal.gdpr'), href: '#' },
        { label: t('Footer.legal.accessibility'), href: '#' },
      ],
    },
  ];

  const social = [Facebook, Twitter, Linkedin, Instagram, Github];
  const email = t('Footer.email');

  return (
    <footer className="border-t border-white/5 bg-stp-blue-dark pb-10 pt-20">
      <Container className="py-10">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
          <div>
            <BrandLogo tone="light" />
            <p className="mt-5 text-sm leading-relaxed text-white/40">{t('Footer.tagline')}</p>
            <p className="mt-4 border-t border-white/5 pt-4 text-[11px] leading-relaxed text-white/30">
              {t('Footer.disclaimer')}
            </p>

            <div className="mt-3 flex gap-2">
              {social.map((Icon, i) => (
                <span key={i} className="rounded-lg bg-[#1D293D] p-3">
                  <Icon className="h-4 w-4 text-[#90A1B9]" />
                </span>
              ))}
            </div>
          </div>

          {linkColumns.map(col => (
            <div key={col.title}>
              <h4 className="mb-6 font-semibold text-white">{col.title}</h4>
              <ul className="space-y-4 text-sm text-white/40">
                {col.links.map(link => (
                  <li key={link.label}>
                    <a href={link.href} className="transition-colors hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#1D293D] pt-8 text-sm text-white/40 md:flex-row">
          <p>{t('Footer.copyright', { year: new Date().getFullYear() })}</p>
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 transition-colors hover:text-white"
          >
            ✉ {email}
          </a>
        </div>
      </Container>
    </footer>
  );
}
