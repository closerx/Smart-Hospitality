import { sendOTPEmail } from '../server/emailService';

export default async function handler(req: any, res: any) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { email, otp, fullName } = body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and OTP are required' 
      });
    }

    const result = await sendOTPEmail({
      to: email,
      otp,
      fullName: fullName || '',
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    console.error('[Vercel API /api/send-otp Error]:', err);
    return res.status(500).json({ 
      success: false, 
      error: err?.message || 'Internal Server Error' 
    });
  }
}
