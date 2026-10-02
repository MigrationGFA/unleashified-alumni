import { useTranslation } from 'react-i18next';
import { BookOpen, Network, ShoppingCart, UsersRound } from 'lucide-react';
import { Container } from './container';

// ============================================================
// Everything — features grid ("Everything you need to succeed
// together"), extended to the full 2x2 grid (ported from the
// original app where half the cards were commented out).
// ============================================================
export function Everything() {
  const { t } = useTranslation();

  const items = [
    {
      title: t('Everything.networkTitle'),
      desc: t('Everything.networkDesc'),
      icon: Network,
      iconColor: 'from-[#00B8DB] to-[#155DFC]',
    },
    {
      title: t('Everything.marketplaceTitle'),
      desc: t('Everything.marketplaceDesc'),
      icon: ShoppingCart,
      iconColor: 'from-[#AD46FF] to-[#E60076]',
    },
    {
      title: t('Everything.eventsTitle'),
      desc: t('Everything.eventsDesc'),
      icon: UsersRound,
      iconColor: 'from-[#FF6900] to-[#E7000B]',
    },
    {
      title: t('Everything.learningTitle'),
      desc: t('Everything.learningDesc'),
      icon: BookOpen,
      iconColor: 'from-[#00C950] to-[#009966]',
    },
  ];

  return (
    <section className="dark:bg-[#233389]">
      <Container className="mx-auto py-20">
        <h1 className="text-center text-5xl font-semibold text-stp-blue-light dark:text-white">
          {t('Everything.headingMain')}
          <p className="gradient-btn-primary-grew leading-[1.2]">{t('Everything.headingGradient')}</p>
        </h1>

        <p className="my-7 text-center text-[#90A1B9]">{t('Everything.description')}</p>

        <div className="mx-auto grid max-w-3xl justify-center gap-4 md:grid-cols-2">
          {items.map(item => (
            <div
              key={item.title}
              className="flex flex-col items-center space-y-2 rounded-md bg-stp-blue-dark p-6 text-white dark:bg-[#0F172B80]"
            >
              <div className={`w-fit rounded-lg bg-gradient-to-r ${item.iconColor} p-2.5`}>
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="text-md font-semibold">{item.title}</h2>
              <p className="text-sm font-thin">{item.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
