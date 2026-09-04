import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Calendar, 
  Briefcase, 
  Key, 
  Bell, 
  User, 
  LogOut, 
  Search, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Sparkles, 
  Star, 
  Clock, 
  PlusCircle, 
  Building2, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  QrCode,
  Layers,
  MapPin,
  CreditCard,
  FileText,
  Phone,
  Mail,
  Send,
  AlertCircle,
  Check,
  RefreshCw,
  Share2,
  Trash2,
  SlidersHorizontal,
  Wifi,
  Wind,
  Coffee,
  Car,
  PackageCheck,
  Menu,
  X
} from 'lucide-react';

// Custom Cleaning Broom Icon
const BroomIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 3L11.5 11.5" strokeWidth="2.2" />
    <circle cx="19.5" cy="2.5" r="1" fill="currentColor" />
    <path d="M8.5 10.5L13.5 15.5" strokeWidth="2.2" />
    <path d="M10 12L3.5 17.5C2.5 19 3 20.5 4.5 21C6.5 21.5 8.5 21.5 10.5 20.5C12 19.5 12.5 18 12 16.5L11.5 13.5" />
    <path d="M6 16.5L5 20.5" strokeWidth="1.2" />
    <path d="M8 15.5L7.5 21" strokeWidth="1.2" />
    <path d="M10 14.5L10 20.5" strokeWidth="1.2" />
  </svg>
);

export default function TenantDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const { currentUser, userProfile, role, isAdmin, logout } = useAuth();

  // Safety guard against role cross-over/overlap: strictly redirect admin, owner, or cleaner to their own dashboard
  useEffect(() => {
    if (isAdmin || userProfile?.role === 'admin' || role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (userProfile?.role === 'owner' || role === 'owner') {
      navigate('/owner-dashboard', { replace: true });
    } else if (userProfile?.role === 'cleaner' || role === 'cleaner') {
      navigate('/cleaner-dashboard', { replace: true });
    }
  }, [isAdmin, userProfile, role, navigate]);

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State for active sidebar menu tab
  const [activeTab, setActiveTab] = useState<'home' | 'bookings' | 'services' | 'key' | 'notifications' | 'profile'>('home');

  // Interactive Pin & Key controls
  const [showPin, setShowPin] = useState(false);
  const pinCode = ['8', '4', '2', '9'];
  const [doorUnlocked, setDoorUnlocked] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Live Timer for "المفتاح الرقمي النشط"
  const [timeLeft, setTimeLeft] = useState({ hours: 6, minutes: 45, seconds: 30 });

  // Guest Pass state in Key tab
  const [guestPassName, setGuestPassName] = useState('');
  const [guestPassDuration, setGuestPassDuration] = useState('2');
  const [generatedPass, setGeneratedPass] = useState<{ code: string; name: string; expires: string } | null>(null);

  // Service Request Modal state
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [serviceNotes, setServiceNotes] = useState('');
  const [activeServiceTab, setActiveServiceTab] = useState<'all' | 'cleaning' | 'hospitality' | 'maintenance' | 'valet'>('all');

  // Active services list
  const [activeServices, setActiveServices] = useState([
    { id: 1, title: 'طلب تنظيف الغرفة العادي', time: '10:30 صباحاً', status: 'pending', category: 'cleaning' },
    { id: 2, title: 'طلب مناشف وماء إضافي', time: '09:15 صباحاً', status: 'completed', category: 'hospitality' },
  ]);

  // Notifications state
  const [notificationsFilter, setNotificationsFilter] = useState<'all' | 'unread'>('all');
  const [notificationsList, setNotificationsList] = useState([
    { id: 1, title: 'تم تأكيد طلب تنظيف غرفة 22', time: 'قبل 10 دقائق', read: false, type: 'services' },
    { id: 2, title: 'المفتاح الذكي أصبح نشطاً لإقامتك الحالية', time: 'قبل ساعة', read: false, type: 'key' },
    { id: 3, title: 'تم فتح الباب بنجاح عبر التطبيق', time: 'قبل ساعتين', read: true, type: 'key' },
    { id: 4, title: 'تم إصدار الفاتورة الإلكترونية لحجز برج الضيافة', time: 'أمس', read: true, type: 'bookings' },
  ]);

  // Dynamic current user's display name
  const currentDisplayName = userProfile?.fullName || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : (isRtl ? 'النزيل' : 'Guest'));
  const currentFirstName = currentDisplayName.split(' ')[0];

  // Profile Form state initialized dynamically
  const [profileData, setProfileData] = useState({
    fullName: currentDisplayName,
    phone: userProfile?.phone || currentUser?.phoneNumber || '0501234567',
    email: userProfile?.email || currentUser?.email || 'guest@example.com',
    idNumber: '1098765432',
    preferredPayment: 'mada',
    language: 'ar'
  });

  useEffect(() => {
    if (userProfile || currentUser) {
      const updatedName = userProfile?.fullName || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'النزيل');
      setProfileData(prev => ({
        ...prev,
        fullName: updatedName,
        phone: userProfile?.phone || currentUser?.phoneNumber || prev.phone,
        email: userProfile?.email || currentUser?.email || prev.email,
      }));
    }
  }, [userProfile, currentUser]);

  const handleLogoutClick = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUnlockDoor = () => {
    setDoorUnlocked(true);
    setToastMessage(isRtl ? 'تم فتح الباب بنجاح! نتمى لك إقامة سعيدة.' : 'Door unlocked successfully! Wish you a pleasant stay.');
    setTimeout(() => {
      setDoorUnlocked(false);
      setToastMessage('');
    }, 3500);
  };

  const triggerServiceToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleGenerateGuestPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestPassName.trim()) {
      triggerServiceToast(isRtl ? 'يرجى إدخال اسم الزائر أو الفني' : 'Please enter guest or technician name');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPass({
      code,
      name: guestPassName,
      expires: `بعد ${guestPassDuration} ساعات`
    });
    triggerServiceToast(isRtl ? `تم إنشاء رمز المرور المؤقت (${code}) للزائر ${guestPassName}` : `Guest pass generated: ${code}`);
    setGuestPassName('');
  };

  const handleSubmitServiceRequest = (title: string) => {
    const newService = {
      id: Date.now(),
      title,
      time: 'الآن',
      status: 'pending',
      category: 'general'
    };
    setActiveServices([newService, ...activeServices]);
    setSelectedService(null);
    setServiceNotes('');
    triggerServiceToast(isRtl ? `تم استلام طلبك: ${title}` : `Service requested: ${title}`);
  };

  // Mock Previous Bookings Data
  const previousBookings = [
    { id: 1, title: 'شقة فاخرة - برج النخيل', location: 'الرياض - حي العقيق', rating: 5, room: 'غرفة 22' },
    { id: 2, title: 'جناح فندقي - النزهة', location: 'جدة - الشاطئ', rating: 5, room: 'جناح 104' },
    { id: 3, title: 'فيلا راقية بمسابح', location: 'الخبر - الحزام الذهبي', rating: 5, room: 'فيلا 8' },
    { id: 4, title: 'استوديو مودرن ذكي', location: 'الرياض - الملقا', rating: 5, room: 'استوديو 12' },
    { id: 5, title: 'شقة إطلالة بانورامية', location: 'مكة المكرمة - العزيزية', rating: 5, room: 'غرفة 305' },
    { id: 6, title: 'شالية هادئ ومجهز', location: 'الدمام - الشاطئ', rating: 5, room: 'شاليه 4' },
  ];

  return (
    <div className="min-h-screen bg-[#ECEFF4] flex font-sans text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Dynamic Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0B1B3D] text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-3 animate-bounce">
          <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTAINER FRAME                                                      */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[1480px] mx-auto min-h-screen flex flex-col md:flex-row bg-[#F2F5F9] shadow-2xl overflow-hidden border border-slate-300/60">
        
        {/* MOBILE STICKY TOP HEADER BAR (< md) */}
        <header className="md:hidden bg-[#0B1B3D] text-white p-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-amber-400"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Smart Hospitality" className="h-6 w-auto" />
              <span className="font-black text-sm text-white">لوحة النزيل</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#0B1B3D] flex items-center justify-center font-bold text-xs">
              <User size={18} />
            </div>
            <span className="font-bold text-xs text-white">{profileData.fullName.split(' ')[0]}</span>
          </div>
        </header>

        {/* MOBILE SLIDE-OVER NAVIGATION DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop Overlay */}
            <div 
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide Drawer Content */}
            <div className="relative w-72 max-w-[80%] bg-[#0B1B3D] text-white flex flex-col justify-between p-5 shadow-2xl z-10 h-full overflow-y-auto">
              <div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <img src={logoImg} alt="Logo" className="h-7 w-auto" />
                    <span className="font-black text-sm text-white">الضيافة الذكية</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Tenant Header Profile inside Mobile Drawer */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#0B1B3D] flex items-center justify-center font-bold text-lg shrink-0">
                    <User size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-white truncate">{profileData.fullName}</h3>
                    <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-md">
                      {isRtl ? 'نزيل ممتاز VIP' : 'VIP Guest'}
                    </span>
                  </div>
                </div>

                {/* Mobile Sidebar Links */}
                <nav className="space-y-1">
                  {[
                    { id: 'home', icon: Home, label: isRtl ? 'الرئيسية' : 'Home / Dashboard' },
                    { id: 'bookings', icon: Calendar, label: isRtl ? 'حجوزاتي' : 'My Bookings' },
                    { id: 'services', icon: Briefcase, label: isRtl ? 'خدماتي' : 'My Services' },
                    { id: 'key', icon: Key, label: isRtl ? 'المفتاح الذكي' : 'Digital Key' },
                    { id: 'notifications', icon: Bell, label: isRtl ? 'التنبيهات والإشعارات' : 'Notifications' },
                    { id: 'profile', icon: User, label: isRtl ? 'الملف الشخصي' : 'Profile' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          activeTab === item.id
                            ? 'bg-white text-[#0B1B3D] shadow-md'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon size={18} className={activeTab === item.id ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-white/10 mt-6">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-amber-300 hover:text-white hover:bg-white/10 font-bold text-xs cursor-pointer"
                >
                  <span>{isRtl ? 'تسجيل الخروج' : 'Log Out'}</span>
                  <LogOut size={16} className="rotate-180" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RIGHT SIDEBAR (قائمة التنقل الجانبية - Dark Navy #0B1B3D)                 */}
        {/* ========================================================================= */}
        <aside className="hidden md:flex w-72 bg-[#0B1B3D] text-white flex-col justify-between p-5 border-l border-slate-800 shrink-0">
          <div>
            {/* User Profile Header in Sidebar */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 mb-8">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 border-2 border-amber-300/80 flex items-center justify-center font-bold text-xl shadow-inner">
                <User size={26} className="text-[#0B1B3D]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-base text-white truncate">{profileData.fullName}</h3>
                <span className="inline-block px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold rounded-md">
                  {isRtl ? 'نزيل ممتاز VIP' : 'VIP Guest'}
                </span>
              </div>
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'home'
                    ? 'bg-white text-[#0B1B3D] shadow-lg scale-[1.02]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Home size={20} className={activeTab === 'home' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'الرئيسية' : 'Home / Dashboard'}</span>
              </button>

              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'bookings'
                    ? 'bg-white text-[#0B1B3D] shadow-lg scale-[1.02]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Calendar size={20} className={activeTab === 'bookings' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'حجوزاتي' : 'My Bookings'}</span>
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'services'
                    ? 'bg-white text-[#0B1B3D] shadow-lg scale-[1.02]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Briefcase size={20} className={activeTab === 'services' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'خدماتي' : 'My Services'}</span>
              </button>

              <button
                onClick={() => setActiveTab('key')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'key'
                    ? 'bg-white text-[#0B1B3D] shadow-lg scale-[1.02]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Key size={20} className={activeTab === 'key' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'المفتاح الذكي' : 'Smart Key'}</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-white text-[#0B1B3D] shadow-lg scale-[1.02]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Bell size={20} className={activeTab === 'notifications' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'الإشعارات' : 'Notifications'}</span>
                {notificationsList.filter(n => !n.read).length > 0 && (
                  <span className="ms-auto bg-amber-500 text-[#0B1B3D] font-black text-xs px-2 py-0.5 rounded-full">
                    {notificationsList.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'profile'
                    ? 'bg-white text-[#0B1B3D] shadow-lg scale-[1.02]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <User size={20} className={activeTab === 'profile' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'الحساب الشخصي' : 'Personal Profile'}</span>
              </button>
            </nav>
          </div>

          {/* Logout Action at Bottom */}
          <div className="pt-6 border-t border-white/10 mt-auto">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-amber-300 hover:text-white hover:bg-white/10 font-bold text-sm transition-all cursor-pointer"
            >
              <span>{isRtl ? 'تسجيل الخروج' : 'Log Out'}</span>
              <LogOut size={18} className="rotate-180" />
            </button>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* CENTER & LEFT MAIN CONTENT AREA                                           */}
        {/* ========================================================================= */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          
          {/* Top Header Title Block */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B1B3D] tracking-tight">
                {activeTab === 'home' && (isRtl ? `مرحبا بك، ${currentFirstName}` : `Welcome, ${currentFirstName}`)}
                {activeTab === 'bookings' && (isRtl ? 'حجوزاتي وإقاماتي' : 'My Bookings & Stays')}
                {activeTab === 'services' && (isRtl ? 'خدمات الإقامة والضيافة' : 'Hospitality & Stay Services')}
                {activeTab === 'key' && (isRtl ? 'إدارة المفتاح الذكي' : 'Smart Digital Key')}
                {activeTab === 'notifications' && (isRtl ? 'مركز الإشعارات' : 'Notification Center')}
                {activeTab === 'profile' && (isRtl ? 'الملف الشخصي والإعدادات' : 'Personal Profile & Settings')}
              </h1>
              <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
                {activeTab === 'home' && (isRtl ? 'استمتع بتجربة إقامة ذكية ومريحة.' : 'Enjoy a smart and comfortable stay experience.')}
                {activeTab === 'bookings' && (isRtl ? 'عرض وإدارة حجوزاتك الحالية، القادمة، والسابقة.' : 'View and manage current, upcoming, and past stays.')}
                {activeTab === 'services' && (isRtl ? 'اطلب النظافة، الغسيل، الصيانة، والخدمات الخاصة بنقرة واحدة.' : 'Order cleaning, room service, and maintenance.')}
                {activeTab === 'key' && (isRtl ? 'التحكم المباشر بقفل الغرفة وإصدار تصاريح الدخول للزوار.' : 'Direct door lock control and guest pass generation.')}
                {activeTab === 'notifications' && (isRtl ? 'متابعة تنبيهات الحجوزات ودخول الغرفة وطلبات الخدمات.' : 'Track stay alerts, access logs, and service status.')}
                {activeTab === 'profile' && (isRtl ? 'تحديث معلوماتك الشخصية، تفضيلات الدفع، ولغة التطبيق.' : 'Update your personal details and payment preferences.')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#0B1B3D] px-4 py-2 rounded-xl font-bold text-xs transition-colors">
                <img src={logoImg} alt="Smart Hospitality" className="h-6 w-auto" />
                <span>Smart Hospitality</span>
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: HOME (الرئيسية)                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT/CENTER WIDE COLUMN */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                
                {/* Search Bar matching mockup */}
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={isRtl ? 'البحث في وجهاتك السابقة' : 'Search in your previous destinations'}
                    className="w-full bg-white border border-slate-300 rounded-2xl py-3.5 px-5 pe-12 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0B1B3D] focus:border-[#0B1B3D] transition-all"
                  />
                  <Search size={18} className="absolute inset-y-0 end-4 my-auto text-slate-400" />
                </div>

                {/* Previous Bookings Section Box (الحجوزات السابقة) */}
                <div className="bg-[#D1DAE8]/70 border border-slate-300/80 rounded-2xl p-5 shadow-sm">
                  
                  {/* Header bar */}
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base sm:text-lg font-black text-[#0B1B3D]">
                      {isRtl ? 'الحجوزات السابقة' : 'Previous Bookings'}
                    </h2>
                    <button 
                      onClick={() => setActiveTab('bookings')}
                      className="text-xs font-extrabold text-slate-600 hover:text-[#0B1B3D] bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-300/60 shadow-2xs transition-all"
                    >
                      {isRtl ? 'عرض الكل' : 'View All'}
                    </button>
                  </div>

                  {/* 3x2 Grid of Previous Booking Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {previousBookings.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white rounded-xl overflow-hidden border border-slate-300/80 shadow-xs hover:shadow-md transition-all group flex flex-col"
                      >
                        <div className="h-32 bg-[#0B1B3D] relative p-3 flex flex-col justify-between overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3D] via-transparent to-black/20"></div>
                          <span className="relative z-10 self-start text-[10px] font-bold text-white bg-blue-600/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                            {item.room}
                          </span>
                          <div className="relative z-10 text-white">
                            <h4 className="text-xs font-bold truncate leading-tight">{item.title}</h4>
                            <p className="text-[10px] text-slate-300 truncate">{item.location}</p>
                          </div>
                        </div>

                        <div className="bg-white border-t border-slate-200 p-2 text-center">
                          <span className="block text-[11px] font-extrabold text-[#0B1B3D] mb-1">
                            {isRtl ? 'التقييم' : 'Rating'}
                          </span>
                          <div className="flex justify-center gap-0.5 text-amber-400">
                            {[...Array(item.rating)].map((_, i) => (
                              <Star key={i} size={13} fill="currentColor" className="text-amber-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Two Quick Action Cards side-by-side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Card 1: My Bookings (حجوزاتي) */}
                  <div 
                    onClick={() => setActiveTab('bookings')}
                    className="bg-white border border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Calendar size={24} />
                    </div>
                    <h3 className="font-black text-base text-[#0B1B3D] mb-1">
                      {isRtl ? 'حجوزاتي' : 'My Bookings'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {isRtl ? 'عرض حجوزاتك الحالية والسابقة' : 'View your current and previous bookings'}
                    </p>
                  </div>

                  {/* Card 2: My Services (خدماتي) */}
                  <div 
                    onClick={() => setActiveTab('services')}
                    className="bg-white border border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Briefcase size={24} />
                    </div>
                    <h3 className="font-black text-base text-[#0B1B3D] mb-1">
                      {isRtl ? 'خدماتي' : 'My Services'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {isRtl ? 'طلب خدمات أثناء إقامتك' : 'Request services during your stay'}
                    </p>
                  </div>

                </div>

              </div>

              {/* RIGHT WIDGET COLUMN (Active Digital Key & Door Unlock) */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-5">
                
                {/* Widget 1: Active Key Timer */}
                <div className="bg-[#BFCEDF] border border-slate-400/80 rounded-2xl p-4 shadow-sm text-center">
                  <h3 className="font-black text-sm text-[#0B1B3D] mb-3">
                    {isRtl ? 'المفتاح الرقمي النشط' : 'Active Digital Key'}
                  </h3>

                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-[#0B1B3D] text-white px-3 py-2 rounded-xl text-center min-w-[58px]">
                      <span className="block text-xl font-black font-mono leading-none">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-slate-300 mt-1 block">
                        {isRtl ? 'ثانيه' : 'Sec'}
                      </span>
                    </div>

                    <span className="font-bold text-[#0B1B3D] text-lg">:</span>

                    <div className="bg-[#0B1B3D] text-white px-3 py-2 rounded-xl text-center min-w-[58px]">
                      <span className="block text-xl font-black font-mono leading-none">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-slate-300 mt-1 block">
                        {isRtl ? 'دقيقه' : 'Min'}
                      </span>
                    </div>

                    <span className="font-bold text-[#0B1B3D] text-lg">:</span>

                    <div className="bg-[#0B1B3D] text-white px-3 py-2 rounded-xl text-center min-w-[58px]">
                      <span className="block text-xl font-black font-mono leading-none">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-slate-300 mt-1 block">
                        {isRtl ? 'ساعة' : 'Hour'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Widget 2: Smart Key Card */}
                <div className="bg-[#C9D7E8] border border-slate-300 rounded-2xl p-5 shadow-sm text-center space-y-5">
                  
                  <h3 className="font-black text-base text-[#0B1B3D]">
                    {isRtl ? 'مفتاحك الذكي' : 'Your Smart Key'}
                  </h3>

                  <div className="bg-[#0B1B3D] text-white rounded-2xl p-6 flex flex-col items-center justify-center shadow-md mx-auto max-w-[200px]">
                    <QrCode size={110} className="text-white mb-2" />
                    <span className="font-mono font-black tracking-widest text-sm text-slate-200">
                      QR CODE
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-lg text-[#0B1B3D]">
                      {isRtl ? 'غرفة 22' : 'Room 22'}
                    </h4>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">
                      {isRtl ? 'برج الضيافة الذكية' : 'Smart Hospitality Tower'}
                    </p>
                  </div>

                  <div className="bg-white/60 p-3.5 rounded-xl border border-slate-300/80">
                    <span className="block text-xs font-bold text-slate-700 mb-2">
                      {isRtl ? 'رمز القفل السري' : 'Secret Lock PIN'}
                    </span>

                    <div className="flex items-center justify-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="bg-[#0B1B3D] text-white p-2.5 rounded-lg hover:bg-slate-900 transition-colors shadow-xs"
                      >
                        {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>

                      {pinCode.map((digit, idx) => (
                        <div 
                          key={idx} 
                          className="w-9 h-10 bg-white border border-slate-300 rounded-lg flex items-center justify-center font-mono font-black text-base text-[#0B1B3D] shadow-inner"
                        >
                          {showPin ? digit : '•'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => triggerServiceToast(isRtl ? 'تم إرسال طلب تمديد الحجز إلى إدارة العقار' : 'Extension request submitted')}
                      className="bg-white hover:bg-slate-50 border border-slate-300 rounded-xl p-3 text-center transition-all shadow-2xs group"
                    >
                      <div className="flex justify-center text-amber-600 mb-1">
                        <Calendar size={18} />
                      </div>
                      <span className="block text-xs font-black text-[#0B1B3D]">
                        {isRtl ? 'تمديد الحجز' : 'Extend Booking'}
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab('services')}
                      className="bg-white hover:bg-slate-50 border border-slate-300 rounded-xl p-3 text-center transition-all shadow-2xs group"
                    >
                      <div className="flex justify-center text-amber-600 mb-1">
                        <BroomIcon size={18} />
                      </div>
                      <span className="block text-xs font-black text-[#0B1B3D]">
                        {isRtl ? 'طلب تنظيف' : 'Request Cleaning'}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={handleUnlockDoor}
                    className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                      doorUnlocked 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : 'bg-[#0B1B3D] hover:bg-slate-900 active:scale-[0.99]'
                    }`}
                  >
                    {doorUnlocked ? <Unlock size={18} /> : <Lock size={18} />}
                    <span>
                      {doorUnlocked 
                        ? (isRtl ? 'الباب مفتوح الآن' : 'Door Unlocked!') 
                        : (isRtl ? 'فتح الباب' : 'Unlock Door')}
                    </span>
                  </button>

                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BOOKINGS (حجوزاتي)                                                */}
          {/* ========================================================================= */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              
              {/* Active Booking Banner */}
              <div className="bg-gradient-to-br from-[#0B1B3D] to-[#152C5B] text-white rounded-2xl p-6 shadow-lg border border-blue-900/40 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-400 text-[#0B1B3D] font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                        {isRtl ? 'الحجز الحالي النشط' : 'Active Current Stay'}
                      </span>
                      <span className="text-xs text-blue-200 font-mono">ID: #BK-9842</span>
                    </div>

                    <h2 className="text-2xl font-black text-white">
                      {isRtl ? 'برج الضيافة الذكية - غرفة 22' : 'Smart Hospitality Tower - Room 22'}
                    </h2>

                    <p className="text-blue-100/80 text-xs sm:text-sm flex items-center gap-2">
                      <MapPin size={16} className="text-amber-400" />
                      {isRtl ? 'الرياض - حي العقيق، طريق الملك فهد' : 'Riyadh - Al Aqiq District, King Fahd Rd'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
                      <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                        <span className="text-blue-200 block text-[10px]">{isRtl ? 'تاريخ الدخول' : 'Check-in'}</span>
                        <span className="font-bold text-white">04 أغسطس 2026 (03:00 م)</span>
                      </div>
                      <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                        <span className="text-blue-200 block text-[10px]">{isRtl ? 'تاريخ المغادرة' : 'Check-out'}</span>
                        <span className="font-bold text-white">08 أغسطس 2026 (12:00 م)</span>
                      </div>
                      <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                        <span className="text-blue-200 block text-[10px]">{isRtl ? 'مدة الإقامة' : 'Duration'}</span>
                        <span className="font-bold text-amber-300">4 ليالي (باقي ليلتان)</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions inside active booking */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                    <button 
                      onClick={() => setActiveTab('key')}
                      className="bg-amber-400 hover:bg-amber-300 text-[#0B1B3D] px-5 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Key size={16} />
                      <span>{isRtl ? 'استخدام المفتاح الذكي' : 'Use Smart Key'}</span>
                    </button>

                    <button 
                      onClick={() => triggerServiceToast(isRtl ? 'تم إرسال طلب تمديد الحجز إلى الإدارة' : 'Extension request submitted')}
                      className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-5 py-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Clock size={16} />
                      <span>{isRtl ? 'طلب تمديد الإقامة' : 'Request Extension'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Upcoming & History Bookings Grid */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="font-black text-lg text-[#0B1B3D]">
                    {isRtl ? 'سجل الحجوزات السابقة والقادمة' : 'All Past & Upcoming Stays'}
                  </h3>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
                    {isRtl ? 'إجمالي الحجوزات: 7' : 'Total Stays: 7'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {previousBookings.map((bk) => (
                    <div key={bk.id} className="border border-slate-200 rounded-xl p-4 hover:border-[#0B1B3D] transition-all bg-slate-50/50 hover:bg-white shadow-2xs space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {isRtl ? 'حجز مكتمل' : 'Completed'}
                          </span>
                          <h4 className="font-black text-sm text-[#0B1B3D] mt-1.5">{bk.title}</h4>
                          <p className="text-xs text-slate-500">{bk.location}</p>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-700">{bk.room}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={14} fill="currentColor" />
                          <span className="font-bold text-slate-700">{bk.rating}.0</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => triggerServiceToast(isRtl ? 'جاري تحميل الفاتورة الإلكترونية PDF...' : 'Downloading PDF Invoice...')}
                            className="text-blue-700 hover:text-blue-900 font-bold hover:underline flex items-center gap-1"
                          >
                            <FileText size={13} />
                            <span>{isRtl ? 'الفاتورة' : 'Invoice'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SERVICES (خدماتي)                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setActiveServiceTab('all')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
                    activeServiceTab === 'all'
                      ? 'bg-[#0B1B3D] text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {isRtl ? 'جميع الخدمات' : 'All Services'}
                </button>
                <button
                  onClick={() => setActiveServiceTab('cleaning')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
                    activeServiceTab === 'cleaning'
                      ? 'bg-[#0B1B3D] text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  🧹 {isRtl ? 'النظافة والترتيب' : 'Housekeeping'}
                </button>
                <button
                  onClick={() => setActiveServiceTab('hospitality')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
                    activeServiceTab === 'hospitality'
                      ? 'bg-[#0B1B3D] text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  ☕ {isRtl ? 'خدمة الغرف والضيافة' : 'Room Amenities'}
                </button>
                <button
                  onClick={() => setActiveServiceTab('maintenance')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
                    activeServiceTab === 'maintenance'
                      ? 'bg-[#0B1B3D] text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  🛠️ {isRtl ? 'الصيانة والدعم' : 'Maintenance'}
                </button>
              </div>

              {/* Service Catalog Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Service 1 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0B1B3D] flex items-center justify-center mb-3">
                      <BroomIcon size={22} />
                    </div>
                    <h3 className="font-black text-base text-[#0B1B3D]">
                      {isRtl ? 'طلب تنظيف الغرفة' : 'Room Cleaning Service'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isRtl ? 'تنظيف شامل للغرفة وتغيير الأغطية والمفارش.' : 'Full room cleaning and linen replacement.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSubmitServiceRequest(isRtl ? 'تنظيف الغرفة وتغيير الأغطية' : 'Room cleaning request')}
                    className="mt-4 w-full bg-[#0B1B3D] hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-2xs"
                  >
                    {isRtl ? 'طلب الآن مجاناً' : 'Request Now'}
                  </button>
                </div>

                {/* Service 2 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                      <Coffee size={22} />
                    </div>
                    <h3 className="font-black text-base text-[#0B1B3D]">
                      {isRtl ? 'مستلزمات ومناشف إضافية' : 'Extra Amenities & Towels'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isRtl ? 'توصيل مناشف إضافية، مياه، ومستلزمات القهوة والشاي.' : 'Extra towels, bottled water, tea & coffee.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSubmitServiceRequest(isRtl ? 'توصيل مناشف ومستلزمات قهوة' : 'Extra towels & amenities')}
                    className="mt-4 w-full bg-[#0B1B3D] hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-2xs"
                  >
                    {isRtl ? 'طلب الآن' : 'Request Now'}
                  </button>
                </div>

                {/* Service 3 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
                      <Wind size={22} />
                    </div>
                    <h3 className="font-black text-base text-[#0B1B3D]">
                      {isRtl ? 'صيانة التكييف والأجهزة' : 'AC & Electronics Repair'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isRtl ? 'إبلاغ فورى لفريق الصيانة لإصلاح التكييف أو التلفزيون.' : 'Instant tech support for AC or TV.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSubmitServiceRequest(isRtl ? 'صيانة التكييف' : 'AC Maintenance')}
                    className="mt-4 w-full bg-[#0B1B3D] hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-2xs"
                  >
                    {isRtl ? 'إرسال الفني' : 'Dispatch Tech'}
                  </button>
                </div>

                {/* Service 4 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                      <Car size={22} />
                    </div>
                    <h3 className="font-black text-base text-[#0B1B3D]">
                      {isRtl ? 'خدمة تجهيز السيارة والشنط' : 'Valet & Luggage Service'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isRtl ? 'طلب تجهيز السيارة أمام البرج وتنزيل الأمتعة.' : 'Car retrieval and baggage assistance.'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSubmitServiceRequest(isRtl ? 'تجهيز السيارة ونقل الشنط' : 'Valet & Luggage request')}
                    className="mt-4 w-full bg-[#0B1B3D] hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-2xs"
                  >
                    {isRtl ? 'طلب الخدمة' : 'Request Valet'}
                  </button>
                </div>

              </div>

              {/* Active Service Tracker */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <h3 className="font-black text-base text-[#0B1B3D] mb-4">
                  {isRtl ? 'حالة الطلبات النشطة' : 'Active Service Requests Status'}
                </h3>

                <div className="space-y-3">
                  {activeServices.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#0B1B3D] flex items-center justify-center shrink-0">
                          <PackageCheck size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-[#0B1B3D]">{svc.title}</h4>
                          <span className="text-[10px] text-slate-500">{svc.time}</span>
                        </div>
                      </div>

                      <div>
                        {svc.status === 'completed' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-1 rounded-md">
                            {isRtl ? 'تم التسليم ✓' : 'Completed ✓'}
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1">
                            <Clock size={12} />
                            {isRtl ? 'جاري التنفيذ ⏳' : 'In Progress ⏳'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SMART KEY (المفتاح الذكي)                                          */}
          {/* ========================================================================= */}
          {activeTab === 'key' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Key Control */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm text-center space-y-6">
                  
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{isRtl ? 'القفل الذكي متصل عبر البلوتوث ومشفر' : 'Connected to Lock via Bluetooth'}</span>
                  </div>

                  {/* Interactive Big Key Button */}
                  <div className="my-6">
                    <button
                      onClick={handleUnlockDoor}
                      className={`w-44 h-44 rounded-full mx-auto flex flex-col items-center justify-center shadow-2xl transition-all border-8 ${
                        doorUnlocked
                          ? 'bg-emerald-600 border-emerald-300 text-white scale-105 ring-8 ring-emerald-100'
                          : 'bg-[#0B1B3D] hover:bg-slate-900 border-slate-300 text-white active:scale-95 ring-8 ring-slate-100'
                      }`}
                    >
                      {doorUnlocked ? <Unlock size={48} className="mb-2" /> : <Lock size={48} className="mb-2" />}
                      <span className="font-black text-sm">
                        {doorUnlocked ? (isRtl ? 'الباب مفتوح' : 'UNLOCKED') : (isRtl ? 'اضغط لفتح الباب' : 'PRESS TO UNLOCK')}
                      </span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    {isRtl ? 'قم بالاقتراب من قفل الغرفة 22 واضغط على الزر لفتح الباب تلقائياً.' : 'Approach Room 22 lock and press button.'}
                  </p>

                  {/* Secret Code View */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-sm mx-auto">
                    <span className="text-xs font-bold text-slate-700 block mb-2">
                      {isRtl ? 'رمز القفل السري للوحة المفاتيح' : 'Keypad PIN Code'}
                    </span>
                    <div className="flex justify-center gap-2">
                      {pinCode.map((num, i) => (
                        <span key={i} className="w-10 h-10 bg-white border border-slate-300 rounded-lg flex items-center justify-center font-mono font-black text-lg text-[#0B1B3D]">
                          {showPin ? num : '•'}
                        </span>
                      ))}
                      <button
                        onClick={() => setShowPin(!showPin)}
                        className="bg-[#0B1B3D] text-white px-3 rounded-lg hover:bg-slate-900 text-xs font-bold"
                      >
                        {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Generate Guest Pass & Access Logs */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Generate Pass Form */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="font-black text-base text-[#0B1B3D] flex items-center gap-2">
                    <Key size={18} className="text-amber-500" />
                    <span>{isRtl ? 'إصدار تصريح دخول مؤقت للزوار' : 'Generate Guest Pass'}</span>
                  </h3>

                  <form onSubmit={handleGenerateGuestPass} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isRtl ? 'اسم الزائر أو الفني' : 'Guest Name'}
                      </label>
                      <input 
                        type="text" 
                        value={guestPassName}
                        onChange={(e) => setGuestPassName(e.target.value)}
                        placeholder={isRtl ? 'مثال: محمد (عامل النظافة)' : 'e.g. Cleaner / Visitor'}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0B1B3D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isRtl ? 'صلاحية الدخول' : 'Validity Duration'}
                      </label>
                      <select 
                        value={guestPassDuration}
                        onChange={(e) => setGuestPassDuration(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0B1B3D]"
                      >
                        <option value="1">ساعة واحدة</option>
                        <option value="2">ساعتان</option>
                        <option value="6">6 ساعات</option>
                        <option value="24">24 ساعة (يوم كامل)</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-[#0B1B3D] text-white font-extrabold text-xs py-2.5 rounded-xl hover:bg-slate-900 transition-all"
                    >
                      {isRtl ? 'إنشاء رمز المرور المؤقت' : 'Generate Temporary PIN'}
                    </button>
                  </form>

                  {/* Generated Pass Result */}
                  {generatedPass && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-1 animate-fade-in">
                      <span className="text-[11px] text-amber-800 font-bold block">
                        {isRtl ? `رمز المرور الخاص بـ ${generatedPass.name}` : `Pass for ${generatedPass.name}`}
                      </span>
                      <span className="font-mono font-black text-2xl text-[#0B1B3D] tracking-widest block">
                        {generatedPass.code}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {generatedPass.expires}
                      </span>
                    </div>
                  )}
                </div>

                {/* Access History Log */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                  <h3 className="font-black text-sm text-[#0B1B3D]">
                    {isRtl ? 'سجل عمليات فتح القفل' : 'Recent Access Logs'}
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-bold text-[#0B1B3D] block">نواف (عبر التطبيق)</span>
                        <span className="text-[10px] text-slate-500">اليوم - 10:14 صباحاً</span>
                      </div>
                      <span className="text-emerald-600 font-bold text-[10px]">مفتوح ✓</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="font-bold text-[#0B1B3D] block">فريق النظافة (مفتاح مؤقت)</span>
                        <span className="text-[10px] text-slate-500">أمس - 04:30 مساءً</span>
                      </div>
                      <span className="text-emerald-600 font-bold text-[10px]">مفتوح ✓</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: NOTIFICATIONS (الإشعارات)                                          */}
          {/* ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <h3 className="font-black text-lg text-[#0B1B3D]">
                  {isRtl ? 'الإشعارات والتنبيهات' : 'Notifications'}
                </h3>
                <button
                  onClick={() => {
                    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
                    triggerServiceToast(isRtl ? 'تم تحديد جميع الإشعارات كمقروءة' : 'Marked all as read');
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900"
                >
                  {isRtl ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                </button>
              </div>

              <div className="space-y-3">
                {notificationsList.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                      notif.read ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-blue-50/60 border-blue-200 shadow-2xs'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#0B1B3D] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Bell size={18} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0B1B3D]">{notif.title}</h4>
                      <span className="text-[10px] text-slate-500 mt-1 block">{notif.time}</span>
                    </div>
                    {!notif.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-2"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: PROFILE (الحساب الشخصي)                                           */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#0B1B3D] text-amber-300 font-black text-2xl flex items-center justify-center shadow-md">
                  ن
                </div>
                <div>
                  <h3 className="font-black text-xl text-[#0B1B3D]">{profileData.fullName}</h3>
                  <p className="text-xs font-bold text-slate-500">{profileData.phone} | {profileData.email}</p>
                  <span className="inline-block mt-2 bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-extrabold px-3 py-0.5 rounded-md">
                    👑 {isRtl ? 'نزيل ممتاز VIP - 450 نقطة ولاء' : 'VIP Member - 450 Points'}
                  </span>
                </div>
              </div>

              {/* Edit Profile Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  triggerServiceToast(isRtl ? 'تم حفظ التعديلات بنجاح' : 'Profile updated successfully');
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input 
                    type="text" 
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-[#0B1B3D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'رقم الجوال' : 'Phone'}</label>
                    <input 
                      type="text" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-[#0B1B3D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-[#0B1B3D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{isRtl ? 'رقم الهوية الوطنية / الإقامة' : 'ID Number'}</label>
                  <input 
                    type="text" 
                    value={profileData.idNumber}
                    onChange={(e) => setProfileData({ ...profileData, idNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-[#0B1B3D]"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-[#0B1B3D] hover:bg-slate-900 text-white font-extrabold text-sm py-3 rounded-xl shadow-md transition-all"
                  >
                    {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
                  </button>
                </div>
              </form>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
