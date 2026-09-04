import { useTranslation } from 'react-i18next';
import React from 'react';
import { Mail, Phone, Instagram } from 'lucide-react';
import logoImg from '../assets/images/logo.png';

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" stroke="none" className={className}>
    <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z"/>
  </svg>
);

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer id="footer" className="bg-secondary text-white pt-12 pb-6 relative overflow-hidden mt-8">
      {/* Decorative left shape */}
      <div 
        className="absolute start-0 bottom-0 top-0 w-48 md:w-[350px] z-0 bg-secondary-light pointer-events-none opacity-80"
        style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 pb-8 mb-6">
          
          {/* Logo Box - First in flex container places it on the right in RTL */}
          <div className="bg-[#e4f7fc] p-6 md:p-8 lg:p-10 flex flex-col items-center justify-center w-40 h-40 md:w-48 md:h-48 shrink-0 rounded-lg lg:rounded-none">
            <img src={logoImg} alt={t('t138')} className="max-w-full max-h-full object-contain mix-blend-multiply" />
          </div>

          {/* Center Links & Contact */}
          <div className="flex flex-col items-center gap-6 w-full md:w-auto flex-1">
            {/* Social Icons */}
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded border border-white flex items-center justify-center hover:bg-white hover:text-secondary cursor-pointer transition-colors">
                 <XIcon className="w-4 h-4" />
               </div>
               <div className="w-8 h-8 rounded border border-white flex items-center justify-center hover:bg-white hover:text-secondary cursor-pointer transition-colors">
                 <Instagram className="w-4 h-4" />
               </div>
               <div className="w-8 h-8 rounded border border-white flex items-center justify-center hover:bg-white hover:text-secondary cursor-pointer transition-colors">
                 <TiktokIcon className="w-4 h-4" />
               </div>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap justify-center gap-6 text-sm font-medium">
              <a href="#" className="hover:text-gray-300 transition-colors">{t('t64')}</a>
              <a href="#" className="hover:text-gray-300 transition-colors">{t('t65')}</a>
              <a href="#faq" className="hover:text-gray-300 transition-colors">{t('t4')}</a>
              <a href="#footer" className="hover:text-gray-300 transition-colors">{t('t5')}</a>
            </nav>

            <div className="w-full max-w-md h-px bg-white/50 my-1"></div>

            {/* Contact */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-12 text-sm font-medium">
              <a 
                href="mailto:smarthospitality@gmail.com" 
                className="flex items-center gap-2 hover:text-amber-300 transition-colors" 
                dir="ltr"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span>smarthospitality@gmail.com</span>
              </a>
              <a 
                href="tel:+966567929497" 
                className="flex items-center gap-2 hover:text-amber-300 transition-colors" 
                dir="ltr"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>+966567929497</span>
              </a>
            </div>
          </div>

          {/* Spacer for left side to balance logo on right */}
          <div className="hidden lg:block w-48"></div>
          
        </div>

        <div className="text-center text-xs text-white/70">{t('t139')}</div>
      </div>
    </footer>
  );
};

export default Footer;
