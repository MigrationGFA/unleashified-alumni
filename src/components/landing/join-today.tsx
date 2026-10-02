import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, LockKeyhole, Star } from 'lucide-react';
import { HeroBadge } from './hero-badge';

// ============================================================
// JoinToday — red/blue/yellow tri-gradient closing CTA band
// (ported from the original alumni app).
// ============================================================
export function JoinToday() {
  const { t } = useTranslation();

  const features = [
    { title: t('JoinToday.featureFree'), icon: Star },
    { title: t('JoinToday.featureIndustries'), icon: LockKeyhole },
    { title: t('JoinToday.featureNetwork'), icon: Check },
  ];

  return (
    <section
      id="join"
      className="relative flex min-h-[80dvh] items-center justify-center overflow-hidden bg-gradient-to-b from-[#ED202D] via-[#155DFC] to-[#FBAD17]"
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 text-center">
        <div className="mb-8 flex justify-center">
          <HeroBadge text={t('JoinToday.badgeText')} className="border border-white/30 bg-white/20" />
        </div>

        <h1 className="animate-fade-up text-3xl font-medium tracking-tight text-white md:text-4xl lg:text-5xl">
          {t('JoinToday.headlineMain')}
        </h1>
        <h2 className="animate-fade-up mb-6 text-3xl font-medium tracking-normal text-white md:text-4xl lg:text-5xl">
          <span>{t('JoinToday.headlineSub')}</span>
        </h2>

        <p className="animate-fade-up mx-auto mb-10 max-w-2xl text-lg text-[#DDEBFF] md:text-xl">
          {t('JoinToday.description')}
        </p>

        <div className="animate-fade-up flex flex-col items-center justify-center gap-4 text-white sm:flex-row">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#28282b] shadow-xl transition-all duration-200 hover:scale-[1.02] hover:opacity-90"
          >
            {t('JoinToday.getStarted')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="animate-fade-up mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
          {features.map((feature, i) => (
            <span key={feature.title} className="flex items-center gap-2">
              <feature.icon size={16} color="#fff" />
              <span className="font-light text-white">{feature.title}</span>
              {i < features.length - 1 && <span className="ml-4 text-white/40">|</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
