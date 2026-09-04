import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Clock, 
  Info
} from 'lucide-react';
import { verifyOTPCode, createAndSaveOTP } from '../utils/otpService';

interface OTPVerificationModalProps {
  isOpen: boolean;
  email: string;
  fullName: string;
  onSuccess: () => void;
  onCancel: () => void;
  isRtl?: boolean;
}

export default function OTPVerificationModal({
  isOpen,
  email,
  fullName,
  onSuccess,
  onCancel,
  isRtl = true,
}: OTPVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300); // 5 minutes (300s)
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on open & reset timers
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMessage('');
      setResendCooldown(60);
      setOtpExpirySeconds(300);
      setResendSuccess(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    }
  }, [isOpen]);

  // Resend Cooldown Timer
  useEffect(() => {
    if (!isOpen) return;
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, resendCooldown]);

  // 5-Minute OTP Expiry Live Countdown
  useEffect(() => {
    if (!isOpen) return;
    if (otpExpirySeconds <= 0) return;

    const timer = setInterval(() => {
      setOtpExpirySeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, otpExpirySeconds]);

  // Format seconds into MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/[^0-9]/g, '');
    
    // If pasted multiple digits
    if (cleanVal.length > 1) {
      const pastedChars = cleanVal.slice(0, 6).split('');
      const newDigits = [...digits];
      pastedChars.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pastedChars.length, 5);
      inputRefs.current[nextFocus]?.focus();
      setErrorMessage('');
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);
    setErrorMessage('');

    // Auto-focus next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setDigits(newDigits);
      const nextFocus = Math.min(pastedData.length, 5);
      inputRefs.current[nextFocus]?.focus();
      setErrorMessage('');
    }
  };

  const handleVerifyWithCode = async (codeToVerify: string) => {
    setIsVerifying(true);
    setErrorMessage('');

    try {
      const result = await verifyOTPCode(email, codeToVerify);
      if (result.valid) {
        setIsVerifying(false);
        onSuccess();
      } else {
        setIsVerifying(false);
        setErrorMessage(result.message);
      }
    } catch (err) {
      setIsVerifying(false);
      setErrorMessage(isRtl ? 'رمز التحقق غير صحيح أو انتهت صلاحيته، يرجى المحاولة ثانية' : 'Invalid or expired OTP code, please try again');
    }
  };

  const handleVerify = () => {
    const enteredCode = digits.join('');
    if (enteredCode.length !== 6) {
      setErrorMessage(isRtl ? 'يرجى إدخال جميع أرقام الرمز الستة' : 'Please enter all 6 digits of the code');
      return;
    }
    handleVerifyWithCode(enteredCode);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage('');
    setResendSuccess(false);
    try {
      await createAndSaveOTP(email, fullName);
      setDigits(['', '', '', '', '', '']);
      setResendCooldown(60);
      setOtpExpirySeconds(300); // Reset 5 min expiration timer
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
      inputRefs.current[0]?.focus();
    } catch (e) {
      console.error('Error resending OTP:', e);
      setErrorMessage(isRtl ? 'تعذر إرسال رمز جديد حالياً، يرجى المحاولة بعد قليل' : 'Could not send a new code, please try again shortly');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative my-6"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#0B1B3D] via-[#172a54] to-[#1e3a8a] text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/15">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {isRtl ? 'التحقق من الرمز والبريد الإلكتروني' : 'Email Security Verification'}
                </h3>
                <p className="text-xs text-amber-300 font-bold tracking-wider">
                  SMART HOSPITALITY • SECURE OTP
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Email target info */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-[#0B1B3D] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Mail size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-600 font-semibold mb-0.5">
                {isRtl ? 'تم إرسال رمز التحقق للبريد الإلكتروني:' : 'Verification target email:'}
              </p>
              <p className="text-sm font-black text-[#0B1B3D] truncate" dir="ltr">
                {email}
              </p>
              <div className="mt-2 bg-amber-50/90 border border-amber-200/90 rounded-lg p-2 text-[11px] text-amber-950 flex items-start gap-1.5 leading-relaxed font-medium">
                <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
                <span>
                  {isRtl 
                    ? 'يرجى مراجعة صندوق الوارد ومجلد الرسائل غير المرغوب فيها (Spam / Junk) في بريدك الإلكتروني.'
                    : 'Please check your Inbox and Spam/Junk folder in your email provider.'}
                </span>
              </div>
            </div>
          </div>

          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{isRtl ? 'تم إرسال رمز تحقق جديد بنجاح إلى بريدك الإلكتروني.' : 'New OTP code sent to your email successfully.'}</span>
            </motion.div>
          )}

          {/* 6 Digit Input Boxes */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 text-center mb-3">
              {isRtl ? 'أدخل رمز التحقق (OTP) المكون من 6 أرقام المرسل لبريدك' : 'Enter the 6-digit OTP code sent to your email'}
            </label>
            <div className="flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl border-2 transition-all outline-none ${
                    digit
                      ? 'border-[#0B1B3D] bg-blue-50/40 text-[#0B1B3D] shadow-xs'
                      : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
              ))}
            </div>

            {/* Error message */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center justify-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 py-2 px-3 rounded-lg"
              >
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </div>

          {/* Security & Expiry info with Live Timer */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold">
              <Clock size={15} className={otpExpirySeconds < 60 ? 'text-rose-600 animate-pulse' : 'text-amber-600'} />
              {otpExpirySeconds > 0 ? (
                <span className={otpExpirySeconds < 60 ? 'text-rose-600 font-extrabold' : 'text-slate-700'}>
                  {isRtl ? `ينتهي الرمز خلال: ${formatTime(otpExpirySeconds)}` : `Expires in: ${formatTime(otpExpirySeconds)}`}
                </span>
              ) : (
                <span className="text-rose-600 font-extrabold">
                  {isRtl ? 'انتهت صلاحية الرمز (طلب رمز جديد)' : 'OTP Expired (Resend required)'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>{isRtl ? 'تشفير وحماية أمنية 256-bit' : '256-bit Encrypted'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || digits.join('').length !== 6}
              className="w-full bg-[#0B1B3D] hover:bg-[#152a55] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isVerifying ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>{isRtl ? 'جارِ التحقق من الرمز وتفعيل الحساب...' : 'Verifying OTP...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span>{isRtl ? 'تأكيد الرمز وتفعيل الحساب' : 'Verify & Activate Account'}</span>
                </>
              )}
            </button>

            {/* Resend button & timer */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{isRtl ? 'لم يصلك الرمز؟' : "Didn't receive code?"}</span>
              {resendCooldown > 0 ? (
                <div className="flex items-center gap-1 font-semibold text-slate-600">
                  <Clock size={13} className="text-slate-400" />
                  <span>{isRtl ? `إعادة الإرسال بعد (${resendCooldown} ثانية)` : `Resend in (${resendCooldown}s)`}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-blue-700 hover:text-blue-900 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
                  <span>{isRtl ? 'إعادة إرسال رمز جديد الآن' : 'Resend New Code Now'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
