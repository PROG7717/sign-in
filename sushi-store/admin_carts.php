<?php
require __DIR__ . '/config.php';
require_admin();
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $in = json_input();
    $action = $in['action'] ?? 'remind';

    if ($action === 'remind') {
        $id = (int)($in['id'] ?? 0);
        if (!$id) json_error('missing id');
        $pdo->prepare('UPDATE cart_sessions SET reminder_sent=1 WHERE id=?')->execute([$id]);
        json_ok();
    }

    if ($action === 'delete') {
        $id = (int)($in['id'] ?? 0);
        if (!$id) json_error('missing id');
        $pdo->prepare('DELETE FROM cart_sessions WHERE id=?')->execute([$id]);
        json_ok();
    }

    if ($action === 'deleteAll') {
        $pdo->exec('DELETE FROM cart_sessions');
        json_ok();
    }

    json_error('invalid action');
}

// ---- تنظيف تلقائي: نحذف أي سلة متروكة من "يوم عمل" سابق.
//      يوم العمل يبدأ الساعة ١٢ ظهراً (مو منتصف الليل زي المعتاد) — حسب طلب صاحب المطعم ----
$now = new DateTime();
$todayNoon = new DateTime($now->format('Y-m-d') . ' 12:00:00');
$dayStart = $now < $todayNoon ? (clone $todayNoon)->modify('-1 day') : $todayNoon;
$pdo->prepare('DELETE FROM cart_sessions WHERE updated_at < ?')->execute([$dayStart->format('Y-m-d H:i:s')]);

$rows = $pdo->query('SELECT id, phone, customer_name, items_json, total, updated_at, reminder_sent
                       FROM cart_sessions ORDER BY updated_at DESC')->fetchAll();

foreach ($rows as &$r) {
    $r['items'] = json_decode($r['items_json'], true) ?: [];
    unset($r['items_json']);
    $r['total'] = (float)$r['total'];
    $r['ageMinutes'] = max(0, (int)floor((time() - strtotime($r['updated_at'])) / 60));
    $r['reminder_sent'] = (bool)$r['reminder_sent'];
}

json_ok(['carts' => $rows]);
