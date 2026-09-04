import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { Menu, X, Globe, User, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, role, userProfile, isAdmin, logout } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('#hero');

  const isUserAdmin = isAdmin || role === 'admin' || userProfile?.role === 'admin';

  const getDashboardPath = () => {
    if (isUserAdmin) return '/admin';
    if (role === 'owner' || userProfile?.role === 'owner') return '/owner-dashboard';
    if (role === 'cleaner' || userProfile?.role === 'cleaner') return '/cleaner-dashboard';
    return '/tenant-dashboard';
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  const navLinks = [
    { name: t('t1'), href: '/#hero' },
    { name: t('t2'), href: '/#about' },
    { name: t('t3'), href: '/#services' },
    { name: t('t4'), href: '/#faq' },
    { name: t('t5'), href: '/#footer' },
  ];

  useEffect(() => {
    if (window.location.pathname !== '/') return;

    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50) {
        if (activeLink !== '/#footer') setActiveLink('/#footer');
        return;
      }

      const sections = ['footer', 'faq', 'services', 'about', 'hero'];
      let currentActive = activeLink;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200) {
            currentActive = `/#${section}`;
            break;
          }
        }
      }

      if (currentActive !== activeLink) {
        setActiveLink(currentActive);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeLink]);

  return (
    <header className="w-full bg-slate-50 pt-4 pb-2 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 border border-gray-300 rounded bg-white px-4 md:px-6 shadow-sm">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center">
            <img src={logoImg} alt="Smart Hospitality Logo" className="h-10" />
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex gap-4 lg:gap-8 items-center relative">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setActiveLink(link.href)}
                className={`relative text-sm py-1 transition-colors group px-2 ${
                  activeLink === link.href ? 'text-secondary font-bold' : 'text-gray-600 hover:text-secondary font-medium'
                }`}
              >
                {link.name}
                {activeLink === link.href && (
                  <motion.div
                    layoutId="navbar-underline"
                    className="absolute bottom-0 start-0 end-0 h-[2px] bg-secondary"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </a>
            ))}
          </nav>

          {/* CTA Button - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="text-gray-600 hover:text-secondary transition-colors flex items-center gap-1 text-sm font-medium px-2 py-1 rounded"
              title={i18n.language === 'ar' ? t('t133') : t('t103')}
            >
              <Globe className="h-5 w-5" />
              <span>{i18n.language === 'ar' ? 'EN' : 'AR'}</span>
            </button>
            {currentUser ? (
              <div className="flex items-center gap-2">
                {isUserAdmin ? (
                  <Link
                    to="/admin"
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-bold transition-all text-sm shadow-sm inline-flex items-center gap-2"
                    title={i18n.language === 'ar' ? 'بوابة التحقق والإدارة' : 'Admin Portal'}
                  >
                    <ShieldCheck size={16} />
                    <span>{i18n.language === 'ar' ? 'لوحة الإدارة' : 'Admin Portal'}</span>
                  </Link>
                ) : (
                  <Link 
                    to={getDashboardPath()} 
                    className="bg-secondary text-white px-5 py-2 rounded font-medium hover:bg-secondary-light transition-colors text-sm shadow-sm inline-flex items-center gap-2"
                  >
                    <User size={16} />
                    <span>{userProfile?.fullName ? userProfile.fullName.split(' ')[0] : (i18n.language === 'ar' ? 'لوحة التحكم' : 'Dashboard')}</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/login" 
                  className="text-secondary hover:text-secondary-light font-bold text-sm px-3 py-1.5 transition-colors"
                >
                  {i18n.language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-secondary text-white px-5 py-2 rounded font-medium hover:bg-secondary-light transition-colors text-sm shadow-sm inline-block"
                >
                  {t('t6')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="text-gray-600 hover:text-secondary transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <Globe className="h-5 w-5" />
              <span>{i18n.language === 'ar' ? 'EN' : 'AR'}</span>
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-secondary hover:text-secondary-light focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 bg-white border border-gray-200 rounded shadow-lg overflow-hidden">
            <nav className="flex flex-col px-4 pt-2 pb-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`text-sm border-b border-gray-100 pb-2 ${
                    activeLink === link.href ? 'text-secondary font-bold' : 'text-gray-600 font-medium'
                  }`}
                  onClick={() => {
                    setActiveLink(link.href);
                    setIsMenuOpen(false);
                  }}
                >
                  {link.name}
                </a>
              ))}
              {currentUser ? (
                <div className="flex flex-col gap-2 mt-2">
                  {isUserAdmin ? (
                    <Link
                      to="/admin"
                      className="bg-amber-600 text-white px-6 py-2.5 rounded font-bold text-sm text-center flex items-center justify-center gap-2 shadow-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShieldCheck size={18} />
                      <span>{i18n.language === 'ar' ? 'بوابة التحقق والإدارة' : 'Admin Portal'}</span>
                    </Link>
                  ) : (
                    <Link 
                      to={getDashboardPath()} 
                      className="bg-secondary text-white px-6 py-2 rounded font-medium hover:bg-secondary-light transition-colors text-sm shadow-sm text-center inline-block" 
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {userProfile?.fullName ? userProfile.fullName.split(' ')[0] : (i18n.language === 'ar' ? 'لوحة التحكم' : 'Dashboard')}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link 
                    to="/login" 
                    className="w-full text-center py-2 text-secondary font-bold text-sm border border-secondary/30 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {i18n.language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-secondary text-white px-6 py-2 rounded font-medium hover:bg-secondary-light transition-colors text-sm shadow-sm text-center inline-block" 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('t6')}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
