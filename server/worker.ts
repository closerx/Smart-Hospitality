export interface Env {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  [key: string]: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API Route: /api/send-otp
    if (url.pathname === "/api/send-otp" && request.method === "POST") {
      try {
        const body = (await request.json()) as { email?: string; otp?: string; fullName?: string };
        const { email, otp, fullName } = body;

        if (!email || !otp) {
          return new Response(
            JSON.stringify({ success: false, error: "Email and OTP are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const resendApiKey = env.RESEND_API_KEY || "re_Pq1Uf4XS_PmZMrBMbViKrQXKbMeDZ5Nhm";
        const resendFromEmail = env.RESEND_FROM_EMAIL || "SMART HOSPITALITY <onboarding@resend.dev>";
        const displayName = fullName && fullName.trim() ? fullName.trim() : "عزيزنا العميل / الشريك";

        const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>رمز التحقق السري - SMART HOSPITALITY</title>
</head>
<body style="margin:0;padding:0;background-color:#070F22;font-family:Arial,sans-serif;direction:rtl;text-align:right;color:#334155;">
  <div style="width:100%;padding:40px 10px;background-color:#070F22;box-sizing:border-box;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.3);">
      <div style="background:#0B1B3D;padding:30px;text-align:center;border-bottom:3px solid #F1D28B;">
        <h1 style="color:#F1D28B;margin:0;font-size:24px;letter-spacing:1px;">SMART HOSPITALITY</h1>
        <p style="color:#94a3b8;margin:5px 0 0 0;font-size:13px;">المنظومة الفندقية الذكية لإدارة العقارات والأقفال</p>
      </div>
      <div style="padding:40px 30px;text-align:center;">
        <h2 style="color:#0f172a;margin-top:0;font-size:20px;">رمز التحقق السري لتسجيل الدخول</h2>
        <p style="color:#475569;font-size:15px;line-height:1.6;">مرحباً ${displayName}، استخدم الرمز التالي لإتمام عملية الدخول:</p>
        <div style="margin:30px auto;padding:18px 24px;background:#F8FAFC;border:2px dashed #F1D28B;border-radius:12px;display:inline-block;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0B1B3D;font-family:monospace;">${otp}</span>
        </div>
        <p style="color:#dc2626;font-size:13px;font-weight:bold;margin:15px 0 0 0;">⚠️ هذا الرمز صالح لمدة 5 دقائق فقط. لا تشاركه مع أي شخص.</p>
      </div>
      <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
        &copy; ${new Date().getFullYear()} SMART HOSPITALITY. جميع الحقوق محفوظة.
      </div>
    </div>
  </div>
</body>
</html>`;

        if (!resendApiKey) {
          console.error("[Worker send-otp] RESEND_API_KEY is not defined in Worker environment");
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "RESEND_API_KEY is not defined in Worker settings. Add it in Cloudflare Worker Variables." 
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const fromAddress = resendFromEmail.includes("<") ? resendFromEmail : `SMART HOSPITALITY <${resendFromEmail}>`;

        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [email],
            subject: `رمز التحقق الخاص بك: ${otp} - SMART HOSPITALITY`,
            html: htmlContent,
          }),
        });

        const resendData: any = await resendResponse.json();

        if (!resendResponse.ok) {
          console.error("[Worker send-otp] Resend API error:", resendData);
          return new Response(
            JSON.stringify({ success: false, error: resendData?.message || "Resend API call failed", details: resendData }),
            { status: resendResponse.status, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, provider: "resend", messageId: resendData.id }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message || "Internal server error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Health check
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "ok", runtime: "cloudflare_worker" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Serve Frontend Static Assets (Single Page Application fallback)
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status === 404 && request.method === "GET" && !url.pathname.startsWith("/api/")) {
        // SPA Fallback: serve index.html for client-side routing
        const indexUrl = new URL("/index.html", request.url);
        return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
      }
      return assetResponse;
    }

    return new Response("Not Found", { status: 404 });
  },
};
