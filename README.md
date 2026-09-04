# 🏨 SMART HOSPITALITY (منظومة الضيافة وإدارة العقارات والأقفال الذكية)

<div align="center">
  <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80" alt="SMART HOSPITALITY Banner" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />

  <h3>منظومة برمجية متكاملة وسحابية فائقة التطور لإدارة الفنادق، الشقق المفروشة، والعقارات بنظام الأقفال الذكية والأتمتة الفندقية.</h3>

  <p align="center">
    <a href="#-المميزات-الرئيسية">المميزات</a> •
    <a href="#-المعمارية-التقنية-tech-stack">التقنيات</a> •
    <a href="#-طريقة-التشغيل-المحلي-local-setup">التشغيل المحلي</a> •
    <a href="#-النشر-على-cloudflare-pages-deployment">النشر على Cloudflare</a> •
    <a href="#-المتغيرات-البيئية-environment-variables">المتغيرات البيئية</a> •
    <a href="#-الأمان-وحماية-البيانات">الأمان</a>
  </p>
</div>

---

## 🌟 المميزات الرئيسية (Key Features)

### 1. 🏢 إدارة العقارات والوحدات السكنية (Property & Unit Management)
- إضافة وإدارة الفنادق والشقق، وتحديد الأسعار، الميزات، والمواقع الجغرافية.
- اعتماد العقارات والتحكم في حالتها بنظام موافقات فوري.

### 2. 🔐 إدارة الأقفال الذكية والغرف (Smart Locks & Rooms PMS)
- توليد وتعيين رموز الدخول السرية (Passcodes) للأقفال الذكية لكل غرفة بشكل آلي.
- تحديد تواريخ وأوقات انتهاء صلاحية الرموز متوافقة مع فترة إقامة النزيل.
- إمكانية إرسال رمز الغرفة ومعلومات الوصول للنزيل مباشرة عبر WhatsApp بضغطة زر.
- سجل كامل لكافة عمليات الدخول وتغيير الأكواد ومتابعة حالة بطارية القفل.

### 3. 👥 أدوار وصلاحيات متعددة (Role-Based Access Control)
- **المشرف العام (Super Admin):** تحكم كامل في العقارات، المستخدمين، والموافقات.
- **مالك العقار (Property Owner):** إدارة الغرف، الأسعار، الحجوزات، والأقفال.
- **فريق النظافة والصيانة (Cleaning Team):** جداول تنظيف الغرف وتحديث حالات النظافة والجاهزية.
- **النزيل (Guest / Tenant):** لوحة ترحيبية برمز القفل الذكي وإرشادات الوصول والخدمات.

### 4. 📧 توثيق آمن بالبريد ورموز الـ OTP (Passwordless Email OTP)
- تسجيل دخول آمن بدون كلمة مرور عبر رموز OTP صالحة لمدة 10 دقائق.
- تشفير الرموز وتمليحها بنظام `SHA-256` مع حماية من التخمين المتكرر (Anti Brute-Force).
- دعم إرسال البريد عبر **Resend API** و **SMTP**.

---

## 🛠️ المعمارية التقنية (Tech Stack)

- **Frontend:** React 18+, TypeScript, Tailwind CSS, Lucide Icons, Motion (Framer Motion).
- **Backend & APIs:** Express.js + Cloudflare Pages Functions (Edge Serverless).
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security - RLS).
- **Email Delivery:** Resend REST API & Nodemailer (SMTP).
- **Hosting & CDN:** Cloudflare Pages (Global Edge Network) / Node.js Server.

---

## ⚙️ طريقة التشغيل المحلي (Local Setup)

### 1. استنساخ المستودع:
```bash
git clone https://github.com/your-username/smart-hospitality.git
cd smart-hospitality
```

### 2. تثبيت الحزم والمكتبات:
```bash
npm install
```

### 3. إعداد المتغيرات البيئية:
قم بنسخ ملف `.env.example` إلى `.env`:
```bash
cp .env.example .env
```
ثم قم بتعبئة بيانات Supabase و Resend الخاصة بك داخل `.env`.

### 4. تشغيل السيرفر وواجهة التطوير:
```bash
npm run dev
```
سيعمل التطبيق على الرابط: `http://localhost:3000`

---

## ☁️ النشر على Cloudflare Pages (Deployment)

المشروع مهيأ ومزود بـ **Cloudflare Pages Functions** ليعمل كـ **Full-Stack Edge Application**:

1. ادخل إلى **[Cloudflare Dashboard](https://dash.cloudflare.com/)** ➡️ **Workers & Pages** ➡️ **Create application** ➡️ **Pages**.
2. اربط مستودع GitHub الخاص بهذا المشروع (`smart-hospitality`).
3. اضبط إعدادات البناء:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. أضف المتغيرات البيئية في إعدادات Cloudflare Pages:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
5. اضغط **Save and Deploy**.

---

## 🔐 المتغيرات البيئية (Environment Variables)

| المتغير | النوع | الوصف |
| :--- | :---: | :--- |
| `VITE_SUPABASE_URL` | Public | رابط مشروع Supabase الخاص بك |
| `VITE_SUPABASE_ANON_KEY` | Public | المفتاح العام لمشروع Supabase |
| `RESEND_API_KEY` | Secret | مفتاح API الخاص بـ Resend لإرسال إيميلات OTP |
| `RESEND_FROM_EMAIL` | Optional | البريد المرسل (مثال: `onboarding@resend.dev` أو بريد نطاقك) |

---

## 🛡️ الأمان وحماية البيانات (Security)

- تم تفعيل **Row Level Security (RLS)** لحماية كافة الجداول بقاعدة البيانات.
- تم عزل كافة مفاتيح الـ API الحساسة بالخادم ومنع تسريبها إلى حزم المتصفح.
- ملف `.env` مستثنى بالكامل من الرفع عبر `.gitignore` لضمان عدم تسريب أي أسرار.

---

<div align="center">
  <p>صُممت وبُنيت بأعلى معايير الجودة والأمان © SMART HOSPITALITY</p>
</div>
