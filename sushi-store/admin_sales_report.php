<?php
require __DIR__ . '/config.php';
require_admin();

$pdo = db();

$from = $_GET['from'] ?? date('Y-m-d', strtotime('-6 days'));
$to   = $_GET['to'] ?? date('Y-m-d');
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) $from = date('Y-m-d', strtotime('-6 days'));
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $to))   $to   = date('Y-m-d');
$fromStart = $from . ' 00:00:00';
$toEnd     = $to . ' 23:59:59';

// ---- ملخص عام ----
$stmt = $pdo->prepare("SELECT COUNT(*) cnt, COALESCE(SUM(total),0) rev
                          FROM orders WHERE status='confirmed' AND confirmed_at BETWEEN ? AND ?");
$stmt->execute([$fromStart, $toEnd]);
$s = $stmt->fetch();
$orderCount = (int)$s['cnt'];
$revenue    = round((float)$s['rev'], 2);

// ---- إيرادات يومية (للرسم البياني) ----
$stmt = $pdo->prepare("SELECT DATE(confirmed_at) d, COALESCE(SUM(total),0) rev, COUNT(*) cnt
                          FROM orders WHERE status='confirmed' AND confirmed_at BETWEEN ? AND ?
                          GROUP BY DATE(confirmed_at) ORDER BY d ASC");
$stmt->execute([$fromStart, $toEnd]);
$daily = array_map(fn($r) => ['date' => $r['d'], 'revenue' => round((float)$r['rev'], 2), 'orders' => (int)$r['cnt']], $stmt->fetchAll());

// ---- أفضل المنتجات مبيعاً (نستثني رسوم التوصيل، مو صنف حقيقي) ----
$stmt = $pdo->prepare("SELECT oi.name_ar ar, oi.name_en en, SUM(oi.qty) qty, SUM(oi.price * oi.qty) rev
                          FROM order_items oi
                          JOIN orders o ON o.id = oi.order_id
                          WHERE o.status='confirmed' AND o.confirmed_at BETWEEN ? AND ?
                            AND oi.product_id <> '_delivery_fee'
                          GROUP BY oi.name_ar, oi.name_en
                          ORDER BY rev DESC");
$stmt->execute([$fromStart, $toEnd]);
$products = array_map(fn($r) => ['ar' => $r['ar'], 'en' => $r['en'], 'qty' => (int)$r['qty'], 'revenue' => round((float)$r['rev'], 2)], $stmt->fetchAll());

// ---- توصيل مقابل استلام ----
$stmt = $pdo->prepare("SELECT order_type, COUNT(*) cnt, COALESCE(SUM(total),0) rev
                          FROM orders WHERE status='confirmed' AND confirmed_at BETWEEN ? AND ?
                          GROUP BY order_type");
$stmt->execute([$fromStart, $toEnd]);
$byType = [];
foreach ($stmt->fetchAll() as $r) $byType[$r['order_type']] = ['orders' => (int)$r['cnt'], 'revenue' => round((float)$r['rev'], 2)];

// ---- قائمة الطلبات نفسها (أسماء العملاء) لهالفترة ----
$stmt = $pdo->prepare("SELECT id, customer_name, phone, order_type, total, confirmed_at
                          FROM orders WHERE status='confirmed' AND confirmed_at BETWEEN ? AND ?
                          ORDER BY confirmed_at DESC");
$stmt->execute([$fromStart, $toEnd]);
$orders = array_map(fn($r) => [
    'id' => (int)$r['id'], 'name' => $r['customer_name'], 'phone' => $r['phone'],
    'type' => $r['order_type'], 'total' => (float)$r['total'], 'confirmedAt' => $r['confirmed_at'],
], $stmt->fetchAll());

json_ok([
    'from' => $from, 'to' => $to,
    'summary' => [
        'revenue' => $revenue,
        'orderCount' => $orderCount,
        'avgOrder' => $orderCount > 0 ? round($revenue / $orderCount, 2) : 0,
    ],
    'daily' => $daily,
    'products' => $products,
    'byType' => $byType,
    'orders' => $orders,
]);
