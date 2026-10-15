-- ============================================================
-- database.sql — قاعدة بيانات متجر سوشي (ملف واحد)
-- استورده من phpMyAdmin ← Import. آمن التنفيذ أكثر من مرة:
-- ينشئ الناقص ويضيف الأعمدة الجديدة فقط، بدون حذف أي بيانات.
-- ============================================================
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- المناديب (سائقي التوصيل)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drivers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- قوالب رسائل المناديب + عبارات الفاتورة
-- ------------------------------------------------------------
ALTER TABLE settings ADD COLUMN IF NOT EXISTS msg_driver_ready TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS msg_driver_late TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_phrases_json TEXT;

-- ------------------------------------------------------------
-- خاصية "إضافة سريعة بالسلة" للمنتجات
-- ------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_addon TINYINT(1) DEFAULT 0;

-- ------------------------------------------------------------
-- خيارات إضافية لكل منتج (زي البوكسات)
-- ------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS extras_enabled TINYINT(1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS extras_json TEXT;

-- ------------------------------------------------------------
-- كوبونات الخصم / الكاش باك
-- ------------------------------------------------------------
ALTER TABLE settings ADD COLUMN IF NOT EXISTS coupon_enabled TINYINT(1) DEFAULT 0;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS coupons_json TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(40) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10,2) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_cashback DECIMAL(10,2) NULL;

-- ------------------------------------------------------------
-- نظام ترشيح صديق
-- ------------------------------------------------------------
ALTER TABLE settings ADD COLUMN IF NOT EXISTS referral_enabled TINYINT(1) DEFAULT 0;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS referral_discount_percent INT DEFAULT 10;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS referrer_phone VARCHAR(20) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_discount DECIMAL(10,2) NULL;
