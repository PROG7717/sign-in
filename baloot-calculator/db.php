<?php
// =========================================================
// db.php — الاتصال بقاعدة البيانات
// ⚠️ المستودع عام: لا تحفظ كلمة المرور الحقيقية هنا.
// على الاستضافة عدّل القيم التالية ببيانات قاعدة بياناتك
// (من لوحة InfinityFree ← MySQL Databases).
// =========================================================
$host   = "DB_HOST";      // مثل sqlXXX.infinityfree.com
$user   = "DB_USER";      // مثل if0_XXXXXXXX
$pass   = "DB_PASSWORD";
$dbname = "DB_NAME";      // مثل if0_XXXXXXXX_baloot

// إنشاء الاتصال
$conn = new mysqli($host, $user, $pass, $dbname);

// التحقق من الاتصال
if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "فشل الاتصال بقاعدة البيانات"], JSON_UNESCAPED_UNICODE));
}
// تعيين الترميز لدعم اللغة العربية
$conn->set_charset("utf8mb4");
?>
