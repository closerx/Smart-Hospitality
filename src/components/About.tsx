import { useTranslation } from 'react-i18next';
import React from 'react';

const About = () => {
  const { t } = useTranslation();

  return (
    <section id="about" className="bg-secondary text-white py-16 relative">
      {/* Decorative top shape */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-[99%] w-64 h-16 bg-secondary" style={{ clipPath: 'polygon(20% 0, 80% 0, 100% 100%, 0% 100%)' }}></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">{t('t140')}</h2>
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">{t('t141')}<br className="hidden md:block" />{t('t16')}<br className="hidden md:block" />{t('t17')}</p>
      </div>
    </section>
  );
};

export default About;
