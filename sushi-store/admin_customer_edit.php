<?php
/**
 * admin_customer_edit.php — أدوات تصحيح يدوية للأدمن:
 * - حذف عميل بالكامل (يحذف طلباته وكاش باكه معه تلقائياً)
 * - تعديل عدد طلبات عميل بالشهر الحالي يدوياً (تصحيح لو صار خطأ)
 */
require __DIR__ . '/config.php';
require_admin();
$pdo = db();
$in = json_input();

$action = $in['action'] ?? '';
$customerId = (int)($in['customerId'] ?? 0);
if (!$customerId) json_error('missing customerId');

if ($action === 'delete') {
    try {
        $pdo->prepare('DELETE FROM customers WHERE id=?')->execute([$customerId]);
        json_ok();
    } catch (Exception $e) {
        json_error('delete failed: ' . $e->getMessage(), 500);
    }
}

if ($action === 'setCount') {
    $count = max(0, (int)($in['count'] ?? 0));
    $ym = current_year_month();
    try {
        $pdo->prepare('INSERT INTO customer_monthly_counter (customer_id, `year_month`, order_count)
                        VALUES (?,?,?)
                        ON DUPLICATE KEY UPDATE order_count=VALUES(order_count)')
            ->execute([$customerId, $ym, $count]);
        json_ok(['count' => $count]);
    } catch (Exception $e) {
        json_error('update failed: ' . $e->getMessage(), 500);
    }
}

if ($action === 'setName') {
    $name = trim($in['name'] ?? '');
    if (mb_strlen($name) > 150) json_error('الاسم طويل جداً');
    try {
        $pdo->prepare('UPDATE customers SET name=? WHERE id=?')->execute([$name, $customerId]);
        json_ok(['name' => $name]);
    } catch (Exception $e) {
        json_error('update failed: ' . $e->getMessage(), 500);
    }
}

json_error('invalid action');
