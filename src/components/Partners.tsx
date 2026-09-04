import { useTranslation } from 'react-i18next';
import React from 'react';

const Partners = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-secondary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-center text-white mb-8">{t('t135')}</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-100 h-24 rounded-md flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
              {/* Partner Logo Placeholder */}
              <span className="text-slate-300 font-bold text-xl">{t('t136')} {i}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;
