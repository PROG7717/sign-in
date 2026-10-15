<?php
/* =====================================================================
   config.php — إعدادات المنصة
   هذا هو الملف الوحيد الذي تحتاج تعديله: بيانات قاعدة البيانات فقط.
   تجدها في لوحة الاستضافة (MySQL Databases).
   ⚠️ المستودع عام: لا تحفظ البيانات الحقيقية هنا — عدّلها على الاستضافة فقط.
   ===================================================================== */

/* بيانات الاتصال بقاعدة البيانات */
define('DB_HOST', 'DB_HOST');       // مثل sqlXXX.infinityfree.com
define('DB_NAME', 'DB_NAME');       // مثل if0_XXXXXXXX_teacher
define('DB_USER', 'DB_USER');       // مثل if0_XXXXXXXX
define('DB_PASS', 'DB_PASSWORD');

/* رقم جوال المعلمة (حسابها مزروع في database.sql بكلمة المرور Teacher@123) */
define('TEACHER_PHONE', '05XXXXXXXX');

/* نقاط التحفيز: كل عمل معتمد = نقطة، وكل هذا العدد من النقاط = وسام بونص */
define('BONUS_STEP', 5);

/* حدود رفع الملفات */
define('MAX_FILE_MB', 10);
define('ALLOWED_EXT', 'pdf,png,jpg,jpeg,webp,docx,pptx');

/* المنطقة الزمنية (لتواريخ الحضور والتسليم) */
date_default_timezone_set('Asia/Riyadh');
