<?php
require __DIR__ . '/config.php';
require_admin();
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $in = json_input();
    $action = $in['action'] ?? '';

    if ($action === 'add') {
        $name = trim($in['name'] ?? '');
        $phone = normalize_sa_phone($in['phone'] ?? '');
        if (!$name) json_error('اكتب اسم المندوب');
        if (!$phone) json_error('رقم جوال غير صحيح');
        $pdo->prepare('INSERT INTO drivers (name, phone) VALUES (?,?)')->execute([$name, $phone]);
        json_ok(['id' => (int)$pdo->lastInsertId()]);
    }

    if ($action === 'edit') {
        $id = (int)($in['id'] ?? 0);
        $name = trim($in['name'] ?? '');
        $phone = normalize_sa_phone($in['phone'] ?? '');
        if (!$id) json_error('missing id');
        if (!$name) json_error('اكتب اسم المندوب');
        if (!$phone) json_error('رقم جوال غير صحيح');
        $pdo->prepare('UPDATE drivers SET name=?, phone=? WHERE id=?')->execute([$name, $phone, $id]);
        json_ok();
    }

    if ($action === 'delete') {
        $id = (int)($in['id'] ?? 0);
        if (!$id) json_error('missing id');
        $pdo->prepare('DELETE FROM drivers WHERE id=?')->execute([$id]);
        json_ok();
    }

    json_error('invalid action');
}

$drivers = $pdo->query('SELECT id, name, phone FROM drivers ORDER BY name ASC')->fetchAll();
json_ok(['drivers' => $drivers]);
