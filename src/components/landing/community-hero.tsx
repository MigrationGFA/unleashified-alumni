import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Calendar, ShoppingBag } from 'lucide-react';

// ============================================================
// CommunityHero — "Connect. Share. Participate." section with
// Marketplace / Events cards (ported from the original app).
// ============================================================
export function CommunityHero() {
  const { t } = useTranslation();

  const cards = [
    {
      icon: ShoppingBag,
      title: t('CommunityHero.marketplaceTitle'),
      desc: t('CommunityHero.marketplaceDesc'),
    },
    {
      icon: Calendar,
      title: t('CommunityHero.eventsTitle'),
      desc: t('CommunityHero.eventsDesc'),
    },
  ];

  return (
    <section
      id="community"
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#b3c7f7] to-[#1e56d3] p-8 py-24 font-sans text-[#1a2b4b]"
    >
      <div className="mb-12 max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-extrabold md:text-5xl">
          {t('CommunityHero.headlineMain')}{' '}
          <span className="text-white">{t('CommunityHero.headlineSub1')}</span>{' '}
          {t('CommunityHero.headlineSub2')}
        </h1>
        <p className="text-lg leading-relaxed opacity-90">{t('CommunityHero.description')}</p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {cards.map(card => (
          <Link
            key={card.title}
            to="/login"
            className="w-80 rounded-2xl bg-white p-8 shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-transform hover:scale-105"
          >
            <div className="my-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#00B8DB] to-[#155DFC] text-white">
              <card.icon className="h-7 w-7" />
            </div>
            <h2 className="mb-3 text-2xl font-bold">{card.title}</h2>
            <p className="leading-snug text-gray-600">{card.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
