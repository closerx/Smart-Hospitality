import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';
import { useAuth } from '../context/AuthContext';
import { CleanerProfile } from '../types/auth';
import {
  Home,
  CheckSquare,
  History,
  Calendar,
  Bell,
  Settings,
  LogOut,
  AlertCircle,
  Clock,
  CheckCircle2,
  ListTodo,
  User,
  MoreVertical,
  Camera,
  PlayCircle,
  Image as ImageIcon,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export default function CleanerDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const { currentUser, userProfile, role, isAdmin, logout } = useAuth();
  const cleanerData = userProfile as CleanerProfile | null;

  // Safety guard against role cross-over/overlap: strictly redirect admin, owner, or tenant to their own dashboard
  useEffect(() => {
    if (isAdmin || userProfile?.role === 'admin' || role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (userProfile?.role === 'owner' || role === 'owner') {
      navigate('/owner-dashboard', { replace: true });
    } else if (userProfile?.role === 'tenant' || role === 'tenant') {
      navigate('/tenant-dashboard', { replace: true });
    }
  }, [isAdmin, userProfile, role, navigate]);

  // Dynamic registered cleaner name resolution
  const cleanerDisplayName = cleanerData?.fullName || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : (isRtl ? 'مزود نظافة' : 'Cleaning Provider'));
  const cleanerFirstName = cleanerDisplayName.split(' ')[0];

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<
    'home' | 'tasks' | 'history' | 'schedule' | 'notifications' | 'settings'
  >('home');

  // Selected task for "تفاصيل المهمة الحالية"
  const [selectedTaskId, setSelectedTaskId] = useState<number>(1);

  // Interactive task execution state
  const [taskStatusState, setTaskStatusState] = useState<{ [key: number]: string }>({
    1: 'قيد التنفيذ',
    2: 'معلقه',
    3: 'قيد التنفيذ',
    4: 'جديده',
    5: 'معلقه',
    6: 'معلقه',
  });

  // Interactive feedback toast
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  // Mock Tasks List matching mockup precisely
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'الجناح الملكي-1',
      property: 'اسم العقار',
      time: '10:30 ص',
      execTime: '4:30 م',
      notes: 'يرجى التركيز على تنظيف النوافذ ودورات المياه',
      imageLabel: 'صوره للجناح',
      imageBg: 'bg-slate-800'
    },
    {
      id: 2,
      title: 'الجناح الملكي-4',
      property: 'اسم العقار',
      time: '12:30 م',
      execTime: '12:30 م',
      notes: 'تغيير المفارش والوسائد بالكامل وتطهير الأسطح',
      imageLabel: 'صوره للجناح',
      imageBg: 'bg-slate-700'
    },
    {
      id: 3,
      title: 'غرفة رقم 4',
      property: 'اسم العقار',
      time: '9:30 ص',
      execTime: '10:00 ص',
      notes: 'تجهيز مستلزمات الضيافة الإضافية مع الشامبو والتنظيف العميق',
      imageLabel: 'صوره للغرفة',
      imageBg: 'bg-slate-800'
    },
    {
      id: 4,
      title: 'غرفة رقم 22',
      property: 'اسم العقار',
      time: '4:30 ص',
      execTime: '4:30 ص',
      notes: 'تنظيف شامل بعد مغادرة النزيل المباشرة',
      imageLabel: 'صوره للغرفة',
      imageBg: 'bg-slate-900'
    },
    {
      id: 5,
      title: 'غرفة رقم 29',
      property: 'اسم العقار',
      time: '5:00 م',
      execTime: '5:00 م',
      notes: 'إكمال جلي الأرضيات والمرايا للغرفة الرئيسية',
      imageLabel: 'صوره للغرفة',
      imageBg: 'bg-slate-800'
    },
    {
      id: 6,
      title: 'غرفة رقم 19',
      property: 'اسم العقار',
      time: '10:00 م',
      execTime: '10:00 م',
      notes: 'تعقيم وتهوية المكان وضبط إضاءة المدخل',
      imageLabel: 'صوره للغرفة',
      imageBg: 'bg-slate-700'
    },
  ]);

  const currentTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];
  const currentTaskStatus = taskStatusState[currentTask.id] || 'معلقه';

  const handleStartTask = () => {
    if (currentTaskStatus === 'مكتمله') {
      triggerToast(isRtl ? 'المهمة مكتملة بالفعل!' : 'Task is already completed!');
      return;
    }

    if (currentTaskStatus === 'قيد التنفيذ') {
      setTaskStatusState((prev) => ({ ...prev, [currentTask.id]: 'مكتمله' }));
      triggerToast(isRtl ? `تم إكمال المهمة (${currentTask.title}) بنجاح!` : `Task (${currentTask.title}) completed successfully!`);
    } else {
      setTaskStatusState((prev) => ({ ...prev, [currentTask.id]: 'قيد التنفيذ' }));
      triggerToast(isRtl ? `بدء المهمة (${currentTask.title}) الآن!` : `Started task (${currentTask.title})!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#ECEFF4] flex font-sans text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0B1B3D] text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center gap-3 animate-bounce">
          <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTAINER FRAME */}
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
              <span className="font-black text-sm text-white">مزود النظافة</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white text-[#0B1B3D] flex items-center justify-center font-bold text-xs">
              <User size={18} />
            </div>
            <span className="font-bold text-xs text-white">{cleanerFirstName}</span>
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

                {/* Cleaner Header Profile inside Mobile Drawer */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#0B1B3D] flex items-center justify-center font-bold text-lg shrink-0">
                    <User size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-white truncate">{cleanerDisplayName}</h3>
                    <span className="inline-block px-2 py-0.5 bg-blue-400/20 text-blue-300 text-[10px] font-bold rounded-md">
                      {isRtl ? 'مزود نظافه' : 'Cleaning Provider'}
                    </span>
                  </div>
                </div>

                {/* Mobile Sidebar Links */}
                <nav className="space-y-1">
                  {[
                    { id: 'home', icon: Home, label: isRtl ? 'الرئيسية' : 'Dashboard' },
                    { id: 'tasks', icon: CheckSquare, label: isRtl ? 'المهام' : 'Tasks' },
                    { id: 'history', icon: History, label: isRtl ? 'السجل' : 'Log / History' },
                    { id: 'schedule', icon: Calendar, label: isRtl ? 'جدول المهام' : 'Task Schedule' },
                    { id: 'notifications', icon: Bell, label: isRtl ? 'الاشعارات' : 'Notifications' },
                    { id: 'settings', icon: Settings, label: isRtl ? 'الاعدادات' : 'Settings' },
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
                  onClick={handleLogout}
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
        {/* DESKTOP SIDEBAR (قائمة التنقل الجانبية - Dark Navy #0B1B3D)                 */}
        {/* ========================================================================= */}
        <aside className="hidden md:flex w-64 bg-[#0B1B3D] text-white flex-col justify-between p-5 border-l border-slate-800 shrink-0">
          <div>
            {/* Cleaner Header Profile matching mockup */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white text-[#0B1B3D] border-2 border-slate-200 flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
                <User size={26} className="text-[#0B1B3D]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-base text-white truncate">{cleanerDisplayName}</h3>
                <span className="inline-block px-2 py-0.5 bg-blue-400/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold rounded-md">
                  {isRtl ? 'مزود نظافه' : 'Cleaning Provider'}
                </span>
              </div>
            </div>

            {/* Sidebar Navigation Menu */}
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'home'
                    ? 'bg-white text-[#0B1B3D] shadow-md scale-[1.01]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Home size={19} className={activeTab === 'home' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'الرئيسية' : 'Dashboard'}</span>
              </button>

              <button
                onClick={() => setActiveTab('tasks')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'tasks'
                    ? 'bg-white text-[#0B1B3D] shadow-md scale-[1.01]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <CheckSquare size={19} className={activeTab === 'tasks' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'المهام' : 'Tasks'}</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'history'
                    ? 'bg-white text-[#0B1B3D] shadow-md scale-[1.01]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <History size={19} className={activeTab === 'history' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'السجل' : 'Log / History'}</span>
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'schedule'
                    ? 'bg-white text-[#0B1B3D] shadow-md scale-[1.01]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Calendar size={19} className={activeTab === 'schedule' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'جدول المهام' : 'Task Schedule'}</span>
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-white text-[#0B1B3D] shadow-md scale-[1.01]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Bell size={19} className={activeTab === 'notifications' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'الاشعارات' : 'Notifications'}</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'settings'
                    ? 'bg-white text-[#0B1B3D] shadow-md scale-[1.01]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Settings size={19} className={activeTab === 'settings' ? 'text-[#0B1B3D]' : 'text-amber-400'} />
                <span>{isRtl ? 'الاعدادات' : 'Settings'}</span>
              </button>
            </nav>
          </div>

          {/* Bottom Logout Button */}
          <div className="pt-4 border-t border-white/10 mt-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-amber-300 hover:text-white hover:bg-white/10 font-bold text-sm transition-all cursor-pointer"
            >
              <span>{isRtl ? 'تسجيل الخروج' : 'Log Out'}</span>
              <LogOut size={18} className="rotate-180" />
            </button>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN DASHBOARD CONTENT AREA                                               */}
        {/* ========================================================================= */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          
          {/* Top Header Greeting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B1B3D] tracking-tight">
                {isRtl ? `مرحبا بك، ${cleanerFirstName}` : `Welcome back, ${cleanerFirstName}`}
              </h1>
              <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
                {isRtl ? 'اطلع على مهامك اليومية وأنجزها بسبولة.' : 'Review your daily tasks and manage them easily.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#0B1B3D] px-4 py-2 rounded-xl font-bold text-xs transition-colors">
                <img src={logoImg} alt="Smart Hospitality" className="h-6 w-auto" />
                <span>Smart Hospitality</span>
              </Link>
            </div>
          </div>

          {/* TAB 1: MAIN HOME DASHBOARD */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              
              {/* ========================================================================= */}
              {/* TOP KPI CARDS GRID (4 Cards matching screenshot)                           */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1: مهام معلقه */}
                <div className="bg-[#C9D7E8] border border-slate-300/90 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
                  <div className="flex justify-center items-center gap-2 mb-1">
                    <AlertCircle size={18} className="text-amber-700" />
                    <span className="text-xs font-bold text-[#0B1B3D]">
                      {isRtl ? 'مهام معلقه' : 'Pending Tasks'}
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#0B1B3D]">8</span>
                  </div>
                  <div className="h-1 bg-slate-400/30 rounded-full overflow-hidden w-2/3 mx-auto">
                    <div className="bg-amber-600 h-full w-1/2"></div>
                  </div>
                </div>

                {/* Card 2: مهام قيد التنفيذ */}
                <div className="bg-[#C9D7E8] border border-slate-300/90 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
                  <div className="flex justify-center items-center gap-2 mb-1">
                    <Clock size={18} className="text-blue-800" />
                    <span className="text-xs font-bold text-[#0B1B3D]">
                      {isRtl ? 'مهام قيد التنفيذ' : 'In Progress Tasks'}
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#0B1B3D]">5</span>
                  </div>
                  <div className="h-1 bg-slate-400/30 rounded-full overflow-hidden w-2/3 mx-auto">
                    <div className="bg-blue-600 h-full w-3/5"></div>
                  </div>
                </div>

                {/* Card 3: مهام مكتمله */}
                <div className="bg-[#C9D7E8] border border-slate-300/90 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
                  <div className="flex justify-center items-center gap-2 mb-1">
                    <CheckCircle2 size={18} className="text-emerald-700" />
                    <span className="text-xs font-bold text-[#0B1B3D]">
                      {isRtl ? 'مهام مكتمله' : 'Completed Tasks'}
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#0B1B3D]">12</span>
                  </div>
                  <div className="h-1 bg-slate-400/30 rounded-full overflow-hidden w-2/3 mx-auto">
                    <div className="bg-emerald-600 h-full w-4/5"></div>
                  </div>
                </div>

                {/* Card 4: مهام اليوم */}
                <div className="bg-[#C9D7E8] border border-slate-300/90 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
                  <div className="flex justify-center items-center gap-2 mb-1">
                    <ListTodo size={18} className="text-amber-800" />
                    <span className="text-xs font-bold text-[#0B1B3D]">
                      {isRtl ? 'مهام اليوم' : "Today's Tasks"}
                    </span>
                  </div>
                  <div className="my-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#0B1B3D]">25</span>
                  </div>
                  <div className="h-1 bg-slate-400/30 rounded-full overflow-hidden w-2/3 mx-auto">
                    <div className="bg-[#0B1B3D] h-full w-full"></div>
                  </div>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* TWO COLUMNS SECTION (مهام اليوم + تفاصيل المهمة الحالية)                 */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT/RIGHT MAIN COLUMN: TODAY'S TASKS LIST (7 cols) */}
                <div className="lg:col-span-6 bg-[#C9D7E8] border border-slate-300 rounded-2xl p-5 shadow-sm space-y-4">
                  
                  <div className="flex justify-between items-center pb-1">
                    <h2 className="font-black text-sm text-[#0B1B3D]">
                      {isRtl ? 'مهام اليوم' : "Today's Tasks"}
                    </h2>
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className="text-xs font-extrabold text-slate-700 hover:text-[#0B1B3D] bg-white/80 hover:bg-white px-3 py-1 rounded-lg border border-slate-300/80 transition-all"
                    >
                      {isRtl ? 'عرض الكل' : 'View All'}
                    </button>
                  </div>

                  {/* List of Tasks matching screenshot cards */}
                  <div className="space-y-2.5">
                    {tasks.map((task) => {
                      const status = taskStatusState[task.id] || 'معلقه';
                      const isSelected = selectedTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`cursor-pointer rounded-xl p-3 border transition-all flex justify-between items-center shadow-2xs ${
                            isSelected
                              ? 'bg-white border-[#0B1B3D] ring-2 ring-[#0B1B3D]/20 scale-[1.01]'
                              : 'bg-white/80 border-slate-300/80 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Dark image preview square matching mockup */}
                            <div className={`w-12 h-12 rounded-xl ${task.imageBg} text-white flex items-center justify-center shrink-0 border border-slate-600 shadow-inner`}>
                              <ImageIcon size={20} className="text-slate-300" />
                            </div>

                            <div>
                              <h3 className="text-xs font-black text-[#0B1B3D]">{task.title}</h3>
                              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{task.property}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {/* Execution Time */}
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dir-ltr">
                              <Clock size={13} className="text-amber-600" />
                              <span>{task.time}</span>
                            </div>

                            {/* Status Badge matching screenshot styling */}
                            <div>
                              {status === 'قيد التنفيذ' && (
                                <span className="bg-amber-100 text-amber-900 text-[11px] font-black px-2.5 py-1 rounded-lg border border-amber-300/80 block">
                                  قيد التنفيذ
                                </span>
                              )}
                              {status === 'معلقه' && (
                                <span className="bg-amber-50 text-amber-800 text-[11px] font-black px-2.5 py-1 rounded-lg border border-amber-200 block">
                                  معلقه
                                </span>
                              )}
                              {status === 'جديده' && (
                                <span className="bg-emerald-100 text-emerald-900 text-[11px] font-black px-2.5 py-1 rounded-lg border border-emerald-300/80 block">
                                  جديده
                                </span>
                              )}
                              {status === 'مكتمله' && (
                                <span className="bg-blue-100 text-blue-900 text-[11px] font-black px-2.5 py-1 rounded-lg border border-blue-300/80 block">
                                  مكتمله
                                </span>
                              )}
                            </div>

                            {/* Context Menu Dots */}
                            <button className="text-slate-400 hover:text-slate-700 p-1">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* RIGHT/LEFT COLUMN: CURRENT TASK DETAILS (6 cols) */}
                <div className="lg:col-span-6 bg-[#C9D7E8] border border-slate-300 rounded-2xl p-5 shadow-sm space-y-5">
                  
                  <h2 className="font-black text-sm text-[#0B1B3D] text-center">
                    {isRtl ? 'تفاصيل المهمة الحالية' : 'Current Task Details'}
                  </h2>

                  {/* Task Header Title & Large Photo Placeholder matching mockup */}
                  <div className="text-center space-y-3">
                    <h3 className="font-black text-lg text-[#0B1B3D]">
                      {currentTask.title}
                    </h3>

                    {/* Large Suite Photo Box */}
                    <div className="w-full max-w-xs h-40 mx-auto rounded-xl bg-[#0B1B3D] border-2 border-slate-700 flex flex-col items-center justify-center text-white shadow-md p-4">
                      <ImageIcon size={32} className="text-slate-300 mb-2" />
                      <span className="font-bold text-xs text-slate-200">
                        {currentTask.imageLabel}
                      </span>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-600 block mb-0.5">
                      {isRtl ? 'وقت التنفيذ' : 'Execution Time'}
                    </span>
                    <span className="text-base font-black text-[#0B1B3D] font-mono">
                      {currentTask.execTime}
                    </span>
                  </div>

                  {/* Manager Notes matching mockup */}
                  <div className="bg-white/80 p-3.5 rounded-xl border border-slate-300 text-center space-y-1">
                    <span className="text-xs font-black text-[#0B1B3D] block">
                      {isRtl ? 'ملاحظات المدير' : 'Manager Notes'}
                    </span>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                      {currentTask.notes}
                    </p>
                  </div>

                  {/* Before Cleaning Photos matching mockup */}
                  <div className="space-y-2">
                    <span className="text-xs font-black text-[#0B1B3D] block text-center">
                      {isRtl ? 'صور قبل التنظيف' : 'Photos Before Cleaning'}
                    </span>

                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((idx) => (
                        <div
                          key={idx}
                          onClick={() => triggerToast(isRtl ? `إضافة صورة قبل التنظيف #${idx}` : `Uploading photo #${idx}`)}
                          className="aspect-square rounded-xl bg-[#0B1B3D] border border-slate-700 hover:border-amber-400 flex flex-col items-center justify-center text-slate-300 cursor-pointer shadow-2xs hover:scale-105 transition-all"
                        >
                          <Camera size={18} />
                          <span className="text-[9px] font-bold mt-1">+{idx}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button matching screenshot ("بدء المهمة") */}
                  <div className="pt-2">
                    <button
                      onClick={handleStartTask}
                      className={`w-full py-3.5 px-4 rounded-xl font-black text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                        currentTaskStatus === 'مكتمله'
                          ? 'bg-emerald-700 hover:bg-emerald-800'
                          : currentTaskStatus === 'قيد التنفيذ'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-[#0B1B3D] hover:bg-slate-900 active:scale-[0.99]'
                      }`}
                    >
                      <PlayCircle size={18} />
                      <span>
                        {currentTaskStatus === 'مكتمله'
                          ? (isRtl ? 'المهمة مكتملة ✓' : 'Task Completed ✓')
                          : currentTaskStatus === 'قيد التنفيذ'
                          ? (isRtl ? 'إكمال المهمة' : 'Finish Task')
                          : (isRtl ? 'بدء المهمة' : 'Start Task')}
                      </span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* OTHER TABS PLACEHOLDERS */}
          {activeTab !== 'home' && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0B1B3D]/10 text-[#0B1B3D] flex items-center justify-center mx-auto">
                <CheckSquare size={32} />
              </div>
              <h2 className="text-xl font-black text-[#0B1B3D]">
                {activeTab === 'tasks' && (isRtl ? 'قائمة جميع المهام المسندة' : 'Assigned Tasks List')}
                {activeTab === 'history' && (isRtl ? 'سجل المهام المكتملة' : 'Completed Tasks Log')}
                {activeTab === 'schedule' && (isRtl ? 'جدول المواعيد والشيفتات' : 'Schedule & Shifts')}
                {activeTab === 'notifications' && (isRtl ? 'مركز التنبيهات والاشعارات' : 'Notification Center')}
                {activeTab === 'settings' && (isRtl ? 'إعدادات الحساب الشخصي' : 'Personal Account Settings')}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isRtl ? 'قسم مهام مزود النظافة جاهز ومربوط بالكامل بالسيستم.' : 'Cleaning provider section is active and synced.'}
              </p>
              <button
                onClick={() => setActiveTab('home')}
                className="bg-[#0B1B3D] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-900 transition-all inline-block mt-2"
              >
                {isRtl ? 'العودة للرئيسية' : 'Back to Dashboard'}
              </button>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
