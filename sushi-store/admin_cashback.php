<?php
/**
 * GET: يرجع كل الكاش باك النشط (active) — مرتب من الأقرب انتهاء للأبعد.
 * POST: action=add|edit|delete — كل عملية تزامن رصيد محفظة العميل (wallet_balance) تلقائياً
 *       عشان يضل مطابق تماماً لمجموع الكاش باك النشط الفعلي، وقائمة العملاء تتحدث معه.
 */
require __DIR__ . '/config.php';
require_admin();
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $in = json_input();
    $action = $in['action'] ?? '';

    if ($action === 'add') {
        $phone = normalize_sa_phone($in['phone'] ?? '');
        $amount = round((float)($in['amount'] ?? 0), 2);
        $days = max(1, (int)($in['days'] ?? 14));
        if (!$phone) json_error('رقم جوال غير صحيح');
        if ($amount <= 0) json_error('اكتب مبلغ أكبر من صفر');

        $cust = $pdo->prepare('SELECT id FROM customers WHERE phone=? LIMIT 1');
        $cust->execute([$phone]);
        $customerId = $cust->fetchColumn();
        if (!$customerId) json_error('ما لقينا عميل بهذا الرقم — لازم يكون طلب عندك قبل كذا');

        try {
            $pdo->beginTransaction();
            $pdo->prepare('INSERT INTO cashback_transactions (customer_id, amount, expires_at, status)
                             VALUES (?,?, DATE_ADD(NOW(), INTERVAL ? DAY), "active")')
                ->execute([$customerId, $amount, $days]);
            $pdo->prepare('UPDATE customers SET wallet_balance = wallet_balance + ? WHERE id=?')
                ->execute([$amount, $customerId]);
            $pdo->commit();
            json_ok();
        } catch (Exception $e) {
            $pdo->rollBack();
            json_error('صار خطأ: ' . $e->getMessage(), 500);
        }
    }

    if ($action === 'edit') {
        $id = (int)($in['id'] ?? 0);
        $amount = round((float)($in['amount'] ?? 0), 2);
        $expiresAt = trim($in['expiresAt'] ?? '');
        if (!$id) json_error('missing id');
        if ($amount <= 0) json_error('اكتب مبلغ أكبر من صفر');
        if (!$expiresAt) json_error('حدد تاريخ الانتهاء');

        try {
            $pdo->beginTransaction();
            $row = $pdo->prepare('SELECT customer_id, amount FROM cashback_transactions WHERE id=? AND status="active" FOR UPDATE');
            $row->execute([$id]);
            $row = $row->fetch();
            if (!$row) { $pdo->rollBack(); json_error('هذا الكاش باك مو نشط حالياً (يمكن انتهى أو انحذف)', 404); }

            $delta = round($amount - (float)$row['amount'], 2);
            $pdo->prepare('UPDATE cashback_transactions SET amount=?, expires_at=? WHERE id=?')
                ->execute([$amount, $expiresAt, $id]);
            $pdo->prepare('UPDATE customers SET wallet_balance = GREATEST(0, wallet_balance + ?) WHERE id=?')
                ->execute([$delta, $row['customer_id']]);
            $pdo->commit();
            json_ok();
        } catch (Exception $e) {
            $pdo->rollBack();
            json_error('صار خطأ: ' . $e->getMessage(), 500);
        }
    }

    if ($action === 'delete') {
        $id = (int)($in['id'] ?? 0);
        if (!$id) json_error('missing id');

        try {
            $pdo->beginTransaction();
            $row = $pdo->prepare('SELECT customer_id, amount FROM cashback_transactions WHERE id=? AND status="active" FOR UPDATE');
            $row->execute([$id]);
            $row = $row->fetch();
            if (!$row) { $pdo->rollBack(); json_error('هذا الكاش باك مو نشط حالياً (يمكن انتهى أو انحذف من قبل)', 404); }

            $pdo->prepare('UPDATE cashback_transactions SET status="expired" WHERE id=?')->execute([$id]);
            $pdo->prepare('UPDATE customers SET wallet_balance = GREATEST(0, wallet_balance - ?) WHERE id=?')
                ->execute([(float)$row['amount'], $row['customer_id']]);
            $pdo->commit();
            json_ok();
        } catch (Exception $e) {
            $pdo->rollBack();
            json_error('صار خطأ: ' . $e->getMessage(), 500);
        }
    }

    json_error('invalid action');
}

$stmt = $pdo->query('SELECT cb.id, cb.amount, cb.expires_at, cb.created_at,
                             c.id customer_id, c.name, c.phone
                       FROM cashback_transactions cb
                       JOIN customers c ON c.id = cb.customer_id
                       WHERE cb.status = "active"
                       ORDER BY cb.expires_at ASC');
$rows = $stmt->fetchAll();
foreach ($rows as &$r) {
    $r['amount'] = (float)$r['amount'];
    $r['daysLeft'] = max(0, (int)ceil((strtotime($r['expires_at']) - time()) / 86400));
    $r['expiringSoon'] = $r['daysLeft'] <= 3;
}

json_ok(['cashback' => $rows]);
