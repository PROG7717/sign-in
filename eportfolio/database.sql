-- =====================================================================
-- قاعدة بيانات ملف الإنجاز الإلكتروني
-- استوردها من phpMyAdmin: اختر قاعدة البيانات ← تبويب «استيراد» (Import) ← اختر هذا الملف ← تنفيذ
-- (ملاحظة: ملف api.php ينشئ هذه الجداول تلقائياً أيضاً إن لم تكن موجودة)
-- =====================================================================

-- جميع محتوى الموقع: الإعدادات، السيرة الذاتية، النمو المهني، الشهادات، المجلدات...
-- كل صف = مفتاح (k) وقيمته بصيغة JSON (v)
CREATE TABLE IF NOT EXISTS ep_data (
  k VARCHAR(64) NOT NULL PRIMARY KEY,
  v LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- حماية تسجيل الدخول من التخمين (قفل 15 دقيقة بعد 5 محاولات خاطئة)
CREATE TABLE IF NOT EXISTS ep_login_attempts (
  ip VARCHAR(45) NOT NULL PRIMARY KEY,
  attempts INT NOT NULL DEFAULT 0,
  last_at INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
