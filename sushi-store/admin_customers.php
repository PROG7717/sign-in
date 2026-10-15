<?php
/**
 * يرجع فقط العملاء اللي عندهم طلب واحد فأكثر تم قبوله فعلياً هالشهر (يتصفر تلقائي أول كل شهر).
 * الطلب المعلق أو المرفوض ما يسجل بعداد الشهر أصلاً، فما يظهر عميله هنا لين يتوافق له طلب حقيقي.
 */
require __DIR__ . '/config.php';
require_admin();
$pdo = db();

$threshold = (int)($pdo->query('SELECT frequent_customer_threshold FROM settings WHERE id=1')->fetchColumn() ?: 5);
$ym = current_year_month();

$stmt = $pdo->prepare('SELECT c.id, c.name, c.phone, c.wallet_balance, c.created_at,
                               c.subscription_expires_at, c.subscription_benefit_ar, c.subscription_benefit_en,
                               m.order_count
                         FROM customers c
                         JOIN customer_monthly_counter m
                           ON m.customer_id = c.id AND m.`year_month` = ?
                         WHERE m.order_count > 0
                         ORDER BY m.order_count DESC, c.created_at DESC');
$stmt->execute([$ym]);
$rows = $stmt->fetchAll();

// أرقام العملاء اللي رشّحوا صديق ونجح (يستخدم لعرض شارة "🎁 رشّح صديق" بالقائمة)
$referrers = $pdo->query("SELECT DISTINCT referrer_phone FROM orders WHERE referrer_phone IS NOT NULL AND referral_discount > 0 AND status IN ('pending','confirmed')")->fetchAll();
$referrerPhones = array_column($referrers, 'referrer_phone');

foreach ($rows as &$r) {
    $r['wallet_balance'] = (float)$r['wallet_balance'];
    $r['order_count'] = (int)$r['order_count'];
    $r['isFrequent'] = $r['order_count'] >= $threshold;
    $subActive = !empty($r['subscription_expires_at']) && strtotime($r['subscription_expires_at']) > time();
    $r['isSubscriber'] = $subActive;
    $r['subscriptionDaysLeft'] = $subActive ? max(0, (int)ceil((strtotime($r['subscription_expires_at']) - time()) / 86400)) : null;
    $r['hasReferred'] = in_array($r['phone'], $referrerPhones, true);
}

json_ok(['customers' => $rows, 'threshold' => $threshold, 'month' => $ym]);
