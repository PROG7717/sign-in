<?php
/* =====================================================================
   يعرض الصفحة (index.html) مع «بطاقة معاينة» تحمل اسم المعلم/ة وصورته
   عند مشاركة الرابط في واتساب وتويتر وغيرها (Open Graph).
   ===================================================================== */
declare(strict_types=1);

$html = (string)file_get_contents(__DIR__ . '/index.html');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
      || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
$host = preg_replace('/[^a-z0-9.:\-\[\]]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'));
$dir = rtrim(str_replace('\\', '/', dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/'))), '/');
$base = ($https ? 'https' : 'http') . '://' . $host . $dir . '/';

$title = 'ملف الإنجاز الإلكتروني';
$description = 'ملف الإنجاز الإلكتروني: السيرة الذاتية، النمو المهني، الشهادات، ومجلدات الأداء والمبادرات.';
$image = null;

try {
    require __DIR__ . '/config.php';
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 3]);
    $p = $pdo->query('SELECT full_name, job_title, job_rank, school_name, education_department, avatar_url FROM ep_profile WHERE id = 1')
             ->fetch(PDO::FETCH_ASSOC) ?: [];
    $s = $pdo->query("SELECT setting_key, setting_value FROM ep_settings WHERE setting_key IN ('siteTitle', 'logo', 'gender')")
             ->fetchAll(PDO::FETCH_KEY_PAIR);

    $name = trim((string)($p['full_name'] ?? ''));
    $site = trim((string)($s['siteTitle'] ?? '')) ?: 'ملف الإنجاز';
    if ($name !== '') $title = $site . ' | ' . $name;
    $parts = array_filter([trim((string)($p['job_title'] ?? '')), trim((string)($p['job_rank'] ?? '')), trim((string)($p['school_name'] ?? '')), trim((string)($p['education_department'] ?? ''))]);
    if ($parts) $description = implode(' — ', $parts);

    foreach ([$p['avatar_url'] ?? null, $s['logo'] ?? null] as $img) {
        if (is_string($img) && preg_match('#^uploads/[a-f0-9]{32}\.(jpg|jpeg|png|webp|gif)$#', $img)) { $image = $base . $img; break; }
    }
} catch (Throwable $e) {
    // قاعدة البيانات غير جاهزة بعد: تُعرض البطاقة الافتراضية
}

$e = fn(string $v): string => htmlspecialchars($v, ENT_QUOTES, 'UTF-8');
$tags = [
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="ar_SA">',
    '<meta property="og:url" content="' . $e($base) . '">',
    '<meta property="og:title" content="' . $e($title) . '">',
    '<meta property="og:description" content="' . $e($description) . '">',
    '<meta name="description" content="' . $e($description) . '">',
    '<meta name="twitter:card" content="' . ($image ? 'summary_large_image' : 'summary') . '">',
    '<meta name="twitter:title" content="' . $e($title) . '">',
    '<meta name="twitter:description" content="' . $e($description) . '">',
];
if ($image) {
    $tags[] = '<meta property="og:image" content="' . $e($image) . '">';
    $tags[] = '<meta name="twitter:image" content="' . $e($image) . '">';
}

$html = preg_replace('#<!-- OG:START -->.*?<!-- OG:END -->#s', "<!-- OG:START -->\n" . implode("\n", $tags) . "\n<!-- OG:END -->", $html, 1);
$html = preg_replace('#<title>.*?</title>#s', '<title>' . $e($title) . '</title>', $html, 1);

header('Content-Type: text/html; charset=utf-8');
echo $html;
