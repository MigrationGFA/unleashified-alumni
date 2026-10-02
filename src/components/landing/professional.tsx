import { useTranslation } from 'react-i18next';
import { CircleCheck } from 'lucide-react';
import { Container } from './container';
import { IMAGES } from '@/lib/images';

// ============================================================
// Professional — three alternating photo/text rows using
// internet-sourced imagery (ported from the original app).
// ============================================================
export function Professional() {
  const { t } = useTranslation();

  const rows = [
    {
      img: IMAGES.professionalNetwork,
      title: t('Professional.network.title'),
      desc: t('Professional.network.desc'),
      list: [
        t('Professional.network.item1'),
        t('Professional.network.item2'),
        t('Professional.network.item3'),
        t('Professional.network.item4'),
      ],
    },
    {
      img: IMAGES.professionalGrowth,
      title: t('Professional.growth.title'),
      desc: t('Professional.growth.desc'),
      list: [
        t('Professional.growth.item1'),
        t('Professional.growth.item2'),
        t('Professional.growth.item3'),
        t('Professional.growth.item4'),
      ],
    },
    {
      img: IMAGES.professionalOpportunities,
      title: t('Professional.opportunities.title'),
      desc: t('Professional.opportunities.desc'),
      list: [
        t('Professional.opportunities.item1'),
        t('Professional.opportunities.item2'),
        t('Professional.opportunities.item3'),
        t('Professional.opportunities.item4'),
      ],
    },
  ];

  return (
    <section id="professional" className="dark:bg-[#233389]">
      <Container className="relative space-y-10 pb-20 pt-10">
        {rows.map((row, i) => {
          const reversed = i % 2 === 1;
          return (
            <div
              key={row.title}
              className={`flex flex-col justify-between gap-8 md:flex-row md:gap-5 ${reversed ? 'md:flex-row-reverse' : ''}`}
            >
              <div className="relative flex flex-1 items-center justify-center rounded-xl md:block">
                <img
                  src={row.img}
                  alt={row.title}
                  width={550}
                  height={330}
                  className="mx-auto h-auto w-full max-w-[550px] rounded-xl shadow-lg"
                  loading="lazy"
                />
              </div>

              <div className="flex flex-1 flex-col justify-center space-y-3">
                <h2 className="text-3xl font-semibold text-stp-blue-light dark:text-white">{row.title}</h2>
                <p className="text-lg text-[#6D76A8] dark:text-[#90A1B9]">{row.desc}</p>
                <ul className="space-y-1">
                  {row.list.map(item => (
                    <li key={item} className="my-1 flex items-start gap-2 text-lg text-[#959CC3] dark:text-[#CAD5E2]">
                      <CircleCheck className="mt-1 h-4 w-4 shrink-0 text-orange-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </Container>
    </section>
  );
}
