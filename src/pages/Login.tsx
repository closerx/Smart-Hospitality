import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import logoImg from '../assets/images/logo.png';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ArrowLeft, ShieldCheck, Check, AlertCircle, X, KeyRound, UserPlus } from 'lucide-react';
import { validateEmail } from '../utils/validation';
import { supabase } from '../lib/supabase';
import { BaseUser } from '../types/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { currentUser, role, isAdmin, loading, setDirectSession, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRtl = i18n.language === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Field-specific touched and error states
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  // Read URL query params (e.g. redirected from SignUp or forgot password link)
  useEffect(() => {
    const paramEmail = searchParams.get('email');
    const isForgotParam = searchParams.get('forgot') === 'true';
    if (paramEmail) {
      setEmail(paramEmail);
      setResetEmail(paramEmail);
    }
    if (isForgotParam) {
      setShowResetModal(true);
    }
  }, [searchParams]);

  // If already logged in, redirect straight to their dashboard
  useEffect(() => {
    if (!loading && currentUser) {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'owner') {
        navigate('/owner-dashboard', { replace: true });
      } else if (role === 'cleaner') {
        navigate('/cleaner-dashboard', { replace: true });
      } else if (role === 'tenant') {
        navigate('/tenant-dashboard', { replace: true });
      }
    }
  }, [currentUser, role, loading, navigate]);

  // Live Email Validation
  const emailValidation = validateEmail(email, false);
  const isEmailError = touched.email && !emailValidation.isValid;

  // Live Password Validation
  const isPasswordEmpty = touched.password && password.length === 0;
  const isPasswordShort = touched.password && password.length > 0 && password.length < 6;

  // Redirect based on user's registered role in Supabase
  const redirectUserByRole = async (userId: string, userEmail?: string | null) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      const userRole = data?.role || 'tenant';
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'owner') {
        navigate('/owner-dashboard', { replace: true });
      } else if (userRole === 'cleaner') {
        navigate('/cleaner-dashboard', { replace: true });
      } else {
        navigate('/tenant-dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Role routing error:', err);
      navigate('/tenant-dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!email.trim()) {
      setError(isRtl ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email address');
      return;
    }

    if (!emailValidation.isValid) {
      setError(isRtl ? emailValidation.errorKey.ar : emailValidation.errorKey.en);
      return;
    }

    if (!password) {
      setError(isRtl ? 'يرجى إدخال كلمة المرور' : 'Please enter your password');
      return;
    }

    if (password.length < 6) {
      setError(isRtl ? 'كلمة المرور يجب أن لا تقل عن 6 خانات' : 'Password must be at least 6 characters');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      
      // 1. Sign in with Supabase Auth (verifies email & bcrypt password against auth.users)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      // If signed in successfully
      if (!signInError && data?.user) {
        const user = data.user;
        setIsLoading(false);
        setSuccess(true);
        await redirectUserByRole(user.id, user.email);
        return;
      }

      // Check if the credentials are valid but email is not confirmed in Supabase Auth
      const isEmailNotConfirmed = Boolean(
        signInError && (
          signInError.message?.toLowerCase().includes('not confirmed') ||
          signInError.message?.toLowerCase().includes('email not confirmed')
        )
      );

      if (isEmailNotConfirmed) {
        // Find existing profile in users table
        let dbUser: any = null;
        try {
          const { data: foundUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();
          dbUser = foundUser;
        } catch (err) {
          console.warn('Query users table notice:', err);
        }

        let userRole = dbUser?.role || 'tenant';
        let userName = dbUser?.full_name || dbUser?.fullName || cleanEmail.split('@')[0];
        let userPhone = dbUser?.phone || '';
        const userId = dbUser?.id || data?.user?.id || `usr_${Date.now()}`;

        if (!dbUser?.role) {
          try {
            const { data: ownerRecord } = await supabase.from('owners').select('id, full_name').eq('email', cleanEmail).maybeSingle();
            if (ownerRecord) {
              userRole = 'owner';
              userName = ownerRecord.full_name || userName;
            } else {
              const { data: cleanerRecord } = await supabase.from('cleaners').select('id, full_name').eq('email', cleanEmail).maybeSingle();
              if (cleanerRecord) {
                userRole = 'cleaner';
                userName = cleanerRecord.full_name || userName;
              }
            }
          } catch {}
        }

        const userAuthRecord = {
          id: userId,
          uid: userId,
          email: cleanEmail,
          phone: userPhone,
          phoneNumber: userPhone,
          displayName: userName,
          emailVerified: true,
          user_metadata: {
            fullName: userName,
            phone: userPhone,
            role: userRole,
          }
        };

        const fullProfileRecord: any = {
          id: userId,
          email: cleanEmail,
          fullName: userName,
          phone: userPhone,
          role: userRole,
          isEmailVerified: true,
          ...(dbUser || {})
        };

        setDirectSession(userAuthRecord, fullProfileRecord);
        setIsLoading(false);
        setSuccess(true);

        if (userRole === 'admin') {
          navigate('/admin', { replace: true });
        } else if (userRole === 'owner') {
          navigate('/owner-dashboard', { replace: true });
        } else if (userRole === 'cleaner') {
          navigate('/cleaner-dashboard', { replace: true });
        } else {
          navigate('/tenant-dashboard', { replace: true });
        }
        return;
      }

      // If there is any other error (such as wrong password or invalid credentials), throw it
      if (signInError) {
        throw signInError;
      }

    } catch (err: any) {
      setIsLoading(false);

      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid credential') || msg.includes('user not found') || msg.includes('wrong password') || msg.includes('email not confirmed')) {
        setError(isRtl 
          ? 'بيانات الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور، أو إنشاء حساب جديد إذا لم تكن مسجلاً مسبقاً.' 
          : 'Invalid credentials. Please verify your email and password, or create a new account if you have not registered yet.');
      } else if (msg.includes('too many requests')) {
        setError(isRtl ? 'تم حظر الحساب مؤقتاً بسبب محاولات دخول متكررة خاطئة. يرجى الانتظار أو إعادة تعيين كلمة المرور.' : 'Too many failed login attempts. Please try again later or reset password.');
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setError(isRtl ? 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.' : 'Network connection error. Please verify internet connectivity.');
      } else {
        setError(isRtl ? (err?.message || 'تعذر تسجيل الدخول. يرجى التأكد من البيانات والمحاولة مجدداً.') : 'Unable to sign in. Please verify your credentials.');
      }
    }
  };

  // Google Login via Firebase
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { profile } = await signInWithGoogle('tenant');
      setIsLoading(false);
      const userRole = profile.role || 'tenant';
      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'owner') {
        navigate('/owner-dashboard', { replace: true });
      } else if (userRole === 'cleaner') {
        navigate('/cleaner-dashboard', { replace: true });
      } else {
        navigate('/tenant-dashboard', { replace: true });
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error('Firebase Google login error:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no error needed
        return;
      }
      setError(isRtl ? 'تعذر تسجيل الدخول عبر Google. يرجى المحاولة لاحقاً أو تسجيل الدخول بالبريد الإلكتروني.' : 'Failed to sign in with Google. Please try again or use email login.');
    }
  };

  // Handle Forgot Password via Supabase
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError(isRtl ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }
    const val = validateEmail(resetEmail, false);
    if (!val.isValid) {
      setResetError(isRtl ? val.errorKey.ar : val.errorKey.en);
      return;
    }

    setResetLoading(true);
    setResetError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;

      setResetLoading(false);
      setResetSuccess(true);
    } catch (err: any) {
      setResetLoading(false);
      setResetError(isRtl ? 'حدث خطأ أثناء إرسال رابط الاستعادة. يرجى المحاولة لاحقاً.' : 'Error sending reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Header Navigation Bar */}
      <header className="bg-[#0B1B3D] text-white py-3.5 px-4 sm:px-8 md:px-12 flex justify-between items-center shadow-md">
        <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
          <img src={logoImg} alt="Smart Hospitality" className="h-10 w-auto object-contain bg-white/90 p-1 rounded-lg shadow-sm" />
          <span className="text-base sm:text-lg font-bold tracking-tight">
            Smart Hospitality
          </span>
        </Link>
        <Link 
          to="/signup" 
          className="flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-200 hover:text-white hover:underline transition-colors"
        >
          <span>{isRtl ? 'إنشاء حساب جديد' : 'Create New Account'}</span>
          {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
        </Link>
      </header>

      {/* Main Body Layout */}
      <main className="flex-1 p-3 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Left Column: Platform Branding & Illustration (5 Cols on LG) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#EEF4FF] via-[#E5F0FF] to-[#D5E5FF] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border-e border-slate-200/80">
            <div className="z-10">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B1B3D] mb-3 leading-tight">
                {isRtl ? 'منصة متكاملة' : 'Integrated Platform'}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                {isRtl 
                  ? 'لخدمات النظافة والصيانة وإدارة الضيافة بأسلوب احترافي وفاخر وموثق عبر سحابة Supabase' 
                  : 'For cleaning, maintenance and hospitality management in a professional verified style'}
              </p>
            </div>

            {/* Illustration Image / Visual */}
            <div className="my-8 flex items-center justify-center relative z-10">
              <div className="w-full max-w-[280px] relative">
                <div className="absolute inset-0 bg-blue-400/10 rounded-full blur-2xl -z-10"></div>
                <img 
                  src="/img-login.png" 
                  alt="Login Illustration" 
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain drop-shadow-2xl transition-transform hover:scale-105 duration-500"
                />
              </div>
            </div>

            {/* Bottom Security Badge */}
            <div className="z-10 flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white/80 backdrop-blur-md p-2.5 rounded-lg border border-white/80 shadow-xs">
              <ShieldCheck size={18} className="text-blue-600 shrink-0" />
              <span>{isRtl ? 'تسجيل دخول آمن ومحمي بأحدث أنظمة التشفير Supabase' : 'Secure login protected with advanced encryption'}</span>
            </div>
          </div>

          {/* Right Column: Login Form (7 Cols on LG) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-white">
            <div className="my-auto max-w-md w-full mx-auto">
              
              <div className="text-center sm:text-start mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3D] mb-1.5">
                  {isRtl ? 'أهلاً بك مجدداً!' : 'Welcome Back!'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {isRtl ? 'أدخل بريدك الإلكتروني المعتمد وكلمة المرور' : 'Enter your verified email and password'}
                </p>
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                    <div className="flex-1 leading-relaxed">
                      <p>{error}</p>
                      {(error.includes('بيانات الدخول') || error.includes('Invalid credentials')) && (
                        <div className="mt-3 pt-2.5 border-t border-rose-200/80 flex flex-wrap items-center gap-2">
                          <button 
                            type="button" 
                            onClick={() => {
                              setResetEmail(email);
                              setResetSuccess(false);
                              setResetError('');
                              setShowResetModal(true);
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <KeyRound size={13} />
                            <span>{isRtl ? 'استعادة / تعيين كلمة المرور' : 'Reset Password'}</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.72 17.57V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                              <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.7 16.7 5.81 14.07H2.13V16.94C3.96 20.57 7.68 23 12 23Z" fill="#34A853"/>
                              <path d="M5.81 14.07C5.58 13.39 5.45 12.7 5.45 12C5.45 11.3 5.58 10.61 5.81 9.93V7.06H2.13C1.37 8.57 0.94 10.23 0.94 12C0.94 13.77 1.37 15.43 2.13 16.94L5.81 14.07Z" fill="#FBBC05"/>
                              <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.36 3.86C17.45 2.08 14.97 1 12 1C7.68 1 3.96 3.43 2.13 7.06L5.81 9.93C6.7 7.3 9.13 5.38 12 5.38Z" fill="#EA4335"/>
                            </svg>
                            <span>Google</span>
                          </button>

                          <Link 
                            to="/signup" 
                            className="text-slate-800 hover:text-slate-950 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all inline-flex items-center gap-1.5"
                          >
                            <UserPlus size={13} />
                            <span>{isRtl ? 'إنشاء حساب جديد' : 'New Account'}</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn">
                  <Check size={18} className="shrink-0 text-emerald-600" />
                  <span>{isRtl ? 'تم تسجيل الدخول بنجاح! جاري تحويلك...' : 'Login successful! Redirecting...'}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      placeholder="name@example.com"
                      dir="ltr"
                      className={`w-full bg-slate-50 border rounded-xl ps-10 pe-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all font-medium text-start ${
                        isEmailError 
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20' 
                          : touched.email && emailValidation.isValid
                          ? 'border-emerald-500 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/10'
                          : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                      }`}
                    />
                  </div>
                  {isEmailError && (
                    <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle size={12} />
                      {isRtl ? emailValidation.errorKey.ar : emailValidation.errorKey.en}
                    </p>
                  )}
                </div>

                {/* Password input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isRtl ? 'كلمة المرور' : 'Password'}
                    </label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setResetEmail(email);
                        setResetSuccess(false);
                        setResetError('');
                        setShowResetModal(true);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                      placeholder="••••••••"
                      dir="ltr"
                      className={`w-full bg-slate-50 border rounded-xl ps-10 pe-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white transition-all font-medium text-start ${
                        (isPasswordEmpty || isPasswordShort)
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20' 
                          : touched.password && password.length >= 6
                          ? 'border-emerald-500 hover:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-emerald-50/10'
                          : 'border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D]'
                      }`}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <span className="p-1 rounded-md hover:bg-slate-200/60 transition-colors">
                        {showPassword ? <EyeOff size={18} className="text-blue-600" /> : <Eye size={18} />}
                      </span>
                    </button>
                  </div>
                  {isPasswordShort && (
                    <p className="mt-1.5 text-[11px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle size={12} />
                      {isRtl ? 'كلمة المرور يجب أن لا تقل عن 6 خانات' : 'Password must be at least 6 characters'}
                    </p>
                  )}
                </div>

                {/* Remember me checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0B1B3D] focus:ring-[#0B1B3D] border-slate-300"
                    />
                    <span>{isRtl ? 'تذكر بياناتي في هذا الجهاز' : 'Remember me on this device'}</span>
                  </label>
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0B1B3D] hover:bg-[#122856] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-sm sm:text-base flex items-center justify-center gap-2 mt-3 disabled:opacity-60 active:scale-[0.99] cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isRtl ? 'جاري التحقق والدخول...' : 'Verifying & signing in...'}</span>
                    </div>
                  ) : (
                    <span>{isRtl ? 'تسجيل الدخول' : 'Sign In'}</span>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center">
                <div className="flex-1 border-t border-slate-200"></div>
                <span className="px-3 text-xs text-slate-400 font-bold uppercase">{isRtl ? 'أو' : 'OR'}</span>
                <div className="flex-1 border-t border-slate-200"></div>
              </div>

              {/* Social Login Button */}
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white border border-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs active:scale-[0.99] cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.72 17.57V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                  <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.57C14.73 18.23 13.48 18.63 12 18.63C9.13 18.63 6.7 16.7 5.81 14.07H2.13V16.94C3.96 20.57 7.68 23 12 23Z" fill="#34A853"/>
                  <path d="M5.81 14.07C5.58 13.39 5.45 12.7 5.45 12C5.45 11.3 5.58 10.61 5.81 9.93V7.06H2.13C1.37 8.57 0.94 10.23 0.94 12C0.94 13.77 1.37 15.43 2.13 16.94L5.81 14.07Z" fill="#FBBC05"/>
                  <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.36 3.86C17.45 2.08 14.97 1 12 1C7.68 1 3.96 3.43 2.13 7.06L5.81 9.93C6.7 7.3 9.13 5.38 12 5.38Z" fill="#EA4335"/>
                </svg>
                <span>{isRtl ? 'المتابعة باستخدام Google' : 'Continue with Google'}</span>
              </button>

              {/* Link to Signup */}
              <div className="mt-5 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  {isRtl ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
                  <Link to="/signup" className="font-bold text-blue-600 hover:underline">
                    {isRtl ? 'إنشاء حساب جديد' : 'Create New Account'}
                  </Link>
                </p>
              </div>

            </div>

            {/* Security Notice Footer */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <Lock size={13} className="text-slate-400" />
              <span>{isRtl ? 'نحن نحافظ على أمان بياناتك وخصوصيتك بأعلى معايير التشفير' : 'We maintain data security & privacy with top encryption'}</span>
            </div>

          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button 
              type="button" 
              onClick={() => setShowResetModal(false)}
              className="absolute top-4 end-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock size={22} />
              </div>
              <h3 className="text-lg font-black text-[#0B1B3D]">
                {isRtl ? 'استعادة كلمة المرور' : 'Reset Your Password'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isRtl ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً آمناً لتعيين كلمة مرور جديدة' : 'Enter your email and we will send you a secure password reset link'}
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-700">
                  <Check size={18} />
                  <span>{isRtl ? 'تم إرسال رابط إعادة التعيين بنجاح!' : 'Reset link sent successfully!'}</span>
                </div>
                <p className="text-[11px] text-slate-600 font-normal">
                  {isRtl ? 'يرجى مراجعة صندوق الوارد (أو الرسائل غير المرغوب فيها) في بريدك الإلكتروني.' : 'Please check your inbox or spam folder.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-full bg-[#0B1B3D] text-white font-bold py-2.5 rounded-lg text-xs hover:bg-[#122856] transition-colors"
                >
                  {isRtl ? 'تم، إغلاق النافذة' : 'Done, Close'}
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isRtl ? 'البريد الإلكتروني المسجل' : 'Registered Email'}
                  </label>
                  <input 
                    type="email" 
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B1B3D]/20 focus:border-[#0B1B3D] text-start font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-2/3 py-2.5 rounded-xl bg-[#0B1B3D] text-white font-bold text-xs hover:bg-[#122856] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{isRtl ? 'جاري الإرسال...' : 'Sending...'}</span>
                      </>
                    ) : (
                      <span>{isRtl ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
