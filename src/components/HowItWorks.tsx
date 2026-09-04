import { useTranslation } from 'react-i18next';
import React from 'react';

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    { number: '1', title: t('t30') },
    { number: '2', title: t('t31') },
    { number: '3', title: t('t32') },
    { number: '4', title: t('t33') },
  ];

  return (
    <section className="bg-secondary-dark py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-3xl font-bold text-center text-white">{t('t29')}</h2>
      </div>
      
      <div className="bg-[#eef8fa] py-6 md:py-8 border-b-4 border-secondary-dark border-t-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-6 sm:gap-y-8 md:gap-y-0 md:divide-x md:divide-x-reverse md:divide-secondary-dark/20">
            {steps.map((step, index) => (
              <div key={index} className={`flex items-center justify-center gap-3 px-4 ${index % 2 !== 0 ? 'sm:border-e sm:border-secondary-dark/20 md:border-0' : ''}`}>
                <span className="font-bold text-secondary-dark whitespace-nowrap">{step.title}</span>
                <span className="w-6 h-6 rounded bg-[#d4af37] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {step.number}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
