import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

// ============================================================
// BuildTogether — stats grid + founding community program card
// (ported from the original alumni app, rebranded for the
// multi-tenant platform story).
// ============================================================
export function BuildTogether() {
  const { t } = useTranslation();

  const stats = [
    { text: t('BuildTogether.stat1Text'), val: t('BuildTogether.stat1Val') },
    { text: t('BuildTogether.stat2Text'), val: t('BuildTogether.stat2Val') },
    { text: t('BuildTogether.stat3Text'), val: t('BuildTogether.stat3Val') },
    { text: t('BuildTogether.stat4Text'), val: t('BuildTogether.stat4Val') },
  ];

  return (
    <div className="bg-[linear-gradient(135deg,#233389_0%,#162456_75%,#233389_100%)] pb-16">
      <div className="flex flex-col items-center gap-5 pt-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          {t('BuildTogether.titleMain')} <br />
          <span className="text-grow-together text-4xl">{t('BuildTogether.titleStronger')}</span>
        </h1>
        <p className="max-w-xl text-[#90A1B9]">{t('BuildTogether.description')}</p>

        <div className="mt-6 grid max-w-4xl gap-4 px-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map(stat => (
            <div
              key={stat.text}
              className="space-y-1 rounded-xl border border-white/5 bg-stp-blue-dark px-8 py-5 text-center"
            >
              <p className="flex items-center justify-center text-2xl font-extrabold text-[#00D3F2] md:text-3xl">
                {stat.val}
              </p>
              <p className="text-sm text-[#90A1B9]">{stat.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Founding community program */}
      <div className="mx-auto mt-16 max-w-4xl px-6">
        <div className="rounded-3xl border border-white/10 bg-stp-blue-dark/60 p-8 text-center shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-white/20 md:p-12">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-l from-[#00D3F2] to-[#155DFC] text-lg font-bold text-white shadow-inner">
            ★
          </div>
          <h3 className="mb-4 text-2xl font-bold text-white md:text-3xl">{t('BuildTogether.foundingTitle')}</h3>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-[#90A1B9] md:text-lg">
            {t('BuildTogether.foundingDescription')}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#00D3F2] to-[#155DFC] px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:from-[#00D3F2]/95 hover:to-[#155DFC]/95 hover:shadow-xl active:scale-[0.98]"
          >
            {t('BuildTogether.foundingCTA')}
          </Link>
        </div>
      </div>
    </div>
  );
}
