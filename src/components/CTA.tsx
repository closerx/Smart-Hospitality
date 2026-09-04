import { useTranslation } from 'react-i18next';
import React from 'react';
import interiorImg from '../assets/images/modern_living_room_interior_1783999966188.jpg';

const CTA = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-white py-16 md:py-24 relative overflow-visible">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-0">
        <div className="bg-[#1b2b36] flex flex-col md:flex-row items-center relative rounded-md min-h-[300px]">
          
          {/* Text Side */}
          <div className="w-full md:w-[60%] p-8 pt-12 pb-10 md:py-16 md:pe-12 md:ps-8 lg:pe-16 text-white text-center md:text-start z-10 flex flex-col justify-center order-2 md:order-1">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('t34')}</h2>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed text-sm md:text-base">{t('t142')}</p>
            <div>
              <button className="bg-white text-[#1b2b36] px-8 py-2.5 rounded font-bold hover:bg-gray-200 transition-colors inline-block text-base md:text-lg">{t('t35')}</button>
            </div>
          </div>

          {/* Image Side (Phone Mockup) */}
          <div className="w-full md:w-[40%] relative flex justify-center z-20 px-4 order-1 md:order-2 -mt-36 md:mt-0 md:absolute md:start-4 lg:start-12 md:top-1/2 md:-translate-y-1/2 mb-6 md:mb-0">
            <div className="bg-[#1a1a1a] border-[8px] border-[#2a2a2a] rounded-[2.5rem] w-[240px] h-[480px] md:w-[260px] md:h-[520px] shadow-2xl overflow-hidden relative flex flex-col md:mt-[5px] md:mb-[5px]">
              {/* Speaker / Camera Notch */}
              <div className="absolute top-0 inset-x-0 h-6 md:h-7 flex justify-center items-end z-20">
                <div className="w-14 md:w-16 h-3 md:h-4 bg-[#1a1a1a] rounded-b-xl relative flex justify-center items-center">
                   <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-800 absolute end-2"></div>
                   <div className="w-6 md:w-8 h-1 rounded-full bg-slate-700"></div>
                </div>
              </div>
              
              {/* Side Buttons */}
              <div className="absolute top-20 md:top-24 -left-[10px] w-1 h-10 md:h-12 bg-[#2a2a2a] rounded-s-md"></div>
              <div className="absolute top-36 md:top-40 -left-[10px] w-1 h-10 md:h-12 bg-[#2a2a2a] rounded-s-md"></div>
              <div className="absolute top-28 md:top-32 -right-[10px] w-1 h-14 md:h-16 bg-[#2a2a2a] rounded-e-md"></div>

              {/* Phone Screen */}
              <div className="bg-white flex-1 relative flex flex-col pt-10 md:pt-12">
                 {/* Top Content */}
                 <div className="px-5 md:px-6 pb-3 md:pb-4 z-10">
                   <h3 className="font-bold text-[#1b2b36] text-2xl md:text-3xl leading-tight text-start mb-1">{t('t35')}<br/>{t('t36')}</h3>
                   <div className="bg-[#d4af37] text-white text-[9px] md:text-[10px] font-bold py-1 px-2 rounded-sm inline-block me-0 ms-auto">{t('t37')}</div>
                 </div>
                 
                 {/* Image Area */}
                 <div className="flex-1 relative overflow-hidden mt-1 md:mt-2">
                    <img src={interiorImg} alt="Interior" className="w-full h-full object-cover" />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1f38] via-[#0f1f38]/40 to-transparent"></div>
                 </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default CTA;
