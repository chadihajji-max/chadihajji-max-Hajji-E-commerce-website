# 🚀 دليل إعداد ونشر متجر SHEIN Affiliate على Netlify
# Netlify Deployment & Setup Instructions for SHEIN Select

هذا الملف يحتوي على الخطوات الشاملة لنشر وتغيير إعدادات المتجر الإلكتروني الخاص بـ **SHEIN Affiliate** على منصة الاستضافة العالمية **Netlify**.

---

## 📋 المتطلبات المبسطة (Prerequisites)
1. حساب على **Netlify** (مجاني).
2. مستودع على **GitHub / GitLab / Bitbucket** للربط مع Netlify، أو استخدام **Netlify CLI** للنشر المباشر.
3. مفتاح **GEMINI_API_KEY** (اختياري، لتشغيل ميزة الجلب التلقائي لروابط SHEIN بالذكاء الاصطناعي).

---

## 🛠️ الطريقة الأولى: النشر عبر GitHub & Netlify Console (الموصى بها)

### 1. رفع المشروع إلى GitHub
قم برفع مجلد المشروع كاملاً إلى مستودع جديد على GitHub:
```bash
git init
git add .
git commit -m "Initial commit - SHEIN Affiliate Store"
git branch -M main
git remote add origin https://github.com/username/shein-affiliate-store.git
git push -u origin main
```

### 2. الربط مع Netlify
1. قم بتسجيل الدخول إلى حسابك في [Netlify Console](https://app.netlify.com/).
2. اضغط على **"Add new site"** ثم اختر **"Import an existing project"**.
3. اختر **GitHub** وحدد مستودع المشروع `shein-affiliate-store`.
4. تحقق من إعدادات البناء (Build Settings):
   - **Build Command**: `npm run build`
   - **Publish directory**: `dist`
5. في قسم **Environment variables** أضف المفاتيح التالية:
   - `GEMINI_API_KEY`: مفتاح Gemini الخاص بك لتفعيل المستورد الآلي لمنتجات SHEIN.
6. اضغط على **Deploy site**.

---

## ⚡ الطريقة الثانية: النشر المباشر عبر Netlify CLI

```bash
# 1. تثبيت Netlify CLI
npm install -g netlify-cli

# 2. بناء المشروع
npm run build

# 3. تسجيل الدخول والنشر
netlify login
netlify deploy --prod --dir=dist
```

---

## 🔑 لوحة التحكم والوصول لمدير المتجر (Admin Portal)

- **رابط الدخول**: انقر على زر **"دخول الأدمن"** أو **"Admin Login"** في الشريط العلوي للمتجر.
- **كلمة المرور الافتراضية**: `admin123`
- يمكنك تغيير كلمة المرور واسم المتجر ومعرف العمولة من قسم **الإعدادات & SEO** داخل لوحة التحكم.

---

## 📈 مميزات النظام ومستورد SHEIN الآلي
- عند إدخال رابط منتج SHEIN في قسم **مستورد رابط SHEIN**، يستخرج النظام التلقائي الصور والأسعار والخصم والأوصاف والمقاسات.
- يتم إلحاق `aff_id` المعرف الخاص بك بجميع الروابط لضمان احتساب العمولات.
- يدعم التوجيه السريع لـ SPA وNetlify Redirects من خلال ملف `netlify.toml`.

---
© 2026 SHEIN Select - Built for High Performance & Conversion.
