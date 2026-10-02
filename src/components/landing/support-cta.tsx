import { useTranslation } from 'react-i18next';

// ============================================================
// SupportCTA — horizontal gradient support band (ported from
// the original alumni app; the button opens a mailto link).
// ============================================================
export function SupportCTA() {
  const { t } = useTranslation();
  const email = t('Footer.email');

  return (
    <section
      id="support"
      className="flex w-full items-center justify-center bg-gradient-to-r from-[#4279d6] via-[#2b56a1] to-[#263e75] px-6 py-12"
    >
      <div className="flex w-full max-w-5xl flex-col items-center rounded-sm px-4 py-16 text-center">
        <h2 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl">{t('SupportCTA.title')}</h2>

        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-white/90 md:text-xl">
          {t('SupportCTA.description', { email })}
        </p>

        <a
          href={`mailto:${email}`}
          className="rounded-full bg-[#002b2d] px-10 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#003d40]"
        >
          {t('SupportCTA.button')}
        </a>
      </div>
    </section>
  );
}
