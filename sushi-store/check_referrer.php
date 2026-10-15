<?php
require __DIR__ . '/config.php';
$pdo = db();

$referrerPhone = normalize_sa_phone($_GET['referrerPhone'] ?? '');
$myPhone = normalize_sa_phone($_GET['myPhone'] ?? '');

if (!$referrerPhone) json_ok(['valid' => false, 'reason' => 'invalid_phone']);
if ($myPhone && $referrerPhone === $myPhone) json_ok(['valid' => false, 'reason' => 'self_referral']);

$stmt = $pdo->prepare("SELECT c.id FROM customers c
                         JOIN orders o ON o.customer_id = c.id AND o.status = 'confirmed'
                         WHERE c.phone = ? LIMIT 1");
$stmt->execute([$referrerPhone]);
$valid = (bool)$stmt->fetchColumn();

if ($valid) {
    // كل مرشِّح فرصة وحدة بس مدى الحياة
    $usedStmt = $pdo->prepare("SELECT 1 FROM orders WHERE referrer_phone=? AND referral_discount > 0 AND status IN ('pending','confirmed') LIMIT 1");
    $usedStmt->execute([$referrerPhone]);
    if ($usedStmt->fetchColumn()) json_ok(['valid' => false, 'reason' => 'referrer_used']);
}

json_ok(['valid' => $valid, 'reason' => $valid ? null : 'not_found']);
