// Vercel Serverless Function: /api/send-otp
// Self-contained with native fetch, no external dependencies required

function buildOTPEmailHTML(fullName: string, otp: string): string {
  const displayName = fullName && fullName.trim() ? fullName.trim() : 'عزيزنا العميل / الشريك';
  
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رمز التحقق السري - SMART HOSPITALITY</title>
  <style>
    body { margin: 0; padding: 0; background-color: #070F22; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; color: #334155; }
    .wrapper { width: 100%; background-color: #070F22; padding: 40px 10px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3); border: 1px solid #1e293b; }
    .header { background: linear-gradient(135deg, #0B1B3D 0%, #152C5B 100%); padding: 35px 30px; text-align: center; border-bottom: 3px solid #F1D28B; }
    .brand-title { color: #F1D28B; font-size: 24px; font-weight: 900; letter-spacing: 2px; margin: 0 0 6px 0; }
    .brand-sub { color: #94a3b8; font-size: 13px; margin: 0; }
    .body-content { padding: 35px 30px; background-color: #ffffff; }
    .greeting { font-size: 18px; font-weight: 700; color: #0B1B3D; margin-bottom: 15px; }
    .text { font-size: 15px; line-height: 1.7; color: #475569; margin-bottom: 25px; }
    .otp-box { background: linear-gradient(135deg, #0B1B3D 0%, #172a54 100%); border: 2px dashed #F1D28B; border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0; }
    .otp-label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #F1D28B; display: inline-block; direction: ltr; }
    .expiry-note { font-size: 12px; color: #dc2626; font-weight: 600; margin-top: 10px; }
    .footer { background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-title">SMART HOSPITALITY</h1>
        <p class="brand-sub">منظومة الضيافة وإدارة وتشغيل العقارات الذكية</p>
      </div>
      <div class="body-content">
        <div class="greeting">مرحباً ${displayName}،</div>
        <p class="text">
          شكراً لاستخدامك منصة <strong>SMART HOSPITALITY</strong>. للتحقق من بريدك الإلكتروني واستكمال عملية التوثيق، يرجى استخدام رمز التحقق السري (OTP) التالي:
        </p>
        
        <div class="otp-box">
          <div class="otp-label">رمز التحقق السري (OTP)</div>
          <div class="otp-code">${otp}</div>
          <div class="expiry-note">⏱️ الرمز صالح للاستخدام لمدة 5 دقائق فقط</div>
        </div>

        <p class="text" style="font-size: 13px; color: #64748b;">
          ⚠️ إذا لم تكن قد طلبت هذا الرمز، يرجى تجاهل هذه الرسالة. لا تشارك هذا الرمز مع أي شخص لحماية أمان حسابك.
        </p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} SMART HOSPITALITY. جميع الحقوق محفوظة.
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    const { email, otp, fullName } = body;

    if (!email || !otp) {
      res.status(400).json({
        success: false,
        error: 'Email and OTP are required parameters',
      });
      return;
    }

    const sanitizedEmail = String(email).trim().toLowerCase();
    const sanitizedOtp = String(otp).trim();
    const htmlContent = buildOTPEmailHTML(fullName || '', sanitizedOtp);

    // Get Resend API Key from Environment or Fallback
    const resendApiKey = (process.env.RESEND_API_KEY || 're_Pq1Uf4XS_PmZMrBMbViKrQXKbMeDZ5Nhm').trim();
    const rawFrom = (process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'otp@smart-hospitality.site').trim();
    const fromEmail = rawFrom.includes('<') ? rawFrom : `SMART HOSPITALITY <${rawFrom}>`;

    console.log(`[API send-otp] Attempting to send OTP to ${sanitizedEmail} using sender: ${fromEmail}`);

    let sendSuccess = false;
    let resendResponseData: any = null;

    // 1. Primary Attempt: Send via Resend with configured domain
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [sanitizedEmail],
          subject: `🔐 رمز التحقق السري الخاص بك: ${sanitizedOtp} | SMART HOSPITALITY`,
          html: htmlContent,
        }),
      });

      resendResponseData = await response.json();

      if (response.ok && resendResponseData?.id) {
        sendSuccess = true;
        console.log(`[API send-otp] Successfully sent email to ${sanitizedEmail}, ID:`, resendResponseData.id);
        res.status(200).json({
          success: true,
          provider: 'Resend',
          messageId: resendResponseData.id,
          message: 'تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني',
        });
        return;
      } else {
        console.warn('[API send-otp] Resend primary dispatch failed:', resendResponseData);
      }
    } catch (err: any) {
      console.error('[API send-otp] Primary Resend fetch error:', err?.message);
    }

    // 2. Fallback Attempt: If custom domain not yet verified in Resend, try onboarding@resend.dev
    if (!sendSuccess && fromEmail.includes('smart-hospitality.site')) {
      try {
        console.log('[API send-otp] Retrying via onboarding@resend.dev fallback...');
        const fallbackRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SMART HOSPITALITY <onboarding@resend.dev>',
            to: [sanitizedEmail],
            subject: `🔐 رمز التحقق السري الخاص بك: ${sanitizedOtp} | SMART HOSPITALITY`,
            html: htmlContent,
          }),
        });

        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData?.id) {
          sendSuccess = true;
          console.log(`[API send-otp] Fallback send succeeded for ${sanitizedEmail}, ID:`, fallbackData.id);
          res.status(200).json({
            success: true,
            provider: 'Resend (Sandbox)',
            messageId: fallbackData.id,
            message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
          });
          return;
        } else {
          console.warn('[API send-otp] Resend fallback dispatch failed:', fallbackData);
          resendResponseData = fallbackData;
        }
      } catch (fbErr: any) {
        console.error('[API send-otp] Fallback error:', fbErr?.message);
      }
    }

    // If both failed, return informative error
    const errorMessage = resendResponseData?.message || 'فشل إرسال البريد عبر خدمة Resend';
    res.status(200).json({
      success: false,
      provider: 'Resend',
      error: errorMessage,
      message: 'تعذر إرسال البريد حالياً. يرجى التحقق من صحة البريد أو إعدادات Resend.',
    });
  } catch (globalErr: any) {
    console.error('[API send-otp Fatal Error]:', globalErr);
    res.status(500).json({
      success: false,
      error: globalErr?.message || 'Internal Server Error',
    });
  }
}
