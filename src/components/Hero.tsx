import { useTranslation } from 'react-i18next';
import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import buildingImg from '../assets/images/modern_residential_building_isometric_1783990356990.jpg';

const Hero = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, role, userProfile, isAdmin } = useAuth();

  const isUserAdmin = isAdmin || role === 'admin' || userProfile?.role === 'admin';

  const getDashboardPath = () => {
    if (isUserAdmin) return '/admin';
    if (role === 'owner' || userProfile?.role === 'owner') return '/owner-dashboard';
    if (role === 'cleaner' || userProfile?.role === 'cleaner') return '/cleaner-dashboard';
    return '/tenant-dashboard';
  };

  const getDashboardLabel = () => {
    if (isUserAdmin) return i18n.language === 'ar' ? 'الدخول إلى لوحة الإدارة' : 'Go to Admin Portal';
    if (role === 'owner' || userProfile?.role === 'owner') return i18n.language === 'ar' ? 'الدخول إلى لوحة المالك' : 'Go to Owner Dashboard';
    if (role === 'cleaner' || userProfile?.role === 'cleaner') return i18n.language === 'ar' ? 'الدخول إلى لوحة مقدم الخدمة' : 'Go to Cleaner Dashboard';
    return i18n.language === 'ar' ? 'الدخول إلى لوحة النزيل' : 'Go to Tenant Dashboard';
  };

  return (
    <section id="hero" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-start">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-secondary mb-4 md:mb-6 leading-tight">{t('t11')}</h1>
            <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">{t('t137')}</p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center md:justify-start">
              {currentUser ? (
                <Link 
                  to={getDashboardPath()} 
                  className={`px-8 py-3 rounded font-bold transition-all shadow-md w-full sm:w-auto inline-block text-center ${
                    isUserAdmin 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-500/20' 
                      : 'bg-secondary text-white hover:bg-secondary-light'
                  }`}
                >
                  {getDashboardLabel()}
                </Link>
              ) : (
                <>
                  <Link to="/login" className="bg-secondary text-white px-8 py-3 rounded font-medium hover:bg-secondary-light transition-colors shadow-md w-full sm:w-auto inline-block text-center">
                    {t('t13')}
                  </Link>
                  <a 
                    href="#about" 
                    className="bg-slate-100 text-secondary border border-secondary/20 px-8 py-3 rounded font-medium hover:bg-slate-200 transition-colors shadow-xs w-full sm:w-auto inline-block text-center"
                  >
                    {t('t14')}
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Image/Illustration Content */}
          <div className="flex-1 relative w-full flex justify-center">
            {/* Tablet Frame */}
            <div className="relative w-full max-w-[500px] aspect-[4/3] bg-secondary-dark rounded-[2rem] border-[12px] border-secondary-dark shadow-2xl overflow-hidden drop-shadow-2xl mb-[30px] ms-0 mt-0">
              {/* Inner screen */}
              <div className="absolute inset-0 bg-[#0f172a] overflow-hidden flex items-center justify-center">
                 <motion.video 
                   src="/hotel.webm" 
                   autoPlay 
                   muted 
                   loop 
                   playsInline 
                   className="w-full h-full object-cover opacity-90" 
                   animate={{
                     y: [-10, 10, -10], // Floating up and down
                     rotateZ: [-1, 1, -1], // Slight subtle 2D rotation
                     scale: [1.05, 1.08, 1.05] // Breathing scale effect
                   }}
                   transition={{
                     duration: 8, // Very slow and smooth
                     repeat: Infinity,
                     ease: "easeInOut"
                   }}
                 />
                 
                 {/* Floating Cards */}
                 {/* Top Left - Occupancy */}
                 <div className="absolute top-3 start-3 md:top-6 md:start-6 bg-secondary-dark/60 backdrop-blur-md border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3 text-white shadow-xl text-center z-10 min-w-[70px] md:min-w-[90px] transform scale-90 md:scale-100 origin-top-left">
                   <div className="font-medium text-gray-300 text-[9px] md:text-xs mb-0.5 md:mb-1">{t('t18')}</div>
                   <div className="font-bold text-base md:text-xl">85%</div>
                 </div>

                 {/* Top Right - Rating */}
                 <div className="absolute top-3 end-3 md:top-6 md:end-6 bg-secondary-dark/60 backdrop-blur-md border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3 text-white shadow-xl text-center z-10 min-w-[70px] md:min-w-[90px] transform scale-90 md:scale-100 origin-top-right">
                   <div className="font-medium text-gray-300 text-[9px] md:text-xs mb-0.5 md:mb-1">{t('t19')}</div>
                   <div className="font-bold text-sm md:text-lg">4.9</div>
                   <div className="text-yellow-400 text-[8px] md:text-[10px] flex justify-center mt-0.5">★★★★★</div>
                 </div>

                 {/* Bottom Left - Revenue */}
                 <div className="absolute bottom-3 start-3 md:bottom-6 md:start-6 bg-secondary-dark/60 backdrop-blur-md border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3 text-white shadow-xl text-center z-10 min-w-[70px] md:min-w-[90px] transform scale-90 md:scale-100 origin-bottom-left">
                   <div className="font-medium text-gray-300 text-[9px] md:text-xs mb-0.5 md:mb-1">{t('t20')}</div>
                   <div className="font-bold text-sm md:text-lg">152,500</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
