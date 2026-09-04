import { useTranslation } from 'react-i18next';
import React from 'react';

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t('t55'),
      description: t('t143'),
    },
    {
      title: t('t57'),
      description: t('t144'),
    },
    {
      title: t('t59'),
      description: t('t145'),
    },
    {
      title: t('t61'),
      description: t('t146'),
    },
  ];

  return (
    <section className="bg-secondary-dark py-20 text-white border-t-4 border-b-4 border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">{t('t63')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-[#eef8fa] text-center p-8 rounded-xl flex flex-col items-center shadow-sm">
              <div className="w-16 h-16 bg-secondary-dark rounded-full mb-6"></div>
              <h3 className="text-xl font-bold text-secondary-dark mb-4">{feature.title}</h3>
              <p className="text-secondary-dark/80 font-medium text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
