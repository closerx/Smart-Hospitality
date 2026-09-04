import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Building2, 
  MapPin, 
  DoorClosed, 
  Phone, 
  Key, 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Property, PropertyFormData, PropertyType, PropertyStatus, LeaseType, ContractDuration } from '../types/property';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (property: Property, isEdit: boolean) => void;
  editingProperty?: Property | null;
}

// Helper to compress and convert images to Base64 (keeps Firestore docs small and fast)
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

export default function AddPropertyModal({
  isOpen,
  onClose,
  onSuccess,
  editingProperty = null,
}: AddPropertyModalProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { currentUser } = useAuth();

  const isEdit = !!editingProperty;

  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    type: 'hotel',
    leaseType: 'daily',
    contractDuration: '3_months',
    agreedToContractTerms: true,
    city: 'الرياض',
    district: '',
    address: '',
    roomsCount: 10,
    floorsCount: 3,
    smartLocksEnabled: true,
    contactPhone: '',
    description: '',
    amenities: [],
    coverImage: '',
    images: [],
    status: 'pending_approval',
    occupancyRate: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowReviewSuccess(false);
      if (editingProperty) {
        setFormData({
          name: editingProperty.name || '',
          type: editingProperty.type || 'hotel',
          leaseType: editingProperty.leaseType || 'daily',
          contractDuration: editingProperty.contractDuration || '3_months',
          agreedToContractTerms: editingProperty.agreedToContractTerms ?? true,
          city: editingProperty.city || 'الرياض',
          district: editingProperty.district || '',
          address: editingProperty.address || '',
          roomsCount: editingProperty.roomsCount ?? 10,
          floorsCount: editingProperty.floorsCount ?? 3,
          smartLocksEnabled: editingProperty.smartLocksEnabled ?? true,
          contactPhone: editingProperty.contactPhone || '',
          description: editingProperty.description || '',
          amenities: editingProperty.amenities || [],
          coverImage: editingProperty.coverImage || '',
          images: editingProperty.images || [],
          status: editingProperty.status || 'active',
          occupancyRate: editingProperty.occupancyRate ?? 0,
        });
      } else {
        setFormData({
          name: '',
          type: 'hotel',
          leaseType: 'daily',
          contractDuration: '3_months',
          agreedToContractTerms: true,
          city: 'الرياض',
          district: '',
          address: '',
          roomsCount: 10,
          floorsCount: 3,
          smartLocksEnabled: true,
          contactPhone: '',
          description: '',
          amenities: [],
          coverImage: '',
          images: [],
          status: 'pending_approval',
          occupancyRate: 0,
        });
      }
      setError('');
    }
  }, [isOpen, editingProperty]);

  if (!isOpen) return null;

  const citiesList = [
    'الرياض',
    'جدة',
    'مكة المكرمة',
    'المدينة المنورة',
    'الخبر',
    'الدمام',
    'أبها',
    'الطائف',
    'تبوك',
    'بريدة',
    'حائل',
    'جازان',
    'خميس مشيط',
    'الجبيل',
    'ينبع'
  ];

  const propertyTypes: { value: PropertyType; labelAr: string; labelEn: string }[] = [
    { value: 'apartments', labelAr: 'شقق مفروشة / مخدومة', labelEn: 'Furnished Apartments' },
    { value: 'hotel', labelAr: 'فندق / أوتيل', labelEn: 'Hotel' },
    { value: 'building', labelAr: 'برج / عمارة سكنية', labelEn: 'Residential Building' },
    { value: 'villa', labelAr: 'فيلا / شاليه / استراحة', labelEn: 'Villa / Chalet' },
    { value: 'resort', labelAr: 'منتجع سياحي', labelEn: 'Resort' },
    { value: 'compound', labelAr: 'مجمع سكني مغلق', labelEn: 'Compound' },
  ];

  // Amenities list matching exactly the user's provided UI design
  const amenitiesList = [
    { id: 'pool', labelAr: 'مسبح', labelEn: 'Swimming Pool' },
    { id: 'wifi', labelAr: 'واي فاي', labelEn: 'Wi-Fi' },
    { id: 'parking', labelAr: 'موقف سيارات', labelEn: 'Car Parking' },
    { id: 'kitchen', labelAr: 'مطبخ', labelEn: 'Kitchen' },
    { id: 'outdoor_seating', labelAr: 'جلسات خارجية', labelEn: 'Outdoor Seating' },
    { id: 'cameras', labelAr: 'كاميرات مراقبة', labelEn: 'Surveillance Cameras' },
  ];

  const toggleAmenity = (amenityId: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenityId);
      const updated = exists 
        ? prev.amenities.filter((id) => id !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities: updated };
    });
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImageFile(file);
      setFormData((prev) => ({ ...prev, coverImage: base64 }));
    } catch (err) {
      console.error('Failed to process cover image:', err);
    }
  };

  const handlePropertyImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 8 - formData.images.length;
    if (remainingSlots <= 0) return;

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    try {
      const compressed = await Promise.all(selectedFiles.map(compressImageFile));
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...compressed].slice(0, 8),
      }));
    } catch (err) {
      console.error('Failed to process property images:', err);
    }
  };

  const removeCoverImage = () => {
    setFormData((prev) => ({ ...prev, coverImage: '' }));
  };

  const removePropertyImage = (idxToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== idxToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError(isRtl ? 'يجب تسجيل الدخول لإضافة عقار.' : 'You must be logged in to add a property.');
      return;
    }

    if (!formData.name.trim()) {
      setError(isRtl ? 'يرجى إدخال اسم العقار.' : 'Please enter the property name.');
      return;
    }

    if (!formData.roomsCount || Number(formData.roomsCount) <= 0) {
      setError(isRtl ? 'يرجى تحديد عدد الغرف / الوحدات (على الأقل 1).' : 'Please enter a valid number of rooms (min 1).');
      return;
    }

    // Phone number validation: if entered, must be exactly 10 digits (e.g. 05XXXXXXXX)
    const cleanPhone = formData.contactPhone.replace(/\D/g, '');
    if (formData.contactPhone.trim() && cleanPhone.length !== 10) {
      setError(isRtl ? 'رقم هاتف إدارة العقار يجب أن يتكون من 10 أرقام (مثال: 05XXXXXXXX)' : 'Phone number must be exactly 10 digits (e.g. 05XXXXXXXX)');
      return;
    }

    setIsSubmitting(true);

    try {
      const propertyId = editingProperty?.id || `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      const propertyPayload: Property = {
        id: propertyId,
        ownerId: currentUser.uid,
        name: formData.name.trim(),
        type: formData.type,
        leaseType: formData.leaseType,
        contractDuration: formData.contractDuration,
        agreedToContractTerms: formData.agreedToContractTerms,
        city: formData.city.trim(),
        district: formData.district.trim(),
        address: formData.address.trim(),
        roomsCount: Number(formData.roomsCount),
        floorsCount: formData.floorsCount ? Number(formData.floorsCount) : undefined,
        smartLocksEnabled: formData.smartLocksEnabled,
        contactPhone: cleanPhone || currentUser.phoneNumber || '',
        description: formData.description.trim(),
        amenities: formData.amenities || [],
        coverImage: formData.coverImage || '',
        images: formData.images || [],
        status: isEdit ? formData.status : 'pending_approval',
        occupancyRate: editingProperty?.occupancyRate ?? 0,
        createdAt: editingProperty?.createdAt || now,
        updatedAt: now,
      };

      // Direct Supabase database persistence with auto-healing schema adaptation
      const cleanDbPayload: any = {
        id: propertyId,
        owner_id: currentUser.uid,
        owner_email: currentUser.email || '',
        name: formData.name.trim(),
        title: formData.name.trim(),
        type: formData.type,
        lease_type: formData.leaseType,
        contract_duration: formData.contractDuration,
        city: formData.city.trim(),
        district: formData.district.trim(),
        address: formData.address.trim(),
        rooms_count: Number(formData.roomsCount),
        floors_count: formData.floorsCount ? Number(formData.floorsCount) : null,
        smart_locks_enabled: formData.smartLocksEnabled,
        contact_phone: cleanPhone || currentUser.phoneNumber || '',
        description: formData.description.trim(),
        amenities: formData.amenities || [],
        cover_image: formData.coverImage || '',
        images: formData.images || [],
        status: isEdit ? formData.status : 'pending_approval',
        created_at: editingProperty?.createdAt || now,
        updated_at: now,
      };

      const savePropertyToSupabase = async (payload: Record<string, any>) => {
        const currentPayload: Record<string, any> = { ...payload };

        let attempts = 0;
        while (attempts < 15) {
          attempts++;
          const { error } = await supabase.from('properties').upsert(currentPayload, { onConflict: 'id' });
          if (!error) {
            return;
          }

          // Auto-heal missing column errors (PGRST204)
          if (error.code === 'PGRST204' || (error.message && error.message.includes('Could not find the'))) {
            const match = error.message.match(/Could not find the '([^']+)' column/i);
            if (match && match[1]) {
              const missingCol = match[1];
              if (missingCol === 'name' && currentPayload.name) {
                currentPayload.title = currentPayload.name;
              } else if (missingCol === 'title' && currentPayload.title) {
                currentPayload.name = currentPayload.title;
              } else if (missingCol === 'owner_id' && currentPayload.owner_id) {
                currentPayload.ownerId = currentPayload.owner_id;
              } else if (missingCol === 'rooms_count' && currentPayload.rooms_count) {
                currentPayload.roomsCount = currentPayload.rooms_count;
              } else if (missingCol === 'cover_image' && currentPayload.cover_image) {
                currentPayload.coverImage = currentPayload.cover_image;
              }
              delete currentPayload[missingCol];
              continue;
            }
          }

          throw error;
        }
      };

      await savePropertyToSupabase(cleanDbPayload);

      setIsSubmitting(false);
      onSuccess(propertyPayload, isEdit);

      if (!isEdit) {
        setShowReviewSuccess(true);
      } else {
        onClose();
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      console.error('Error saving property to Supabase:', err);
      setError(isRtl ? 'حدث خطأ أثناء حفظ العقار. يرجى المحاولة مرة أخرى.' : 'Error saving property. Please try again.');
    }
  };

  // Review Pending Approval Screen matching the exact provided UI mockup
  if (showReviewSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 min-h-screen">
        {/* Backdrop click dismiss */}
        <div className="fixed inset-0 z-[9999]" onClick={onClose} />

        <div 
          className="relative z-[10000] bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-6 my-auto transition-all animate-in fade-in zoom-in-95 duration-200"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 sm:top-5 sm:left-5 text-slate-400 hover:text-[#0B1B3D] p-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Heading Section matching image exactly */}
          <div className="space-y-2 pt-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1B3D] tracking-tight">
              {isRtl ? 'مراجعة العقار' : 'Property Review'}
            </h2>
            <p className="text-base sm:text-lg font-bold text-[#0B1B3D]">
              {isRtl ? 'جاري مراجعة بيانات العقار' : 'Reviewing Property Data'}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              {isRtl 
                ? 'سيتم التحقق من صحة البيانات ومطابقة العقار في النظام' 
                : 'Data validity and property matching are being verified in the system'}
            </p>
          </div>

          {/* Central Graphic matching image layout */}
          <div className="py-2 flex items-center justify-center">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              {/* Clean vector layout icon matching screenshot */}
              <svg width="76" height="76" viewBox="0 0 76 76" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Top wide container */}
                <rect x="12" y="12" width="52" height="18" rx="4" stroke="#0B1B3D" strokeWidth="4" />
                {/* Bottom left square */}
                <rect x="12" y="38" width="24" height="24" rx="4" stroke="#0B1B3D" strokeWidth="4" />
                {/* Bottom right square */}
                <rect x="42" y="38" width="22" height="24" rx="4" stroke="#0B1B3D" strokeWidth="4" />
                {/* Amber circle indicator at bottom-right of icon */}
                <circle cx="58" cy="54" r="9" fill="#F59E0B" />
                <circle cx="58" cy="54" r="13" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.25" />
              </svg>
            </div>
          </div>

          {/* 1-3 Business Days Badge matching the image */}
          <div className="w-full max-w-xs sm:max-w-sm py-3.5 px-5 rounded-xl bg-[#CAD7E6] border border-[#B4C4D8] text-[#0B1B3D] font-black text-xs sm:text-sm text-center shadow-xs">
            {isRtl ? 'ستصلك النتيجة خلال 1-3 ايام عمل' : 'You will receive the result within 1-3 business days'}
          </div>

          {/* Action Button to return to dashboard */}
          <button
            type="button"
            onClick={onClose}
            className="w-full max-w-xs sm:max-w-sm bg-[#0B1B3D] hover:bg-slate-900 text-white font-black text-xs sm:text-sm py-3.5 px-6 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {isRtl ? 'تم، العودة للوحة العقارات' : 'Done, return to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 min-h-screen">
      {/* Backdrop click dismiss */}
      <div className="fixed inset-0 z-[9999]" onClick={() => !isSubmitting && onClose()} />

      <div 
        className="relative z-[10000] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl lg:max-w-3xl flex flex-col my-auto max-h-[88vh] overflow-hidden transition-all"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header - Always Fixed Top */}
        <div className="bg-[#0B1B3D] text-white px-5 py-4 sm:px-6 sm:py-4.5 flex justify-between items-center shrink-0 border-b border-slate-800 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {isEdit 
                  ? (isRtl ? 'تعديل بيانات العقار' : 'Edit Property Details')
                  : (isRtl ? 'إضافة عقار جديد للنظام' : 'Register New Property')}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {isRtl ? 'الربط المباشر مع قاعدة بيانات المالك في فايرستور' : 'Direct sync with Firestore Cloud Database'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body with clean visual scrollbar */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div 
            id="add-property-form-scroll-container"
            className="p-4 sm:p-6 md:p-8 pb-12 space-y-6 overflow-y-auto flex-1 min-h-0 overscroll-contain scroll-smooth focus:outline-none"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: '#94a3b8 #f1f5f9'
            }}
            tabIndex={0}
          >
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2.5 text-xs font-bold shadow-xs">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#0B1B3D] uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center gap-2">
                <Layers size={16} className="text-amber-500" />
                <span>{isRtl ? 'المعلومات الأساسية ونوع العقد' : 'Basic Info & Contract Type'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    {isRtl ? 'اسم العقار / الفندق *' : 'Property / Hotel Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isRtl ? 'مثال: فندق قصر اليمامة، شقق النخيل المخدومة' : 'e.g. Al-Nakheel Serviced Apartments'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    {isRtl ? 'تصنيف ونوع العقار' : 'Property Category'}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PropertyType })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all shadow-xs"
                  >
                    {propertyTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {isRtl ? t.labelAr : t.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lease Type: Daily or Monthly/Annual */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    {isRtl ? 'نوع التأجير المستهدف' : 'Target Lease Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, leaseType: 'daily' })}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.leaseType === 'daily'
                          ? 'bg-[#0B1B3D] text-white border-[#0B1B3D] shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{isRtl ? 'تأجير يومي' : 'Daily Lease'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, leaseType: 'monthly_annual' })}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.leaseType === 'monthly_annual'
                          ? 'bg-[#0B1B3D] text-white border-[#0B1B3D] shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{isRtl ? 'شهري / سنوي' : 'Monthly / Annual'}</span>
                    </button>
                  </div>
                </div>

                {/* Operational Contract Duration & Terms */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#0B1B3D]" />
                      <span className="text-xs font-black text-[#0B1B3D]">
                        {isRtl ? 'مدة العقد التشغيلي مع المنصة' : 'Operational Contract Duration'}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md border border-slate-300">
                      {isRtl ? 'عقد تشغيل واستثمار' : 'Operational Agreement'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: '3_months', labelAr: '3 أشهر', labelEn: '3 Months' },
                      { value: '6_months', labelAr: '6 أشهر', labelEn: '6 Months' },
                      { value: '1_year', labelAr: 'سنة واحدة', labelEn: '1 Year' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, contractDuration: opt.value as ContractDuration })}
                        className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition-all text-center cursor-pointer ${
                          formData.contractDuration === opt.value
                            ? 'bg-[#0B1B3D] text-white font-black border-[#0B1B3D] shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isRtl ? opt.labelAr : opt.labelEn}
                      </button>
                    ))}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.agreedToContractTerms}
                        onChange={(e) => setFormData({ ...formData, agreedToContractTerms: e.target.checked })}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0B1B3D] focus:ring-[#0B1B3D] cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-700 leading-tight">
                        {isRtl ? (
                          <>
                            أوافق على <span className="text-[#0B1B3D] underline font-black">الشروط والأحكام</span> الخاصة بمدة العقد التشغيلي ونظام إدارة الحجوزات والتحصيل الآلي.
                          </>
                        ) : (
                          <>
                            I have read and agree to the <span className="text-[#0B1B3D] underline font-black">Terms and Conditions</span> of the Operational Contract.
                          </>
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Location */}
            <div className="space-y-4 pt-1">
              <h3 className="text-xs font-black text-[#0B1B3D] uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center gap-2">
                <MapPin size={16} className="text-amber-500" />
                <span>{isRtl ? 'الموقع والعنوان' : 'Location & Address'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    {isRtl ? 'المدينة *' : 'City *'}
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all shadow-xs"
                  >
                    {citiesList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    {isRtl ? 'الحي' : 'District'}
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder={isRtl ? 'مثال: حي العقيق، الملقا...' : 'e.g. Al-Aqeeq District'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all shadow-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    {isRtl ? 'العنوان التفصيلي / الشارع' : 'Detailed Address / Street'}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={isRtl ? 'مثال: طريق الملك فهد، مقابل المركز المالي' : 'e.g. King Fahd Road'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Units & Specifications */}
            <div className="space-y-4 pt-1">
              <h3 className="text-xs font-black text-[#0B1B3D] uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center gap-2">
                <DoorClosed size={16} className="text-amber-500" />
                <span>{isRtl ? 'الوحدات والمواصفات التشغيلية' : 'Units & Specifications'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    {isRtl ? 'عدد الغرف / الوحدات *' : 'Total Rooms/Units *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={formData.roomsCount}
                    onChange={(e) => setFormData({ ...formData, roomsCount: e.target.value === '' ? '' : parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    {isRtl ? 'عدد الطوابق' : 'Floors Count'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={formData.floorsCount}
                    onChange={(e) => setFormData({ ...formData, floorsCount: e.target.value === '' ? '' : parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    {isRtl ? 'حالة التشغيل' : 'Operational Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PropertyStatus })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all shadow-xs"
                  >
                    <option value="active">{isRtl ? 'نشط ومتاح للحجز' : 'Active / Available'}</option>
                    <option value="maintenance">{isRtl ? 'تحت الصيانة' : 'Under Maintenance'}</option>
                    <option value="inactive">{isRtl ? 'غير نشط مؤقتاً' : 'Inactive'}</option>
                  </select>
                </div>
              </div>

              {/* Smart Locks Feature Toggle */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                    <Key size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0B1B3D]">
                      {isRtl ? 'تفعيل نظام الأقفال الذكية (Smart Locks)' : 'Enable Smart Digital Locks'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isRtl ? 'إمكانية إرسال مفاتيح إلكترونية مشفرة عبر تطبيق النزيل مباشرة' : 'Issue encrypted smart access keys directly to guests'}
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.smartLocksEnabled}
                    onChange={(e) => setFormData({ ...formData, smartLocksEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B1B3D]"></div>
                </label>
              </div>
            </div>

            {/* ========================================================= */}
            {/* NEW OPTIONAL SECTION: المرافق (Amenities)                  */}
            {/* ========================================================= */}
            <div className="space-y-4 pt-1">
              {/* Header Bar */}
              <div className="bg-[#cbd5e1]/75 text-[#0B1B3D] py-2.5 px-4 rounded-xl text-center font-black text-sm tracking-wide shadow-2xs">
                {isRtl ? 'المرافق (اختياري)' : 'Amenities (Optional)'}
              </div>

              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-3" dir={isRtl ? 'rtl' : 'ltr'}>
                  {amenitiesList.map((amenity) => {
                    const isSelected = formData.amenities.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className="flex items-center gap-2.5 text-right font-black text-xs text-slate-800 hover:text-[#0B1B3D] transition-all cursor-pointer group select-none"
                      >
                        {/* Radio / Circle Indicator matching the screenshot */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                          isSelected 
                            ? 'border-[#0B1B3D] bg-white ring-2 ring-[#0B1B3D]/20' 
                            : 'border-slate-300 bg-slate-100 group-hover:border-slate-400'
                        }`}>
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#0B1B3D]" />
                          )}
                        </div>
                        <span className="truncate">{isRtl ? amenity.labelAr : amenity.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* NEW OPTIONAL SECTION: الصور (Images)                       */}
            {/* ========================================================= */}
            <div className="space-y-4 pt-1">
              {/* Header Bar */}
              <div className="bg-[#cbd5e1]/75 text-[#0B1B3D] py-2.5 px-4 rounded-xl text-center font-black text-sm tracking-wide shadow-2xs">
                {isRtl ? 'الصور (اختياري)' : 'Images (Optional)'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1: صورة الغلاف */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-between text-center shadow-xs min-h-[190px]">
                  <div className="w-full">
                    <h4 className="text-sm sm:text-base font-black text-slate-800 mb-0.5">
                      {isRtl ? 'صورة الغلاف' : 'Cover Image'}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-400 mb-3">
                      {isRtl ? '*فقط صورة وحده' : '*Only 1 image'}
                    </p>
                  </div>

                  {/* Cover image preview if selected */}
                  {formData.coverImage ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 border border-slate-200 group">
                      <img src={formData.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={removeCoverImage}
                        className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg shadow-md hover:bg-rose-700 transition-all cursor-pointer"
                        title={isRtl ? 'حذف الصورة' : 'Remove Image'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : null}

                  <input 
                    type="file" 
                    id="cover-image-upload-input" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleCoverImageUpload}
                  />
                  <label
                    htmlFor="cover-image-upload-input"
                    className="w-full bg-[#0B1B3D] hover:bg-slate-900 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] mt-auto"
                  >
                    <span>{isRtl ? 'تحميل الصورة' : 'Upload Image'}</span>
                    <Upload size={16} />
                  </label>
                </div>

                {/* Card 2: صور العقار */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-between text-center shadow-xs min-h-[190px]">
                  <div className="w-full">
                    <h4 className="text-sm sm:text-base font-black text-slate-800 mb-0.5">
                      {isRtl ? 'صور العقار' : 'Property Images'}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-400 mb-3">
                      {isRtl ? `اقصى حد للصور (8 صور) - تم اختيار ${formData.images.length}` : `Max 8 images - Selected ${formData.images.length}`}
                    </p>
                  </div>

                  {/* Multi-images gallery preview */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 w-full mb-3">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative h-16 rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={img} alt={`Img ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePropertyImage(idx)}
                            className="absolute top-1 right-1 bg-rose-600/90 text-white p-1 rounded-md shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
                            title={isRtl ? 'حذف' : 'Delete'}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input 
                    type="file" 
                    id="property-images-upload-input" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handlePropertyImagesUpload}
                    disabled={formData.images.length >= 8}
                  />
                  <label
                    htmlFor="property-images-upload-input"
                    className={`w-full font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all mt-auto ${
                      formData.images.length >= 8
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#0B1B3D] hover:bg-slate-900 text-white cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                  >
                    <span>{isRtl ? 'تحميل الصور' : 'Upload Images'}</span>
                    <Upload size={16} />
                  </label>
                </div>
              </div>
            </div>

            {/* Section 4: Contact & Details */}
            <div className="space-y-4 pt-1">
              <h3 className="text-xs font-black text-[#0B1B3D] uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center gap-2">
                <FileText size={16} className="text-amber-500" />
                <span>{isRtl ? 'التواصل وملاحظات إضافية' : 'Contact & Notes'}</span>
              </h3>

              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-slate-700">
                      {isRtl ? 'رقم هاتف إدارة العقار (10 أرقام)' : 'Property Phone (10 digits)'}
                    </label>
                    <span className="text-[10px] font-bold text-slate-400">
                      {formData.contactPhone.replace(/\D/g, '').length}/10
                    </span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.contactPhone}
                    onChange={(e) => {
                      const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, contactPhone: onlyDigits });
                    }}
                    placeholder="05XXXXXXXX"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all text-left font-mono tracking-wider shadow-xs"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isRtl ? 'مثال: 0501234567 (أرقام فقط)' : 'e.g. 0501234567 (10 digits only)'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    {isRtl ? 'وصف العقار وملاحظات أخرى' : 'Description & Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={isRtl ? 'ملاحظات إضافية، تفاصيل وصول النزلاء، إلخ...' : 'Additional notes, check-in details, etc...'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Always Visible Fixed Sticky Footer */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0 z-20 shadow-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-200/70 transition-all cursor-pointer"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#0B1B3D] hover:bg-slate-900 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isRtl ? 'جاري الحفظ في السحابة...' : 'Saving to Database...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>
                    {isEdit 
                      ? (isRtl ? 'تحديث العقار' : 'Update Property')
                      : (isRtl ? 'حفظ وإضافة العقار' : 'Save & Register Property')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
