<?php
/**
 * update_order.php — يسمح للعميل يعدّل طلبه المعلق (قبل ما الأدمن يوافق أو يرفض).
 * يتحقق إن الطلب فعلاً معلق ويخص نفس رقم الجوال، وبعدين يستبدل الأصناف والإجمالي.
 */
require __DIR__ . '/config.php';
$pdo = db();
$in = json_input();

$orderId = (int)($in['orderId'] ?? 0);
$phone   = normalize_sa_phone($in['phone'] ?? '');
$items   = is_array($in['items'] ?? null) ? $in['items'] : [];
$notes   = trim($in['notes'] ?? '');
$area    = trim($in['area'] ?? '');
$type    = ($in['type'] ?? 'delivery') === 'pickup' ? 'pickup' : 'delivery';

if (!$orderId || !$phone) json_error('بيانات ناقصة');
if (count($items) === 0) json_error('السلة فارغة');

$scheduledFor = null;
$scheduledForRaw = trim($in['scheduledFor'] ?? '');
if ($scheduledForRaw !== '') {
    if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $scheduledForRaw)) json_error('صيغة وقت الجدولة غير صحيحة');
    if (strtotime($scheduledForRaw) <= time() - 60) json_error('وقت الجدولة لازم يكون بالمستقبل');
    $scheduledFor = $scheduledForRaw;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT id, customer_id, phone, status FROM orders WHERE id=? FOR UPDATE');
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();

    if (!$order || $order['phone'] !== $phone) {
        $pdo->rollBack();
        json_error('الطلب غير موجود', 404);
    }
    if ($order['status'] !== 'pending') {
        $pdo->rollBack();
        json_error('الطلب اتأكد بالفعل، ما تقدر تعدله', 409, ['code' => 'not_pending']);
    }

    $total = 0;
    foreach ($items as $it) $total += (float)($it['price'] ?? 0) * (int)($it['q'] ?? 1);
    $total = round($total, 2);

    // ---- كوبون الخصم (اختياري) — نفس تحقق create_order.php (نتجاهل نفس الطلب اللي نعدّله بفحص "استخدم قبل")
    $couponCode = strtoupper(trim($in['couponCode'] ?? ''));
    $couponDiscount = 0; $couponCashback = 0; $appliedCouponCode = null;
    if ($couponCode !== '') {
        $s = $pdo->query('SELECT coupon_enabled, coupons_json FROM settings WHERE id=1')->fetch();
        if (!empty($s['coupon_enabled'])) {
            $coupons = json_decode($s['coupons_json'] ?? '', true) ?: [];
            foreach ($coupons as $c) {
                if (strtoupper(trim($c['code'] ?? '')) === $couponCode && ($c['active'] ?? true)) {
                    $usedStmt = $pdo->prepare("SELECT 1 FROM orders WHERE coupon_code=? AND status IN ('pending','confirmed') AND id<>? LIMIT 1");
                    $usedStmt->execute([$couponCode, $orderId]);
                    if ($usedStmt->fetchColumn()) json_error('هذا الكود استُخدم من قبل — كل كوبون يُستخدم مرة وحدة بس لكل المتجر', 409, ['code' => 'coupon_used']);
                    $appliedCouponCode = $couponCode;
                    if (($c['type'] ?? 'discount') === 'cashback') {
                        $pct = max(5, min(95, (float)($c['value'] ?? 0)));
                        $couponCashback = round($total * ($pct / 100), 2);
                    } else {
                        $pct = max(5, min(95, (float)($c['value'] ?? 0)));
                        $couponDiscount = round($total * ($pct / 100), 2);
                    }
                    break;
                }
            }
        }
    }
    $total = round($total - $couponDiscount, 2);

    // معاينة الكاش باك من جديد (بدون تنفيذ فعلي)
    $stmt = $pdo->prepare('SELECT amount FROM cashback_transactions
                             WHERE customer_id=? AND status="active" AND expires_at > NOW()
                             ORDER BY created_at ASC LIMIT 1');
    $stmt->execute([$order['customer_id']]);
    $oldAmount = (float)($stmt->fetchColumn() ?: 0);
    $previewRedeemed = $oldAmount > 0 ? round(min($oldAmount, $total), 2) : 0;
    $netTotal = round($total - $previewRedeemed, 2);

    $pdo->prepare('UPDATE orders SET order_type=?, scheduled_for=?, area=?, notes=?, total=?, cashback_redeemed=?, coupon_code=?, coupon_discount=?, coupon_cashback=? WHERE id=?')
        ->execute([$type, $scheduledFor, $area, $notes, $total, $previewRedeemed, $appliedCouponCode, $couponDiscount, $couponCashback, $orderId]);

    $pdo->prepare('DELETE FROM order_items WHERE order_id=?')->execute([$orderId]);
    $stmtItem = $pdo->prepare('INSERT INTO order_items (order_id, product_id, name_ar, name_en, price, qty, note)
                                 VALUES (?,?,?,?,?,?,?)');
    foreach ($items as $it) {
        $stmtItem->execute([
            $orderId, $it['id'] ?? null, $it['ar'] ?? '', $it['en'] ?? '',
            (float)($it['price'] ?? 0), (int)($it['q'] ?? 1), $it['note'] ?? '',
        ]);
    }

    $pdo->commit();

    json_ok([
        'orderId' => $orderId,
        'total' => $total,
        'cashbackRedeemed' => $previewRedeemed,
        'netTotal' => $netTotal,
        'scheduledFor' => $scheduledFor,
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    json_error('update failed: ' . $e->getMessage(), 500);
}
