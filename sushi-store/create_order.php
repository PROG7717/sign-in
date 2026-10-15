<?php
/**
 * create_order.php
 * يسجل طلب العميل كـ"معلق" بانتظار موافقة الأدمن.
 * مهم: عداد الطلبات الشهري والكاش باك (استرجاع/منح) ما يتنفذ هنا إطلاقاً —
 * يصير فقط لما الأدمن يوافق على الطلب (admin_orders.php) عشان طلب مرفوض ما يأثر على شي.
 * كمان: ما نسمح للعميل يرسل أكثر من طلب معلق بنفس الوقت.
 */
require __DIR__ . '/config.php';
$pdo = db();
$in = json_input();

$phoneRaw = trim($in['phone'] ?? '');
$name     = trim($in['name'] ?? '');
$type     = ($in['type'] ?? 'delivery') === 'pickup' ? 'pickup' : 'delivery';
$area     = trim($in['area'] ?? '');
$notes    = trim($in['notes'] ?? '');
$items    = is_array($in['items'] ?? null) ? $in['items'] : [];

if (count($items) === 0) json_error('السلة فارغة');

$phone = normalize_sa_phone($phoneRaw);
if (!$phone) json_error('رقم الجوال غير صحيح. اكتبه بصيغة 05XXXXXXXX');

// ---- هل المتجر مفتوح؟ ----
$storeOpen = (int)($pdo->query('SELECT store_open FROM settings WHERE id=1')->fetchColumn() ?? 1);
if (!$storeOpen) json_error('المتجر مغلق حالياً، جرب لاحقاً 🙏', 403, ['code' => 'store_closed']);

// ---- جدولة الطلب (اختياري) — لازم تكون بالمستقبل ----
$scheduledFor = null;
$scheduledForRaw = trim($in['scheduledFor'] ?? '');
if ($scheduledForRaw !== '') {
    if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $scheduledForRaw)) {
        json_error('صيغة وقت الجدولة غير صحيحة');
    }
    if (strtotime($scheduledForRaw) <= time() - 60) {
        json_error('وقت الجدولة لازم يكون بالمستقبل');
    }
    $scheduledFor = $scheduledForRaw;
}

$total = 0;
foreach ($items as $it) $total += (float)($it['price'] ?? 0) * (int)($it['q'] ?? 1);
$total = round($total, 2);

// ---- كوبون الخصم (اختياري) — نتحقق منه بالسيرفر، ما نثق بأي خصم محسوب بالمتصفح ----
// كل كوبون يُستخدم مرة وحدة بس لكل عميل (نتحقق من رقم جواله بطلباته السابقة الفعلية)
$couponCode = strtoupper(trim($in['couponCode'] ?? ''));
$couponDiscount = 0; $couponCashback = 0; $appliedCouponCode = null;
if ($couponCode !== '') {
    $s = $pdo->query('SELECT coupon_enabled, coupons_json FROM settings WHERE id=1')->fetch();
    if (!empty($s['coupon_enabled'])) {
        $coupons = json_decode($s['coupons_json'] ?? '', true) ?: [];
        foreach ($coupons as $c) {
            if (strtoupper(trim($c['code'] ?? '')) === $couponCode && ($c['active'] ?? true)) {
                $usedStmt = $pdo->prepare("SELECT 1 FROM orders WHERE coupon_code=? AND status IN ('pending','confirmed') LIMIT 1");
                $usedStmt->execute([$couponCode]);
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

// ---- خصم ترشيح صديق (اختياري) — بس لعميل جديد ما طلب قبل، وصديقه لازم يكون طلب عندنا فعلاً،
//      وكل عميل (كمرشِّح) يقدر يرشّح شخص واحد بس مدى الحياة ----
$referrerPhone = normalize_sa_phone($in['referrerPhone'] ?? '');
$referralDiscount = 0; $appliedReferrerPhone = null;
if ($referrerPhone) {
    $s2 = $pdo->query('SELECT referral_enabled, referral_discount_percent FROM settings WHERE id=1')->fetch();
    if (!empty($s2['referral_enabled']) && $referrerPhone !== $phone) {
        // العميل نفسه لازم يكون جديد (ما له طلبات سابقة أصلاً)
        $existing = $pdo->prepare("SELECT 1 FROM orders WHERE phone=? LIMIT 1");
        $existing->execute([$phone]);
        if (!$existing->fetchColumn()) {
            $refCheck = $pdo->prepare("SELECT 1 FROM customers c JOIN orders o ON o.customer_id=c.id AND o.status='confirmed' WHERE c.phone=? LIMIT 1");
            $refCheck->execute([$referrerPhone]);
            if ($refCheck->fetchColumn()) {
                // تأكد إن هذا الرقم ما رشّح حد قبل كذا (كل مرشِّح فرصة وحدة بس)
                $refUsed = $pdo->prepare("SELECT 1 FROM orders WHERE referrer_phone=? AND referral_discount > 0 AND status IN ('pending','confirmed') LIMIT 1");
                $refUsed->execute([$referrerPhone]);
                if ($refUsed->fetchColumn()) json_error('هذا الصديق سبق واستخدم فرصة ترشيحه — كل عميل يرشّح شخص واحد بس', 409, ['code' => 'referrer_used']);
                $pct = max(1, min(90, (int)($s2['referral_discount_percent'] ?? 10)));
                $referralDiscount = round($total * ($pct / 100), 2);
                $appliedReferrerPhone = $referrerPhone;
            }
        }
    }
}
$total = round($total - $referralDiscount, 2);

try {
    $pdo->beginTransaction();

    // ---- عميل جديد أو موجود ----
    $stmt = $pdo->prepare('SELECT id, name FROM customers WHERE phone=?');
    $stmt->execute([$phone]);
    $customer = $stmt->fetch();
    if ($customer) {
        $customerId = $customer['id'];
        if ($name && $name !== $customer['name']) {
            $pdo->prepare('UPDATE customers SET name=? WHERE id=?')->execute([$name, $customerId]);
        }
    } else {
        $pdo->prepare('INSERT INTO customers (phone, name) VALUES (?,?)')->execute([$phone, $name]);
        $customerId = $pdo->lastInsertId();
    }

    // ---- ممنوع أكثر من طلب معلق بنفس الوقت لنفس العميل ----
    $stmt = $pdo->prepare('SELECT id FROM orders WHERE customer_id=? AND status="pending" LIMIT 1');
    $stmt->execute([$customerId]);
    $existingPending = $stmt->fetchColumn();
    if ($existingPending) {
        $pdo->rollBack();
        json_error('عندك طلب سابق لسه ما تأكد', 409, ['code' => 'pending_exists', 'pendingOrderId' => (int)$existingPending]);
    }

    // ---- معاينة الكاش باك فقط (بدون أي تنفيذ فعلي) — يظهر بالرسالة كتوقع، وينفذ فعلياً عند الموافقة ----
    $stmt = $pdo->prepare('SELECT amount FROM cashback_transactions
                             WHERE customer_id=? AND status="active" AND expires_at > NOW()
                             ORDER BY created_at ASC LIMIT 1');
    $stmt->execute([$customerId]);
    $oldAmount = (float)($stmt->fetchColumn() ?: 0);
    $previewRedeemed = $oldAmount > 0 ? round(min($oldAmount, $total), 2) : 0;
    $netTotal = round($total - $previewRedeemed, 2);

    // ---- هل بالسلة منتج اشتراك؟ (نلقط لقطة من بياناته الآن، تُفعّل فعلياً عند الموافقة) ----
    $subProductId = null; $subDays = null; $subBenefitAr = null; $subBenefitEn = null;
    $productIds = array_values(array_filter(array_map(fn($it) => $it['id'] ?? null, $items)));
    if ($productIds) {
        $ph = implode(',', array_fill(0, count($productIds), '?'));
        $stmt = $pdo->prepare("SELECT id, subscription_days, subscription_benefit_ar, subscription_benefit_en
                                 FROM products WHERE id IN ($ph) AND is_subscription=1 LIMIT 1");
        $stmt->execute($productIds);
        if ($sp = $stmt->fetch()) {
            $subProductId = $sp['id']; $subDays = (int)($sp['subscription_days'] ?: 30);
            $subBenefitAr = $sp['subscription_benefit_ar']; $subBenefitEn = $sp['subscription_benefit_en'];
        }
    }

    // ---- الطلب (معلق) ----
    $pdo->prepare('INSERT INTO orders (customer_id, customer_name, phone, order_type, scheduled_for, area, notes, total, cashback_redeemed,
                                        subscription_product_id, subscription_days, subscription_benefit_ar, subscription_benefit_en,
                                        coupon_code, coupon_discount, coupon_cashback, referrer_phone, referral_discount, status)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,"pending")')
        ->execute([$customerId, $name, $phone, $type, $scheduledFor, $area, $notes, $total, $previewRedeemed,
                   $subProductId, $subDays, $subBenefitAr, $subBenefitEn, $appliedCouponCode, $couponDiscount, $couponCashback,
                   $appliedReferrerPhone, $referralDiscount]);
    $orderId = $pdo->lastInsertId();

    $stmtItem = $pdo->prepare('INSERT INTO order_items (order_id, product_id, name_ar, name_en, price, qty, note)
                                 VALUES (?,?,?,?,?,?,?)');
    foreach ($items as $it) {
        $stmtItem->execute([
            $orderId, $it['id'] ?? null, $it['ar'] ?? '', $it['en'] ?? '',
            (float)($it['price'] ?? 0), (int)($it['q'] ?? 1), $it['note'] ?? '',
        ]);
    }

    // ---- الطلب صار له سجل فعلي، احذف أي سجل "سلة متروكة" لنفس الرقم ----
    $pdo->prepare('DELETE FROM cart_sessions WHERE phone=?')->execute([$phone]);

    $pdo->commit();

    json_ok([
        'orderId' => $orderId,
        'customerId' => $customerId,
        'total' => $total,
        'cashbackRedeemed' => $previewRedeemed,
        'netTotal' => $netTotal,
        'pending' => true,
        'scheduledFor' => $scheduledFor,
        'couponApplied' => $appliedCouponCode,
        'referralApplied' => $appliedReferrerPhone,
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    json_error('order failed: ' . $e->getMessage(), 500);
}
