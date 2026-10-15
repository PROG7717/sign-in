<?php
require __DIR__ . '/config.php';
require_admin();
$pdo = db();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $status = $_GET['status'] ?? 'pending';
    if (!in_array($status, ['pending', 'confirmed', 'rejected', 'cancelled', 'scheduled'], true)) $status = 'pending';

    if ($status === 'scheduled') {
        // طلبات معلقة مجدولة لوقت بالمستقبل — لسه ما جا وقت تحضيرها
        $orders = $pdo->prepare("SELECT * FROM orders WHERE status='pending' AND scheduled_for IS NOT NULL AND scheduled_for > NOW() ORDER BY scheduled_for ASC LIMIT 200");
        $orders->execute();
    } elseif ($status === 'pending') {
        // الطلبات المعلقة العادية: بدون جدولة، أو وصل وقتها المجدول فعلاً
        $orders = $pdo->prepare("SELECT * FROM orders WHERE status='pending' AND (scheduled_for IS NULL OR scheduled_for <= NOW()) ORDER BY created_at DESC LIMIT 200");
        $orders->execute();
    } else {
        $orders = $pdo->prepare('SELECT * FROM orders WHERE status=? ORDER BY created_at DESC LIMIT 200');
        $orders->execute([$status]);
    }
    $orders = $orders->fetchAll();

    $itemsStmt = $pdo->prepare('SELECT name_ar `ar`, name_en `en`, price, qty `q`, note FROM order_items WHERE order_id=?');
    foreach ($orders as &$o) {
        $itemsStmt->execute([$o['id']]);
        $o['items'] = $itemsStmt->fetchAll();
        $o['total'] = (float)$o['total'];
        $o['cashback_redeemed'] = (float)$o['cashback_redeemed'];
        $o['net_total'] = round($o['total'] - $o['cashback_redeemed'], 2);
    }
    json_ok(['orders' => $orders]);
}

if ($method === 'POST') {
    $in = json_input();
    $orderId = (int)($in['orderId'] ?? 0);
    $action  = $in['action'] ?? '';
    if (!$orderId || !in_array($action, ['approve', 'reject', 'cancel'], true)) json_error('invalid request');

    try {
        $pdo->beginTransaction();

        if ($action === 'cancel') {
            // ---- إلغاء طلب مقبول سابقاً — نعكس كل الآثار اللي صارت وقت القبول ----
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE id=? AND status="confirmed" FOR UPDATE');
            $stmt->execute([$orderId]);
            $order = $stmt->fetch();
            if (!$order) {
                $pdo->rollBack();
                json_error('الطلب مو مقبول حالياً (يمكن ملغى من قبل)', 409);
            }
            $customerId = $order['customer_id'];

            // ١) رجّع عداد الطلبات الشهري لنفس شهر إنشاء الطلب
            $ym = date('Y-m', strtotime($order['created_at']));
            $pdo->prepare('UPDATE customer_monthly_counter SET order_count = GREATEST(0, order_count - 1) WHERE customer_id=? AND `year_month`=?')
                ->execute([$customerId, $ym]);

            // ٢) رجّع أي كاش باك اتخصم (استُخدم) وقت قبول هذا الطلب لمحفظة العميل
            if ((float)$order['cashback_redeemed'] > 0) {
                $pdo->prepare('UPDATE customers SET wallet_balance = wallet_balance + ? WHERE id=?')
                    ->execute([(float)$order['cashback_redeemed'], $customerId]);
            }

            // ٣) ألغِ أي كاش باك (عادي أو من كوبون) كان انصرف بسبب هذا الطلب تحديداً (لو لسه ما استُخدم بطلب ثاني)
            $stmt = $pdo->prepare('SELECT id, amount FROM cashback_transactions WHERE order_id=? AND customer_id=? AND status="active"');
            $stmt->execute([$orderId, $customerId]);
            foreach ($stmt->fetchAll() as $issuedCb) {
                $pdo->prepare('UPDATE cashback_transactions SET status="expired" WHERE id=?')->execute([$issuedCb['id']]);
                $pdo->prepare('UPDATE customers SET wallet_balance = GREATEST(0, wallet_balance - ?) WHERE id=?')
                    ->execute([(float)$issuedCb['amount'], $customerId]);
            }

            // ٤) لو الطلب كان فعّل/جدد اشتراك، اطرح نفس المدة اللي زادت
            if (!empty($order['subscription_product_id'])) {
                $subDays = (int)($order['subscription_days'] ?: 30);
                $pdo->prepare('UPDATE customers SET subscription_expires_at = DATE_SUB(subscription_expires_at, INTERVAL ? DAY) WHERE id=?')
                    ->execute([$subDays, $customerId]);
            }

            $pdo->prepare('UPDATE orders SET status="cancelled" WHERE id=?')->execute([$orderId]);
            $pdo->commit();
            json_ok();
        }

        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id=? AND status="pending" FOR UPDATE');
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        if (!$order) {
            $pdo->rollBack();
            json_error('الطلب مو معلق (يمكن اتأكد أو انرفض من قبل)', 409);
        }

        if ($action === 'reject') {
            // الطلب المعلق ما أثر على العداد ولا الكاش باك أصلاً، فالرفض بس تغيير حالة
            $pdo->prepare('UPDATE orders SET status="rejected" WHERE id=?')->execute([$orderId]);
            $pdo->commit();
            json_ok();
        }

        // ---- موافقة: الآن بس تُنفّذ كل الآثار الفعلية ----
        $customerId = $order['customer_id'];
        $total = (float)$order['total'];

        // استرجاع كاش باك سابق نشط (لو موجود فعلاً الآن)
        $stmt = $pdo->prepare('SELECT id, amount FROM cashback_transactions
                                 WHERE customer_id=? AND status="active" AND expires_at > NOW()
                                 ORDER BY created_at ASC LIMIT 1');
        $stmt->execute([$customerId]);
        $oldCb = $stmt->fetch();
        $redeemed = 0;
        if ($oldCb) {
            $redeemed = round(min((float)$oldCb['amount'], $total), 2);
            $pdo->prepare('UPDATE cashback_transactions SET status="used", used_at=NOW() WHERE id=?')->execute([$oldCb['id']]);
            $pdo->prepare('UPDATE customers SET wallet_balance = GREATEST(0, wallet_balance - ?) WHERE id=?')->execute([$redeemed, $customerId]);
        }

        // عداد الطلبات الشهري — يُحتسب لشهر تاريخ إنشاء الطلب نفسه، ويصير بس الآن (عند الموافقة)
        $ym = date('Y-m', strtotime($order['created_at']));
        $pdo->prepare('INSERT INTO customer_monthly_counter (customer_id, `year_month`, order_count)
                        VALUES (?,?,1)
                        ON DUPLICATE KEY UPDATE order_count = order_count + 1')
            ->execute([$customerId, $ym]);

        // كاش باك جديد — بس لو ما فيه استرجاع بهذا الطلب والمبلغ يستاهل
        $s = $pdo->query('SELECT cashback_min_order, cashback_percent, cashback_expiry_days FROM settings WHERE id=1')->fetch();
        $minOrder = (float)($s['cashback_min_order'] ?? 120);
        $percent  = (float)($s['cashback_percent'] ?? 10);
        $days     = (int)($s['cashback_expiry_days'] ?? 14);
        if ($redeemed <= 0 && $total >= $minOrder) {
            $amount = round($total * ($percent / 100), 2);
            $pdo->prepare('INSERT INTO cashback_transactions (customer_id, order_id, amount, expires_at)
                             VALUES (?,?,?, DATE_ADD(NOW(), INTERVAL ? DAY))')
                ->execute([$customerId, $orderId, $amount, $days]);
            $pdo->prepare('UPDATE customers SET wallet_balance = wallet_balance + ? WHERE id=?')->execute([$amount, $customerId]);
        }

        // تفعيل/تجديد الاشتراك — لو الطلب فيه منتج اشتراك (لقطة أُخذت وقت إنشاء الطلب)
        if (!empty($order['subscription_product_id'])) {
            $subDays = (int)($order['subscription_days'] ?: 30);
            $pdo->prepare('UPDATE customers SET
                    subscription_expires_at = DATE_ADD(IF(subscription_expires_at IS NOT NULL AND subscription_expires_at > NOW(), subscription_expires_at, NOW()), INTERVAL ? DAY),
                    subscription_benefit_ar = ?, subscription_benefit_en = ?
                WHERE id=?')
                ->execute([$subDays, $order['subscription_benefit_ar'] ?? '', $order['subscription_benefit_en'] ?? '', $customerId]);
        }

        // كوبون كاش باك (لو الطلب فيه كوبون من نوع كاش باك) — يُسجَّل بنفس جدول معاملات الكاش باك العادي
        // (نفس مصدر قائمة "كاش باك نشط" وآلية الخصم التلقائي بالطلب الجاي) بدل ما يضاف للمحفظة مباشرة بلا أثر
        if ((float)($order['coupon_cashback'] ?? 0) > 0) {
            $couponAmount = round((float)$order['coupon_cashback'], 2);
            $pdo->prepare('INSERT INTO cashback_transactions (customer_id, order_id, amount, expires_at)
                             VALUES (?,?,?, DATE_ADD(NOW(), INTERVAL ? DAY))')
                ->execute([$customerId, $orderId, $couponAmount, $days]);
            $pdo->prepare('UPDATE customers SET wallet_balance = wallet_balance + ? WHERE id=?')->execute([$couponAmount, $customerId]);
        }

        $pdo->prepare('UPDATE orders SET status="confirmed", confirmed_at=NOW(), cashback_redeemed=? WHERE id=?')
            ->execute([$redeemed, $orderId]);

        $pdo->commit();
        json_ok();
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        json_error('order action failed: ' . $e->getMessage(), 500);
    }
}

json_error('method not allowed', 405);
