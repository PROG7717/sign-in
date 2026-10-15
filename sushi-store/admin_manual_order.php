<?php
require __DIR__ . '/config.php';
require_admin();

$in = json_input();
$name     = trim($in['name'] ?? '');
$phoneRaw = trim($in['phone'] ?? '');
$total    = (float)($in['total'] ?? 0);
$notes    = trim($in['notes'] ?? '');
$items    = is_array($in['items'] ?? null) ? $in['items'] : [];

$phone = normalize_sa_phone($phoneRaw);
if (!$phone) json_error('رقم جوال غير صحيح. اكتبه بصيغة 05XXXXXXXX');
if ($total <= 0 && count($items) === 0) json_error('لازم تحط الإجمالي أو صنف واحد على الأقل');

$pdo = db();
$pdo->beginTransaction();
try {
    // ---- عميل جديد أو موجود ----
    $stmt = $pdo->prepare('SELECT id, name FROM customers WHERE phone=?');
    $stmt->execute([$phone]);
    $c = $stmt->fetch();
    if ($c) {
        $customerId = $c['id'];
        if ($name && !$c['name']) $pdo->prepare('UPDATE customers SET name=? WHERE id=?')->execute([$name, $customerId]);
    } else {
        $pdo->prepare('INSERT INTO customers (phone, name) VALUES (?,?)')->execute([$phone, $name]);
        $customerId = $pdo->lastInsertId();
    }

    if (count($items) === 0) {
        $items = [['ar' => 'طلب يدوي (من واتساب)', 'en' => 'Manual order (from WhatsApp)', 'price' => $total, 'q' => 1]];
    }
    $calcTotal = 0;
    foreach ($items as $it) $calcTotal += (float)($it['price'] ?? 0) * (int)($it['q'] ?? 1);
    $finalTotal = $total > 0 ? round($total, 2) : round($calcTotal, 2);

    // ---- الطلب — يُسجَّل كمقبول مباشرة (صار فعلياً واتفق عليه بالواتساب) ----
    $pdo->prepare('INSERT INTO orders (customer_id, customer_name, phone, order_type, area, notes, total, status, confirmed_at, created_at)
                    VALUES (?,?,?,"pickup","",?,?,"confirmed",NOW(),NOW())')
        ->execute([$customerId, $name, $phone, $notes, $finalTotal]);
    $orderId = $pdo->lastInsertId();

    $stmtItem = $pdo->prepare('INSERT INTO order_items (order_id, product_id, name_ar, name_en, price, qty, note)
                                 VALUES (?,?,?,?,?,?,?)');
    foreach ($items as $it) $stmtItem->execute([
        $orderId, null, $it['ar'] ?? '', $it['en'] ?? '', (float)($it['price'] ?? 0), (int)($it['q'] ?? 1), $it['note'] ?? '',
    ]);

    // ---- عداد الطلبات الشهري (لهذا الشهر) ----
    $ym = current_year_month();
    $pdo->prepare('INSERT INTO customer_monthly_counter (customer_id, `year_month`, order_count)
                    VALUES (?,?,1)
                    ON DUPLICATE KEY UPDATE order_count = order_count + 1')
        ->execute([$customerId, $ym]);

    // ---- كاش باك جديد لو المبلغ يستاهل (نفس منطق قبول الطلب العادي) ----
    $s = $pdo->query('SELECT cashback_min_order, cashback_percent, cashback_expiry_days FROM settings WHERE id=1')->fetch();
    $minOrder = (float)($s['cashback_min_order'] ?? 120);
    $percent  = (float)($s['cashback_percent'] ?? 10);
    $days     = (int)($s['cashback_expiry_days'] ?? 14);
    if ($finalTotal >= $minOrder && $percent > 0) {
        $amount = round($finalTotal * ($percent / 100), 2);
        $pdo->prepare('INSERT INTO cashback_transactions (customer_id, order_id, amount, expires_at)
                         VALUES (?,?,?, DATE_ADD(NOW(), INTERVAL ? DAY))')
            ->execute([$customerId, $orderId, $amount, $days]);
        $pdo->prepare('UPDATE customers SET wallet_balance = wallet_balance + ? WHERE id=?')->execute([$amount, $customerId]);
    }

    $pdo->commit();
    json_ok(['orderId' => (int)$orderId, 'customerId' => (int)$customerId, 'total' => $finalTotal]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    json_error('فشل الحفظ: ' . $e->getMessage(), 500);
}
