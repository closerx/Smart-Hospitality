import { useTranslation } from 'react-i18next';
import React from 'react';

const Stats = () => {
  const { t } = useTranslation();

  const stats = [
    { value: '25+', label: t('t124') },
    { value: '1000+', label: t('t125') },
    { value: '20+', label: t('t126') },
    { value: '1200+', label: t('t127') },
  ];

  return (
    <section className="bg-[#eef8fa] py-12 border-b-4 border-secondary-dark border-t-4 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-6 sm:gap-y-8 md:gap-y-0 md:divide-x md:divide-x-reverse md:divide-secondary-dark">
          {stats.map((stat, index) => (
            <div key={index} className={`text-center px-4 ${index % 2 !== 0 ? 'sm:border-e sm:border-secondary-dark/20 md:border-0' : ''}`}>
              <div className="text-3xl md:text-4xl font-black text-secondary-dark mb-2">{stat.value}</div>
              <div className="text-sm md:text-base text-secondary-dark font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
