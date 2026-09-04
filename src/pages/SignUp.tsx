import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';
import { 
  User, 
  Building, 
  Hotel,
  Check, 
  X, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Lock,
  Mail,
  Phone,
  ArrowRight, 
  ArrowLeft,
  ChevronDown,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  evaluatePasswordStrength, 
  validateEmail, 
  validateSaudiPhone, 
  validateSaudiIban, 
  validateIdOrCr 
} from '../utils/validation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import OTPVerificationModal from '../components/OTPVerificationModal';
import { createAndSaveOTP } from '../utils/otpService';

export type AccountType = 'tenant' | 'owner' | 'cleaner';

export const SAUDI_CITIES = [
  { ar: 'الرياض', en: 'Riyadh' },
  { ar: 'جدة', en: 'Jeddah' },
  { ar: 'مكة المكرمة', en: 'Makkah' },
  { ar: 'المدينة المنورة', en: 'Madinah' },
  { ar: 'الدمام', en: 'Dammam' },
  { ar: 'الخبر', en: 'Khobar' },
  { ar: 'الظهران', en: 'Dhahran' },
  { ar: 'الطائف', en: 'Taif' },
  { ar: 'تبوك', en: 'Tabuk' },
  { ar: 'بريدة', en: 'Buraidah' },
  { ar: 'عنيزة', en: 'Onaizah' },
  { ar: 'أبها', en: 'Abha' },
  { ar: 'خميس مشيط', en: 'Khamis Mushait' },
  { ar: 'الجبيل', en: 'Jubail' },
  { ar: 'حائل', en: 'Hail' },
  { ar: 'نجران', en: 'Najran' },
  { ar: 'جازان', en: 'Jazan' },
  { ar: 'ينبع', en: 'Yanbu' },
  { ar: 'الأحساء', en: 'Al-Ahsa' },
  { ar: 'القطيف', en: 'Qatif' },
];

// Custom Interactive City Dropdown component (حل مشكلة القائمة المنسدلة في متصفحات و iFrames)
interface CityDropdownProps {
  id?: string;
  selectedCity: string;
  onSelect: (city: string) => void;
  isRtl: boolean;
  cities: { ar: string; en: string }[];
}

const CityDropdown = ({ id = "city-dropdown", selectedCity, onSelect, isRtl, cities }: CityDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCities = cities.filter(c => 
    c.ar.toLowerCase().includes(search.toLowerCase()) || 
    c.en.toLowerCase().includes(search.toLowerCase())
  );

  const displayValue = () => {
    const found = cities.find(c => c.ar === selectedCity || c.en === selectedCity);
    if (found) return isRtl ? found.ar : found.en;
    return selectedCity || (isRtl ? 'اختر المدينة' : 'Select City');
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-[#0B1B3D] focus:ring-2 focus:ring-[#0B1B3D]/20 rounded-xl px-4 py-3 text-sm text-slate-900 flex items-center justify-between shadow-xs font-medium transition-all text-start cursor-pointer"
      >
        <span className={selectedCity ? "text-slate-900 font-semibold" : "text-slate-400"}>
          {displayValue()}
        </span>
        <ChevronDown size={18} className={`text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0B1B3D]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
          {/* Quick Search */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isRtl ? 'ابحث عن مدينة...' : 'Search city...'}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0B1B3D] text-slate-900 placeholder:text-slate-400"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Cities List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-50">
            {filteredCities.length > 0 ? (
              filteredCities.map((c) => {
                const isSelected = selectedCity === c.ar;
                return (
                  <button
                    key={c.ar}
                    type="button"
                    onClick={() => {
                      onSelect(c.ar);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-4 py-2.5 text-sm flex items-center justify-between transition-colors text-start cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50/80 text-[#0B1B3D] font-bold' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{isRtl ? c.ar : c.en}</span>
                    {isSelected && <Check size={16} className="text-[#0B1B3D]" />}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">
                {isRtl ? 'لم يتم العثور على مدينة' : 'No city found'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface SignUpProps {
  initialType?: AccountType;
  initialStep?: number;
}

export default function SignUp({ initialType = 'tenant', initialStep = 1 }: SignUpProps) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const { currentUser, role, loading, refreshUser, setDirectSession, signInWithGoogle } = useAuth();

  // If already logged in, redirect straight to their dashboard
  useEffect(() => {
    if (!loading && currentUser) {
      if (role === 'owner') {
        navigate('/owner-dashboard', { replace: true });
      } else if (role === 'cleaner') {
        navigate('/cleaner-dashboard', { replace: true });
      } else {
        navigate('/tenant-dashboard', { replace: true });
      }
    }
  }, [currentUser, role, loading, navigate]);

  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [step, setStep] = useState<number>(initialStep);
  
  // Comprehensive Form State
  const [formData, setFormData] = useState({
    // Step 1 - Common Basic Fields
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',

    // Tenant Step 1 Specific
    city: 'الرياض',
    preferredLanguage: 'العربية',

    // Property Owner Step 2 Specific
    ownerType: 'individual' as 'individual' | 'office',
    officeName: '',
    identityOrCr: '', // 10 digits
    ownerCity: 'الرياض',
    ibanOrAccount: '', // IBAN
    contactMethod: 'واتساب',

    // Cleaner Provider Step 2 Specific
    coveredNeighborhoods: '',
    cleanerCity: 'الرياض',
    workHours: '',
    serviceType: '',
    experienceYears: '',
    pricing: '',
    idNumber: '', // 10 digits
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Touched state to display errors only after interaction
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Live password strength calculation
  const passwordStrength = evaluatePasswordStrength(formData.password);

  const markTouched = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Strict limits for phone, ID/CR, and IBAN fields
    if (name === 'phone') {
      // Strictly digits only and maximum 10 digits
      formattedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'identityOrCr' || name === 'idNumber') {
      // Saudi ID, Iqama or CR: strictly digits only and maximum 10 digits
      formattedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'ibanOrAccount') {
      // IBAN: uppercase alphanumeric and maximum 24 characters
      formattedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 24);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Clear specific field error as user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (error) setError('');
  };

  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
    setStep(1);
    setError('');
    setFieldErrors({});
  };

  // Comprehensive Step 1 Validation
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Full Name
    if (!formData.fullName.trim()) {
      errors.fullName = isRtl ? 'الاسم الكامل مطلوب' : 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = isRtl ? 'الاسم يجب أن لا يقل عن 3 أحرف' : 'Name must be at least 3 characters';
    }

    // 2. Phone Number (Saudi validation)
    const phoneVal = validateSaudiPhone(formData.phone);
    if (!phoneVal.isValid) {
      errors.phone = isRtl ? phoneVal.errorKey.ar : phoneVal.errorKey.en;
    }

    // 3. Email (Real Gmail / Genuine Email check)
    const emailVal = validateEmail(formData.email, false);
    if (!emailVal.isValid) {
      errors.email = isRtl ? emailVal.errorKey.ar : emailVal.errorKey.en;
    }

    // 4. Password (Strength & length)
    if (!formData.password) {
      errors.password = isRtl ? 'كلمة المرور مطلوبة' : 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = isRtl ? 'كلمة المرور يجب أن لا تقل عن 8 خانات' : 'Password must be at least 8 characters';
    } else if (!passwordStrength.hasNumber || !passwordStrength.hasLetter) {
      errors.password = isRtl ? 'يجب أن تحتوي كلمة المرور على أحرف وأرقام معاً' : 'Password must contain both letters and numbers';
    }

    // 5. Confirm Password
    if (!formData.confirmPassword) {
      errors.confirmPassword = isRtl ? 'يرجى تأكيد كلمة المرور' : 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = isRtl ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
    }

    // Tenant Step 1 additional fields
    if (accountType === 'tenant') {
      if (!formData.city) {
        errors.city = isRtl ? 'يرجى اختيار المدينة' : 'Please select a city';
      }
    }

    setFieldErrors(errors);

    // Mark all Step 1 fields as touched
    setTouched(prev => ({
      ...prev,
      fullName: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
      city: true,
    }));

    if (Object.keys(errors).length > 0) {
      setError(isRtl ? 'يرجى تصحيح الأخطاء وإكمال الحقول المطلوبة بشكل صحيح' : 'Please fix the highlighted errors and complete required fields');
      return false;
    }

    setError('');
    return true;
  };

  // Comprehensive Step 2 Validation (Owner / Cleaner)
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (accountType === 'owner') {
      // Owner validation
      const idVal = validateIdOrCr(formData.identityOrCr);
      if (!idVal.isValid) {
        errors.identityOrCr = isRtl ? idVal.errorKey.ar : idVal.errorKey.en;
      }

      if (formData.ownerType === 'office' && !formData.officeName.trim()) {
        errors.officeName = isRtl ? 'اسم المكتب العقاري مطلوب' : 'Office name is required';
      }

      const ibanVal = validateSaudiIban(formData.ibanOrAccount);
      if (!ibanVal.isValid) {
        errors.ibanOrAccount = isRtl ? ibanVal.errorKey.ar : ibanVal.errorKey.en;
      }

      if (!formData.ownerCity) {
        errors.ownerCity = isRtl ? 'يرجى اختيار المدينة' : 'Please select city';
      }
    } else if (accountType === 'cleaner') {
      // Cleaner validation
      if (!formData.coveredNeighborhoods.trim()) {
        errors.coveredNeighborhoods = isRtl ? 'يرجى تحديد الأحياء التي تغطيها' : 'Please enter covered neighborhoods';
      }

      if (!formData.workHours.trim()) {
        errors.workHours = isRtl ? 'يرجى إدخال أوقات العمل' : 'Please enter work hours';
      }

      if (!formData.experienceYears.trim()) {
        errors.experienceYears = isRtl ? 'يرجى تحديد سنوات الخبرة' : 'Please enter years of experience';
      }

      const idVal = validateIdOrCr(formData.idNumber);
      if (!idVal.isValid) {
        errors.idNumber = isRtl ? idVal.errorKey.ar : idVal.errorKey.en;
      }

      if (!formData.cleanerCity) {
        errors.cleanerCity = isRtl ? 'يرجى اختيار المدينة' : 'Please select city';
      }

      if (!formData.serviceType.trim()) {
        errors.serviceType = isRtl ? 'يرجى تحديد نوع الخدمة المقدمة' : 'Please specify service type';
      }

      if (!formData.pricing.trim()) {
        errors.pricing = isRtl ? 'يرجى إدخال السعر بالساعة أو الخدمة' : 'Please enter pricing rate';
      }
    }

    setFieldErrors(errors);

    // Mark step 2 fields as touched
    setTouched(prev => ({
      ...prev,
      identityOrCr: true,
      officeName: true,
      ibanOrAccount: true,
      ownerCity: true,
      coveredNeighborhoods: true,
      workHours: true,
      experienceYears: true,
      idNumber: true,
      cleanerCity: true,
      serviceType: true,
      pricing: true,
    }));

    if (Object.keys(errors).length > 0) {
      setError(isRtl ? 'يرجى إكمال وتصحيح جميع الخانات الإلزامية للمتابعة' : 'Please complete and fix all mandatory fields to proceed');
      return false;
    }

    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (accountType === 'tenant') {
      if (!validateStep1()) return;
    } else {
      if (!validateStep1()) {
        setStep(1);
        return;
      }
      if (!validateStep2()) return;
    }

    setIsSubmitting(true);
    setError('');

    const targetEmail = formData.email.trim().toLowerCase();

    try {
      // 1. Fast check if this email already exists in Supabase users table
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', targetEmail)
          .maybeSingle();

        if (existingUser) {
          setIsSubmitting(false);
          setError(isRtl 
            ? 'هذا البريد الإلكتروني مسجل مسبقاً في النظام. يمكنك تسجيل الدخول مباشرة أو استعادة كلمة المرور.' 
            : 'This email is already registered. You can sign in directly or reset your password.');
          return;
        }
      } catch (checkErr) {
        console.log('Pre-check email notice:', checkErr);
      }

      // 2. Generate OTP and open the verification modal
      await createAndSaveOTP(targetEmail, formData.fullName.trim());
      setIsSubmitting(false);
      setShowOtpModal(true);
    } catch (err: any) {
      console.error('Error generating OTP code:', err);
      setIsSubmitting(false);
      setError(isRtl ? 'حدث خطأ أثناء إرسال رمز التحقق. يرجى المحاولة ثانية.' : 'Failed to send OTP verification code. Please try again.');
    }
  };

  const handleGoogleSignup = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const { profile } = await signInWithGoogle(accountType);
      setIsSubmitting(false);
      setSuccess(true);
      const userRole = profile.role || accountType;
      setTimeout(() => {
        if (userRole === 'admin') {
          navigate('/admin', { replace: true });
        } else if (userRole === 'owner') {
          navigate('/owner-dashboard', { replace: true });
        } else if (userRole === 'cleaner') {
          navigate('/cleaner-dashboard', { replace: true });
        } else {
          navigate('/tenant-dashboard', { replace: true });
        }
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      console.error('Firebase Google signup error:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      setError(isRtl ? 'تعذر التسجيل عبر Google. يرجى المحاولة لاحقاً أو إكمال التسجيل بالبريد الإلكتروني.' : 'Failed to sign up with Google. Please try again or continue with email.');
    }
  };

  const finalizeAccountCreation = async () => {
    setShowOtpModal(false);
    setIsSubmitting(true);
    setError('');

    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const userRole = accountType;
      const timestamp = new Date().toISOString();
      let userId = `usr_${Date.now()}`;

      // 1. Create user in Supabase Authentication
      try {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              fullName: formData.fullName.trim(),
              phone: formData.phone.trim(),
              role: userRole,
            }
          }
        });

        if (authData?.user) {
          userId = authData.user.id;
        } else if (signUpError) {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: formData.password,
          });
          if (signInData?.user) {
            userId = signInData.user.id;
          }
        }
      } catch (authErr) {
        console.warn('Supabase Auth register notice:', authErr);
      }

      // 2. Build complete verified user profile
      const userAuthRecord = {
        id: userId,
        uid: userId,
        email: cleanEmail,
        phone: formData.phone.trim(),
        phoneNumber: formData.phone.trim(),
        displayName: formData.fullName.trim(),
        emailVerified: true,
        user_metadata: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          role: userRole,
        }
      };

      const fullProfileRecord: any = {
        id: userId,
        email: cleanEmail,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        role: userRole,
        isEmailVerified: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...(accountType === 'tenant' ? {
          city: formData.city,
          preferredLanguage: formData.preferredLanguage,
        } : {}),
        ...(accountType === 'owner' ? {
          ownerType: formData.ownerType,
          officeName: formData.ownerType === 'office' ? formData.officeName.trim() : '',
          identityOrCr: formData.identityOrCr.trim(),
          ownerCity: formData.ownerCity,
          ibanOrAccount: formData.ibanOrAccount.trim(),
          contactMethod: formData.contactMethod,
        } : {}),
        ...(accountType === 'cleaner' ? {
          cleanerCity: formData.cleanerCity,
          coveredNeighborhoods: formData.coveredNeighborhoods.trim(),
          workHours: formData.workHours.trim(),
          serviceType: formData.serviceType.trim(),
          experienceYears: formData.experienceYears.trim(),
          pricing: formData.pricing.trim(),
          idNumber: formData.idNumber.trim(),
        } : {}),
      };

      // 3. Immediately set direct session in AuthContext & LocalStorage
      setDirectSession(userAuthRecord, fullProfileRecord);

      // 4. Save to Unified users table in Supabase
      try {
        await supabase.from('users').upsert({
          id: userId,
          email: cleanEmail,
          full_name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          role: userRole,
          is_email_verified: true,
          created_at: timestamp,
          updated_at: timestamp,
        }, { onConflict: 'id' });
      } catch (tableErr) {
        console.warn('Supabase users table save notice:', tableErr);
      }

      // 5. Save to separate role-specific table in Supabase
      try {
        if (accountType === 'tenant') {
          await supabase.from('tenants').upsert({
            id: userId,
            user_id: userId,
            full_name: formData.fullName.trim(),
            email: cleanEmail,
            phone: formData.phone.trim(),
            city: formData.city,
            preferred_language: formData.preferredLanguage,
            created_at: timestamp,
            updated_at: timestamp,
          }, { onConflict: 'id' });
        } else if (accountType === 'owner') {
          await supabase.from('owners').upsert({
            id: userId,
            user_id: userId,
            full_name: formData.fullName.trim(),
            email: cleanEmail,
            phone: formData.phone.trim(),
            owner_type: formData.ownerType,
            office_name: formData.ownerType === 'office' ? formData.officeName.trim() : '',
            identity_or_cr: formData.identityOrCr.trim(),
            owner_city: formData.ownerCity,
            iban_or_account: formData.ibanOrAccount.trim(),
            contact_method: formData.contactMethod,
            created_at: timestamp,
            updated_at: timestamp,
          }, { onConflict: 'id' });
        } else if (accountType === 'cleaner') {
          await supabase.from('cleaners').upsert({
            id: userId,
            user_id: userId,
            full_name: formData.fullName.trim(),
            email: cleanEmail,
            phone: formData.phone.trim(),
            cleaner_city: formData.cleanerCity,
            covered_neighborhoods: formData.coveredNeighborhoods.trim(),
            work_hours: formData.workHours.trim(),
            service_type: formData.serviceType.trim(),
            experience_years: formData.experienceYears.trim(),
            pricing: formData.pricing.trim(),
            id_number: formData.idNumber.trim(),
            created_at: timestamp,
            updated_at: timestamp,
          }, { onConflict: 'id' });
        }
      } catch (roleTableErr) {
        console.warn('Supabase role table save notice:', roleTableErr);
      }

      setIsSubmitting(false);
      setSuccess(true);

      // 6. Direct instant redirect based on role
      setTimeout(() => {
        if (accountType === 'tenant') {
          navigate('/tenant-dashboard', { replace: true });
        } else if (accountType === 'owner') {
          navigate('/owner-dashboard', { replace: true });
        } else if (accountType === 'cleaner') {
          navigate('/cleaner-dashboard', { replace: true });
        } else if (accountType === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/tenant-dashboard', { replace: true });
        }
      }, 400);

    } catch (err: any) {
      console.error('Registration error:', err);
      setIsSubmitting(false);

      const msg = (err.message || '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('unique constraint') || msg.includes('user already registered')) {
        setError(isRtl ? 'البريد الإلكتروني مسجل مسبقاً في النظام. يرجى تسجيل الدخول أو استخدام بريد آخر.' : 'Email is already registered. Please sign in or use another email.');
      } else if (msg.includes('weak') || msg.includes('password should be at least')) {
        setError(isRtl ? 'كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى.' : 'Password is too weak. Please choose a stronger password.');
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setError(isRtl ? 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.' : 'Network error. Please check your internet connection.');
      } else {
        setError(isRtl ? (err.message || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.') : 'An error occurred during registration. Please try again.');
      }
    }
  };

  const getPageTitle = () => {
    if (step === 2) {
      return isRtl ? 'إكمال بيانات الحساب' : 'Complete Account Details';
    }
    if (accountType === 'tenant') return isRtl ? 'إنشاء حساب (مستأجر)' : 'Create Account (Tenant)';
    if (accountType === 'owner') return isRtl ? 'إنشاء حساب (صاحب عقار)' : 'Create Account (Property Owner)';
    return isRtl ? 'إنشاء حساب (مزود نظافة)' : 'Create Account (Cleaning Provider)';
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col font-sans text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Top Professional App Header */}
      <header className="bg-[#0B1B3D] text-white py-3.5 px-4 sm:px-8 md:px-12 flex justify-between items-center shadow-lg border-b border-slate-800">
        <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
          <img src={logoImg} alt="Smart Hospitality" className="h-10 w-auto object-contain bg-white/90 p-1 rounded-lg shadow-sm" />
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">
              Smart Hospitality
            </h1>
            <p className="text-[11px] text-slate-300 font-medium">
              {isRtl ? 'تسجيل حساب جديد بكل سهولة وأمان' : 'Easy & secure account registration'}
            </p>
          </div>
        </Link>

        <Link 
          to="/login" 
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-lg transition-all"
        >
          <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
          {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-3 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/90 my-auto">
          
          {/* Top Category Selector Tabs */}
          <div className="bg-slate-100 p-2 sm:p-3 border-b border-slate-200 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleAccountTypeChange('tenant')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                accountType === 'tenant'
                  ? 'bg-[#0B1B3D] text-white shadow-md scale-[1.01]'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <span>{isRtl ? 'مستأجر' : 'Tenant'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleAccountTypeChange('owner')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                accountType === 'owner'
                  ? 'bg-[#0B1B3D] text-white shadow-md scale-[1.01]'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <span>{isRtl ? 'صاحب عقار' : 'Property Owner'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleAccountTypeChange('cleaner')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                accountType === 'cleaner'
                  ? 'bg-[#0B1B3D] text-white shadow-md scale-[1.01]'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <span>{isRtl ? 'مزود نظافة' : 'Cleaning Provider'}</span>
            </button>
          </div>

          {/* Step Progress Bar (For Owner & Cleaner) */}
          {accountType !== 'tenant' && (
            <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex items-center justify-center gap-6 text-xs font-bold">
              <div 
                className={`flex items-center gap-2 cursor-pointer transition-colors ${step === 1 ? 'text-[#0B1B3D]' : 'text-slate-500'}`}
                onClick={() => setStep(1)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold ${step === 1 ? 'bg-[#0B1B3D] ring-4 ring-blue-100' : 'bg-emerald-600'}`}>
                  {step === 2 ? <Check size={14} /> : '1'}
                </div>
                <span>{isRtl ? 'البيانات الأساسية' : 'Basic Info'}</span>
              </div>

              <div className={`w-12 sm:w-20 h-0.5 transition-colors ${step === 2 ? 'bg-[#0B1B3D]' : 'bg-slate-300'}`}></div>

              <div 
                className={`flex items-center gap-2 cursor-pointer transition-colors ${step === 2 ? 'text-[#0B1B3D]' : 'text-slate-400'}`}
                onClick={() => validateStep1() && setStep(2)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold ${step === 2 ? 'bg-[#0B1B3D] ring-4 ring-blue-100' : 'bg-slate-300'}`}>
                  2
                </div>
                <span>{isRtl ? 'إكمال بيانات النشاط' : 'Activity Details'}</span>
              </div>
            </div>
          )}

          {/* Inner Form Card */}
          <div className="p-6 sm:p-10 md:p-12">
            
            {/* Header Title */}
            <div className="text-center mb-7">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B1B3D] tracking-tight mb-1.5">
                {getPageTitle()}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium">
                {isRtl ? 'يرجى تعبئة جميع الحقول المطلوبة بدقة لتوثيق حسابك.' : 'Please fill all required fields accurately to verify your account.'}
              </p>
            </div>

            {/* Notification Alert for Errors */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs sm:text-sm font-bold animate-fadeIn shadow-xs">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="leading-relaxed">{error}</p>
                    {(error.includes('مسجل مسبقاً') || error.includes('already registered')) && (
                      <div className="mt-3 pt-3 border-t border-rose-200/80 flex flex-wrap items-center gap-2.5">
                        <Link
                          to={`/login?email=${encodeURIComponent(formData.email.trim())}`}
                          className="bg-[#0B1B3D] text-white hover:bg-slate-900 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-xs inline-flex items-center gap-1.5 transition-all"
                        >
                          <span>{isRtl ? 'تسجيل الدخول بهذا البريد' : 'Sign in with this email'}</span>
                          {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                        </Link>
                        <Link
                          to={`/login?email=${encodeURIComponent(formData.email.trim())}&forgot=true`}
                          className="text-slate-800 hover:text-slate-950 bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all inline-flex items-center gap-1.5"
                        >
                          <Lock size={13} />
                          <span>{isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notification Alert for Success */}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-bold flex items-center gap-3 animate-fadeIn">
                <Check size={20} className="shrink-0 text-emerald-600" />
                <span>{isRtl ? 'تم إنشاء الحساب بنجاح! جاري التوجيه...' : 'Account created successfully! Redirecting...'}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 1: Basic Information (All Roles)                     */}
            {/* ========================================================= */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* 2-Column Responsive Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Right Column Fields */}
                  <div className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-900">
                          {isRtl ? 'الاسم الكامل' : 'Full Name'} <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                          <User size={18} />
                        </div>
                        <input 
                          type="text" 
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          onBlur={() => markTouched('fullName')}
                          placeholder={isRtl ? 'ادخل الاسم الكامل' : 'Enter full name'}
                          className={`w-full bg-white border rounded-xl ps-10 pe-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs font-medium ${
                            touched.fullName && fieldErrors.fullName
                              ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                              : touched.fullName && !fieldErrors.fullName && formData.fullName.trim().length >= 3
                              ? 'border-emerald-500 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/10'
                              : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                          }`}
                        />
                      </div>
                      {touched.fullName && fieldErrors.fullName && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-900">
                          {isRtl ? 'رقم الجوال' : 'Phone Number'} <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone size={18} />
                        </div>
                        <input 
                          type="tel" 
                          name="phone"
                          value={formData.phone}
                          maxLength={10}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          onChange={handleInputChange}
                          onBlur={() => markTouched('phone')}
                          placeholder="05xxxxxxxx"
                          dir="ltr"
                          className={`w-full bg-white border rounded-xl ps-10 pe-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all text-start shadow-xs font-medium ${
                            touched.phone && fieldErrors.phone
                              ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                              : touched.phone && !fieldErrors.phone && formData.phone.length === 10
                              ? 'border-emerald-500 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/10'
                              : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                          }`}
                        />
                      </div>
                      {touched.phone && fieldErrors.phone && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.phone}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-900">
                          {isRtl ? 'البريد الإلكتروني' : 'Email Address'} <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail size={18} />
                        </div>
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onBlur={() => markTouched('email')}
                          placeholder="example@gmail.com"
                          dir="ltr"
                          className={`w-full bg-white border rounded-xl ps-10 pe-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all text-start shadow-xs font-medium ${
                            touched.email && fieldErrors.email
                              ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                              : touched.email && !fieldErrors.email && formData.email.includes('@')
                              ? 'border-emerald-500 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/10'
                              : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                          }`}
                        />
                      </div>
                      {touched.email && fieldErrors.email && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Left Column Fields */}
                  <div className="space-y-5">
                    {/* Password */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-900">
                          {isRtl ? 'كلمة المرور' : 'Password'} <span className="text-rose-500">*</span>
                        </label>
                        {formData.password && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${passwordStrength.bgLight}`}>
                            {isRtl ? passwordStrength.label.ar : passwordStrength.label.en}
                          </span>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock size={18} />
                        </div>
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          onBlur={() => markTouched('password')}
                          placeholder="••••••••"
                          dir="ltr"
                          className={`w-full bg-white border rounded-xl ps-10 pe-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs text-start font-medium ${
                            touched.password && fieldErrors.password
                              ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                              : touched.password && !fieldErrors.password && formData.password.length >= 8
                              ? 'border-emerald-500 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/10'
                              : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                          }`}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 end-0 pe-2.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                          title={showPassword ? (isRtl ? 'إخفاء كلمة المرور' : 'Hide password') : (isRtl ? 'إظهار كلمة المرور' : 'Show password')}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <span className="p-1 rounded-md hover:bg-slate-100 transition-colors flex items-center justify-center">
                            {showPassword ? <EyeOff size={18} className="text-blue-600" /> : <Eye size={18} />}
                          </span>
                        </button>
                      </div>

                      {/* Password Strength Meter (Visual Bars) */}
                      {formData.password.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          <div className="grid grid-cols-4 gap-1.5 h-1.5">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`rounded-full transition-all duration-300 ${
                                  passwordStrength.score >= level
                                    ? passwordStrength.color
                                    : 'bg-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-500">
                            <span className={`inline-flex items-center gap-1 ${passwordStrength.hasLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                              {passwordStrength.hasLength ? '✓' : '•'} {isRtl ? '8 أحرف على الأقل' : '8+ chars'}
                            </span>
                            <span className={`inline-flex items-center gap-1 ${passwordStrength.hasLetter ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                              {passwordStrength.hasLetter ? '✓' : '•'} {isRtl ? 'حروف' : 'Letters'}
                            </span>
                            <span className={`inline-flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                              {passwordStrength.hasNumber ? '✓' : '•'} {isRtl ? 'أرقام' : 'Numbers'}
                            </span>
                            <span className={`inline-flex items-center gap-1 ${passwordStrength.hasSpecial ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                              {passwordStrength.hasSpecial ? '✓' : '•'} {isRtl ? 'رموز' : 'Symbols'}
                            </span>
                          </div>
                        </div>
                      )}

                      {touched.password && fieldErrors.password && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.password}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-900">
                          {isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'} <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock size={18} />
                        </div>
                        <input 
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          onBlur={() => markTouched('confirmPassword')}
                          placeholder="••••••••"
                          dir="ltr"
                          className={`w-full bg-white border rounded-xl ps-10 pe-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs text-start font-medium ${
                            touched.confirmPassword && fieldErrors.confirmPassword
                              ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                              : touched.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword
                              ? 'border-emerald-500 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/10'
                              : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                          }`}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 end-0 pe-2.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                          title={showConfirmPassword ? (isRtl ? 'إخفاء كلمة المرور' : 'Hide password') : (isRtl ? 'إظهار كلمة المرور' : 'Show password')}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          <span className="p-1 rounded-md hover:bg-slate-100 transition-colors flex items-center justify-center">
                            {showConfirmPassword ? <EyeOff size={18} className="text-blue-600" /> : <Eye size={18} />}
                          </span>
                        </button>
                      </div>
                      {touched.confirmPassword && fieldErrors.confirmPassword && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    {/* TENANT Left Column Specific Fields (City Dropdown) */}
                    {accountType === 'tenant' && (
                      <div>
                        {/* City Custom Interactive Dropdown */}
                        <div className="relative">
                          <label className="block text-xs font-bold text-slate-900 mb-1.5">
                            {isRtl ? 'المدينة' : 'City'} <span className="text-rose-500">*</span>
                          </label>
                          <CityDropdown 
                            selectedCity={formData.city} 
                            onSelect={(cityName) => {
                              setFormData(prev => ({ ...prev, city: cityName }));
                            }}
                            isRtl={isRtl}
                            cities={SAUDI_CITIES}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Submit / Next Button */}
                <div className="pt-6 space-y-4">
                  {accountType === 'tenant' ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full bg-[#0B1B3D] hover:bg-[#122856] text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-md active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>{isRtl ? 'جاري إنشاء وتوثيق الحساب...' : 'Creating & verifying account...'}</span>
                        </div>
                      ) : (
                        <span>{isRtl ? 'إنشاء الحساب' : 'Create Account'}</span>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full bg-[#0B1B3D] hover:bg-[#122856] text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{isRtl ? 'التالي (إكمال البيانات)' : 'Next (Complete Details)'}</span>
                      {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                    </button>
                  )}

                  {/* Divider */}
                  <div className="flex items-center my-4">
                    <div className="flex-1 border-t border-slate-200"></div>
                    <span className="px-3 text-xs text-slate-400 font-bold uppercase">{isRtl ? 'أو التسجيل السريع' : 'OR QUICK SIGNUP'}</span>
                    <div className="flex-1 border-t border-slate-200"></div>
                  </div>

                  {/* Google Sign Up Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={isSubmitting}
                    className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs active:scale-[0.99] cursor-pointer"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.72 17.57V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                      <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.7 16.7 5.81 14.07H2.13V16.94C3.96 20.57 7.68 23 12 23Z" fill="#34A853"/>
                      <path d="M5.81 14.07C5.58 13.39 5.45 12.7 5.45 12C5.45 11.3 5.58 10.61 5.81 9.93V7.06H2.13C1.37 8.57 0.94 10.23 0.94 12C0.94 13.77 1.37 15.43 2.13 16.94L5.81 14.07Z" fill="#FBBC05"/>
                      <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.36 3.86C17.45 2.08 14.97 1 12 1C7.68 1 3.96 3.43 2.13 7.06L5.81 9.93C6.7 7.3 9.13 5.38 12 5.38Z" fill="#EA4335"/>
                    </svg>
                    <span>{isRtl ? 'التسجيل الفوري باستخدام Google' : 'Quick Sign Up with Google'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 2: Complete Details - PROPERTY OWNER (صاحب عقار)      */}
            {/* ========================================================= */}
            {step === 2 && accountType === 'owner' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Radio buttons: نوع المالك */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-900 mb-2">
                    {isRtl ? 'نوع المالك' : 'Owner Type'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, ownerType: 'individual' }))}
                      className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                        formData.ownerType === 'individual'
                          ? 'bg-[#0B1B3D] text-white border-[#0B1B3D] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isRtl ? 'فرد' : 'Individual'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, ownerType: 'office' }))}
                      className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer ${
                        formData.ownerType === 'office'
                          ? 'bg-[#0B1B3D] text-white border-[#0B1B3D] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isRtl ? 'مكتب عقاري' : 'Real Estate Office'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Right Column */}
                  <div className="space-y-5">
                    {/* ID / Commercial Register */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-900">
                          {formData.ownerType === 'office' 
                            ? (isRtl ? 'رقم السجل التجاري' : 'Commercial Registration')
                            : (isRtl ? 'رقم الهوية الوطنية' : 'National ID')} <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <input 
                        type="text" 
                        name="identityOrCr"
                        value={formData.identityOrCr}
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={handleInputChange}
                        onBlur={() => markTouched('identityOrCr')}
                        placeholder={isRtl ? '10 أرقام' : '10 Digits'}
                        dir="ltr"
                        className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all shadow-xs text-start font-medium ${
                          touched.identityOrCr && fieldErrors.identityOrCr
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                            : touched.identityOrCr && !fieldErrors.identityOrCr && formData.identityOrCr.length === 10
                            ? 'border-emerald-500 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/10'
                            : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                        }`}
                      />
                      {touched.identityOrCr && fieldErrors.identityOrCr && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.identityOrCr}
                        </p>
                      )}
                    </div>

                    {/* Office Name if Office */}
                    {formData.ownerType === 'office' && (
                      <div className="animate-fadeIn">
                        <label className="block text-xs font-bold text-slate-900 mb-1.5">
                          {isRtl ? 'اسم المكتب العقاري' : 'Office Name'} <span className="text-rose-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          name="officeName"
                          value={formData.officeName}
                          onChange={handleInputChange}
                          onBlur={() => markTouched('officeName')}
                          placeholder={isRtl ? 'ادخل اسم المكتب العقاري' : 'Enter office name'}
                          className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all shadow-xs font-medium ${
                            touched.officeName && fieldErrors.officeName
                              ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                              : touched.officeName && !fieldErrors.officeName && formData.officeName.trim().length >= 2
                              ? 'border-emerald-500 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/10'
                              : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                          }`}
                        />
                        {touched.officeName && fieldErrors.officeName && (
                          <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                            <AlertCircle size={12} /> {fieldErrors.officeName}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Left Column */}
                  <div className="space-y-5">
                    {/* City */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        {isRtl ? 'المدينة' : 'City'} <span className="text-rose-500">*</span>
                      </label>
                      <CityDropdown 
                        id="owner-city-select"
                        selectedCity={formData.ownerCity}
                        onSelect={(cityName) => {
                          setFormData(prev => ({ ...prev, ownerCity: cityName }));
                        }}
                        isRtl={isRtl}
                        cities={SAUDI_CITIES}
                      />
                    </div>
                  </div>
                </div>

                {/* Section Divider Bar: بيانات الدفع والتحويل */}
                <div className="bg-[#0B1B3D] text-white text-center py-2.5 px-4 rounded-xl font-bold text-sm my-6 flex items-center justify-center gap-2">
                  <ShieldCheck size={18} className="text-blue-300" />
                  <span>{isRtl ? 'بيانات التحويل البنكي والتواصل' : 'Bank Transfer & Contact Information'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Right Column: IBAN */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-900">
                        {isRtl ? 'رقم الآيبان البنكي' : 'Bank IBAN'} <span className="text-rose-500">*</span>
                      </label>
                    </div>
                    <input 
                      type="text" 
                      name="ibanOrAccount"
                      value={formData.ibanOrAccount}
                      maxLength={24}
                      onChange={handleInputChange}
                      onBlur={() => markTouched('ibanOrAccount')}
                      placeholder="SA0380000000608010167519"
                      dir="ltr"
                      className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all text-start shadow-xs font-mono font-medium ${
                        touched.ibanOrAccount && fieldErrors.ibanOrAccount
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                          : touched.ibanOrAccount && !fieldErrors.ibanOrAccount && formData.ibanOrAccount.length === 24
                          ? 'border-emerald-500 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/10'
                          : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                      }`}
                    />
                    {touched.ibanOrAccount && fieldErrors.ibanOrAccount && (
                      <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle size={12} /> {fieldErrors.ibanOrAccount}
                      </p>
                    )}
                  </div>

                  {/* Left Column: Preferred Contact Method */}
                  <div>
                    <label htmlFor="owner-contact-select" className="block text-xs font-bold text-slate-900 mb-1.5">
                      {isRtl ? 'وسيلة التواصل المفضلة' : 'Preferred Contact Method'}
                    </label>
                    <div className="relative">
                      <select 
                        id="owner-contact-select"
                        name="contactMethod"
                        value={formData.contactMethod}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] transition-all appearance-none shadow-xs font-medium cursor-pointer"
                      >
                        <option value="واتساب" className="text-slate-900 bg-white py-1">{isRtl ? 'واتساب' : 'WhatsApp'}</option>
                        <option value="اتصال هاتف" className="text-slate-900 bg-white py-1">{isRtl ? 'اتصال هاتف' : 'Phone Call'}</option>
                        <option value="بريد إلكتروني" className="text-slate-900 bg-white py-1">{isRtl ? 'بريد إلكتروني' : 'Email'}</option>
                      </select>
                      <ChevronDown size={18} className="absolute inset-y-0 end-3 my-auto text-slate-500 pointer-events-none z-10" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold text-sm transition-all text-center cursor-pointer"
                  >
                    {isRtl ? 'رجوع' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-2/3 bg-[#0B1B3D] hover:bg-[#122856] text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-md active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{isRtl ? 'جاري توثيق الحساب...' : 'Verifying Account...'}</span>
                      </div>
                    ) : (
                      <span>{isRtl ? 'إنشاء حساب صاحب عقار' : 'Create Owner Account'}</span>
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 2: Complete Details - CLEANER PROVIDER (مزود نظافة)   */}
            {/* ========================================================= */}
            {step === 2 && accountType === 'cleaner' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Right Column */}
                  <div className="space-y-5">
                    {/* Covered Neighborhoods */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        {isRtl ? 'الأحياء المشمولة' : 'Covered Neighborhoods'} <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        name="coveredNeighborhoods"
                        value={formData.coveredNeighborhoods}
                        onChange={handleInputChange}
                        onBlur={() => markTouched('coveredNeighborhoods')}
                        placeholder={isRtl ? 'مثال: النزهة، الملقا، الياسمين' : 'Ex: Nuzha, Malqa, Yasmin'}
                        className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all shadow-xs font-medium ${
                          touched.coveredNeighborhoods && fieldErrors.coveredNeighborhoods
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                        }`}
                      />
                      {touched.coveredNeighborhoods && fieldErrors.coveredNeighborhoods && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.coveredNeighborhoods}
                        </p>
                      )}
                    </div>

                    {/* Work Hours */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        {isRtl ? 'أوقات العمل' : 'Work Hours'} <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        name="workHours"
                        value={formData.workHours}
                        onChange={handleInputChange}
                        onBlur={() => markTouched('workHours')}
                        placeholder={isRtl ? 'مثال: من 8:00 صباحاً حتى 8:00 مساءً' : 'Ex: 8:00 AM to 8:00 PM'}
                        className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all shadow-xs font-medium ${
                          touched.workHours && fieldErrors.workHours
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                        }`}
                      />
                      {touched.workHours && fieldErrors.workHours && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.workHours}
                        </p>
                      )}
                    </div>

                    {/* Experience Years */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        {isRtl ? 'سنوات الخبرة' : 'Years of Experience'} <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        name="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleInputChange}
                        onBlur={() => markTouched('experienceYears')}
                        placeholder={isRtl ? 'مثال: 3 سنوات' : 'Ex: 3 Years'}
                        className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all shadow-xs font-medium ${
                          touched.experienceYears && fieldErrors.experienceYears
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                        }`}
                      />
                      {touched.experienceYears && fieldErrors.experienceYears && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.experienceYears}
                        </p>
                      )}
                    </div>

                    {/* ID or Iqama Number */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-900">
                          {isRtl ? 'رقم الهوية الوطنية أو الإقامة' : 'National ID / Iqama'} <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <input 
                        type="text" 
                        name="idNumber"
                        value={formData.idNumber}
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={handleInputChange}
                        onBlur={() => markTouched('idNumber')}
                        placeholder={isRtl ? '10 أرقام' : '10 Digits'}
                        dir="ltr"
                        className={`w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all shadow-xs text-start font-medium ${
                          touched.idNumber && fieldErrors.idNumber
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                            : touched.idNumber && !fieldErrors.idNumber && formData.idNumber.length === 10
                            ? 'border-emerald-500 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/10'
                            : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                        }`}
                      />
                      {touched.idNumber && fieldErrors.idNumber && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.idNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Left Column */}
                  <div className="space-y-5">
                    {/* City Selection from unified SAUDI_CITIES */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        {isRtl ? 'المدينة' : 'City'} <span className="text-rose-500">*</span>
                      </label>
                      <CityDropdown 
                        id="cleaner-city-select"
                        selectedCity={formData.cleanerCity}
                        onSelect={(cityName) => {
                          setFormData(prev => ({ ...prev, cleanerCity: cityName }));
                        }}
                        isRtl={isRtl}
                        cities={SAUDI_CITIES}
                      />
                    </div>

                    {/* Service Type as INPUT */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        {isRtl ? 'نوع الخدمة' : 'Service Type'} <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleInputChange}
                        onBlur={() => markTouched('serviceType')}
                        placeholder={isRtl ? 'مثال: تنظيف منازل وشقق' : 'Ex: House cleaning'}
                        className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs font-medium ${
                          touched.serviceType && fieldErrors.serviceType
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                        }`}
                      />
                      {touched.serviceType && fieldErrors.serviceType && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.serviceType}
                        </p>
                      )}
                    </div>

                    {/* Pricing / Rate as INPUT */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        {isRtl ? 'التسعير' : 'Pricing'} <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        name="pricing"
                        value={formData.pricing}
                        onChange={handleInputChange}
                        onBlur={() => markTouched('pricing')}
                        placeholder={isRtl ? 'مثال: 50 ريال / ساعة' : 'Ex: 50 SAR / Hour'}
                        className={`w-full bg-white border rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-xs font-medium ${
                          touched.pricing && fieldErrors.pricing
                            ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20'
                            : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                        }`}
                      />
                      {touched.pricing && fieldErrors.pricing && (
                        <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.pricing}
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Action Buttons */}
                <div className="pt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold text-sm transition-all text-center cursor-pointer"
                  >
                    {isRtl ? 'رجوع' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-2/3 bg-[#0B1B3D] hover:bg-[#122856] text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-md active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{isRtl ? 'جاري توثيق الحساب...' : 'Verifying Account...'}</span>
                      </div>
                    ) : (
                      <span>{isRtl ? 'إنشاء حساب مزود نظافة' : 'Create Cleaner Account'}</span>
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* Bottom Footer Switch to Login */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
              <span>{isRtl ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}</span>
              <Link to="/login" className="font-extrabold text-[#0B1B3D] hover:underline ms-1">
                {isRtl ? 'سجل دخولك هنا' : 'Log in here'}
              </Link>
            </div>

          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        © {new Date().getFullYear()} {isRtl ? 'منصة الخدمات العقارية والنظافة. جميع الحقوق محفوظة.' : 'Property & Cleaning Services Platform. All rights reserved.'}
      </footer>

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showOtpModal}
        email={formData.email.trim()}
        fullName={formData.fullName.trim()}
        onSuccess={finalizeAccountCreation}
        onCancel={() => setShowOtpModal(false)}
        isRtl={isRtl}
      />
    </div>
  );
}
