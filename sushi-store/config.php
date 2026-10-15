<?php
/**
 * config.php — الاتصال بقاعدة البيانات + دوال مشتركة
 * عدّل بيانات الاتصال الأربعة بالأسفل حسب استضافتك (InfinityFree / Bluehost)
 */

// ====== بيانات الاتصال — عدّلها ======
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');
// =====================================

header('Content-Type: application/json; charset=utf-8');
// إذا الواجهة والـ API على نفس الدومين ما تحتاج CORS. فعّلها فقط لو الواجهة على دومين مختلف:
// header('Access-Control-Allow-Origin: https://yourdomain.com');
// header('Access-Control-Allow-Credentials: true');

session_set_cookie_params(14400); // 4 ساعات — تقليل مرات تسجيل الخروج التلقائي أثناء الاختبار
ini_set('session.gc_maxlifetime', '14400');
session_start();
error_reporting(E_ALL);
ini_set('display_errors', '0'); // ما نطلع أخطاء PHP الخام للعميل (أمان)
date_default_timezone_set('Asia/Riyadh'); // توقيت السعودية لكل دوال PHP (date, strtotime...)

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER, DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
            $pdo->exec("SET time_zone = '+03:00'"); // نفس توقيت السعودية لكل NOW()/CURRENT_TIMESTAMP بقاعدة البيانات
        } catch (PDOException $e) {
            json_error('database connection failed', 500);
        }
    }
    return $pdo;
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function json_ok($data = []) {
    echo json_encode(['ok' => true] + (is_array($data) ? $data : ['data' => $data]), JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $msg, int $code = 400, array $extra = []) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg] + $extra, JSON_UNESCAPED_UNICODE);
    exit;
}

function require_admin() {
    if (empty($_SESSION['admin_id'])) {
        json_error('unauthorized', 401);
    }
}

/**
 * توحيد رقم الجوال السعودي لصيغة 9665XXXXXXXX (بدون + وبدون مسافات)
 * يقبل: 05XXXXXXXX / 5XXXXXXXX / +9665XXXXXXXX / 9665XXXXXXXX / 009665XXXXXXXX
 */
function normalize_sa_phone(string $raw): ?string {
    $d = preg_replace('/\D/', '', $raw); // أرقام فقط
    if ($d === '') return null;
    if (str_starts_with($d, '00966')) $d = substr($d, 2);
    if (str_starts_with($d, '0') && strlen($d) === 10) $d = '966' . substr($d, 1);
    elseif (str_starts_with($d, '5') && strlen($d) === 9) $d = '966' . $d;
    // إذا وصلت أصلاً 9665xxxxxxxx تبقى كما هي
    if (!preg_match('/^9665\d{8}$/', $d)) return null; // رقم غير صالح
    return $d;
}

function current_year_month(): string {
    return date('Y-m');
}

/**
 * القوالب الافتراضية لرسائل الواتساب الجاهزة (تُستخدم لو الأدمن ما عدّل عليها من الإعدادات)
 * المتغيرات المتاحة بين {}: name, amount, cur, days, offer, count, threshold
 */
function default_msg_templates(): array {
    return [
        'msgCashback' => 'مرحباً {name}! 🍣 عندك كاش باك بقيمة {amount} {cur} بمحفظتك، باقي له {days} يوم. استخدمه بأقرب طلب قبل ما ينتهي! 🎉',
        'msgVip' => 'مرحباً {name}! 🏅 إنت من عملائنا المميزين، وحاب نشكرك على تكرار طلباتك معنا. عندك عرض خاص: {offer}. نشوفك قريب! 🍣',
        'msgNearThreshold' => 'مرحباً {name}! 🎯 وصلت {count} من {threshold} طلبات هالشهر. طلب واحد بس ويوصلك عرض عملائنا المميزين قبل ما الشهر يخلص! 🍣',
        'msgBroadcastDefault' => '',
    ];
}
