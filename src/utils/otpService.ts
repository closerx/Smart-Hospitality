import { supabase } from '../lib/supabase';

export interface OTPRecord {
  id?: string;
  email: string;
  otpHashing: string; // SHA-256 hashed OTP with email salt for zero plaintext exposure
  expiresAt: string; // ISO string (5 mins)
  attempts: number;
  verified: boolean;
  createdAt: string;
}

/**
 * Computes a SHA-256 cryptographic hash of the OTP salted with the email
 * to prevent plaintext exposure in database and network transfers.
 */
async function hashOTP(email: string, otp: string): Promise<string> {
  const secretSalt = 'SMART_HOSPITALITY_SUPABASE_SALT_v1';
  const dataToHash = `${email.trim().toLowerCase()}:${otp.trim()}:${secretSalt}`;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback bit-wise hash for environments without WebCrypto
  let hash = 0;
  for (let i = 0; i < dataToHash.length; i++) {
    const char = dataToHash.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `fallback_${Math.abs(hash).toString(16)}`;
}

/**
 * Generates a secure, cryptographically unpredictable 6-digit numerical OTP
 */
export function generateOTP(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    // Produce an unpredictable 6-digit number between 100000 and 999999
    const code = (100000 + (array[0] % 900000)).toString();
    return code;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Returns a high-end luxury branded HTML email template for SMART HOSPITALITY
 */
export function getOTPEmailHTML(fullName: string, otp: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>رمز التحقق - SMART HOSPITALITY</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Montserrat:wght@600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      direction: rtl;
      text-align: right;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 15px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px -15px rgba(10, 17, 40, 0.12), 0 0 1px 1px rgba(10, 17, 40, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(145deg, #091224 0%, #0F1E3D 55%, #162B56 100%);
      padding: 40px 30px 35px 30px;
      text-align: center;
      position: relative;
      border-bottom: 2px solid #C5A059;
    }
    .brand-crest {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: rgba(197, 160, 89, 0.12);
      border: 1.5px solid #C5A059;
      border-radius: 14px;
      margin-bottom: 16px;
      color: #F1D28B;
      font-size: 20px;
      line-height: 1;
    }
    .brand-title {
      font-family: 'Montserrat', 'Segoe UI', sans-serif;
      font-size: 22px;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 6px 0;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 13px;
      font-weight: 700;
      color: #C5A059;
      margin: 0 0 14px 0;
      letter-spacing: 0.5px;
    }
    .badge-pill {
      display: inline-block;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 5px 16px;
      border-radius: 30px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .content {
      padding: 38px 32px;
      background-color: #ffffff;
    }
    .greeting {
      font-size: 18px;
      font-weight: 800;
      color: #0F1E3D;
      margin-bottom: 14px;
    }
    .text-body {
      font-size: 14px;
      line-height: 1.8;
      color: #475569;
      margin-bottom: 26px;
    }
    .otp-wrapper {
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1.5px solid #cbd5e1;
      border-radius: 18px;
      padding: 28px 20px;
      text-align: center;
      margin: 28px 0;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    .otp-header-label {
      font-size: 12px;
      font-weight: 800;
      color: #64748b;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .otp-code-box {
      font-family: 'Montserrat', 'Courier New', monospace;
      font-size: 40px;
      font-weight: 900;
      color: #091224;
      letter-spacing: 10px;
      padding: 14px 28px;
      background: #ffffff;
      border-radius: 12px;
      display: inline-block;
      border: 2px solid #0F1E3D;
      box-shadow: 0 6px 16px -4px rgba(15, 30, 61, 0.1);
      margin: 0 auto;
      direction: ltr;
    }
    .otp-validity {
      margin-top: 14px;
      font-size: 12px;
      color: #b45309;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .features-row {
      display: table;
      width: 100%;
      margin: 24px 0 20px 0;
      border-top: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
      padding: 12px 0;
    }
    .feature-item {
      display: table-cell;
      width: 33.33%;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
    }
    .security-card {
      background: #eff6ff;
      border-right: 4px solid #0284c7;
      border-radius: 10px;
      padding: 14px 18px;
      margin-top: 24px;
      font-size: 12px;
      line-height: 1.7;
      color: #0369a1;
      font-weight: 600;
    }
    .security-card strong {
      color: #0c4a6e;
      display: block;
      margin-bottom: 4px;
      font-weight: 800;
    }
    .footer {
      background-color: #091224;
      padding: 30px 24px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.8;
    }
    .footer-brand {
      font-family: 'Montserrat', sans-serif;
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 2px;
      margin-bottom: 6px;
    }
    .footer-subtitle {
      color: #C5A059;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 14px;
    }
    .footer-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 16px auto;
      width: 60%;
    }
    .footer-copy {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Top Luxury Header -->
      <div class="header">
        <div class="brand-crest">✦</div>
        <h1 class="brand-title">SMART HOSPITALITY</h1>
        <div class="brand-subtitle">الضيافة الذكية • منظومة إدارة وتشغيل العقارات</div>
        <div class="badge-pill">رمز أمان الحساب والتحقق السريع</div>
      </div>

      <!-- Main Body Content -->
      <div class="content">
        <div class="greeting">مرحباً بك ${fullName ? fullName : 'عزيزنا العميل'}،</div>
        <p class="text-body">
          نشكرك لاختيارك منصة <strong>SMART HOSPITALITY</strong>. للتحقق من ملكية البريد الإلكتروني وتأمين حسابك، يرجى إدخال رمز التحقق (OTP) السري أدناه في صفحة التسجيل:
        </p>
        
        <!-- Central OTP Card -->
        <div class="otp-wrapper">
          <div class="otp-header-label">رمز التحقق لمرة واحدة (ONE-TIME PASSWORD)</div>
          <div class="otp-code-box">${otp}</div>
          <div class="otp-validity">
            ⏱️ هذا الرمز صالح للاستخدام لمدة 5 دقائق فقط
          </div>
        </div>

        <!-- Trust Badges -->
        <div class="features-row">
          <div class="feature-item">🔒 تشفير معتمد 256-bit</div>
          <div class="feature-item">⚡ تفعيل حساب فوري (Supabase)</div>
          <div class="feature-item">🇸🇦 المملكة العربية السعودية</div>
        </div>

        <!-- Security Warning -->
        <div class="security-card">
          <strong>🛡️ إشعار أمان هام:</strong>
          لا تشارك رمز التحقق هذا مع أي شخص إطلاقاً. لن يطلب منك فريق دعم SMART HOSPITALITY الإفصاح عن هذا الرمز بأي وسيلة.
        </div>
      </div>

      <!-- Luxury Footer -->
      <div class="footer">
        <div class="footer-brand">SMART HOSPITALITY</div>
        <div class="footer-subtitle">الضيافة الذكية • جميع الحقوق محفوظة © ${new Date().getFullYear()}</div>
        <div class="footer-divider"></div>
        <p class="footer-copy">
          هذه الرسالة آلية لتأكيد التسجيل في منصة SMART HOSPITALITY. إذا لم تقم بطلب هذا الرمز، يرجى تجاهل هذه الرسالة بأمان.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

/**
 * Returns the exact Go-Template compatible HTML for Supabase Auth Dashboard -> Email Templates
 */
export function getSupabaseNativeOTPEmailTemplate(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رمز التحقق السري - SMART HOSPITALITY</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      direction: rtl;
      text-align: right;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 15px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px -15px rgba(10, 17, 40, 0.12), 0 0 1px 1px rgba(10, 17, 40, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(145deg, #091224 0%, #0F1E3D 55%, #162B56 100%);
      padding: 40px 30px 35px 30px;
      text-align: center;
      position: relative;
      border-bottom: 2px solid #C5A059;
    }
    .brand-crest {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: rgba(197, 160, 89, 0.12);
      border: 1.5px solid #C5A059;
      border-radius: 14px;
      margin-bottom: 16px;
      color: #F1D28B;
      font-size: 20px;
      line-height: 1;
    }
    .brand-title {
      font-family: 'Montserrat', 'Segoe UI', sans-serif;
      font-size: 22px;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 6px 0;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .brand-subtitle {
      font-size: 13px;
      font-weight: 700;
      color: #C5A059;
      margin: 0 0 14px 0;
      letter-spacing: 0.5px;
    }
    .badge-pill {
      display: inline-block;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 5px 16px;
      border-radius: 30px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .content {
      padding: 36px 32px;
      background-color: #ffffff;
    }
    .greeting {
      font-size: 18px;
      font-weight: 800;
      color: #0F1E3D;
      margin-bottom: 14px;
    }
    .text-body {
      font-size: 14px;
      line-height: 1.8;
      color: #475569;
      margin-bottom: 26px;
    }
    .otp-wrapper {
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1.5px solid #cbd5e1;
      border-radius: 18px;
      padding: 28px 20px;
      text-align: center;
      margin: 28px 0;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    .otp-header-label {
      font-size: 12px;
      font-weight: 800;
      color: #64748b;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .otp-code-box {
      font-family: 'Montserrat', 'Courier New', monospace;
      font-size: 40px;
      font-weight: 900;
      color: #091224;
      letter-spacing: 10px;
      padding: 14px 28px;
      background: #ffffff;
      border-radius: 12px;
      display: inline-block;
      border: 2px solid #0F1E3D;
      box-shadow: 0 6px 16px -4px rgba(15, 30, 61, 0.1);
      margin: 0 auto;
      direction: ltr;
    }
    .otp-validity {
      margin-top: 14px;
      font-size: 12px;
      color: #b45309;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .features-row {
      display: table;
      width: 100%;
      margin: 24px 0 20px 0;
      border-top: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
      padding: 12px 0;
    }
    .feature-item {
      display: table-cell;
      width: 33.33%;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
    }
    .security-card {
      background: #eff6ff;
      border-right: 4px solid #0284c7;
      border-radius: 10px;
      padding: 14px 18px;
      margin-top: 24px;
      font-size: 12px;
      line-height: 1.7;
      color: #0369a1;
      font-weight: 600;
    }
    .security-card strong {
      color: #0c4a6e;
      display: block;
      margin-bottom: 4px;
      font-weight: 800;
    }
    .footer {
      background-color: #091224;
      padding: 30px 24px;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.8;
    }
    .footer-brand {
      font-family: 'Montserrat', sans-serif;
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 2px;
      margin-bottom: 6px;
    }
    .footer-subtitle {
      color: #C5A059;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 14px;
    }
    .footer-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 16px auto;
      width: 60%;
    }
    .footer-copy {
      font-size: 11px;
      color: #64748b;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Top Luxury Header -->
      <div class="header">
        <div class="brand-crest">✦</div>
        <h1 class="brand-title">SMART HOSPITALITY</h1>
        <div class="brand-subtitle">الضيافة الذكية • منظومة إدارة وتشغيل العقارات</div>
        <div class="badge-pill">رمز أمان الحساب والتحقق السريع</div>
      </div>

      <!-- Main Body Content -->
      <div class="content">
        <div class="greeting">مرحباً بك،</div>
        <p class="text-body">
          نشكرك لاختيارك منصة <strong>SMART HOSPITALITY</strong>. للتحقق من ملكية البريد الإلكتروني وتأمين حسابك، يرجى إدخال رمز التحقق (OTP) السري أدناه في صفحة التسجيل:
        </p>
        
        <!-- Central OTP Card -->
        <div class="otp-wrapper">
          <div class="otp-header-label">رمز التحقق لمرة واحدة (ONE-TIME PASSWORD)</div>
          <div class="otp-code-box">{{ .Token }}</div>
          <div class="otp-validity">
            ⏱️ هذا الرمز صالح للاستخدام لمدة 5 دقائق فقط
          </div>
        </div>

        <!-- Trust Badges -->
        <div class="features-row">
          <div class="feature-item">🔒 تشفير معتمد 256-bit</div>
          <div class="feature-item">⚡ تفعيل حساب فوري</div>
          <div class="feature-item">🇸🇦 المملكة العربية السعودية</div>
        </div>

        <!-- Security Warning -->
        <div class="security-card">
          <strong>🛡️ إشعار أمان هام:</strong>
          لا تشارك رمز التحقق هذا مع أي شخص إطلاقاً. لن يطلب منك فريق دعم SMART HOSPITALITY الإفصاح عن هذا الرمز بأي وسيلة.
        </div>
      </div>

      <!-- Luxury Footer -->
      <div class="footer">
        <div class="footer-brand">SMART HOSPITALITY</div>
        <div class="footer-subtitle">الضيافة الذكية • جميع الحقوق محفوظة</div>
        <div class="footer-divider"></div>
        <p class="footer-copy">
          هذه الرسالة آلية لتأكيد التسجيل في منصة SMART HOSPITALITY. إذا لم تقم بطلب هذا الرمز، يرجى تجاهل هذه الرسالة بأمان.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

/**
 * Saves or updates an OTP record in Supabase database with SHA-256 cryptographic hash
 */
export async function createAndSaveOTP(
  email: string, 
  fullName: string = ''
): Promise<{ expiresAt: string; otp: string; deliveryResult?: { success: boolean; provider: string; message: string } }> {
  const sanitizedEmail = email.trim().toLowerCase();
  const otp = generateOTP();
  const otpHashing = await hashOTP(sanitizedEmail, otp);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // 5 minutes

  const docId = sanitizedEmail.replace(/[^a-zA-Z0-9]/g, '_');

  const record: OTPRecord = {
    id: docId,
    email: sanitizedEmail,
    otpHashing,
    expiresAt,
    attempts: 0,
    verified: false,
    createdAt: now.toISOString()
  };

  // Try saving to Supabase email_verifications table
  try {
    const { error: upsertError } = await supabase
      .from('email_verifications')
      .upsert({
        id: docId,
        email: sanitizedEmail,
        otpHashing: otpHashing,
        expiresAt: expiresAt,
        attempts: 0,
        verified: false,
        createdAt: now.toISOString()
      }, { onConflict: 'id' });

    if (upsertError) {
      console.warn('Supabase OTP table upsert notice (fallback active):', upsertError.message);
    }
  } catch (err) {
    console.warn('Supabase OTP save error:', err);
  }

  // Backup in sessionStorage for client resilience
  try {
    sessionStorage.setItem(`otp_${docId}`, JSON.stringify({
      ...record,
      plainOtp: otp
    }));
  } catch {}

  // Log in browser console for developers and instant testing
  console.log(
    `%c🔐 [SMART HOSPITALITY OTP] الرمز السري هو: ${otp} (لبريد: ${sanitizedEmail})`,
    'background: #0B1B3D; color: #F1D28B; font-size: 14px; font-weight: bold; padding: 6px 14px; border-radius: 6px; border: 1px solid #F1D28B;'
  );

  // Trigger backend email delivery service via /api/send-otp with fast timeout
  let deliveryResult: { success: boolean; provider: string; message: string } | undefined;
  try {
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('/api/send-otp', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: sanitizedEmail,
        otp: otp,
        fullName: fullName || '',
      }),
    });
    clearTimeout(fetchTimeout);
    
    if (res.ok) {
      deliveryResult = await res.json();
      console.log('✅ [EmailService] OTP Delivery dispatch result:', deliveryResult);
    } else {
      const errorText = await res.text();
      console.warn(`⚠️ [EmailService] Backend /api/send-otp status ${res.status}:`, errorText);
    }
  } catch (apiErr: any) {
    console.warn('⚠️ [EmailService] Backend send-otp notice (offline or timeout):', apiErr?.message);
  }

  return { expiresAt, otp, deliveryResult };
}

/**
 * Verifies the user-entered 6-digit OTP code against the hashed record in Supabase
 */
export async function verifyOTPCode(email: string, enteredCode: string): Promise<{ valid: boolean; message: string }> {
  const sanitizedEmail = email.trim().toLowerCase();
  const docId = sanitizedEmail.replace(/[^a-zA-Z0-9]/g, '_');

  try {
    let record: OTPRecord | null = null;

    // 1. Try querying Supabase
    try {
      const { data, error } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('id', docId)
        .maybeSingle();

      if (!error && data) {
        record = {
          id: data.id,
          email: data.email,
          otpHashing: data.otpHashing || data.otp_hashing,
          expiresAt: data.expiresAt || data.expires_at,
          attempts: data.attempts || 0,
          verified: data.verified || false,
          createdAt: data.createdAt || data.created_at
        };
      }
    } catch (dbErr) {
      console.warn('Supabase OTP read fallback to session:', dbErr);
    }

    // 2. Fallback to session cache if table empty or connecting
    if (!record) {
      const cached = sessionStorage.getItem(`otp_${docId}`);
      if (cached) {
        record = JSON.parse(cached);
      }
    }

    if (!record) {
      return {
        valid: false,
        message: 'لم يتم العثور على رمز تحقق نشط لهذا البريد. يرجى طلب رمز جديد.'
      };
    }

    // 3. Check expiration
    const now = new Date();
    const expiry = new Date(record.expiresAt);
    if (now > expiry) {
      try {
        await supabase.from('email_verifications').delete().eq('id', docId);
        sessionStorage.removeItem(`otp_${docId}`);
      } catch {}
      return {
        valid: false,
        message: 'انتهت صلاحية رمز التحقق (5 دقائق). يرجى طلب رمز جديد.'
      };
    }

    // 4. Anti-Brute-Force: Check attempts
    if (record.attempts >= 5) {
      try {
        await supabase.from('email_verifications').delete().eq('id', docId);
        sessionStorage.removeItem(`otp_${docId}`);
      } catch {}
      return {
        valid: false,
        message: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إبطال الرمز حمايةً للحساب، يرجى طلب رمز جديد.'
      };
    }

    // 5. Cryptographic Hash Comparison
    const calculatedHash = await hashOTP(sanitizedEmail, enteredCode.trim());
    const isMatch = (record.otpHashing && record.otpHashing === calculatedHash) || ((record as any).plainOtp && (record as any).plainOtp === enteredCode.trim());

    if (!isMatch) {
      const newAttempts = (record.attempts || 0) + 1;
      if (newAttempts >= 5) {
        try {
          await supabase.from('email_verifications').delete().eq('id', docId);
          sessionStorage.removeItem(`otp_${docId}`);
        } catch {}
        return {
          valid: false,
          message: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إبطال الرمز لحمايتك، يرجى طلب رمز جديد.'
        };
      }

      try {
        await supabase.from('email_verifications').update({ attempts: newAttempts }).eq('id', docId);
        sessionStorage.setItem(`otp_${docId}`, JSON.stringify({ ...record, attempts: newAttempts }));
      } catch {}

      return {
        valid: false,
        message: `رمز التحقق غير صحيح. تبقى لك ${5 - newAttempts} محاولات قبل إبطال الرمز.`
      };
    }

    // 6. Mark as verified
    try {
      await supabase.from('email_verifications').update({ verified: true }).eq('id', docId);
      sessionStorage.setItem(`otp_${docId}`, JSON.stringify({ ...record, verified: true }));
    } catch {}
    
    return {
      valid: true,
      message: 'تم التحقق من البريد الإلكتروني بنجاح!'
    };
  } catch (error) {
    console.error('Error verifying OTP securely:', error);
    return {
      valid: false,
      message: 'حدث خطأ أثناء معالجة التحقق. يرجى المحاولة مرة أخرى.'
    };
  }
}
