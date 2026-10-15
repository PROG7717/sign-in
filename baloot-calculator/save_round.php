<?php
// =========================================================
// save_round.php — حفظ نشرات البلوت في قاعدة البيانات
// action = add    : إضافة نشرة (وينشئ مباراة جديدة إذا ما فيه match_id)
// action = update : تعديل نشرة موجودة
// action = delete : حذف نشرة (التراجع)
// =========================================================
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");

function respond($arr, $code = 200) {
    http_response_code($code);
    echo json_encode($arr, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(["status" => "error", "message" => "الطلب لازم يكون POST"], 405);
}

require 'db.php'; // ملف الاتصال — يوفّر $conn (mysqli)

if (!isset($conn) || $conn->connect_error) {
    respond(["status" => "error", "message" => "تعذّر الاتصال بقاعدة البيانات"], 500);
}
$conn->set_charset("utf8mb4");
// أي خطأ SQL يتحول Exception عشان نمسكه تحت
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data) || empty($data)) {
    respond(["status" => "error", "message" => "لم يتم استلام أي بيانات"], 400);
}

$action = isset($data['action']) ? $data['action'] : 'add';

// ---------- تنظيف المدخلات ----------
$allowedBuyers = ['us', 'them', ''];
$allowedTypes  = ['sun', 'hakam'];

$buyer      = isset($data['buyer']) && in_array($data['buyer'], $allowedBuyers, true) ? $data['buyer'] : '';
$game_type  = isset($data['game_type']) && in_array($data['game_type'], $allowedTypes, true) ? $data['game_type'] : 'sun';
$us_points  = isset($data['us_points'])   ? (int)$data['us_points']   : 0;
$them_points= isset($data['them_points']) ? (int)$data['them_points'] : 0;
$match_id   = isset($data['match_id'])    ? (int)$data['match_id']    : 0;
$round_id   = isset($data['round_id'])    ? (int)$data['round_id']    : 0;

$cleanProjects = function ($list) {
    $out = [];
    if (is_array($list)) {
        foreach ($list as $p) {
            $name = is_array($p) && isset($p['txt']) ? $p['txt'] : $p;
            if (is_string($name) && mb_strlen($name) <= 20) $out[] = $name;
        }
    }
    return $out;
};
$projects_json = json_encode([
    'us'   => $cleanProjects(isset($data['us_projects'])   ? $data['us_projects']   : []),
    'them' => $cleanProjects(isset($data['them_projects']) ? $data['them_projects'] : []),
], JSON_UNESCAPED_UNICODE);

try {
    // ---------- حذف نشرة ----------
    if ($action === 'delete') {
        if (!$round_id || !$match_id) respond(["status" => "error", "message" => "رقم النشرة ناقص"], 400);
        $st = $conn->prepare("DELETE FROM rounds WHERE id = ? AND match_id = ?");
        $st->bind_param("ii", $round_id, $match_id);
        $st->execute();
        respond(["status" => "success", "message" => "تم حذف النشرة", "deleted" => $st->affected_rows]);
    }

    // ---------- تعديل نشرة ----------
    if ($action === 'update') {
        if (!$round_id || !$match_id) respond(["status" => "error", "message" => "رقم النشرة ناقص"], 400);
        $st = $conn->prepare("UPDATE rounds SET buyer = ?, game_type = ?, projects = ?, us_points = ?, them_points = ? WHERE id = ? AND match_id = ?");
        $st->bind_param("sssiiii", $buyer, $game_type, $projects_json, $us_points, $them_points, $round_id, $match_id);
        $st->execute();
        respond(["status" => "success", "message" => "تم تعديل النشرة", "round_id" => $round_id, "match_id" => $match_id]);
    }

    // ---------- إضافة نشرة ----------
    // نتأكد إن المباراة موجودة، وإذا لا ننشئ مباراة جديدة (كل صكّة لها مباراة)
    if ($match_id > 0) {
        $st = $conn->prepare("SELECT id FROM matches WHERE id = ?");
        $st->bind_param("i", $match_id);
        $st->execute();
        $st->store_result();
        if ($st->num_rows === 0) $match_id = 0;
        $st->close();
    }
    if ($match_id === 0) {
        $status = 'active';
        $st = $conn->prepare("INSERT INTO matches (status) VALUES (?)");
        $st->bind_param("s", $status);
        $st->execute();
        $match_id = $conn->insert_id;
        $st->close();
    }

    $st = $conn->prepare("INSERT INTO rounds (match_id, buyer, game_type, projects, us_points, them_points) VALUES (?, ?, ?, ?, ?, ?)");
    $st->bind_param("isssii", $match_id, $buyer, $game_type, $projects_json, $us_points, $them_points);
    $st->execute();

    respond([
        "status"   => "success",
        "message"  => "تم حفظ النشرة بنجاح",
        "match_id" => $match_id,
        "round_id" => $conn->insert_id
    ]);
} catch (Throwable $e) {
    respond(["status" => "error", "message" => "خطأ في الحفظ"], 500);
} finally {
    if (isset($conn)) $conn->close();
}
