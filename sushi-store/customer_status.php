<?php
/**
 * customer_status.php — نقطة عامة (بدون تسجيل دخول أدمن) يستخدمها الموقع
 * عشان يعرض للعميل نفسه رصيد الكاش باك اللي عنده لما يكتب رقم جواله بالسلة.
 * GET ?phone=05XXXXXXXX
 */
require __DIR__ . '/config.php';
$pdo = db();

$phone = normalize_sa_phone($_GET['phone'] ?? '');
if (!$phone) json_error('invalid phone');

$stmt = $pdo->prepare('SELECT id, name, wallet_balance, subscription_expires_at, subscription_benefit_ar, subscription_benefit_en FROM customers WHERE phone=?');
$stmt->execute([$phone]);
$c = $stmt->fetch();

if (!$c) json_ok(['found' => false]);

$subscription = null;
if (!empty($c['subscription_expires_at']) && strtotime($c['subscription_expires_at']) > time()) {
    $subscription = [
        'active' => true,
        'daysLeft' => max(0, (int)ceil((strtotime($c['subscription_expires_at']) - time()) / 86400)),
        'benefitAr' => $c['subscription_benefit_ar'],
        'benefitEn' => $c['subscription_benefit_en'],
    ];
}

$cb = $pdo->prepare('SELECT amount, expires_at FROM cashback_transactions
                       WHERE customer_id=? AND status="active" AND expires_at > NOW()
                       ORDER BY created_at ASC LIMIT 1');
$cb->execute([$c['id']]);
$row = $cb->fetch();

$active = null;
if ($row) {
    $active = [
        'amount' => (float)$row['amount'],
        'daysLeft' => max(0, (int)ceil((strtotime($row['expires_at']) - time()) / 86400)),
    ];
}

$threshold = (int)($pdo->query('SELECT frequent_customer_threshold FROM settings WHERE id=1')->fetchColumn() ?: 5);
$ym = current_year_month();
$mc = $pdo->prepare('SELECT order_count FROM customer_monthly_counter WHERE customer_id=? AND `year_month`=?');
$mc->execute([$c['id'], $ym]);
$monthlyCount = (int)($mc->fetchColumn() ?: 0);

// أكواد الكوبونات اللي سبق واستخدمها هذا العميل (بطلب لسه ما اترفض أو اتلغى) — كوبون استخدام واحد بس لكل عميل
$usedCoupons = $pdo->prepare("SELECT DISTINCT coupon_code FROM orders WHERE customer_id=? AND coupon_code IS NOT NULL AND status IN ('pending','confirmed')");
$usedCoupons->execute([$c['id']]);
$usedCoupons = array_column($usedCoupons->fetchAll(), 'coupon_code');

// هل عنده طلب معلق حالياً؟ (يمنع إرسال طلب جديد، لكن يسمح بتعديل هذا الطلب)
$po = $pdo->prepare('SELECT id, order_type, scheduled_for, area, notes, total FROM orders WHERE customer_id=? AND status="pending" LIMIT 1');
$po->execute([$c['id']]);
$pendingRow = $po->fetch();
$pendingOrder = null;
if ($pendingRow) {
    $itemsStmt = $pdo->prepare('SELECT product_id `id`, name_ar `ar`, name_en `en`, price, qty `q`, note FROM order_items WHERE order_id=?');
    $itemsStmt->execute([$pendingRow['id']]);
    $pendingOrder = [
        'id' => (int)$pendingRow['id'],
        'type' => $pendingRow['order_type'],
        'scheduledFor' => $pendingRow['scheduled_for'],
        'area' => $pendingRow['area'],
        'notes' => $pendingRow['notes'],
        'total' => (float)$pendingRow['total'],
        'items' => array_map(function($it){ $it['price']=(float)$it['price']; $it['q']=(int)$it['q']; return $it; }, $itemsStmt->fetchAll()),
    ];
}

json_ok([
    'found' => true,
    'name' => $c['name'],
    'walletBalance' => (float)$c['wallet_balance'],
    'activeCashback' => $active,
    'subscription' => $subscription,
    'monthlyOrderCount' => $monthlyCount,
    'isFrequent' => $monthlyCount >= $threshold,
    'pendingOrder' => $pendingOrder,
    'usedCoupons' => $usedCoupons,
]);
