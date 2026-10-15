# حاسبة البلوت

حاسبة نشرات البلوت بهوية «ورقة المجلس»: صن وحكم، التدبيل (دبل/ثري/فور/قهوة)، الكبوت، المشاريع، حساب الطيحة، سجل الحسبات مع التعديل والتراجع، وضع الطاولة (شاشتين)، مؤقت، وإبقاء الشاشة شغالة.

| الملف | الوظيفة |
|---|---|
| `index.html` | الواجهة |
| `style.css` | التصميم |
| `script.js` | منطق الحسبة والحفظ المحلي والمزامنة مع السيرفر |
| `save_round.php` | حفظ/تعديل/حذف النشرات في قاعدة البيانات |
| `db.php` | بيانات الاتصال بقاعدة البيانات |

## التشغيل

- **بدون سيرفر:** افتح `index.html` — الحسبة تشتغل وتنحفظ في المتصفح.
- **مع قاعدة بيانات (مثل InfinityFree):**
  1. ارفع الملفات إلى `htdocs`.
  2. عدّل `db.php` على الاستضافة ببيانات قاعدة بياناتك (لا ترفع كلمة المرور الحقيقية إلى GitHub).
  3. تأكد من وجود الجدولين `matches` و`rounds`. إن لم يكونا موجودين أنشئهما من phpMyAdmin:

```sql
CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT NOT NULL,
  buyer VARCHAR(10) NOT NULL DEFAULT '',
  game_type VARCHAR(10) NOT NULL DEFAULT 'sun',
  projects TEXT,
  us_points INT NOT NULL DEFAULT 0,
  them_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
