<?php
/* =====================================================================
   واجهة برمجة ملف الإنجاز (API)
   - القراءة (load) متاحة للجميع
   - كل عمليات الكتابة والرفع والحذف للمسؤول فقط (جلسة + رمز CSRF)
   ===================================================================== */
declare(strict_types=1);

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
      || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_name('eportfolio_sid');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => $https,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_SECONDS = 900;
const MAX_VALUE_BYTES    = 4 * 1024 * 1024;
const STORED_FILE_RE     = '/^[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif|pdf|doc|docx)$/';

// الامتدادات المسموح برفعها وأنواع MIME المقبولة لكل منها
const ALLOWED_UPLOADS = [
    'jpg'  => ['image/jpeg'],
    'jpeg' => ['image/jpeg'],
    'png'  => ['image/png'],
    'webp' => ['image/webp'],
    'gif'  => ['image/gif'],
    'pdf'  => ['application/pdf'],
    'doc'  => ['application/msword', 'application/CDFV2', 'application/x-ole-storage', 'application/vnd.ms-office', 'application/octet-stream'],
    'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'],
];

/* ---------- أدوات مساعدة ---------- */
function out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $code = 400): void
{
    out(['ok' => false, 'error' => $message], $code);
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    } catch (PDOException $e) {
        fail('تعذر الاتصال بقاعدة البيانات — تحقق من الإعدادات في ملف config.php', 500);
    }
    // إنشاء الجداول تلقائياً إن لم تكن موجودة (نفس محتوى database.sql)
    $pdo->exec("CREATE TABLE IF NOT EXISTS ep_data (
        k VARCHAR(64) NOT NULL PRIMARY KEY,
        v LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS ep_login_attempts (
        ip VARCHAR(45) NOT NULL PRIMARY KEY,
        attempts INT NOT NULL DEFAULT 0,
        last_at INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    return $pdo;
}

function is_admin(): bool
{
    return !empty($_SESSION['admin']);
}

function body(): array
{
    $json = json_decode(file_get_contents('php://input') ?: '', true);
    return is_array($json) ? $json : [];
}

function require_admin(): void
{
    if (!is_admin()) fail('غير مصرح — سجّل الدخول كمسؤول', 401);
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || !hash_equals($_SESSION['csrf'] ?? '', $token)) {
        fail('انتهت صلاحية الجلسة — أعد تحميل الصفحة', 403);
    }
}

function valid_key($key): bool
{
    return is_string($key) && preg_match('/^[a-z0-9:_-]{1,64}$/i', $key) === 1;
}

function encode_value($value): string
{
    $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) fail('بيانات غير صالحة');
    if (strlen($json) > MAX_VALUE_BYTES) fail('حجم البيانات كبير جداً');
    return $json;
}

function save_value(string $key, $value): void
{
    $stmt = db()->prepare('INSERT INTO ep_data (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)');
    $stmt->execute([$key, encode_value($value)]);
}

function delete_stored_file($url): void
{
    if (!is_string($url) || strpos($url, 'uploads/') !== 0) return;
    $name = substr($url, strlen('uploads/'));
    if (preg_match(STORED_FILE_RE, $name) !== 1) return;
    $path = UPLOAD_DIR . '/' . $name;
    if (is_file($path)) @unlink($path);
}

function client_ip(): string
{
    return substr((string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
}

function password_matches(string $given): bool
{
    if (strncmp(ADMIN_PASSWORD, '$2y$', 4) === 0) return password_verify($given, ADMIN_PASSWORD);
    return hash_equals(ADMIN_PASSWORD, $given);
}

/* ---------- التوجيه ---------- */
$action = (string)($_GET['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($action !== 'load' && $method !== 'POST') fail('طريقة الطلب غير مسموحة', 405);

switch ($action) {

    // قراءة جميع البيانات (للزوار والمسؤول)
    case 'load':
        $data = [];
        foreach (db()->query('SELECT k, v FROM ep_data') as $row) {
            $data[$row['k']] = json_decode($row['v'], true);
        }
        out([
            'ok'          => true,
            'data'        => (object)$data,
            'admin'       => is_admin(),
            'csrf'        => is_admin() ? $_SESSION['csrf'] : null,
            'maxUploadMb' => MAX_UPLOAD_MB,
        ]);

    // تسجيل دخول المسؤول
    case 'login':
        if (ADMIN_PASSWORD === 'CHANGE_ME' || ADMIN_PASSWORD === '') {
            fail('لم تُضبط كلمة مرور المسؤول بعد — غيّرها في ملف config.php', 403);
        }
        $ip = client_ip();
        $stmt = db()->prepare('SELECT attempts, last_at FROM ep_login_attempts WHERE ip = ?');
        $stmt->execute([$ip]);
        $row = $stmt->fetch();
        $recent = $row && (time() - (int)$row['last_at']) < LOGIN_LOCK_SECONDS;
        if ($recent && (int)$row['attempts'] >= LOGIN_MAX_ATTEMPTS) {
            fail('محاولات دخول كثيرة — حاول مرة أخرى بعد 15 دقيقة', 429);
        }

        $b = body();
        $user = (string)($b['username'] ?? '');
        $pass = (string)($b['password'] ?? '');
        $userOk = hash_equals(ADMIN_USERNAME, $user);
        $passOk = password_matches($pass);
        if (!$userOk || !$passOk) {
            $attempts = $recent ? (int)$row['attempts'] + 1 : 1;
            db()->prepare('INSERT INTO ep_login_attempts (ip, attempts, last_at) VALUES (?, ?, ?)
                           ON DUPLICATE KEY UPDATE attempts = VALUES(attempts), last_at = VALUES(last_at)')
                ->execute([$ip, $attempts, time()]);
            usleep(400000);
            fail('اسم المستخدم أو كلمة المرور غير صحيحة', 401);
        }

        db()->prepare('DELETE FROM ep_login_attempts WHERE ip = ?')->execute([$ip]);
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        $_SESSION['csrf']  = bin2hex(random_bytes(32));
        out(['ok' => true, 'csrf' => $_SESSION['csrf']]);

    // تسجيل الخروج
    case 'logout':
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $p['path'], 'secure' => $p['secure'], 'httponly' => true, 'samesite' => 'Strict']);
        }
        session_destroy();
        out(['ok' => true]);

    // حفظ قيمة واحدة
    case 'save':
        require_admin();
        $b = body();
        if (!valid_key($b['key'] ?? null) || !array_key_exists('value', $b)) fail('طلب غير صالح');
        save_value($b['key'], $b['value']);
        out(['ok' => true]);

    // حفظ عدة قيم دفعة واحدة (الاستيراد)
    case 'save_many':
        require_admin();
        $items = body()['items'] ?? null;
        if (!is_array($items)) fail('طلب غير صالح');
        $pdo = db();
        $pdo->beginTransaction();
        foreach ($items as $key => $value) {
            if (!valid_key($key)) { $pdo->rollBack(); fail('مفتاح غير صالح: ' . $key); }
            save_value((string)$key, $value);
        }
        $pdo->commit();
        out(['ok' => true]);

    // حذف قيمة
    case 'delete':
        require_admin();
        $key = body()['key'] ?? null;
        if (!valid_key($key)) fail('طلب غير صالح');
        db()->prepare('DELETE FROM ep_data WHERE k = ?')->execute([$key]);
        out(['ok' => true]);

    // رفع ملف (صورة / Word / PDF)
    case 'upload':
        require_admin();
        $file = $_FILES['file'] ?? null;
        if (!$file || !is_array($file) || is_array($file['error'])) fail('لم يُرسل أي ملف');
        if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) fail('الملف أكبر من الحد المسموح في إعدادات الاستضافة');
        if ($file['error'] !== UPLOAD_ERR_OK) fail('فشل رفع الملف (رمز ' . (int)$file['error'] . ')');
        if ($file['size'] > MAX_UPLOAD_MB * 1024 * 1024) fail('الملف أكبر من ' . MAX_UPLOAD_MB . ' ميجابايت');

        $ext = strtolower(pathinfo((string)$file['name'], PATHINFO_EXTENSION));
        if (!isset(ALLOWED_UPLOADS[$ext])) fail('نوع الملف غير مسموح (المسموح: الصور، Word، PDF)');
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']) ?: '';
        if (!in_array($mime, ALLOWED_UPLOADS[$ext], true)) fail('محتوى الملف لا يطابق امتداده');

        if (!is_dir(UPLOAD_DIR) && !mkdir(UPLOAD_DIR, 0755, true)) fail('تعذر إنشاء مجلد الرفع', 500);
        $name = bin2hex(random_bytes(16)) . '.' . $ext;
        if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . '/' . $name)) fail('تعذر حفظ الملف على الخادم — تحقق من صلاحيات مجلد uploads', 500);
        @chmod(UPLOAD_DIR . '/' . $name, 0644);
        out(['ok' => true, 'url' => 'uploads/' . $name, 'size' => (int)$file['size']]);

    // حذف ملف مرفوع
    case 'delete_file':
        require_admin();
        delete_stored_file(body()['url'] ?? null);
        out(['ok' => true]);

    // حذف جميع البيانات والملفات
    case 'reset':
        require_admin();
        db()->exec('DELETE FROM ep_data');
        foreach (glob(UPLOAD_DIR . '/*') ?: [] as $path) {
            if (preg_match(STORED_FILE_RE, basename($path)) === 1) @unlink($path);
        }
        out(['ok' => true]);

    default:
        fail('طلب غير معروف', 404);
}
