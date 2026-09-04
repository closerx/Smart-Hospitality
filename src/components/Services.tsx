import { useTranslation } from 'react-i18next';
import React from 'react';
import { CalendarCheck, Users, Lock, Wrench, BarChart3 } from 'lucide-react';

const JanitorIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14 21v-2a4 4 0 0 0-4-4H4a4 4 0 0 0-4 4v2" />
    <circle cx="7" cy="7" r="4" />
    <path d="M19 4v12" />
    <path d="M16 16h6" />
    <path d="M17 16v4h4v-4" />
    <path d="M17 20l2 2 2-2" />
  </svg>
);

const Services = () => {
  const { t } = useTranslation();

  const services = [
    { title: t('t21'), icon: <CalendarCheck className="w-8 h-8 text-[#d4af37]" /> },
    { title: t('t22'), icon: <Users className="w-8 h-8 text-[#d4af37]" /> },
    { title: t('t23'), icon: <Lock className="w-8 h-8 text-[#d4af37]" /> },
    { title: t('t24'), icon: <JanitorIcon className="w-8 h-8 text-[#d4af37]" /> },
    { title: t('t25'), icon: <Wrench className="w-8 h-8 text-[#d4af37]" /> },
    { title: t('t26'), icon: <BarChart3 className="w-8 h-8 text-[#d4af37]" /> },
  ];

  return (
    <section id="services" className="bg-secondary-dark py-20 border-t-4 border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-white mb-12">{t('t147')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="text-white rounded flex items-stretch justify-between border-2 border-white/30 hover:bg-white/10 transition-colors cursor-pointer group overflow-hidden"
            >
              <h3 className="text-xl font-bold px-6 flex items-center">{service.title}</h3>
              <div className="bg-white p-4 flex items-center justify-center min-w-[72px]">
                {service.icon}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
