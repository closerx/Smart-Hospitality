import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';
import { useAuth } from '../context/AuthContext';
import { OwnerProfile } from '../types/auth';
import { Property, PropertyType } from '../types/property';
import AddPropertyModal from '../components/AddPropertyModal';
import { supabase } from '../lib/supabase';
import { safeUpdateProperty, unpackPropertyMetadata } from '../utils/propertyPersistence';
import { 
  Home, 
  Building2, 
  DoorClosed, 
  Calendar, 
  DollarSign, 
  CreditCard,
  LayoutDashboard,
  FileText, 
  Wrench, 
  Star, 
  Users, 
  Settings, 
  LogOut, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  PlusCircle, 
  Filter, 
  Search, 
  User, 
  BarChart3, 
  PieChart as PieIcon,
  ChevronRight,
  ArrowUpRight,
  Bell,
  Menu,
  X,
  Trash2,
  Edit3,
  MapPin,
  Key,
  Layers,
  Loader2,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  Download,
  Wallet,
  AlertCircle
} from 'lucide-react';

export default function OwnerDashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const { currentUser, userProfile, role, isAdmin, logout } = useAuth();
  const ownerData = userProfile as OwnerProfile | null;

  // Safety guard against role cross-over/overlap: strictly redirect admin, tenant, or cleaner to their own dashboard
  useEffect(() => {
    if (isAdmin || userProfile?.role === 'admin' || role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (userProfile?.role === 'tenant' || role === 'tenant') {
      navigate('/tenant-dashboard', { replace: true });
    } else if (userProfile?.role === 'cleaner' || role === 'cleaner') {
      navigate('/cleaner-dashboard', { replace: true });
    }
  }, [isAdmin, userProfile, role, navigate]);

  // Dynamic registered owner name resolution
  const ownerDisplayName = ownerData?.fullName || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : (isRtl ? 'المالك' : 'Owner'));
  const ownerFirstName = ownerDisplayName.split(' ')[0];

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<
    'home' | 'properties' | 'bookings' | 'tenants' | 'finance' | 'settings'
  >('home');

  // Chart time filter state
  const [chartPeriod, setChartPeriod] = useState<'current' | 'previous'>('current');

  // Interactive feedback toast
  const [toastMessage, setToastMessage] = useState('');

  // Firestore Properties State
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyToRequestDelete, setPropertyToRequestDelete] = useState<Property | null>(null);
  const [deletionReasonInput, setDeletionReasonInput] = useState('');
  const [isSubmittingDeletionRequest, setIsSubmittingDeletionRequest] = useState(false);
  const [propertySearchQuery, setPropertySearchQuery] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Fetch owner's properties directly from Supabase database
  const fetchProperties = async () => {
    if (!currentUser) {
      setIsLoadingProperties(false);
      return;
    }

    setIsLoadingProperties(true);
    let fetched: Property[] = [];

    try {
      const { data } = await supabase
        .from('properties')
        .select('*');

      if (data && data.length > 0) {
        fetched = data
          .filter((item: any) => {
            const itemOwner = item.ownerId || item.owner_id || item.owner_email;
            return !itemOwner || itemOwner === currentUser.uid || itemOwner === currentUser.id || itemOwner === currentUser.email;
          })
          .map((item: any) => {
            const { cleanDescription, meta } = unpackPropertyMetadata(item.description);
            return {
              id: item.id,
              ownerId: item.ownerId || item.owner_id || currentUser.uid,
              name: item.name || item.title || item.property_name || '',
              type: item.type,
              leaseType: item.leaseType || item.lease_type || 'daily',
              contractDuration: item.contractDuration || item.contract_duration || '3_months',
              agreedToContractTerms: item.agreedToContractTerms ?? item.agreed_to_contract_terms ?? true,
              city: item.city,
              district: item.district,
              address: item.address,
              roomsCount: item.roomsCount || item.rooms_count || 10,
              floorsCount: item.floorsCount || item.floors_count,
              smartLocksEnabled: item.smartLocksEnabled ?? item.smart_locks_enabled ?? true,
              contactPhone: item.contactPhone || item.contact_phone,
              description: cleanDescription,
              amenities: item.amenities || [],
              coverImage: item.coverImage || item.cover_image,
              images: item.images || [],
              status: item.status || 'pending_approval',
              rejectionReason: item.rejectionReason || item.rejection_reason || meta.rejectionReason,
              deletionReason: item.deletionReason || item.deletion_reason || meta.deletionReason,
              deletionRequestedAt: item.deletionRequestedAt || item.deletion_requested_at || meta.deletionRequestedAt,
              deletionRequestedBy: item.deletionRequestedBy || item.deletion_requested_by || meta.deletionRequestedBy,
              previousStatus: item.previousStatus || item.previous_status || meta.previousStatus,
              occupancyRate: item.occupancyRate ?? item.occupancy_rate ?? 0,
              createdAt: item.createdAt || item.created_at || new Date().toISOString(),
              updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
            };
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (err) {
      console.error('Error fetching properties from Supabase:', err);
    }

    setProperties(fetched);
    setIsLoadingProperties(false);
  };

  useEffect(() => {
    fetchProperties();

    // Auto-refresh on window focus and safe interval without opening brittle WebSockets
    const handleFocus = () => {
      fetchProperties();
    };
    window.addEventListener('focus', handleFocus);

    const intervalId = setInterval(() => {
      fetchProperties();
    }, 20000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, [currentUser]);

  // Dynamic Calculated Metrics
  const totalPropertiesCount = properties.length;
  const totalRoomsCount = properties.reduce((acc, p) => acc + (Number(p.roomsCount) || 0), 0);
  const avgOccupancyRate = totalPropertiesCount > 0 
    ? Math.round(properties.reduce((acc, p) => acc + (Number(p.occupancyRate) || 0), 0) / totalPropertiesCount)
    : 0;
  
  // Calculate dynamic revenue based on rooms and occupancy (e.g. avg SAR 350/room/night * 30 days)
  const totalRevenue = properties.reduce((acc, p) => {
    const activeRooms = Math.round((Number(p.roomsCount) || 0) * ((Number(p.occupancyRate) || 0) / 100));
    return acc + (activeRooms * 350 * 25);
  }, 0);

  const netProfit = Math.round(totalRevenue * 0.78);
  const operatorEarnings = Math.round(totalRevenue * 0.16);
  const serviceCosts = Math.round(totalRevenue * 0.06);

  // Submit deletion request to Administration for ANY property
  const handleSubmitDeletionRequest = async () => {
    if (!propertyToRequestDelete) return;
    setIsSubmittingDeletionRequest(true);
    try {
      const now = new Date().toISOString();
      const reason = deletionReasonInput.trim() || (isRtl ? 'طلب المالك حذف واستبعاد العقار' : 'Owner requested property deletion');
      const prevStatus = propertyToRequestDelete.status !== 'deletion_requested' ? propertyToRequestDelete.status : 'pending_approval';

      await safeUpdateProperty(propertyToRequestDelete.id, {
        status: 'deletion_requested',
        currentDescription: propertyToRequestDelete.description,
        deletionReason: reason,
        deletionRequestedAt: now,
        deletionRequestedBy: currentUser?.email || 'owner',
        previousStatus: prevStatus,
      });

      setProperties(prev => prev.map(p => 
        p.id === propertyToRequestDelete.id
          ? {
              ...p,
              status: 'deletion_requested',
              deletionReason: reason,
              deletionRequestedAt: now,
              deletionRequestedBy: currentUser?.email || 'owner',
              previousStatus: prevStatus
            }
          : p
      ));

      setIsSubmittingDeletionRequest(false);
      setPropertyToRequestDelete(null);
      setDeletionReasonInput('');
      triggerToast(
        isRtl
          ? `تم رفع طلب حذف عقار "${propertyToRequestDelete.name}" لإدارة المنصة بنجاح. ستقوم الإدارة بمراجعته.`
          : `Deletion request for "${propertyToRequestDelete.name}" submitted to platform administration.`
      );
    } catch (err) {
      setIsSubmittingDeletionRequest(false);
      console.error('Error submitting deletion request:', err);
      triggerToast(isRtl ? 'حدث خطأ أثناء إرسال طلب الحذف للإدارة.' : 'Failed to submit deletion request.');
    }
  };

  // Cancel deletion request (restore to previous status)
  const handleCancelDeletionRequest = async (prop: Property) => {
    try {
      const targetStatus = prop.previousStatus || (prop.reviewedAt ? 'active' : 'pending_approval');
      await safeUpdateProperty(prop.id, {
        status: targetStatus,
        currentDescription: prop.description,
        deletionReason: null,
        deletionRequestedAt: null,
        deletionRequestedBy: null,
      });

      setProperties(prev => prev.map(p => 
        p.id === prop.id
          ? { ...p, status: targetStatus, deletionReason: undefined, deletionRequestedAt: undefined }
          : p
      ));

      triggerToast(
        isRtl
          ? `تم إلغاء طلب الحذف وإعادة عقار "${prop.name}".`
          : `Deletion request cancelled. Property "${prop.name}" restored.`
      );
    } catch (err) {
      console.error('Error cancelling deletion request:', err);
      triggerToast(isRtl ? 'حدث خطأ أثناء إلغاء طلب الحذف.' : 'Failed to cancel deletion request.');
    }
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

  // Mock Recent Bookings matching mockup
  const [recentBookings, setRecentBookings] = useState([
    { id: 1, guest: 'ساره السبيعي', propertyRoom: `${properties[0]?.name || 'برج الضيافة'}-غرفة 22`, date: '2026/06/26', status: 'مؤكدة', statusType: 'green' },
    { id: 2, guest: 'فيصل الشمري', propertyRoom: `${properties[0]?.name || 'مجمع النخيل'}-جناح 104`, date: '2026/06/26', status: 'مؤكدة', statusType: 'green' },
    { id: 3, guest: 'خالد المطيري', propertyRoom: `${properties[1]?.name || 'أبراج السحاب'}-غرفة 12`, date: '2026/06/26', status: 'قيد الانتظار', statusType: 'yellow' },
  ]);

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
              <span className="font-black text-sm text-white">لوحة المالك</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white text-[#0B1B3D] flex items-center justify-center font-bold text-xs">
              <User size={18} />
            </div>
            <span className="font-bold text-xs text-white">{ownerFirstName}</span>
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
            <div className="relative w-72 max-w-[85%] bg-[#0B1B3D] text-white flex flex-col justify-between p-5 shadow-2xl z-10 h-full overflow-y-auto">
              <div>
                {/* Header matching screenshot */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Building2 size={22} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-sm text-white truncate">
                        {ownerData?.officeName || ownerDisplayName || (isRtl ? 'شركة ريادة للعقارات' : 'Riyadah Real Estate')}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {isRtl ? 'صاحب عقار' : 'Property Owner'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Main Nav Items */}
                <nav className="space-y-1.5">
                  {[
                    { id: 'home', icon: LayoutDashboard, label: isRtl ? 'لوحة التحكم' : 'Dashboard' },
                    { id: 'properties', icon: Building2, label: isRtl ? 'عقاراتي' : 'My Properties' },
                    { id: 'bookings', icon: Calendar, label: isRtl ? 'الحجوزات' : 'Bookings' },
                    { id: 'tenants', icon: Users, label: isRtl ? 'المستأجرين' : 'Tenants' },
                    { id: 'finance', icon: CreditCard, label: isRtl ? 'المالية' : 'Finance' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                          isActive
                            ? 'bg-slate-800/90 text-white shadow-sm'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon size={20} className={isActive ? 'text-white' : 'text-slate-300'} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Items: Settings & Logout */}
              <div className="pt-4 border-t border-white/10 mt-6 space-y-1.5">
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    activeTab === 'settings'
                      ? 'bg-slate-800/90 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Settings size={20} className="text-slate-300" />
                  <span>{isRtl ? 'الإعدادات' : 'Settings'}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-red-400 hover:text-red-300 hover:bg-white/5 font-bold text-sm transition-all cursor-pointer"
                >
                  <LogOut size={20} className="text-red-400" />
                  <span>{isRtl ? 'تسجيل الخروج' : 'Log Out'}</span>
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
            {/* Owner Header Profile */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Building2 size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm text-white truncate">
                  {ownerData?.officeName || ownerDisplayName || (isRtl ? 'شركة ريادة للعقارات' : 'Riyadah Real Estate')}
                </h3>
                <span className="inline-block text-xs text-slate-400 font-medium">
                  {isRtl ? 'صاحب عقار' : 'Property Owner'}
                </span>
              </div>
            </div>

            {/* Sidebar Navigation Menu */}
            <nav className="space-y-1.5">
              {[
                { id: 'home', icon: LayoutDashboard, label: isRtl ? 'لوحة التحكم' : 'Dashboard' },
                { id: 'properties', icon: Building2, label: isRtl ? 'عقاراتي' : 'My Properties' },
                { id: 'bookings', icon: Calendar, label: isRtl ? 'الحجوزات' : 'Bookings' },
                { id: 'tenants', icon: Users, label: isRtl ? 'المستأجرين' : 'Tenants' },
                { id: 'finance', icon: CreditCard, label: isRtl ? 'المالية' : 'Finance' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                      isActive
                        ? 'bg-slate-800/90 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-300'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Settings & Logout */}
          <div className="pt-4 border-t border-white/10 mt-6 space-y-1.5">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === 'settings'
                  ? 'bg-slate-800/90 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings size={20} className="text-slate-300" />
              <span>{isRtl ? 'الإعدادات' : 'Settings'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-red-400 hover:text-red-300 hover:bg-white/5 font-bold text-sm transition-all cursor-pointer"
            >
              <LogOut size={20} className="text-red-400" />
              <span>{isRtl ? 'تسجيل الخروج' : 'Log Out'}</span>
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
                {isRtl ? `مرحبا بك، ${ownerFirstName}` : `Welcome back, ${ownerFirstName}`}
              </h1>
              <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
                {isRtl ? 'تابع أداء عقاراتك وإيراداتك من مكان واحد.' : 'Track your property performance and revenue from one place.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#0B1B3D] px-4 py-2 rounded-xl font-bold text-xs transition-colors">
                <img src={logoImg} alt="Smart Hospitality" className="h-6 w-auto" />
                <span>Smart Hospitality</span>
              </Link>
            </div>
          </div>

          {/* TAB 1: HOME DASHBOARD OVERVIEW */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              
              {/* ========================================================================= */}
              {/* TOP KPI CARDS GRID (ROW 1: 4 Cards)                                       */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1: عدد الغرف */}
                <div className="bg-[#C9D7E8] border border-slate-300/90 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
                  <span className="text-xs font-bold text-[#0B1B3D] block mb-1">
                    {isRtl ? 'عدد الغرف' : 'Total Rooms'}
                  </span>
                  <div className="my-2">
                    <span className="text-3xl sm:text-4xl font-black text-[#0B1B3D]">{totalRoomsCount}</span>
                    <span className="text-xs font-bold text-slate-600 me-2 ms-1">{isRtl ? 'غرفة' : 'Rooms'}</span>
                  </div>
                  <div className="h-1 bg-slate-400/30 rounded-full overflow-hidden w-2/3 mx-auto">
                    <div className="bg-[#0B1B3D] h-full w-4/5"></div>
                  </div>
                </div>

                {/* Card 2: عدد العقارات */}
                <div className="bg-[#C9D7E8] border border-slate-300/90 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
                  <span className="text-xs font-bold text-[#0B1B3D] block mb-1">
                    {isRtl ? 'عدد العقارات' : 'Total Properties'}
                  </span>
                  <div className="my-2">
                    <span className="text-3xl sm:text-4xl font-black text-[#0B1B3D]">{totalPropertiesCount}</span>
                    <span className="text-xs font-bold text-slate-600 me-2 ms-1">{isRtl ? 'عقار' : 'Properties'}</span>
                  </div>
                  <div className="h-1 bg-slate-400/30 rounded-full overflow-hidden w-2/3 mx-auto">
                    <div className="bg-[#0B1B3D] h-full w-full"></div>
                  </div>
                </div>

                {/* Card 3: نسبة الاشغال */}
                <div className="bg-[#C9D7E8] border border-slate-300/90 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#0B1B3D]">
                      {isRtl ? 'نسبة الاشغال' : 'Occupancy Rate'}
                    </span>
                    {/* Green Bar Icon */}
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <BarChart3 size={15} />
                    </div>
                  </div>
                  <div className="my-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#0B1B3D]">{avgOccupancyRate}%</span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md inline-block mx-auto">
                    {avgOccupancyRate > 0 ? `+${Math.min(avgOccupancyRate, 12)}%` : '0%'} {isRtl ? 'معدل النشاط' : 'Active rate'}
                  </div>
                </div>

                {/* Card 4: أجمالي الايرادات */}
                <div className="bg-[#C9D7E8] border border-slate-300/90 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#0B1B3D]">
                      {isRtl ? 'أجمالي الايرادات' : 'Total Revenue'}
                    </span>
                    <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      <DollarSign size={15} />
                    </div>
                  </div>
                  <div className="my-1">
                    <span className="text-2xl sm:text-3xl font-black text-[#0B1B3D]">
                      {totalRevenue > 0 ? totalRevenue.toLocaleString('en-US') : '0'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 block mt-0.5">{isRtl ? 'ريال سعودي' : 'SAR'}</span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md inline-block mx-auto">
                    {totalRevenue > 0 ? '+75.7%' : '0%'} {isRtl ? 'تقديري للشهر' : 'est. monthly'}
                  </div>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* SECOND KPI CARDS ROW (ROW 2: 3 Cards)                                    */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Net Profit: صافي الربح */}
                <div className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-xs text-center flex justify-between items-center">
                  <span className="text-xs font-black text-[#0B1B3D]">
                    {isRtl ? 'صافي الربح:' : 'Net Profit:'}
                  </span>
                  <div>
                    <span className="text-xl font-black text-[#0B1B3D]">
                      {netProfit > 0 ? netProfit.toLocaleString('en-US') : '0'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 ms-1.5">{isRtl ? 'ريال سعودي' : 'SAR'}</span>
                  </div>
                </div>

                {/* Operator Share: أرباح المشغل */}
                <div className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-xs text-center flex justify-between items-center">
                  <span className="text-xs font-black text-[#0B1B3D]">
                    {isRtl ? 'أرباح المشغل:' : 'Operator Earnings:'}
                  </span>
                  <div>
                    <span className="text-xl font-black text-[#0B1B3D]">
                      {operatorEarnings > 0 ? operatorEarnings.toLocaleString('en-US') : '0'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 ms-1.5">{isRtl ? 'ريال سعودي' : 'SAR'}</span>
                  </div>
                </div>

                {/* Services & Cleaning Expenses: تكاليف الخدمات والنظافه */}
                <div className="bg-white border border-slate-300/90 rounded-2xl p-4 shadow-xs text-center flex justify-between items-center">
                  <span className="text-xs font-black text-[#0B1B3D]">
                    {isRtl ? 'تكاليف الخدمات والنظافه:' : 'Service & Cleaning Costs:'}
                  </span>
                  <div>
                    <span className="text-xl font-black text-[#0B1B3D]">
                      {serviceCosts > 0 ? serviceCosts.toLocaleString('en-US') : '0'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 ms-1.5">{isRtl ? 'ريال سعودي' : 'SAR'}</span>
                  </div>
                </div>

              </div>

              {/* ========================================================================= */}
              {/* CHARTS ROW (Revenue Wave Chart + Bookings Donut Chart)                   */}
              {/* ========================================================================= */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left Area Chart Box matching mockup visual */}
                <div className="lg:col-span-7 bg-[#C9D7E8] border border-slate-300 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  
                  {/* Period selector buttons at top left */}
                  <div className="flex justify-start items-center gap-2 mb-4">
                    <button
                      onClick={() => setChartPeriod('current')}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all border ${
                        chartPeriod === 'current'
                          ? 'bg-white text-[#0B1B3D] border-slate-400 shadow-xs'
                          : 'bg-transparent text-slate-600 border-transparent hover:bg-white/40'
                      }`}
                    >
                      {isRtl ? 'هذا الشهر' : 'This Month'}
                    </button>
                    <button
                      onClick={() => setChartPeriod('previous')}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all border ${
                        chartPeriod === 'previous'
                          ? 'bg-white text-[#0B1B3D] border-slate-400 shadow-xs'
                          : 'bg-transparent text-slate-600 border-transparent hover:bg-white/40'
                      }`}
                    >
                      {isRtl ? 'الشهر السابق' : 'Previous Month'}
                    </button>
                  </div>

                  {/* SVG Wave Chart Container */}
                  <div className="relative w-full h-52 bg-white/60 rounded-xl p-3 border border-slate-300/80 flex flex-col justify-between overflow-hidden">
                    
                    {/* Y-Axis Label Percentages */}
                    <div className="absolute inset-y-2 start-2 flex flex-col justify-between text-[10px] font-bold text-slate-600 z-10 pointer-events-none">
                      <span>100%</span>
                      <span>75%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>

                    {/* SVG Graphic with Gradient Wave */}
                    <div className="w-full h-full ps-8 pb-5">
                      <svg viewBox="0 0 500 150" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0B1B3D" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.2" />
                          </linearGradient>
                        </defs>
                        {/* Background lines */}
                        <line x1="0" y1="10" x2="500" y2="10" stroke="#CBD5E1" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#CBD5E1" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="0" y1="90" x2="500" y2="90" stroke="#CBD5E1" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="0" y1="130" x2="500" y2="130" stroke="#CBD5E1" strokeDasharray="3 3" strokeWidth="1" />

                        {/* Wave Fill Area */}
                        <path 
                          d="M0,110 Q40,60 80,100 T160,80 T240,110 T320,50 T400,40 T500,100 L500,130 L0,130 Z" 
                          fill="url(#waveGradient)" 
                        />
                        {/* Smooth Line Stroke */}
                        <path 
                          d="M0,110 Q40,60 80,100 T160,80 T240,110 T320,50 T400,40 T500,100" 
                          fill="none" 
                          stroke="#0B1B3D" 
                          strokeWidth="3.5" 
                        />
                      </svg>
                    </div>

                    {/* X-Axis Timeline Dates */}
                    <div className="flex justify-between text-[10px] font-extrabold text-slate-700 ps-8 pe-2 pt-1 border-t border-slate-300">
                      <span>1 يونيو</span>
                      <span>5 يونيو</span>
                      <span>10 يونيو</span>
                      <span>15 يونيو</span>
                      <span>20 يونيو</span>
                      <span>25 يونيو</span>
                      <span>30 يونيو</span>
                    </div>
                  </div>

                </div>

                {/* Right Donut Chart Box (توزيع الحجوزات) */}
                <div className="lg:col-span-5 bg-[#C9D7E8] border border-slate-300 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <h3 className="font-black text-center text-sm text-[#0B1B3D] mb-2">
                    {isRtl ? 'توزيع الحجوزات' : 'Booking Distribution'}
                  </h3>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto py-2">
                    {/* SVG Donut Chart */}
                    <div className="relative w-36 h-36 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        {/* Pending (Orange) */}
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#E67E22" strokeWidth="6" strokeDasharray="25 75" strokeDashoffset="0" />
                        {/* Confirmed (Green) */}
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#27AE60" strokeWidth="6" strokeDasharray="55 45" strokeDashoffset="-25" />
                        {/* Cancelled (Light Gray) */}
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="6" strokeDasharray="20 80" strokeDashoffset="-80" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col text-center">
                        <span className="font-black text-lg text-[#0B1B3D]">100%</span>
                        <span className="text-[9px] font-bold text-slate-600">{isRtl ? 'إجمالي' : 'Total'}</span>
                      </div>
                    </div>

                    {/* Legend Labels matching image */}
                    <div className="space-y-3 text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#E67E22]"></span>
                        <span>{isRtl ? 'قيد الانتظار' : 'Pending'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#27AE60]"></span>
                        <span>{isRtl ? 'مؤكدة' : 'Confirmed'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-[#E2E8F0] border border-slate-400"></span>
                        <span>{isRtl ? 'ملغاة' : 'Cancelled'}</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* ========================================================================= */}
              {/* BOTTOM ROW (Recent Bookings)                                              */}
              {/* ========================================================================= */}
              <div>
                {/* Card: احدث الحجوزات */}
                <div className="bg-[#C9D7E8] border border-slate-300 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-black text-sm text-[#0B1B3D]">
                      {isRtl ? 'احدث الحجوزات' : 'Recent Bookings'}
                    </h3>
                    <button 
                      onClick={() => setActiveTab('bookings')}
                      className="text-xs font-extrabold text-slate-700 hover:text-[#0B1B3D] bg-white/80 hover:bg-white px-3 py-1 rounded-lg border border-slate-300/80 transition-all"
                    >
                      {isRtl ? 'عرض الكل' : 'View All'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {recentBookings.map((bk) => (
                      <div key={bk.id} className="bg-white/80 rounded-xl p-3 border border-slate-300/80 flex justify-between items-center shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0B1B3D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {bk.guest.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-[#0B1B3D]">{bk.guest}</h4>
                            <p className="text-[10px] font-medium text-slate-500">{bk.propertyRoom}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-600 font-bold hidden sm:inline">{bk.date}</span>
                          {bk.statusType === 'green' && (
                            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-lg border border-emerald-300/60">
                              {bk.status}
                            </span>
                          )}
                          {bk.statusType === 'red' && (
                            <span className="bg-rose-100 text-rose-800 text-[11px] font-black px-3 py-1 rounded-lg border border-rose-300/60">
                              {bk.status}
                            </span>
                          )}
                          {bk.statusType === 'yellow' && (
                            <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-3 py-1 rounded-lg border border-amber-300/60">
                              {bk.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PROPERTIES (العقارات) */}
          {activeTab === 'properties' && (
            <div className="space-y-6">
              
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h2 className="font-black text-xl text-[#0B1B3D]">
                    {isRtl ? `إدارة العقارات (${properties.length} عقار)` : `Properties Management (${properties.length} Properties)`}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {isRtl 
                      ? 'جميع عقاراتك المسجلة والمحفوظة في قاعدة بياناتك الخاصة بالسحابة.' 
                      : 'All properties associated with your owner account in Firestore.'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingProperty(null);
                    setIsAddModalOpen(true);
                  }}
                  className="bg-[#0B1B3D] hover:bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md inline-flex items-center gap-2 transition-all hover:scale-105 shrink-0"
                >
                  <PlusCircle size={16} className="text-amber-400" />
                  <span>{isRtl ? '+ إضافة عقار جديد' : '+ Add New Property'}</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
                  <input
                    type="text"
                    value={propertySearchQuery}
                    onChange={(e) => setPropertySearchQuery(e.target.value)}
                    placeholder={isRtl ? 'ابحث باسم العقار، المدينة، أو الحي...' : 'Search by name, city, or district...'}
                    className="w-full bg-white border border-slate-200 rounded-xl ps-9 pe-4 py-2.5 text-xs font-bold text-[#0B1B3D] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]"
                  />
                </div>

                <select
                  value={propertyTypeFilter}
                  onChange={(e) => setPropertyTypeFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-[#0B1B3D] focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]"
                >
                  <option value="all">{isRtl ? 'جميع أنواع العقارات' : 'All Types'}</option>
                  <option value="hotel">{isRtl ? 'فندق' : 'Hotel'}</option>
                  <option value="building">{isRtl ? 'برج / عمارة سكنية' : 'Residential Building'}</option>
                  <option value="apartments">{isRtl ? 'شقق مخدومة' : 'Serviced Apartments'}</option>
                  <option value="resort">{isRtl ? 'منتجع' : 'Resort'}</option>
                  <option value="villa">{isRtl ? 'فيلا / شاليه' : 'Villa / Chalet'}</option>
                  <option value="compound">{isRtl ? 'مجمع سكني' : 'Compound'}</option>
                </select>
              </div>

              {/* Loading State */}
              {isLoadingProperties && (
                <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
                  <Loader2 size={36} className="animate-spin text-[#0B1B3D] mx-auto" />
                  <p className="text-xs font-bold text-slate-500">
                    {isRtl ? 'جاري تحميل عقاراتك من قاعدة البيانات...' : 'Loading your properties from database...'}
                  </p>
                </div>
              )}

              {/* Zero State / Empty List */}
              {!isLoadingProperties && properties.length === 0 && (
                <div className="bg-white rounded-2xl p-10 border border-dashed border-slate-300 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0B1B3D] flex items-center justify-center mx-auto border border-blue-100">
                    <Building2 size={32} />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-black text-[#0B1B3D]">
                      {isRtl ? 'لم تقم بإضافة أي عقار حتى الآن' : 'No properties added yet'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isRtl 
                        ? 'أضف عقارك الأول الآن ليتم ربطه بحسابك وتخزينه في قاعدة البيانات، وتفعيل إدارة الغرف والحجوزات والأقفال الذكية.'
                        : 'Add your first property to store it in your Firestore account and start managing rooms and locks.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProperty(null);
                      setIsAddModalOpen(true);
                    }}
                    className="bg-[#0B1B3D] hover:bg-slate-900 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md inline-flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <PlusCircle size={16} className="text-amber-400" />
                    <span>{isRtl ? 'إضافة أول عقار الآن' : 'Add First Property'}</span>
                  </button>
                </div>
              )}

              {/* Properties Grid */}
              {!isLoadingProperties && properties.length > 0 && (() => {
                const filtered = properties.filter((p) => {
                  const propName = (p.name || '').toLowerCase();
                  const propCity = (p.city || '').toLowerCase();
                  const propDistrict = (p.district || '').toLowerCase();
                  const q = propertySearchQuery.toLowerCase().trim();
                  const matchesSearch = !q || propName.includes(q) || propCity.includes(q) || propDistrict.includes(q);
                  const matchesType = propertyTypeFilter === 'all' || p.type === propertyTypeFilter;
                  return matchesSearch && matchesType;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                        <Search size={22} />
                      </div>
                      <h3 className="text-sm font-black text-[#0B1B3D]">
                        {isRtl ? 'لا توجد عقارات مطابقة لمعايير البحث' : 'No properties match your search'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isRtl ? 'جرب تغيير كلمة البحث أو اختيار نوع عقار آخر.' : 'Try changing your search keywords or filter.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPropertySearchQuery('');
                          setPropertyTypeFilter('all');
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0B1B3D] text-xs font-bold rounded-xl transition-all"
                      >
                        {isRtl ? 'إعادة ضبط البحث' : 'Reset Search'}
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {filtered.map((p) => {
                      const getPropertyTypeLabel = (type: PropertyType) => {
                        switch (type) {
                          case 'hotel': return isRtl ? 'فندق' : 'Hotel';
                          case 'building': return isRtl ? 'برج سكني' : 'Residential Building';
                          case 'apartments': return isRtl ? 'شقق مخدومة' : 'Serviced Apartments';
                          case 'resort': return isRtl ? 'منتجع' : 'Resort';
                          case 'villa': return isRtl ? 'فيلا / شاليه' : 'Villa';
                          case 'compound': return isRtl ? 'مجمع سكني' : 'Compound';
                          default: return isRtl ? 'عقار' : 'Property';
                        }
                      };

                      const amenityLabels: Record<string, { ar: string; en: string }> = {
                        pool: { ar: 'مسبح', en: 'Pool' },
                        wifi: { ar: 'واي فاي', en: 'Wi-Fi' },
                        parking: { ar: 'موقف سيارات', en: 'Parking' },
                        kitchen: { ar: 'مطبخ', en: 'Kitchen' },
                        outdoor_seating: { ar: 'جلسات خارجية', en: 'Outdoor' },
                        cameras: { ar: 'كاميرات مراقبة', en: 'Cameras' },
                        'مسبح': { ar: 'مسبح', en: 'Pool' },
                        'واي فاي': { ar: 'واي فاي', en: 'Wi-Fi' },
                        'موقف سيارات': { ar: 'موقف سيارات', en: 'Parking' },
                        'مطبخ': { ar: 'مطبخ', en: 'Kitchen' },
                        'جلسات خارجية': { ar: 'جلسات خارجية', en: 'Outdoor' },
                        'كاميرات مراقبة': { ar: 'كاميرات مراقبة', en: 'Cameras' },
                      };

                      const isPending = p.status === 'pending_approval';
                      const isRejected = p.status === 'rejected';

                      return (
                        <div 
                          key={p.id} 
                          className={`${
                            isPending 
                              ? 'bg-slate-100/90 border border-slate-300 shadow-xs' 
                              : isRejected
                              ? 'bg-red-50/50 border border-red-200 shadow-xs'
                              : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
                          } rounded-2xl p-5 space-y-4 transition-all relative overflow-hidden flex flex-col justify-between`}
                        >
                          
                          {/* Top Card Info */}
                          <div>
                            {/* Management Review Alert Banner when pending */}
                            {isPending && (
                              <div className="bg-slate-200/90 border border-slate-300/80 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 mb-3.5 shadow-2xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Clock size={15} className="text-amber-600 shrink-0 animate-pulse" />
                                  <span className="truncate">
                                    {isRtl ? 'جاري مراجعة ومطابقة بيانات العقار من قبل الإدارة' : 'Reviewing property data by management'}
                                  </span>
                                </div>
                                <span className="text-[10px] bg-slate-300/90 text-slate-800 px-2 py-0.5 rounded font-black shrink-0">
                                  {isRtl ? '1 - 3 أيام عمل' : '1-3 days'}
                                </span>
                              </div>
                            )}

                            {/* Rejection Alert Banner when rejected */}
                            {isRejected && (
                              <div className="bg-red-100/80 border border-red-200 text-red-900 px-3 py-2.5 rounded-xl text-xs font-medium space-y-1 mb-3.5">
                                <div className="flex items-center gap-1.5 font-bold text-red-800">
                                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                                  <span>{isRtl ? 'ملاحظة الإدارة عند المراجعة:' : 'Management Review Note:'}</span>
                                </div>
                                <p className="text-[11px] text-red-950 ps-5">
                                  {p.rejectionReason || (isRtl ? 'يرجى مراجعة البيانات والصور المرفقة وتعديلها.' : 'Please review and update details.')}
                                </p>
                              </div>
                            )}

                            {/* Optional Cover Image Preview */}
                            {p.coverImage && (
                              <div className={`relative w-full h-36 rounded-xl overflow-hidden mb-3.5 border border-slate-200/80 bg-slate-200/50 ${isPending ? 'grayscale-[40%] opacity-85' : ''}`}>
                                <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover" />
                                {isPending && (
                                  <span className="absolute top-2 end-2 bg-slate-900/80 backdrop-blur-xs text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                    <Clock size={11} className="text-amber-400" />
                                    <span>{isRtl ? 'بانتظار الموافقة' : 'Awaiting Approval'}</span>
                                  </span>
                                )}
                                {p.images && p.images.length > 0 && (
                                  <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <span>+{p.images.length}</span>
                                    <span>{isRtl ? 'صور' : 'photos'}</span>
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className={`font-black text-base ${isPending ? 'text-slate-800' : 'text-[#0B1B3D]'}`}>
                                    {p.name}
                                  </h3>
                                  <span className="bg-slate-200/80 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded-md border border-slate-300">
                                    {getPropertyTypeLabel(p.type)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                  <MapPin size={13} className="text-slate-400 shrink-0" />
                                  <span>{p.city} {p.district ? `- حي ${p.district}` : ''}</span>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1 ${
                                p.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60' 
                                  : p.status === 'pending_approval'
                                  ? 'bg-slate-200 text-slate-700 border border-slate-300'
                                  : p.status === 'deletion_requested'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : p.status === 'rejected'
                                  ? 'bg-red-100 text-red-800 border border-red-300/60'
                                  : p.status === 'maintenance'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300/60'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300/60'
                              }`}>
                                {p.status === 'pending_approval' && (
                                  <>
                                    <Clock size={12} className="text-amber-600 shrink-0" />
                                    <span>{isRtl ? 'قيد المراجعة' : 'Under Review'}</span>
                                  </>
                                )}
                                {p.status === 'deletion_requested' && (
                                  <>
                                    <Clock size={12} className="text-rose-600 animate-pulse shrink-0" />
                                    <span>{isRtl ? 'طلب الحذف قيد المراجعة' : 'Deletion Requested'}</span>
                                  </>
                                )}
                                {p.status === 'rejected' && (
                                  <>
                                    <AlertCircle size={12} className="text-red-600 shrink-0" />
                                    <span>{isRtl ? 'طلب مرفوض' : 'Rejected'}</span>
                                  </>
                                )}
                                {p.status === 'active' && (isRtl ? 'نشط' : 'Active')}
                                {p.status === 'maintenance' && (isRtl ? 'تحت الصيانة' : 'Maintenance')}
                                {p.status === 'inactive' && (isRtl ? 'غير نشط' : 'Inactive')}
                              </span>
                            </div>

                            {/* Informational Callout when deletion is requested */}
                            {p.status === 'deletion_requested' && (
                              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="flex items-center gap-1.5 text-xs font-black text-rose-800">
                                    <AlertCircle size={14} className="shrink-0" />
                                    <span>{isRtl ? 'طلب حذف العقار قيد دراسة الإدارة' : 'Deletion Request Under Review'}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelDeletionRequest(p)}
                                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline"
                                  >
                                    {isRtl ? 'تراجع وإلغاء الطلب' : 'Cancel Request'}
                                  </button>
                                </div>
                                {p.deletionReason && (
                                  <p className="text-[11px] text-slate-700 bg-white/90 p-2 rounded-lg border border-rose-100 font-medium leading-relaxed">
                                    <strong className="text-rose-900">{isRtl ? 'السبب المسجل:' : 'Reason:'} </strong>
                                    {p.deletionReason}
                                  </p>
                                )}
                                <p className="text-[10px] text-slate-500">
                                  {isRtl ? 'تقوم إدارة المنصة بمراجعة السجلات والتأكد من خلو العقار من أي حجوزات سارية قبل الاعتماد النهائي.' : 'Platform admin is verifying records for active reservations before permanent deletion.'}
                                </p>
                              </div>
                            )}

                            {/* Features & Metrics Row */}
                            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/70 text-center">
                              <div className="bg-slate-200/60 p-2 rounded-xl">
                                <span className="text-[10px] text-slate-500 block font-bold">{isRtl ? 'الغرف' : 'Rooms'}</span>
                                <span className="text-sm font-black text-[#0B1B3D]">{p.roomsCount || 0}</span>
                              </div>

                              <div className="bg-slate-200/60 p-2 rounded-xl">
                                <span className="text-[10px] text-slate-500 block font-bold">{isRtl ? 'الطوابق' : 'Floors'}</span>
                                <span className="text-sm font-black text-[#0B1B3D]">{p.floorsCount || 1}</span>
                              </div>

                              <div className="bg-slate-200/60 p-2 rounded-xl">
                                <span className="text-[10px] text-slate-500 block font-bold">{isRtl ? 'الإشغال' : 'Occupancy'}</span>
                                <span className="text-sm font-black text-emerald-700">{p.occupancyRate || 0}%</span>
                              </div>
                            </div>

                            {/* Contract duration and lease type badge */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {p.leaseType && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-200/70 px-2.5 py-1 rounded-lg border border-slate-300">
                                  <span>{isRtl ? 'التأجير:' : 'Lease:'}</span>
                                  <span className="text-[#0B1B3D] font-black">
                                    {p.leaseType === 'daily' ? (isRtl ? 'يومي' : 'Daily') : (isRtl ? 'شهري / سنوي' : 'Monthly/Annual')}
                                  </span>
                                </span>
                              )}

                              {p.contractDuration && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-200/70 px-2.5 py-1 rounded-lg border border-slate-300">
                                  <span>{isRtl ? 'عقد تشغيلي:' : 'Contract:'}</span>
                                  <span className="font-black text-[#0B1B3D]">
                                    {p.contractDuration === '3_months' && (isRtl ? '3 أشهر' : '3 Months')}
                                    {p.contractDuration === '6_months' && (isRtl ? '6 أشهر' : '6 Months')}
                                    {p.contractDuration === '1_year' && (isRtl ? 'سنة واحدة' : '1 Year')}
                                  </span>
                                </span>
                              )}

                              {p.smartLocksEnabled && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  <Key size={12} className="text-emerald-600" />
                                  <span>{isRtl ? 'أقفال ذكية' : 'Smart Locks'}</span>
                                </span>
                              )}
                            </div>

                            {/* Amenities Badges if any */}
                            {p.amenities && p.amenities.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400">{isRtl ? 'المرافق:' : 'Amenities:'}</span>
                                {p.amenities.map((aId) => (
                                  <span key={aId} className="bg-slate-200/80 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-300">
                                    {isRtl ? (amenityLabels[aId]?.ar || aId) : (amenityLabels[aId]?.en || aId)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingProperty(p);
                                  setIsAddModalOpen(true);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-700 hover:text-[#0B1B3D] hover:bg-slate-100 font-bold transition-all"
                              >
                                <Edit3 size={14} />
                                <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                              </button>

                              {p.status === 'deletion_requested' ? (
                                <button
                                  onClick={() => handleCancelDeletionRequest(p)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-indigo-700 hover:bg-indigo-50 font-bold transition-all cursor-pointer"
                                  title={isRtl ? 'التراجع عن طلب الحذف' : 'Cancel Deletion'}
                                >
                                  <XCircle size={14} />
                                  <span>{isRtl ? 'إلغاء طلب الحذف' : 'Cancel Deletion'}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setPropertyToRequestDelete(p);
                                    setDeletionReasonInput('');
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold transition-all cursor-pointer"
                                  title={isRtl ? 'طلب حذف العقار عبر الإدارة' : 'Request Deletion'}
                                >
                                  <Trash2 size={14} />
                                  <span>{isRtl ? 'طلب حذف العقار' : 'Request Deletion'}</span>
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: BOOKINGS MANAGEMENT (الحجوزات)                                    */}
          {/* ========================================================================= */}
          {activeTab === 'bookings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#0B1B3D]">
                    {isRtl ? 'إدارة الحجوزات والنزلاء' : 'Bookings & Reservations'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {isRtl ? 'متابعة وتأكيد حجوزات العقارات والوحدات السكنية' : 'Manage and monitor all property reservations'}
                  </p>
                </div>
              </div>

              {/* Bookings KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-bold">{isRtl ? 'إجمالي الحجوزات' : 'Total Bookings'}</p>
                  <p className="text-2xl font-black text-[#0B1B3D] mt-1">28</p>
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                    <TrendingUp size={12} /> +12% {isRtl ? 'هذا الشهر' : 'this month'}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-bold">{isRtl ? 'حجوزات نشطة' : 'Active Now'}</p>
                  <p className="text-2xl font-black text-amber-500 mt-1">6</p>
                  <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                    {isRtl ? 'نزلاء مقيمين حالياً' : 'Current checked-in guests'}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-bold">{isRtl ? 'قيد الانتظار' : 'Pending'}</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">3</p>
                  <span className="text-[11px] text-blue-600 font-bold mt-1 block">
                    {isRtl ? 'تحتاج تأكيد' : 'Requires approval'}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-bold">{isRtl ? 'مكتملة' : 'Completed'}</p>
                  <p className="text-2xl font-black text-slate-700 mt-1">19</p>
                  <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                    {isRtl ? 'تمت بنجاح' : 'Checked out successfully'}
                  </span>
                </div>
              </div>

              {/* Bookings List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={bookingSearchQuery}
                      onChange={(e) => setBookingSearchQuery(e.target.value)}
                      placeholder={isRtl ? 'ابحث باسم النزيل أو العقار...' : 'Search by guest or property...'}
                      className="w-full ps-9 pe-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B1B3D]"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {[
                    { id: 'BK-9401', guest: 'محمد عبدالله الشمري', property: 'برج الأفق الفندقي', unit: 'جناح 402', checkIn: '2026-08-20', checkOut: '2026-08-26', total: '4,200 ر.س', status: 'نشط' },
                    { id: 'BK-9402', guest: 'سارة خالد العتيبي', property: 'شاليهات النخيل', unit: 'فيلا 12', checkIn: '2026-08-24', checkOut: '2026-08-27', total: '2,850 ر.س', status: 'قيد الانتظار' },
                    { id: 'BK-9403', guest: 'عبدالعزيز القحطاني', property: 'أجنحة الياسمين', unit: 'استوديو 108', checkIn: '2026-08-15', checkOut: '2026-08-19', total: '1,750 ر.س', status: 'مكتمل' },
                    { id: 'BK-9404', guest: 'فاطمة أحمد السالم', property: 'برج الأفق الفندقي', unit: 'غرفة ديلوكس 205', checkIn: '2026-08-25', checkOut: '2026-08-30', total: '3,100 ر.س', status: 'مؤكد' },
                  ]
                    .filter((bk) => {
                      const q = bookingSearchQuery.trim().toLowerCase();
                      if (!q) return true;
                      return bk.guest.toLowerCase().includes(q) || bk.property.toLowerCase().includes(q) || bk.id.toLowerCase().includes(q);
                    })
                    .map((bk) => (
                    <div key={bk.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B1B3D] flex items-center justify-center font-bold text-sm shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-[#0B1B3D]">{bk.guest}</h4>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{bk.id}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {bk.property} • {bk.unit}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{isRtl ? 'تاريخ الإقامة' : 'Dates'}</span>
                          <span className="font-bold">{bk.checkIn} ← {bk.checkOut}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">{isRtl ? 'المبلغ' : 'Amount'}</span>
                          <span className="font-black text-[#0B1B3D]">{bk.total}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          bk.status === 'نشط' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          bk.status === 'مؤكد' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          bk.status === 'قيد الانتظار' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {bk.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: TENANTS MANAGEMENT (المستأجرين)                                    */}
          {/* ========================================================================= */}
          {activeTab === 'tenants' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#0B1B3D]">
                    {isRtl ? 'دليل المستأجرين والنزلاء' : 'Tenants & Leases Directory'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {isRtl ? 'إدارة بيانات المستأجرين، العقود السارية، وحالات السداد' : 'Manage tenant profiles, active contracts, and payment records'}
                  </p>
                </div>
              </div>

              {/* Tenants KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-bold">{isRtl ? 'المستأجرين النشطين' : 'Active Tenants'}</p>
                  <p className="text-2xl font-black text-[#0B1B3D] mt-1">14</p>
                  <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                    {isRtl ? 'عقود سارية المفعول' : 'Active contracts'}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-bold">{isRtl ? 'مدفوعات منتظمة' : 'On-Time Payments'}</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">92%</p>
                  <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                    {isRtl ? 'نسبة التحصيل' : 'Collection rate'}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-bold">{isRtl ? 'دفعات متأخرة' : 'Overdue Payments'}</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">1</p>
                  <span className="text-[11px] text-rose-600 font-bold mt-1 block">
                    {isRtl ? 'تحتاج متابعة' : 'Requires follow-up'}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <p className="text-xs text-slate-500 font-bold">{isRtl ? 'تجديدات قادمة' : 'Upcoming Renewals'}</p>
                  <p className="text-2xl font-black text-amber-500 mt-1">3</p>
                  <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                    {isRtl ? 'خلال 30 يوم' : 'Within 30 days'}
                  </span>
                </div>
              </div>

              {/* Tenants Directory List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={tenantSearchQuery}
                      onChange={(e) => setTenantSearchQuery(e.target.value)}
                      placeholder={isRtl ? 'ابحث بالاسم أو رقم الجوال...' : 'Search by name or phone...'}
                      className="w-full ps-9 pe-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B1B3D]"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {[
                    { name: 'عبدالله بن سعد الدوسري', phone: '0501234567', email: 'abdullah@example.com', property: 'برج الأفق الفندقي', unit: 'شقة 301', contractEnd: '2026-12-31', rent: '45,000 ر.س / سنوياً', paymentStatus: 'مسدد' },
                    { name: 'مها عبدالعزيز الرشيد', phone: '0559876543', email: 'maha@example.com', property: 'شاليهات النخيل', unit: 'شاليه 4', contractEnd: '2026-09-15', rent: '6,500 ر.س / شهرياً', paymentStatus: 'مسدد' },
                    { name: 'خالد بن ناصر العسيري', phone: '0543322110', email: 'khaled@example.com', property: 'أجنحة الياسمين', unit: 'استوديو 202', contractEnd: '2026-08-30', rent: '3,200 ر.س / شهرياً', paymentStatus: 'متأخر 3 أيام' },
                  ]
                    .filter((tenant) => {
                      const q = tenantSearchQuery.trim().toLowerCase();
                      if (!q) return true;
                      return tenant.name.toLowerCase().includes(q) || tenant.phone.includes(q) || tenant.property.toLowerCase().includes(q);
                    })
                    .map((tenant, idx) => (
                    <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#0B1B3D]/10 text-[#0B1B3D] flex items-center justify-center font-black text-sm shrink-0">
                          {tenant.name.slice(0, 1)}
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-[#0B1B3D]">{tenant.name}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                            <span className="flex items-center gap-1"><Phone size={12} className="text-slate-400" /> {tenant.phone}</span>
                            <span className="hidden sm:flex items-center gap-1"><Mail size={12} className="text-slate-400" /> {tenant.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600 font-medium">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{isRtl ? 'الوحدة والعقار' : 'Property & Unit'}</span>
                          <span className="font-bold">{tenant.property} - {tenant.unit}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">{isRtl ? 'القيمة الإيجارية' : 'Rent'}</span>
                          <span className="font-black text-[#0B1B3D]">{tenant.rent}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          tenant.paymentStatus === 'مسدد' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {tenant.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: FINANCIAL OVERVIEW (المالية)                                       */}
          {/* ========================================================================= */}
          {activeTab === 'finance' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#0B1B3D]">
                    {isRtl ? 'الإدارة المالية والإيرادات' : 'Financials & Revenue'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {isRtl ? 'كشوفات الحسابات، التحصيلات، وصافي الأرباح للعقارات' : 'Financial statements, collections, and net profit overview'}
                  </p>
                </div>
                <button
                  onClick={() => triggerToast(isRtl ? 'جاري تحميل التقرير المالي...' : 'Downloading financial report...')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0B1B3D] text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-all shadow-sm"
                >
                  <Download size={14} />
                  <span>{isRtl ? 'تصدير التقرير المالي (PDF)' : 'Export Report (PDF)'}</span>
                </button>
              </div>

              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold">{isRtl ? 'إجمالي المحصل' : 'Total Revenue'}</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Wallet size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-[#0B1B3D] mt-2">128,450 ر.س</p>
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                    <TrendingUp size={12} /> +14.8% {isRtl ? 'مقارنة بالشهر السابق' : 'vs last month'}
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold">{isRtl ? 'صافي الأرباح' : 'Net Profit'}</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-blue-600 mt-2">102,800 ر.س</p>
                  <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                    {isRtl ? 'بعد خصم الرسوم والمصاريف' : 'After fees and operational costs'}
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold">{isRtl ? 'المستحقات المعلقة' : 'Pending Inflow'}</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-amber-500 mt-2">18,200 ر.س</p>
                  <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                    {isRtl ? 'دفعات متوقعة قريباً' : 'Expected incoming payments'}
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold">{isRtl ? 'المصروفات التشغيلية' : 'Operating Expenses'}</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                      <CreditCard size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-700 mt-2">7,450 ر.س</p>
                  <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                    {isRtl ? 'صيانة، نظافة، وفواتير' : 'Maintenance & cleaning costs'}
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-sm text-[#0B1B3D]">{isRtl ? 'سجل العمليات المالية الأخيرة' : 'Recent Financial Transactions'}</h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {[
                    { id: 'INV-2026-081', desc: 'حجز فندقي - برج الأفق (محمد الشمري)', type: 'إيراد حجز', date: '2026-08-20', amount: '+4,200 ر.س', method: 'مدى / Mada', status: 'مدفوع' },
                    { id: 'INV-2026-080', desc: 'دفعة إيجار شهري - شاليهات النخيل (مها الرشيد)', type: 'إيجار شهري', date: '2026-08-18', amount: '+6,500 ر.س', method: 'تحويل بنكي', status: 'مدفوع' },
                    { id: 'INV-2026-079', desc: 'صيانة دورية للمكيفات - أجنحة الياسمين', type: 'مصروف صيانة', date: '2026-08-15', amount: '-1,200 ر.س', method: 'سداد فواتير', status: 'مكتمل' },
                    { id: 'INV-2026-078', desc: 'حجز استوديو - أجنحة الياسمين (عبدالعزيز)', type: 'إيراد حجز', date: '2026-08-14', amount: '+1,750 ر.س', method: 'فيزا / Visa', status: 'مدفوع' },
                  ].map((tx) => (
                    <div key={tx.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-[#0B1B3D]">{tx.desc}</h4>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{tx.id}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium mt-1">
                          <span>{tx.type}</span>
                          <span>•</span>
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span>{tx.method}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`font-black text-sm ${tx.amount.startsWith('+') ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {tx.amount}
                        </span>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: SETTINGS (الإعدادات)                                              */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
              <div>
                <h2 className="text-xl font-black text-[#0B1B3D]">
                  {isRtl ? 'إعدادات الحساب والعقارات' : 'Account & Properties Settings'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isRtl ? 'إدارة بيانات المالك، التنبيهات، وتفضيلات التشغيل' : 'Manage owner profile, notification preferences, and settings'}
                </p>
              </div>

              {/* Profile Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-[#0B1B3D] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <User size={16} />
                  <span>{isRtl ? 'بيانات المالك والمنشأة' : 'Owner & Business Details'}</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{isRtl ? 'اسم المنشأة / الشركة' : 'Company Name'}</label>
                    <input
                      type="text"
                      defaultValue={ownerData?.officeName || (isRtl ? 'شركة ريادة للعقارات' : 'Riyadah Real Estate')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B1B3D]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{isRtl ? 'اسم المالك المسؤول' : 'Owner Full Name'}</label>
                    <input
                      type="text"
                      defaultValue={ownerDisplayName}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B1B3D]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input
                      type="email"
                      defaultValue={currentUser?.email || 'owner@riyadah.com'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B1B3D]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">{isRtl ? 'رقم الجوال' : 'Phone Number'}</label>
                    <input
                      type="tel"
                      defaultValue="0501234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0B1B3D]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => triggerToast(isRtl ? 'تم حفظ التعديلات بنجاح!' : 'Settings saved successfully!')}
                    className="px-5 py-2.5 bg-[#0B1B3D] text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-all shadow-sm"
                  >
                    {isRtl ? 'حفظ التعديلات' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-[#0B1B3D] border-b border-slate-100 pb-3 flex items-center gap-2">
                  <ShieldCheck size={16} />
                  <span>{isRtl ? 'التنبيهات والأمان' : 'Notifications & Security'}</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <h4 className="font-bold text-[#0B1B3D]">{isRtl ? 'تنبيهات الحجوزات الجديدة' : 'New Booking Alerts'}</h4>
                      <p className="text-[11px] text-slate-500">{isRtl ? 'إشعار فوري عند إتمام أي حجز أو دفع' : 'Instant notification on new bookings'}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0B1B3D]" />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <h4 className="font-bold text-[#0B1B3D]">{isRtl ? 'القبول التلقائي للحجوزات' : 'Instant Booking Approval'}</h4>
                      <p className="text-[11px] text-slate-500">{isRtl ? 'تأكيد الحجوزات المؤكدة دفعها تلقائياً' : 'Auto-confirm paid reservations'}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0B1B3D]" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ADD / EDIT PROPERTY MODAL */}
      <AddPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProperty(null);
          fetchProperties();
        }}
        editingProperty={editingProperty}
        onSuccess={(savedProp) => {
          setProperties(prev => {
            const exists = prev.some(p => p.id === savedProp.id);
            if (exists) {
              return prev.map(p => p.id === savedProp.id ? savedProp : p);
            }
            return [savedProp, ...prev];
          });
          triggerToast(
            editingProperty 
              ? (isRtl ? `تم تحديث عقار "${savedProp.name}" بنجاح.` : `Property "${savedProp.name}" updated successfully.`)
              : (isRtl ? `تم حفظ عقار "${savedProp.name}" الجديد في قاعدة البيانات بنجاح!` : `New property "${savedProp.name}" saved to database!`)
          );
        }}
      />

      {/* REQUEST DELETION MODAL (TO PLATFORM ADMIN) */}
      {propertyToRequestDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-start space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0B1B3D]">
                  {isRtl ? 'طلب حذف العقار عبر إدارة المنصة' : 'Request Property Deletion via Admin'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {propertyToRequestDelete.name} ({propertyToRequestDelete.city})
                </p>
              </div>
            </div>

            {/* Platform Safety Notice */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1.5 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle size={15} className="shrink-0" />
                <span>{isRtl ? 'سياسة حماية الالتزامات والحجوزات:' : 'Platform Protection Policy:'}</span>
              </div>
              <p className="text-[11px] text-amber-900/90">
                {isRtl 
                  ? 'لحماية حقوق النزلاء والتأكد من عدم وجود حجوزات جارية أو دفعات معلقة، يتم رفع طلب الحذف إلى إدارة المنصة لمراجعة السجلات وتأكيد إخلاء الطرف قبل الإلغاء النهائي.'
                  : 'To protect guest reservations and verify no active bookings or outstanding payouts exist, deletion requests are reviewed by platform administration.'}
              </p>
            </div>

            {/* Reason input field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {isRtl ? 'سبب طلب الحذف (مطلوب توضيحه للإدارة)' : 'Reason for Deletion Request (Required)'}
              </label>
              <textarea
                rows={3}
                value={deletionReasonInput}
                onChange={(e) => setDeletionReasonInput(e.target.value)}
                placeholder={isRtl ? 'مثال: تم بيع العقار، أو أعمال تجديد شاملة، أو رغبة المالك في الإيقاف المؤقت...' : 'e.g., Property sold, major renovations, or owner stopping rental...'}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0B1B3D]/30 focus:border-[#0B1B3D] focus:outline-hidden"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setPropertyToRequestDelete(null);
                  setDeletionReasonInput('');
                }}
                disabled={isSubmittingDeletionRequest}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSubmitDeletionRequest}
                disabled={isSubmittingDeletionRequest}
                className="px-5 py-2.5 rounded-xl bg-[#0B1B3D] hover:bg-slate-900 text-white text-xs font-black shadow-md flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingDeletionRequest && <Loader2 size={14} className="animate-spin" />}
                <span>{isRtl ? 'إرسال طلب الحذف للإدارة' : 'Submit Deletion Request'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
