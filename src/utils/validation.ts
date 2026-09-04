// Validation utilities for Authentication & Registration

export interface PasswordStrength {
  score: number; // 0 to 4
  label: { ar: string; en: string };
  color: string;
  bgLight: string;
  hasLength: boolean;
  hasNumber: boolean;
  hasLetter: boolean;
  hasSpecial: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\]/.test(password);

  let score = 0;
  if (password.length > 0) score += 1;
  if (hasLength) score += 1;
  if (hasNumber && hasLetter) score += 1;
  if (hasSpecial && password.length >= 10) score += 1;

  if (score > 4) score = 4;

  const strengthMap: Record<number, { label: { ar: string; en: string }; color: string; bgLight: string }> = {
    0: { label: { ar: 'فارغة', en: 'Empty' }, color: 'bg-slate-200', bgLight: 'bg-slate-100 text-slate-500' },
    1: { label: { ar: 'ضعيفة جداً', en: 'Very Weak' }, color: 'bg-rose-500', bgLight: 'bg-rose-50 text-rose-700 border-rose-200' },
    2: { label: { ar: 'متوسطة', en: 'Fair' }, color: 'bg-amber-500', bgLight: 'bg-amber-50 text-amber-700 border-amber-200' },
    3: { label: { ar: 'جيدة', en: 'Good' }, color: 'bg-blue-500', bgLight: 'bg-blue-50 text-blue-700 border-blue-200' },
    4: { label: { ar: 'قوية ومحمية', en: 'Strong & Secure' }, color: 'bg-emerald-500', bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  };

  return {
    score,
    label: strengthMap[score].label,
    color: strengthMap[score].color,
    bgLight: strengthMap[score].bgLight,
    hasLength,
    hasNumber,
    hasLetter,
    hasSpecial,
  };
}

// Disallowed fake/disposable domains
const FAKE_DOMAINS = [
  'test.com', 'example.com', 'fake.com', 'temp.com', 'mailinator.com',
  '10minutemail.com', 'guerrillamail.com', 'throwaway.com', 'trashmail.com',
  'asdf.com', 'aaa.com', 'dummy.com', 'noemail.com', 'none.com', 'sample.com'
];

/**
 * Validates email format and ensures it is a real Gmail or valid genuine email domain.
 */
export function validateEmail(email: string, requireGmail: boolean = false): { isValid: boolean; errorKey: { ar: string; en: string } } {
  const trimmed = email.trim().toLowerCase();
  
  if (!trimmed) {
    return {
      isValid: false,
      errorKey: { ar: 'البريد الإلكتروني مطلوب', en: 'Email is required' }
    };
  }

  // Standard RFC regex pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      errorKey: { ar: 'صيغة البريد الإلكتروني غير صحيحة (مثال: name@gmail.com)', en: 'Invalid email format (e.g. name@gmail.com)' }
    };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      errorKey: { ar: 'صيغة البريد الإلكتروني غير صحيحة', en: 'Invalid email format' }
    };
  }

  const [username, domain] = parts;

  if (username.length < 3) {
    return {
      isValid: false,
      errorKey: { ar: 'اسم المستخدم للبريد الإلكتروني قصير جداً', en: 'Email username is too short' }
    };
  }

  if (FAKE_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      errorKey: { ar: 'يرجى إدخال بريد حقيقي (Gmail أو بريد معتمد) وعدم استخدام بريد وهمي', en: 'Please enter a real email (Gmail or valid email), disposable emails not allowed' }
    };
  }

  if (requireGmail && !domain.includes('gmail.com')) {
    return {
      isValid: false,
      errorKey: { ar: 'يرجى استخدام حساب بريد Gmail حقيقي ينتهي بـ @gmail.com', en: 'Please use a valid Gmail account ending with @gmail.com' }
    };
  }

  return { isValid: true, errorKey: { ar: '', en: '' } };
}

/**
 * Validates Saudi mobile phone numbers (05xxxxxxxx or +9665xxxxxxxx or 9665xxxxxxxx)
 */
export function validateSaudiPhone(phone: string): { isValid: boolean; errorKey: { ar: string; en: string } } {
  const cleaned = phone.replace(/[\s\-()]/g, '');

  if (!cleaned) {
    return {
      isValid: false,
      errorKey: { ar: 'رقم الهاتف مطلوب', en: 'Phone number is required' }
    };
  }

  // 05XXXXXXXX (10 digits) or 9665XXXXXXXX (12 digits) or +9665XXXXXXXX
  const saudiRegex = /^(05\d{8}|(9665|\+9665)\d{8}|5\d{8})$/;
  if (!saudiRegex.test(cleaned)) {
    return {
      isValid: false,
      errorKey: { ar: 'يرجى إدخال رقم هاتف سعودي صحيح يبدأ بـ 05 (مثال: 0512345678)', en: 'Please enter a valid Saudi mobile starting with 05 (e.g. 0512345678)' }
    };
  }

  return { isValid: true, errorKey: { ar: '', en: '' } };
}

/**
 * Validates Saudi IBAN (SA + 22 alphanumeric/digits = 24 chars)
 */
export function validateSaudiIban(iban: string): { isValid: boolean; errorKey: { ar: string; en: string } } {
  const cleaned = iban.replace(/\s+/g, '').toUpperCase();
  if (!cleaned) {
    return {
      isValid: false,
      errorKey: { ar: 'رقم الآيبان أو الحساب البنكي مطلوب', en: 'IBAN or bank account is required' }
    };
  }

  if (cleaned.startsWith('SA') && cleaned.length !== 24) {
    return {
      isValid: false,
      errorKey: { ar: 'الآيبان السعودي يجب أن يتكون من SA متبوعة بـ 22 رقم/حرف', en: 'Saudi IBAN must start with SA followed by 22 digits' }
    };
  }

  if (cleaned.length < 10) {
    return {
      isValid: false,
      errorKey: { ar: 'رقم الحساب البنكي قصير جداً', en: 'Bank account number is too short' }
    };
  }

  return { isValid: true, errorKey: { ar: '', en: '' } };
}

/**
 * Validates Saudi National ID or Iqama (10 digits) or Commercial Registration (10 digits)
 */
export function validateIdOrCr(idVal: string): { isValid: boolean; errorKey: { ar: string; en: string } } {
  const cleaned = idVal.trim();
  if (!cleaned) {
    return {
      isValid: false,
      errorKey: { ar: 'رقم الهوية الوطنية / الإقامة أو السجل التجاري مطلوب', en: 'National ID, Iqama or CR is required' }
    };
  }

  const digitsRegex = /^\d{10}$/;
  if (!digitsRegex.test(cleaned)) {
    return {
      isValid: false,
      errorKey: { ar: 'يجب أن يتكون رقم الهوية أو السجل التجاري من 10 أرقام', en: 'ID or Commercial Registration must be 10 digits' }
    };
  }

  return { isValid: true, errorKey: { ar: '', en: '' } };
}
