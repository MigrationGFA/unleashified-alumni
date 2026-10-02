import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { HeroBadge } from './hero-badge';
import { IMAGES } from '@/lib/images';

// ============================================================
// Hero — full-viewport hero over an internet-sourced photo of
// professionals networking (ported from the original alumni app
// with the Unleashified rebrand).
// ============================================================
export function Hero() {
  const { t } = useTranslation();
  const features = [t('Hero.featureFree'), t('Hero.featureIndustries'), t('Hero.featureNetwork')];

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#233389_0%,#162456_50%,#233389_100%)]">
      {/* Background photo (light mode) */}
      <div className="absolute inset-0 z-0 dark:hidden">
        <img
          src={IMAGES.hero}
          alt={t('Hero.imageAlt')}
          className="h-full w-full object-cover opacity-75"
          loading="eager"
        />
        <div className="absolute inset-0 bg-[rgba(29,41,61,0.5)]" />
      </div>

      {/* Cyan blur orbs (dark mode) */}
      <div className="absolute left-0 top-1/2 hidden h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00B8DB]/30 blur-[128px] dark:block" />
      <div className="absolute right-0 top-1/2 hidden h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00B8DB]/30 blur-[128px] dark:block" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-32 text-center md:py-24">
        <div className="mb-8 flex justify-center">
          <HeroBadge
            text={t('Hero.badgeText')}
            className="gradient-primary-rtl dark:border dark:border-[#314158]"
            iconClass="dark:text-[#00D3F2]"
          />
        </div>

        <h1 className="animate-fade-up text-5xl font-medium tracking-tight text-white md:text-6xl lg:text-7xl">
          {t('Hero.headlineMain')}
        </h1>
        <h2 className="animate-fade-up text-grow-together mb-6 pb-2 text-5xl font-medium leading-[1.2] tracking-tight md:text-6xl lg:text-7xl">
          <span className="inline-block pb-1">{t('Hero.headlineSub')}</span>
        </h2>

        <p className="animate-fade-up mx-auto mb-10 max-w-2xl text-lg text-[#DDEBFF] md:text-xl">
          {t('Hero.description')}
        </p>

        {/* CTA */}
        <div className="animate-fade-up flex flex-col items-center justify-center gap-4 text-white sm:flex-row">
          <Link
            to="/login"
            className="gradient-btn-primary-rtl inline-flex items-center justify-center gap-2 rounded-md px-8 py-3.5 text-base font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] hover:opacity-90"
          >
            {t('Hero.getStarted')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Feature bullets */}
        <div className="animate-fade-up mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
          {features.map((feature, i) => (
            <span key={feature} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#FBAD17]" />
              <span className="text-white/90">{feature}</span>
              {i < features.length - 1 && <span className="ml-4 text-white/30">|</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
