<?php
/* =====================================================================
   api.php — الخلفية الكاملة لمنصة المعلمة (PHP + MySQL)

   نقطة واحدة لكل العمليات. الأمان كله هنا في السيرفر:
   - الأدوار: زائر / طالبة / معلمة، لكل جدول قواعد قراءة وكتابة صارمة
   - حارس التقييم: الطالبة لا تعدل درجتها أو حالتها أو ملاحظات المعلمة
   - ملفات الطالبات محمية ولا تُقدم إلا لصاحبتها أو للمعلمة
   ===================================================================== */

require __DIR__ . '/config.php';

error_reporting(E_ALL);
ini_set('display_errors', '0');

/* ------------------------------------------------ الجلسة */
if (PHP_VERSION_ID >= 70300) {
  session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'path' => '/']);
} else {
  session_set_cookie_params(0, '/; samesite=Lax', '', false, true);
}
session_start();

/* ------------------------------------------------ الاتصال
   الاستضافات المشتركة تحدّ عدد اتصالات MySQL المتزامنة، والرفض عابر في
   الغالب (يزول بعد أجزاء من الثانية)، فنعيد المحاولة ثلاث مرات بفارق
   قصير قبل أن نُرجع خطأ. وإن فشلت كلها نُرجع 503 (خدمة غير متاحة
   مؤقتاً) حتى تعرف الواجهة أن الخطأ مؤقت فتعيد الطلب تلقائياً. */
$pdo = null;
for ($db_try = 0; $db_try < 3; $db_try++) {
  if ($db_try > 0) usleep($db_try === 1 ? 200000 : 500000);
  try {
    $pdo = new PDO(
      'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
      DB_USER, DB_PASS,
      [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
      ]
    );
    break;
  } catch (Exception $e) {
    $pdo = null;
  }
}
if (!$pdo) {
  http_response_code(503);
  header('Content-Type: application/json; charset=utf-8');
  header('Retry-After: 2');
  echo json_encode(['data' => null, 'error' => 'db_connection: تعذّر الاتصال بقاعدة البيانات مؤقتاً'], JSON_UNESCAPED_UNICODE);
  exit;
}

/* ------------------------------------------------ مساعدات عامة */
function out($data, $error = null, $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['data' => $data, 'error' => $error], JSON_UNESCAPED_UNICODE);
  exit;
}

function body_json() {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $d = json_decode($raw, true);
  return is_array($d) ? $d : [];
}

function uid() { return isset($_SESSION['uid']) ? (int)$_SESSION['uid'] : 0; }

/* أرقام الفصول تُخزّن قائمة مفصولة بفواصل ("3,7") حتى تُطابق في
   SQL بـ FIND_IN_SET مطابقة تامة، بلا حيل بحث نصي */
function id_list_to_array($v) {
  if ($v === null || $v === '') return null;
  $out = [];
  foreach (explode(',', (string)$v) as $x) {
    $n = (int)trim($x);
    if ($n > 0 && !in_array($n, $out, true)) $out[] = $n;
  }
  return count($out) ? $out : null;
}

function array_to_id_list($v) {
  if (!is_array($v)) return id_list_to_array($v) ? implode(',', id_list_to_array($v)) : null;
  $out = [];
  foreach ($v as $x) {
    $n = (int)$x;
    if ($n > 0 && !in_array($n, $out, true)) $out[] = $n;
  }
  return count($out) ? implode(',', $out) : null;
}

/* فصل طالبة بعينها (تستعمله المعلمة حين تطّلع على تقدّم طالبة) */
function student_class_id($pdo, $sid) {
  $st = $pdo->prepare('SELECT class_id FROM users WHERE id = ?');
  $st->execute([(int)$sid]);
  $r = $st->fetch();
  return ($r && $r['class_id'] !== null) ? (int)$r['class_id'] : 0;
}

/* فصل الطالبة الحالية (يُقرأ مرة واحدة لكل طلب) */
function my_class_id($pdo) {
  static $cached = false, $val = 0;
  if ($cached) return $val;
  $cached = true;
  if (!uid()) return $val = 0;
  $st = $pdo->prepare('SELECT class_id FROM users WHERE id = ?');
  $st->execute([uid()]);
  $r = $st->fetch();
  return $val = ($r && $r['class_id'] !== null) ? (int)$r['class_id'] : 0;
}

/* هل هذا العنصر موجّه لهذه الطالبة؟ يُستخدم حيث تُصفّى الصفوف في PHP */
function item_targets_student($row, $sid, $classId) {
  if (!isset($row['audience']) || $row['audience'] === 'all') return true;
  if ($row['audience'] === 'class') {
    $ids = id_list_to_array(isset($row['audience_class_ids']) ? $row['audience_class_ids'] : null);
    return $classId > 0 && is_array($ids) && in_array($classId, $ids, true);
  }
  $ids = isset($row['audience_student_ids']) && $row['audience_student_ids']
    ? json_decode($row['audience_student_ids'], true) : [];
  return is_array($ids) && in_array((int)$sid, array_map('intval', $ids), true);
}

function me_row($pdo) {
  if (!uid()) return null;
  $st = $pdo->prepare('SELECT id, full_name, phone, mother_phone, mother_name, class_id, role, status, created_at
                       FROM users WHERE id = ?');
  $st->execute([uid()]);
  $r = $st->fetch();
  return $r ?: null;
}

function role($pdo) {
  static $cached = false, $val = 'anon';
  if ($cached) return $val;
  $cached = true;
  $m = me_row($pdo);
  if ($m) $val = $m['role'];
  return $val;
}

function is_teacher($pdo) { return role($pdo) === 'teacher'; }

function is_approved_student($pdo) {
  $m = me_row($pdo);
  return $m && $m['role'] === 'student' && $m['status'] === 'approved';
}

function require_fetch_header() {
  $h = isset($_SERVER['HTTP_X_REQUESTED_WITH']) ? $_SERVER['HTTP_X_REQUESTED_WITH'] : '';
  if ($h !== 'fetch') out(null, 'bad_request', 400);
}

function iso_to_sql($v) {
  if ($v === null || $v === '') return null;
  $t = strtotime($v);
  return $t ? date('Y-m-d H:i:s', $t) : null;
}

/* توحيد صيغة رقم الجوال السعودي.
   يقبل: 0512345678 / +966512345678 / 966512345678 / 00966512345678
   ويعيد دائماً الصيغة المحلية 0512345678، أو '' إذا كان غير صحيح. */
function normalize_phone($v) {
  $d = preg_replace('/[^0-9]/', '', (string)$v);
  if ($d === '') return '';
  if (strpos($d, '00966') === 0) $d = substr($d, 5);
  elseif (strpos($d, '966') === 0) $d = substr($d, 3);
  elseif ($d[0] === '0') $d = substr($d, 1);
  /* الآن يجب أن يكون 9 أرقام تبدأ بـ 5 */
  if (!preg_match('/^5[0-9]{8}$/', $d)) return '';
  return '0' . $d;
}

function dt_iso($v) {
  if ($v === null) return null;
  return str_replace(' ', 'T', $v);
}

/* ------------------------------------------------ مجلدات الرفع (تُنشأ تلقائياً) */
function ensure_dirs() {
  $base = __DIR__ . '/uploads';
  $dirs = [$base, $base . '/portfolios', $base . '/materials'];
  foreach ($dirs as $d) {
    if (!is_dir($d)) @mkdir($d, 0755, true);
  }
  /* منع تنفيذ أي سكربت داخل مجلد الرفع */
  $ht = $base . '/.htaccess';
  if (!file_exists($ht)) {
    @file_put_contents($ht,
      "<FilesMatch \"\\.(php|phtml|php3|php4|php5|php7|phar)$\">\n" .
      "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n" .
      "<IfModule !mod_authz_core.c>\nOrder deny,allow\nDeny from all\n</IfModule>\n" .
      "</FilesMatch>\n");
  }
  /* ملفات الطالبات خاصة: لا وصول مباشر، فقط عبر api.php */
  $ht2 = $base . '/portfolios/.htaccess';
  if (!file_exists($ht2)) {
    @file_put_contents($ht2,
      "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n" .
      "<IfModule !mod_authz_core.c>\nOrder deny,allow\nDeny from all\n</IfModule>\n");
  }
}
ensure_dirs();

/* =====================================================================
   سجل الجداول: الأعمدة المسموح التعامل معها لكل جدول
   (أي عمود خارج القائمة يُرفض: حماية من الحقن ومن كشف بيانات)
   ===================================================================== */
$TABLES = [
  'profiles' => ['t' => 'users',
    'cols' => ['id', 'full_name', 'phone', 'mother_phone', 'mother_name', 'class_id', 'role', 'status', 'created_at']],
  'classes' => ['t' => 'classes',
    'cols' => ['id', 'name', 'sort_order', 'is_active', 'created_at']],
  'grade_criteria' => ['t' => 'grade_criteria',
    'cols' => ['id', 'ckey', 'group_ar', 'group_en', 'title_ar', 'title_en', 'max_score', 'slots', 'sort_order', 'is_active']],
  'grade_entries' => ['t' => 'grade_entries',
    'cols' => ['id', 'student_id', 'criterion_id', 'slot_index', 'score', 'updated_at']],
  'sections' => ['t' => 'sections',
    'cols' => ['id', 'slug', 'title_ar', 'title_en', 'kind', 'allowed_types', 'is_system',
               'visible_to_students', 'visible_to_parents', 'sort_order', 'created_at']],
  'section_items' => ['t' => 'section_items',
    'cols' => ['id', 'section_id', 'title_ar', 'title_en', 'body_ar', 'body_en', 'item_type',
               'file_path', 'external_url', 'accepts_submissions', 'due_at', 'audience',
               'audience_student_ids', 'audience_class_ids', 'in_portfolio', 'standards',
               'is_published', 'sort_order', 'created_by', 'created_at']],
  'submissions' => ['t' => 'submissions',
    'cols' => ['id', 'student_id', 'item_id', 'title', 'note', 'file_path', 'external_url',
               'status', 'grade', 'max_grade', 'teacher_feedback', 'evaluated_at', 'created_at']],
  'attendance' => ['t' => 'attendance',
    'cols' => ['id', 'student_id', 'class_date', 'status', 'note']],
  'participation' => ['t' => 'participation',
    'cols' => ['id', 'student_id', 'class_date', 'points', 'note', 'created_at']],
  'excellence_board' => ['t' => 'excellence_board',
    'cols' => ['id', 'student_id', 'student_name', 'reason_ar', 'reason_en',
               'source_submission_id', 'is_active', 'added_at']],
  'certificates' => ['t' => 'certificates',
    'cols' => ['id', 'student_id', 'title_ar', 'title_en', 'file_path', 'issued_on']],
  'schedule_slots' => ['t' => 'schedule_slots',
    'cols' => ['id', 'day_of_week', 'period_no', 'class_name_ar', 'class_name_en',
               'starts_at', 'ends_at', 'room']],
  'feedback' => ['t' => 'feedback',
    'cols' => ['id', 'author_id', 'body', 'teacher_reply', 'is_public', 'created_at']],
  'parent_links' => ['t' => 'parent_links',
    'cols' => ['id', 'student_id', 'access_code', 'parent_name', 'is_active', 'created_at']],
  'settings' => ['t' => 'settings',
    'cols' => ['id', 'skey', 'svalue']],
  'parent_messages' => ['t' => 'parent_messages',
    'cols' => ['id', 'student_id', 'kind', 'note', 'sent_at']]
];

$BOOL_COLS = ['is_system', 'visible_to_students', 'visible_to_parents', 'accepts_submissions',
              'is_published', 'is_active', 'is_public'];
$INT_COLS  = ['id', 'student_id', 'section_id', 'item_id', 'author_id', 'created_by',
              'source_submission_id', 'sort_order', 'points', 'day_of_week', 'period_no',
              'class_id', 'criterion_id', 'slot_index', 'slots'];
$DT_COLS   = ['created_at', 'added_at', 'evaluated_at', 'due_at', 'sent_at', 'updated_at'];

function normalize_row($table, $row) {
  global $BOOL_COLS, $INT_COLS, $DT_COLS;
  foreach ($row as $k => $v) {
    if ($v === null) continue;
    if (in_array($k, $BOOL_COLS, true)) $row[$k] = ((int)$v) === 1;
    elseif (in_array($k, $INT_COLS, true)) $row[$k] = (int)$v;
    elseif (in_array($k, $DT_COLS, true)) $row[$k] = dt_iso($v);
    elseif ($k === 'grade' || $k === 'max_grade' || $k === 'max_score' || $k === 'score') $row[$k] = (float)$v;
  }
  if ($table === 'sections' && isset($row['allowed_types'])) {
    $row['allowed_types'] = array_values(array_filter(explode(',', $row['allowed_types'])));
  }
  if ($table === 'section_items') {
    $ids = isset($row['audience_student_ids']) && $row['audience_student_ids']
      ? json_decode($row['audience_student_ids'], true) : null;
    $row['audience_student_ids'] = is_array($ids) ? array_map('intval', $ids) : null;
    if (array_key_exists('audience_class_ids', $row)) {
      $row['audience_class_ids'] = id_list_to_array($row['audience_class_ids']);
    }
    if (array_key_exists('standards', $row)) {
      $row['standards'] = std_list($row['standards']);
    }
  }
  return $row;
}

/* تحويل قيم الكتابة القادمة من الواجهة إلى صيغ MySQL */
function coerce_write($table, $vals) {
  foreach ($vals as $k => $v) {
    if (is_bool($v)) $vals[$k] = $v ? 1 : 0;
  }
  if ($table === 'sections' && isset($vals['allowed_types']) && is_array($vals['allowed_types'])) {
    $vals['allowed_types'] = implode(',', array_map(function ($x) {
      return preg_replace('/[^a-z_]/', '', $x);
    }, $vals['allowed_types']));
  }
  if ($table === 'section_items') {
    if (array_key_exists('audience_student_ids', $vals)) {
      $vals['audience_student_ids'] = is_array($vals['audience_student_ids']) && count($vals['audience_student_ids'])
        ? json_encode(array_map('intval', $vals['audience_student_ids'])) : null;
    }
    if (array_key_exists('audience_class_ids', $vals)) {
      $vals['audience_class_ids'] = array_to_id_list($vals['audience_class_ids']);
    }
    if (array_key_exists('standards', $vals)) {
      $keys = is_array($vals['standards']) ? $vals['standards'] : std_list($vals['standards']);
      $clean = [];
      foreach ($keys as $k) {
        $k = preg_replace('/[^a-z_]/', '', (string)$k);
        if ($k !== '' && !in_array($k, $clean, true)) $clean[] = $k;
      }
      $vals['standards'] = count($clean) ? implode(',', $clean) : null;
    }
    if (array_key_exists('due_at', $vals)) $vals['due_at'] = iso_to_sql($vals['due_at']);
  }
  if ($table === 'submissions' && array_key_exists('evaluated_at', $vals)) {
    $vals['evaluated_at'] = iso_to_sql($vals['evaluated_at']);
  }
  return $vals;
}

function check_portfolio_path($path) {
  if ($path === null || $path === '') return true;
  return strpos($path, 'portfolios/' . uid() . '/') === 0;
}

/* =====================================================================
   قواعد الصلاحيات لكل جدول وعملية (مرآة سياسات RLS السابقة)
   ترجع: deny / empty / where (شروط إجبارية) / cols (أعمدة كتابة مسموحة)
          force (قيم تُفرض) / precheck (فحص صف قبل التعديل والحذف)
   ===================================================================== */
function rules($pdo, $table, $op) {
  $teacher = is_teacher($pdo);
  $approved = is_approved_student($pdo);
  $logged = uid() > 0;

  switch ($table) {
    case 'profiles':
      if ($op === 'select') {
        if ($teacher) return [];
        if ($logged) return ['where' => [['id', '=', uid()]]];
        return ['empty' => true];
      }
      if ($op === 'update' && $teacher) return [
        'cols' => ['status', 'full_name', 'phone', 'mother_phone', 'mother_name', 'class_id'],
        'shape' => function ($vals) {
          if (array_key_exists('full_name', $vals)) {
            $n = trim(preg_replace('/\s+/u', ' ', (string)$vals['full_name']));
            $vals['full_name'] = (count(array_filter(explode(' ', $n))) < 3) ? '__BADNAME__' : $n;
          }
          if (array_key_exists('phone', $vals)) {
            $p = normalize_phone((string)$vals['phone']);
            $vals['phone'] = $p !== '' ? $p : '__BAD__';
          }
          if (array_key_exists('mother_phone', $vals)) {
            $raw = trim((string)$vals['mother_phone']);
            if ($raw === '') { $vals['mother_phone'] = null; }
            else {
              $n = normalize_phone($raw);
              $vals['mother_phone'] = $n !== '' ? $n : '__BAD__';
            }
          }
          return $vals;
        },
        'validate' => function ($vals) {
          if (isset($vals['full_name']) && $vals['full_name'] === '__BADNAME__') return 'invalid_name';
          if (isset($vals['phone']) && $vals['phone'] === '__BAD__') return 'invalid_phone';
          if (isset($vals['mother_phone']) && $vals['mother_phone'] === '__BAD__') return 'invalid_phone';
          /* تطابق رقم الطالبة مع رقم أمها مسموح (طالبة بلا جوال) */
          return null;
        }
      ];
      /* الحذف يتم عبر نقطة مخصصة (delete_student) لتنظيف الملفات كذلك */
      return ['deny' => true];

    case 'sections':
      if ($op === 'select') {
        return $teacher ? [] : ['where' => [['visible_to_students', '=', 1]]];
      }
      if (!$teacher) return ['deny' => true];
      if ($op === 'insert') return [
        'cols' => ['slug', 'title_ar', 'title_en', 'kind', 'allowed_types',
                   'visible_to_students', 'visible_to_parents', 'sort_order'],
        'force' => ['is_system' => 0]
      ];
      if ($op === 'update') return [
        'cols' => ['title_ar', 'title_en', 'allowed_types',
                   'visible_to_students', 'visible_to_parents', 'sort_order']
      ];
      if ($op === 'delete') return [
        'precheck' => function ($row) { return $row && (int)$row['is_system'] === 1 ? 'system_section' : null; }
      ];
      return ['deny' => true];

    case 'section_items':
      if ($op === 'select') {
        if ($teacher) return [];
        return [
          'where' => [['is_published', '=', 1]],
          'raw' => 'section_id IN (SELECT id FROM sections WHERE visible_to_students = 1)',
          'post' => function ($row) use ($approved, $pdo) {
            if ($row['audience'] === 'all') return true;
            if (!$approved) return false;
            if ($row['audience'] === 'class') {
              $ids = is_array($row['audience_class_ids']) ? $row['audience_class_ids'] : [];
              return in_array(my_class_id($pdo), $ids, true);
            }
            $ids = is_array($row['audience_student_ids']) ? $row['audience_student_ids'] : [];
            return in_array(uid(), $ids, true);
          }
        ];
      }
      if (!$teacher) return ['deny' => true];
      $cols = ['section_id', 'title_ar', 'title_en', 'body_ar', 'body_en', 'item_type',
               'file_path', 'external_url', 'accepts_submissions', 'due_at', 'audience',
               'audience_student_ids', 'audience_class_ids', 'in_portfolio', 'standards',
               'is_published', 'sort_order'];
      if ($op === 'insert') return ['cols' => $cols, 'force' => ['created_by' => uid()]];
      if ($op === 'update') return ['cols' => $cols];
      if ($op === 'delete') return [];
      return ['deny' => true];

    case 'submissions':
      if ($op === 'select') {
        if ($teacher) return [];
        if ($logged) return ['where' => [['student_id', '=', uid()]]];
        return ['empty' => true];
      }
      if ($op === 'insert') {
        if (!$approved) return ['deny' => true];
        return [
          'cols' => ['item_id', 'title', 'note', 'file_path', 'external_url'],
          'force' => ['student_id' => uid(), 'status' => 'pending'],
          'validate' => function ($vals) {
            return check_portfolio_path(isset($vals['file_path']) ? $vals['file_path'] : null)
              ? null : 'bad_file_path';
          }
        ];
      }
      if ($op === 'update') {
        if ($teacher) return ['cols' => ['status', 'grade', 'max_grade', 'teacher_feedback', 'evaluated_at']];
        if (!$logged) return ['deny' => true];
        /* حارس التقييم: الطالبة لا تلمس الدرجة أو الحالة أو ملاحظات المعلمة.
           الاستثناء الوحيد: إعادة التسليم من needs_revision إلى pending */
        return [
          'cols' => ['title', 'note', 'file_path', 'external_url', 'status'],
          'scope' => [['student_id', '=', uid()]],
          'precheck' => function ($row) {
            if (!$row) return 'not_found';
            if (!in_array($row['status'], ['pending', 'needs_revision'], true)) return 'locked';
            return null;
          },
          'shape' => function ($vals, $row) {
            if (isset($vals['status'])) {
              if (!($row['status'] === 'needs_revision' && $vals['status'] === 'pending')) {
                unset($vals['status']);
              }
            }
            return $vals;
          },
          'validate' => function ($vals) {
            return (!array_key_exists('file_path', $vals) || check_portfolio_path($vals['file_path']))
              ? null : 'bad_file_path';
          }
        ];
      }
      return ['deny' => true];

    case 'attendance':
      if ($op === 'select') {
        if ($teacher) return [];
        if ($logged) return ['where' => [['student_id', '=', uid()]]];
        return ['empty' => true];
      }
      if (!$teacher) return ['deny' => true];
      return ['cols' => ['student_id', 'class_date', 'status', 'note']];

    case 'participation':
      if ($op === 'select') {
        if ($teacher) return [];
        if ($logged) return ['where' => [['student_id', '=', uid()]]];
        return ['empty' => true];
      }
      if (!$teacher) return ['deny' => true];
      return [
        'cols' => ['student_id', 'class_date', 'points', 'note'],
        'shape' => function ($vals) {
          if (isset($vals['points'])) $vals['points'] = max(-5, min(10, (int)$vals['points']));
          return $vals;
        }
      ];

    case 'excellence_board':
      if ($op === 'select') return []; /* لوحة شرف عامة */
      if (!$teacher) return ['deny' => true];
      if ($op === 'insert') return ['cols' => ['student_id', 'student_name', 'reason_ar', 'reason_en', 'source_submission_id']];
      if ($op === 'update') return ['cols' => ['is_active']];
      return [];

    case 'certificates':
      if ($op === 'select') {
        if ($teacher) return [];
        if ($logged) return ['where' => [['student_id', '=', uid()]]];
        return ['empty' => true];
      }
      if (!$teacher) return ['deny' => true];
      if ($op === 'insert') return [
        'cols' => ['student_id', 'title_ar', 'title_en', 'file_path'],
        'force' => ['issued_on' => date('Y-m-d')]
      ];
      return [];

    case 'schedule_slots':
      if ($op === 'select') return []; /* قراءة عامة */
      if (!$teacher) return ['deny' => true];
      return ['cols' => ['day_of_week', 'period_no', 'class_name_ar', 'class_name_en',
                         'starts_at', 'ends_at', 'room']];

    case 'feedback':
      if ($op === 'select') {
        if ($teacher) return [];
        if ($logged) return ['where' => [['author_id', '=', uid()]]];
        return ['empty' => true];
      }
      if ($op === 'insert') {
        if (!$approved) return ['deny' => true];
        return ['cols' => ['body'], 'force' => ['author_id' => uid()]];
      }
      if ($op === 'update' && $teacher) return ['cols' => ['teacher_reply', 'is_public']];
      if ($op === 'delete' && $teacher) return [];
      return ['deny' => true];

    case 'parent_links':
      if (!$teacher) return ['deny' => true];
      if ($op === 'insert') return [
        'cols' => ['student_id', 'parent_name'],
        'force' => ['access_code' => bin2hex(random_bytes(5))]
      ];
      if ($op === 'update') return ['cols' => ['is_active']];
      return [];

    case 'classes':
      /* قراءة عامة: تحتاجها صفحة التسجيل قبل الدخول */
      if ($op === 'select') return [];
      if (!$teacher) return ['deny' => true];
      if ($op === 'insert') return ['cols' => ['name', 'sort_order']];
      if ($op === 'update') return ['cols' => ['name', 'sort_order', 'is_active']];
      if ($op === 'delete') return [];
      return ['deny' => true];

    case 'grade_criteria':
      if ($op === 'select') {
        if ($teacher || $logged) return [];
        return ['empty' => true];
      }
      if (!$teacher) return ['deny' => true];
      if ($op === 'update') return ['cols' => ['title_ar', 'title_en', 'max_score', 'slots', 'sort_order', 'is_active']];
      return ['deny' => true];

    case 'grade_entries':
      if ($op === 'select') {
        if ($teacher) return [];
        if ($logged) return ['where' => [['student_id', '=', uid()]]];
        return ['empty' => true];
      }
      /* الرصد للمعلمة وحدها */
      if (!$teacher) return ['deny' => true];
      if ($op === 'insert' || $op === 'upsert') return ['cols' => ['student_id', 'criterion_id', 'slot_index', 'score']];
      if ($op === 'update') return ['cols' => ['score']];
      if ($op === 'delete') return [];
      return ['deny' => true];

    case 'settings':
      /* قوالب الرسائل: للمعلمة فقط قراءةً وكتابة */
      if (!$teacher) return ['deny' => true];
      if ($op === 'select') return [];
      if ($op === 'insert' || $op === 'upsert') return ['cols' => ['skey', 'svalue']];
      if ($op === 'update') return ['cols' => ['svalue']];
      return ['deny' => true];

    case 'parent_messages':
      /* سجل التنبيهات: للمعلمة فقط */
      if (!$teacher) return ['deny' => true];
      if ($op === 'select') return [];
      if ($op === 'insert') return ['cols' => ['student_id', 'kind', 'note']];
      if ($op === 'delete') return [];
      return ['deny' => true];
  }
  return ['deny' => true];
}

/* =====================================================================
   محرك الاستعلامات المصفّى (action=q)
   ===================================================================== */
$OP_MAP = ['eq' => '=', 'neq' => '!=', 'gte' => '>=', 'lte' => '<='];

function build_where($tableCols, $filters, $forced, $raw, &$params) {
  global $OP_MAP;
  $parts = [];
  foreach ($forced as $f) {
    $parts[] = '`' . $f[0] . '` ' . $f[1] . ' ?';
    $params[] = $f[2];
  }
  foreach ($filters as $f) {
    $c = isset($f['c']) ? $f['c'] : '';
    $o = isset($f['o']) ? $f['o'] : 'eq';
    if (!in_array($c, $tableCols, true)) out(null, 'bad_column', 400);
    if ($o === 'in') {
      $vals = is_array($f['v']) ? $f['v'] : [];
      if (!count($vals)) { $parts[] = '1=0'; continue; }
      $parts[] = '`' . $c . '` IN (' . implode(',', array_fill(0, count($vals), '?')) . ')';
      foreach ($vals as $v) $params[] = $v;
    } elseif ($o === 'is') {
      $parts[] = '`' . $c . '` IS NULL';
    } elseif (isset($OP_MAP[$o])) {
      $parts[] = '`' . $c . '` ' . $OP_MAP[$o] . ' ?';
      $params[] = $f['v'];
    } else {
      out(null, 'bad_operator', 400);
    }
  }
  if ($raw) $parts[] = $raw;
  return count($parts) ? ' WHERE ' . implode(' AND ', $parts) : '';
}

function attach_embeds($pdo, $table, $select, $rows) {
  if (!count($rows)) return $rows;
  if (($table === 'submissions' || $table === 'feedback') && strpos($select, 'profiles(') !== false) {
    $key = $table === 'feedback' ? 'author_id' : 'student_id';
    $ids = array_values(array_unique(array_map(function ($r) use ($key) { return (int)$r[$key]; }, $rows)));
    $in = implode(',', array_fill(0, count($ids), '?'));
    $st = $pdo->prepare("SELECT id, full_name FROM users WHERE id IN ($in)");
    $st->execute($ids);
    $map = [];
    foreach ($st->fetchAll() as $u) $map[(int)$u['id']] = ['full_name' => $u['full_name']];
    foreach ($rows as &$r) {
      $r['profiles'] = isset($map[(int)$r[$key]]) ? $map[(int)$r[$key]] : null;
    }
    unset($r);
  }
  if ($table === 'submissions' && strpos($select, 'section_items(') !== false) {
    $ids = array_values(array_unique(array_filter(array_map(function ($r) {
      return $r['item_id'] !== null ? (int)$r['item_id'] : null;
    }, $rows), function ($x) { return $x !== null; })));
    $map = [];
    if (count($ids)) {
      $in = implode(',', array_fill(0, count($ids), '?'));
      $st = $pdo->prepare("SELECT id, title_ar, title_en FROM section_items WHERE id IN ($in)");
      $st->execute($ids);
      foreach ($st->fetchAll() as $it) {
        $map[(int)$it['id']] = ['title_ar' => $it['title_ar'], 'title_en' => $it['title_en']];
      }
    }
    foreach ($rows as &$r) {
      $r['section_items'] = ($r['item_id'] !== null && isset($map[(int)$r['item_id']]))
        ? $map[(int)$r['item_id']] : null;
    }
    unset($r);
  }
  return $rows;
}

function do_insert_row($pdo, $phys, $vals) {
  $cols = array_keys($vals);
  $sql = 'INSERT INTO `' . $phys . '` (`' . implode('`,`', $cols) . '`) VALUES ('
    . implode(',', array_fill(0, count($cols), '?')) . ')';
  $st = $pdo->prepare($sql);
  $st->execute(array_values($vals));
  return (int)$pdo->lastInsertId();
}

function do_upsert_row($pdo, $phys, $vals, $conflictCols) {
  $cols = array_keys($vals);
  $updates = [];
  foreach ($cols as $c) {
    if (!in_array($c, $conflictCols, true)) $updates[] = '`' . $c . '` = VALUES(`' . $c . '`)';
  }
  if (!count($updates)) $updates[] = '`' . $conflictCols[0] . '` = `' . $conflictCols[0] . '`';
  $sql = 'INSERT INTO `' . $phys . '` (`' . implode('`,`', $cols) . '`) VALUES ('
    . implode(',', array_fill(0, count($cols), '?')) . ') ON DUPLICATE KEY UPDATE '
    . implode(', ', $updates);
  $st = $pdo->prepare($sql);
  $st->execute(array_values($vals));
  return (int)$pdo->lastInsertId();
}

function handle_q($pdo) {
  global $TABLES;
  require_fetch_header();
  $b = body_json();
  $table = isset($b['table']) ? $b['table'] : '';
  if (!isset($TABLES[$table])) out(null, 'bad_table', 400);
  $phys = $TABLES[$table]['t'];
  $tcols = $TABLES[$table]['cols'];
  $op = isset($b['op']) ? $b['op'] : 'select';
  $filters = isset($b['filters']) && is_array($b['filters']) ? $b['filters'] : [];
  $orders = isset($b['orders']) && is_array($b['orders']) ? $b['orders'] : [];
  $select = isset($b['select']) ? (string)$b['select'] : '*';
  $limit = isset($b['limit']) ? max(1, min(1000, (int)$b['limit'])) : 1000;
  $single = !empty($b['single']);

  /* upsert يخضع لقواعد insert */
  $r = rules($pdo, $table, $op === 'upsert' ? 'insert' : $op);

  if (!empty($r['deny'])) out(null, 'not_allowed', 403);
  if (!empty($r['empty'])) out($single ? null : [], null);

  $forced = isset($r['where']) ? $r['where'] : [];
  $raw = isset($r['raw']) ? $r['raw'] : null;

  /* ---------------- SELECT ---------------- */
  if ($op === 'select') {
    $params = [];
    $where = build_where($tcols, $filters, $forced, $raw, $params);
    $orderSql = '';
    if (count($orders)) {
      $parts = [];
      foreach ($orders as $o) {
        $c = isset($o['c']) ? $o['c'] : '';
        if (!in_array($c, $tcols, true)) out(null, 'bad_column', 400);
        $parts[] = '`' . $c . '` ' . (isset($o['asc']) && $o['asc'] === false ? 'DESC' : 'ASC');
      }
      $orderSql = ' ORDER BY ' . implode(', ', $parts);
    }
    $sql = 'SELECT `' . implode('`,`', $tcols) . '` FROM `' . $phys . '`' . $where . $orderSql . ' LIMIT ' . $limit;
    $st = $pdo->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll();
    $rows = array_map(function ($row) use ($table) { return normalize_row($table, $row); }, $rows);
    if (isset($r['post'])) {
      $rows = array_values(array_filter($rows, $r['post']));
    }
    $rows = attach_embeds($pdo, $table, $select, $rows);
    if ($single) out(count($rows) ? $rows[0] : null);
    out($rows);
  }

  /* ---------------- كتابة ---------------- */
  $values = isset($b['values']) ? $b['values'] : [];
  $isBatch = is_array($values) && array_keys($values) === range(0, count($values) - 1) && count($values) && is_array($values[0]);
  $rowsIn = $isBatch ? $values : [$values];
  $allowedCols = isset($r['cols']) ? $r['cols'] : [];
  $force = isset($r['force']) ? $r['force'] : [];
  $scope = isset($r['scope']) ? $r['scope'] : [];

  if ($op === 'insert' || $op === 'upsert') {
    $conflict = [];
    if ($op === 'upsert') {
      $conflict = array_filter(array_map('trim', explode(',', isset($b['conflict']) ? $b['conflict'] : '')));
      foreach ($conflict as $c) if (!in_array($c, $tcols, true)) out(null, 'bad_column', 400);
    }
    $outRows = [];
    $pdo->beginTransaction();
    try {
      foreach ($rowsIn as $vals) {
        if (!is_array($vals)) continue;
        $clean = [];
        foreach ($vals as $k => $v) {
          if (in_array($k, $allowedCols, true)) $clean[$k] = $v;
        }
        foreach ($force as $k => $v) $clean[$k] = $v;
        if (isset($r['shape'])) $clean = $r['shape']($clean, null);
        $clean = coerce_write($table, $clean);
        if (isset($r['validate'])) {
          $err = $r['validate']($clean);
          if ($err) { $pdo->rollBack(); out(null, $err, 400); }
        }
        if (!count($clean)) { $pdo->rollBack(); out(null, 'no_values', 400); }
        $newId = $op === 'upsert' && count($conflict)
          ? do_upsert_row($pdo, $phys, $clean, $conflict)
          : do_insert_row($pdo, $phys, $clean);
        $outRows[] = ['id' => $newId];
      }
      $pdo->commit();
    } catch (Exception $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      out(null, $e->getMessage(), 400);
    }
    /* إرجاع الصف الأول كاملاً (تحتاجه الواجهة مثل رمز ولي الأمر الجديد) */
    if (count($outRows) === 1 && $outRows[0]['id'] > 0) {
      $st = $pdo->prepare('SELECT `' . implode('`,`', $tcols) . '` FROM `' . $phys . '` WHERE id = ?');
      $st->execute([$outRows[0]['id']]);
      $row = $st->fetch();
      out($row ? [normalize_row($table, $row)] : $outRows);
    }
    out($outRows);
  }

  if ($op === 'update' || $op === 'delete') {
    if (!count($filters)) out(null, 'filters_required', 400);
    $params = [];
    $forcedAll = array_merge($forced, $scope);
    $where = build_where($tcols, $filters, $forcedAll, $raw, $params);

    if (isset($r['precheck'])) {
      $st = $pdo->prepare('SELECT * FROM `' . $phys . '`' . $where . ' LIMIT 1');
      $st->execute($params);
      $row = $st->fetch();
      $err = $r['precheck']($row);
      if ($err) out(null, $err, 403);
      if ($op === 'update' && isset($r['shape'])) {
        $values = $r['shape']($values, $row);
      }
    } elseif ($op === 'update' && isset($r['shape'])) {
      $values = $r['shape']($values, null);
    }

    if ($op === 'delete') {
      $st = $pdo->prepare('DELETE FROM `' . $phys . '`' . $where);
      $st->execute($params);
      out([['deleted' => $st->rowCount()]]);
    }

    $clean = [];
    foreach ($values as $k => $v) {
      if (in_array($k, $allowedCols, true)) $clean[$k] = $v;
    }
    $clean = coerce_write($table, $clean);
    if (isset($r['validate'])) {
      $err = $r['validate']($clean);
      if ($err) out(null, $err, 400);
    }
    if (!count($clean)) out([['id' => 0]]);
    $sets = [];
    $setParams = [];
    foreach ($clean as $k => $v) { $sets[] = '`' . $k . '` = ?'; $setParams[] = $v; }
    $sql = 'UPDATE `' . $phys . '` SET ' . implode(', ', $sets) . $where;
    $st = $pdo->prepare($sql);
    try {
      $st->execute(array_merge($setParams, $params));
    } catch (Exception $e) {
      /* رقم مستخدَم من حساب آخر */
      if (strpos($e->getMessage(), 'Duplicate') !== false) out(null, 'already registered', 400);
      out(null, $e->getMessage(), 400);
    }
    out([['updated' => $st->rowCount()]]);
  }

  out(null, 'bad_op', 400);
}

/* =====================================================================
   الدخول والتسجيل والجلسة
   ===================================================================== */
function handle_login($pdo) {
  require_fetch_header();
  $b = body_json();
  $phone = normalize_phone(isset($b['phone']) ? $b['phone'] : '');
  $pass = isset($b['password']) ? (string)$b['password'] : '';
  if ($phone === '') out(null, 'invalid_phone', 400);
  $st = $pdo->prepare('SELECT * FROM users WHERE phone = ?');
  $st->execute([$phone]);
  $u = $st->fetch();
  if (!$u) out(null, 'wrong_login', 401);
  /* الحسابات المحمية بكلمة مرور (المعلمة) تُعرف من قاعدة البيانات لا من ملف الإعدادات،
     حتى لو غُيّر رقم المعلمة لاحقاً. إذا لم تُرسل كلمة المرور نطلبها صراحة
     ليتمكن الموقع من إظهار خانة الرمز دون معرفة الرقم مسبقاً. */
  $needsPass = ($u['role'] === 'teacher') || !empty($u['password_hash']);
  if ($needsPass) {
    if ($pass === '') out(null, 'password_required', 401);
    if (empty($u['password_hash']) || !password_verify($pass, $u['password_hash'])) {
      out(null, 'wrong_login', 401);
    }
  }
  session_regenerate_id(true);
  $_SESSION['uid'] = (int)$u['id'];
  out(normalize_row('profiles', [
    'id' => $u['id'], 'full_name' => $u['full_name'], 'phone' => $u['phone'],
    'mother_phone' => isset($u['mother_phone']) ? $u['mother_phone'] : null,
    'mother_name' => isset($u['mother_name']) ? $u['mother_name'] : null,
    'class_id' => isset($u['class_id']) ? $u['class_id'] : null,
    'role' => $u['role'], 'status' => $u['status'], 'created_at' => $u['created_at']
  ]));
}

function handle_register($pdo) {
  require_fetch_header();
  $b = body_json();
  $name = isset($b['full_name']) ? trim(preg_replace('/\s+/u', ' ', $b['full_name'])) : '';
  $phone = normalize_phone(isset($b['phone']) ? $b['phone'] : '');
  $mother = normalize_phone(isset($b['mother_phone']) ? $b['mother_phone'] : '');
  $motherName = isset($b['mother_name']) ? trim(preg_replace('/\s+/u', ' ', $b['mother_name'])) : '';
  if ($motherName === '') $motherName = null;
  if (count(array_filter(explode(' ', $name))) < 3) out(null, 'invalid_name', 400);
  if ($phone === '') out(null, 'invalid_phone', 400);
  if ($mother === '') out(null, 'invalid_mother_phone', 400);
  /* الفصل: يجب أن يكون موجوداً وفعّالاً */
  $classId = isset($b['class_id']) ? (int)$b['class_id'] : 0;
  if ($classId <= 0) out(null, 'class_required', 400);
  $stc = $pdo->prepare('SELECT id FROM classes WHERE id = ? AND is_active = 1');
  $stc->execute([$classId]);
  if (!$stc->fetch()) out(null, 'class_required', 400);
  /* يُسمح بتطابق رقم الطالبة مع رقم أمها: الطالبة التي لا تملك جوالاً
     تُسجَّل برقم أمها في الحقلين، وتصل رسائلها إلى جوال الأم. */
  /* رقم المعلمة يُقرأ من قاعدة البيانات، فيبقى صحيحاً حتى لو غُيّر لاحقاً */
  $st = $pdo->prepare("SELECT id FROM users WHERE phone = ? AND role = 'teacher'");
  $st->execute([$phone]);
  if ($st->fetch()) out(null, 'already registered', 400);
  try {
    $st = $pdo->prepare('INSERT INTO users (full_name, phone, mother_phone, mother_name, class_id) VALUES (?, ?, ?, ?, ?)');
    $st->execute([$name, $phone, $mother, $motherName, $classId]);
  } catch (Exception $e) {
    $m = $e->getMessage();
    if (strpos($m, 'Duplicate') !== false) out(null, 'already registered', 400);
    /* قاعدة البيانات لم تُحدَّث: أعمدة الأم غير موجودة */
    if (stripos($m, 'Unknown column') !== false || stripos($m, "doesn't exist") !== false) {
      out(null, 'db_needs_update', 400);
    }
    out(null, 'register_failed', 400);
  }
  session_regenerate_id(true);
  $_SESSION['uid'] = (int)$pdo->lastInsertId();
  $m = me_row($pdo);
  out(normalize_row('profiles', $m));
}

function handle_me($pdo) {
  $m = me_row($pdo);
  out($m ? normalize_row('profiles', $m) : null);
}

function handle_logout() {
  require_fetch_header();
  $_SESSION = [];
  if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $p['path'],
      isset($p['domain']) ? $p['domain'] : '', !empty($p['secure']), true);
  }
  session_destroy();
  out(true);
}

/* =====================================================================
   رفع الملفات وتقديمها
   ===================================================================== */
function handle_upload($pdo) {
  require_fetch_header();
  $bucket = isset($_POST['bucket']) ? $_POST['bucket'] : '';
  $folder = isset($_POST['folder']) ? $_POST['folder'] : '';
  if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    out(null, 'upload_failed', 400);
  }
  $f = $_FILES['file'];
  $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
  $allowed = array_map('trim', explode(',', ALLOWED_EXT));
  if (!in_array($ext, $allowed, true)) out(null, 'bad_type', 400);
  if ($f['size'] > MAX_FILE_MB * 1024 * 1024) out(null, 'too_big', 400);

  if ($bucket === 'portfolios') {
    if (!is_approved_student($pdo) && !is_teacher($pdo)) out(null, 'not_allowed', 403);
    $rel = 'portfolios/' . uid();
  } elseif ($bucket === 'materials') {
    if (!is_teacher($pdo)) out(null, 'not_allowed', 403);
    $folder = trim(preg_replace('#[^a-zA-Z0-9/_-]#', '', $folder), '/');
    $folder = str_replace('..', '', $folder);
    $rel = 'materials' . ($folder !== '' ? '/' . $folder : '');
  } else {
    out(null, 'bad_bucket', 400);
  }

  $dir = __DIR__ . '/uploads/' . $rel;
  if (!is_dir($dir) && !@mkdir($dir, 0755, true)) out(null, 'mkdir_failed', 500);
  $name = time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
  if (!move_uploaded_file($f['tmp_name'], $dir . '/' . $name)) out(null, 'save_failed', 500);
  out(['path' => $rel . '/' . $name]);
}

function handle_file($pdo) {
  $path = isset($_GET['path']) ? $_GET['path'] : '';
  if (strpos($path, 'portfolios/') !== 0) { http_response_code(404); exit; }
  if (strpos($path, '..') !== false) { http_response_code(404); exit; }
  $parts = explode('/', $path);
  $ownerId = isset($parts[1]) ? (int)$parts[1] : 0;
  if (!is_teacher($pdo) && uid() !== $ownerId) { http_response_code(403); exit; }
  $full = realpath(__DIR__ . '/uploads/' . $path);
  $base = realpath(__DIR__ . '/uploads');
  if (!$full || !$base || strpos($full, $base) !== 0 || !is_file($full)) { http_response_code(404); exit; }
  $ext = strtolower(pathinfo($full, PATHINFO_EXTENSION));
  $mimes = [
    'pdf' => 'application/pdf', 'png' => 'image/png', 'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg', 'webp' => 'image/webp',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  header('Content-Type: ' . (isset($mimes[$ext]) ? $mimes[$ext] : 'application/octet-stream'));
  header('Content-Length: ' . filesize($full));
  header('X-Content-Type-Options: nosniff');
  readfile($full);
  exit;
}

/* =====================================================================
   تنبيهات الجديد للطالبة
   يُحتسب الجديد منذ آخر مرة فتحت فيها القسم، وللطالبة الجديدة منذ
   تاريخ إنشاء حسابها (فالمحتوى الموجود قبل انضمامها ليس "جديداً").
   ===================================================================== */
/* العناصر التي لم تفتحها الطالبة بعد.
   العنصر يُحسب جديداً إذا:
   - لم تفتحه هي (لا سجل في item_views)، و
   - أُضيف بعد تسجيلها، وبعد الحدّ الفاصل القديم للقسم إن وُجد
     (section_views لم تُعد تُحدّث، فهي تمنع رجوع المحتوى القديم جديداً).
   يُرجع لكل قسم: عدده، ومعرّفات عناصره الجديدة ليعرف العرض أيها يوسم. */
function handle_unread($pdo) {
  if (!is_approved_student($pdo)) out([]);
  $sid = uid();

  $st = $pdo->prepare("SELECT i.id, i.section_id, i.audience, i.audience_student_ids, i.audience_class_ids
                       FROM section_items i
                       JOIN sections s ON s.id = i.section_id AND s.visible_to_students = 1
                       LEFT JOIN section_views v
                         ON v.section_id = i.section_id AND v.student_id = ?
                       LEFT JOIN item_views iv
                         ON iv.item_id = i.id AND iv.student_id = ?
                       JOIN users u ON u.id = ?
                       WHERE i.is_published = 1
                         AND iv.id IS NULL
                         AND i.created_at > COALESCE(v.last_seen_at, u.created_at)
                       ORDER BY i.created_at DESC, i.id DESC");
  $st->execute([$sid, $sid, $sid]);

  $myClass = my_class_id($pdo);
  $items = [];
  foreach ($st->fetchAll() as $r) {
    /* التصفية حسب الجمهور تتم هنا لأن القوائم مخزّنة نصاً */
    if (!item_targets_student($r, $sid, $myClass)) continue;
    $k = (int)$r['section_id'];
    if (!isset($items[$k])) $items[$k] = [];
    $items[$k][] = (int)$r['id'];
  }

  $rows = [];
  foreach ($items as $secId => $ids) {
    $rows[] = ['section_id' => $secId, 'count' => count($ids), 'item_ids' => $ids];
  }
  out($rows);
}

/* تُستدعى عند فتح الطالبة عنصراً بعينه: يختفي وسم "جديد" عنه وحده.
   فتح القسم نفسه لم يعد يُعلّم شيئاً مقروءاً، لذلك الطلب بـ section_id
   وحده صار بلا أثر (نُبقيه حتى لا يفشل متصفح يعمل بنسخة قديمة). */
function handle_mark_seen($pdo) {
  require_fetch_header();
  if (!is_approved_student($pdo)) out(true);
  $b = body_json();
  $itemId = isset($b['item_id']) ? (int)$b['item_id'] : 0;
  if ($itemId <= 0) out(true);

  $sid = uid();
  /* لا نسجّل إلا عنصراً منشوراً في قسم ظاهر للطالبات، ويخصّها إن كان
     موجّهاً لأسماء محددة */
  $st = $pdo->prepare("SELECT i.audience, i.audience_student_ids, i.audience_class_ids
                       FROM section_items i
                       JOIN sections s ON s.id = i.section_id AND s.visible_to_students = 1
                       WHERE i.id = ? AND i.is_published = 1");
  $st->execute([$itemId]);
  $it = $st->fetch();
  if (!$it) out(null, 'bad_item', 404);
  if (!item_targets_student($it, $sid, my_class_id($pdo))) out(null, 'not_allowed', 403);

  $st = $pdo->prepare('INSERT INTO item_views (student_id, item_id, seen_at)
                       VALUES (?, ?, NOW())
                       ON DUPLICATE KEY UPDATE seen_at = seen_at');
  $st->execute([$sid, $itemId]);
  out(true);
}

/* =====================================================================
   تقدّم الطالبة ونقاطها
   النقاط تُحتسب من الأعمال المعتمدة من المعلمة فقط (لا بمجرد الرفع)،
   وتُحسب في السيرفر فلا يمكن تزويرها من المتصفح.
   ===================================================================== */
function progress_for($pdo, $sid) {
  $sid = (int)$sid;

  /* الأقسام التي تقبل تسليمات، مجمّعة حسب القسم */
  $st = $pdo->prepare("SELECT s.id, s.slug, s.title_ar, s.title_en,
                              COUNT(i.id) AS total
                       FROM sections s
                       JOIN section_items i ON i.section_id = s.id
                            AND i.is_published = 1 AND i.accepts_submissions = 1
                            AND (i.audience = 'all'
                                 OR (i.audience = 'named' AND FIND_IN_SET(?,
                                       REPLACE(REPLACE(REPLACE(i.audience_student_ids,'[',''),']',''),' ','')))
                                 OR (i.audience = 'class' AND FIND_IN_SET(?, i.audience_class_ids)))
                       WHERE s.visible_to_students = 1
                       GROUP BY s.id, s.slug, s.title_ar, s.title_en
                       ORDER BY s.sort_order");
  $st->execute([$sid, student_class_id($pdo, $sid)]);
  $sections = $st->fetchAll();

  /* المعتمد لكل قسم */
  $st = $pdo->prepare("SELECT i.section_id, COUNT(DISTINCT sub.item_id) AS done
                       FROM submissions sub
                       JOIN section_items i ON i.id = sub.item_id
                       WHERE sub.student_id = ? AND sub.status = 'approved'
                       GROUP BY i.section_id");
  $st->execute([$sid]);
  $done = [];
  foreach ($st->fetchAll() as $r) $done[(int)$r['section_id']] = (int)$r['done'];

  $rows = [];
  foreach ($sections as $s) {
    $rows[] = [
      'section_id' => (int)$s['id'],
      'slug' => $s['slug'],
      'title_ar' => $s['title_ar'],
      'title_en' => $s['title_en'],
      'total' => (int)$s['total'],
      'done' => isset($done[(int)$s['id']]) ? $done[(int)$s['id']] : 0
    ];
  }

  /* النقاط: كل عمل معتمد نقطة */
  $st = $pdo->prepare("SELECT COUNT(*) c FROM submissions
                       WHERE student_id = ? AND status = 'approved'");
  $st->execute([$sid]);
  $points = (int)$st->fetch()['c'];

  return [
    'sections' => $rows,
    'points' => $points,
    'bonus_step' => BONUS_STEP,
    'bonus_count' => intdiv($points, BONUS_STEP),
    'to_next' => ($points % BONUS_STEP === 0 && $points > 0)
      ? 0 : (BONUS_STEP - ($points % BONUS_STEP))
  ];
}

function handle_progress($pdo) {
  $sid = uid();
  if (is_teacher($pdo)) {
    $q = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
    if ($q > 0) $sid = $q;
    else out(null, 'student_required', 400);
  } elseif (!is_approved_student($pdo)) {
    out(['sections' => [], 'points' => 0, 'bonus_step' => BONUS_STEP, 'bonus_count' => 0, 'to_next' => BONUS_STEP]);
  }
  out(progress_for($pdo, $sid));
}

/* نقاط كل الطالبات دفعة واحدة (للمعلمة) */
function handle_points_all($pdo) {
  if (!is_teacher($pdo)) out(null, 'not_allowed', 403);
  $st = $pdo->query("SELECT u.id, COUNT(s.id) AS pts
                     FROM users u
                     LEFT JOIN submissions s ON s.student_id = u.id AND s.status = 'approved'
                     WHERE u.role = 'student' AND u.status = 'approved'
                     GROUP BY u.id");
  $rows = [];
  foreach ($st->fetchAll() as $r) {
    $p = (int)$r['pts'];
    $rows[] = ['student_id' => (int)$r['id'], 'points' => $p, 'bonus_count' => intdiv($p, BONUS_STEP)];
  }
  out(['students' => $rows, 'bonus_step' => BONUS_STEP]);
}

/* حذف حساب طالبة نهائياً: سجلاتها ومرفقاتها معها.
   للمعلمة وحدها، ولا يمكن حذف حساب معلمة أو حسابها هي. */
function handle_delete_student($pdo) {
  require_fetch_header();
  if (!is_teacher($pdo)) out(null, 'not_allowed', 403);
  $b = body_json();
  $sid = isset($b['student_id']) ? (int)$b['student_id'] : 0;
  if ($sid <= 0) out(null, 'bad_student', 400);
  if ($sid === uid()) out(null, 'cannot_delete_self', 400);

  $st = $pdo->prepare('SELECT id, full_name, role FROM users WHERE id = ?');
  $st->execute([$sid]);
  $u = $st->fetch();
  if (!$u) out(null, 'not_found', 404);
  if ($u['role'] !== 'student') out(null, 'not_allowed', 403);

  /* تأكيد صريح حتى لا يقع الحذف بطلب عابر */
  if (!isset($b['confirm']) || $b['confirm'] !== 'DELETE') out(null, 'confirm_required', 400);

  try {
    /* السجلات المرتبطة تُحذف تلقائياً بعلاقات ON DELETE CASCADE */
    $del = $pdo->prepare('DELETE FROM users WHERE id = ? AND role = ?');
    $del->execute([$sid, 'student']);
  } catch (Exception $e) {
    out(null, 'delete_failed: ' . $e->getMessage(), 500);
  }

  /* مرفقات الطالبة على القرص */
  rrmdir(__DIR__ . '/uploads/portfolios/' . $sid);
  out(['deleted' => true, 'student_id' => $sid, 'full_name' => $u['full_name']]);
}

/* عدد عناصر المحتوى في كل قسم.
   المعلمة ترى كل العناصر، والطالبة ترى المنشور الموجّه إليها فقط. */
function handle_section_counts($pdo) {
  $counts = [];

  if (is_teacher($pdo)) {
    $st = $pdo->query('SELECT section_id, COUNT(*) c FROM section_items GROUP BY section_id');
    foreach ($st->fetchAll() as $r) $counts[(int)$r['section_id']] = (int)$r['c'];
  } else {
    $sid = is_approved_student($pdo) ? uid() : 0;
    $myClass = $sid ? my_class_id($pdo) : 0;
    $st = $pdo->query("SELECT i.section_id, i.audience, i.audience_student_ids, i.audience_class_ids
                       FROM section_items i
                       JOIN sections s ON s.id = i.section_id AND s.visible_to_students = 1
                       WHERE i.is_published = 1");
    foreach ($st->fetchAll() as $r) {
      if ($r['audience'] !== 'all' && !$sid) continue;
      if (!item_targets_student($r, $sid, $myClass)) continue;
      $k = (int)$r['section_id'];
      $counts[$k] = isset($counts[$k]) ? $counts[$k] + 1 : 1;
    }
  }

  $rows = [];
  foreach ($counts as $secId => $c) $rows[] = ['section_id' => $secId, 'count' => $c];
  out($rows);
}

/* =====================================================================
   تغذية ملف الإنجاز
   نقطة قراءة واحدة يسحب منها موقع ملف الإنجاز محتواه مرتباً على معايير
   الأداء الوظيفي. لا تمر إلا بمفتاح سري، ولا تُخرج أرقام جوالات ولا
   بيانات شخصية للطالبات.
   ===================================================================== */
function portfolio_key_ok() {
  if (!defined('PORTFOLIO_KEY')) return false;
  $want = (string)PORTFOLIO_KEY;
  if ($want === '' || $want === 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET') return false;
  $got = '';
  if (isset($_SERVER['HTTP_X_PORTFOLIO_KEY'])) $got = (string)$_SERVER['HTTP_X_PORTFOLIO_KEY'];
  elseif (isset($_GET['key'])) $got = (string)$_GET['key'];
  if ($got === '') return false;
  return hash_equals($want, $got);
}

/* عنوان كامل لملف مرفوع، ليفتح من الموقع الآخر */
function portfolio_file_url($path) {
  if (!$path) return null;
  $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
  $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
  $dir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
  return $scheme . '://' . $host . $dir . '/uploads/' . ltrim($path, '/');
}

function std_list($v) {
  if ($v === null || $v === '') return [];
  $out = [];
  foreach (explode(',', (string)$v) as $x) {
    $k = preg_replace('/[^a-z_]/', '', trim($x));
    if ($k !== '' && !in_array($k, $out, true)) $out[] = $k;
  }
  return $out;
}

function handle_portfolio($pdo) {
  /* السماح لموقع ملف الإنجاز وحده بالقراءة من المتصفح */
  $origin = defined('PORTFOLIO_ORIGIN') ? rtrim((string)PORTFOLIO_ORIGIN, '/') : '';
  if ($origin !== '') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: X-Portfolio-Key, Content-Type');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
  }
  if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
  if (!portfolio_key_ok()) out(null, 'portfolio_key', 403);

  $showNames = defined('PORTFOLIO_SHOW_NAMES') && PORTFOLIO_SHOW_NAMES;

  /* ------------------------------------------------ المعايير */
  $stds = [];
  $st = $pdo->query('SELECT skey, title_ar, title_en FROM portfolio_standards ORDER BY sort_order, id');
  foreach ($st->fetchAll() as $r) {
    $stds[$r['skey']] = [
      'key' => $r['skey'],
      'title_ar' => $r['title_ar'],
      'title_en' => $r['title_en'],
      'items' => [],
      'stats' => [],
      'cards' => []
    ];
  }
  if (!count($stds)) out(null, 'no_standards', 500);

  /* ------------------------------------------------ المحتوى الموسوم */
  $st = $pdo->query("SELECT i.id, i.title_ar, i.title_en, i.body_ar, i.body_en, i.item_type,
                            i.file_path, i.external_url, i.standards, i.created_at,
                            s.title_ar AS sec_ar, s.title_en AS sec_en, s.slug AS sec_slug
                     FROM section_items i
                     JOIN sections s ON s.id = i.section_id
                     WHERE i.in_portfolio = 1 AND i.is_published = 1
                     ORDER BY i.created_at DESC, i.id DESC");
  $itemCount = 0;
  foreach ($st->fetchAll() as $r) {
    $keys = std_list($r['standards']);
    if (!count($keys)) continue;
    $itemCount++;
    $row = [
      'id' => (int)$r['id'],
      'title_ar' => $r['title_ar'],
      'title_en' => $r['title_en'],
      'body_ar' => $r['body_ar'],
      'body_en' => $r['body_en'],
      'type' => $r['item_type'],
      'file_url' => portfolio_file_url($r['file_path']),
      'external_url' => $r['external_url'],
      'section_ar' => $r['sec_ar'],
      'section_en' => $r['sec_en'],
      'section_slug' => $r['sec_slug'],
      'created_at' => dt_iso($r['created_at'])
    ];
    foreach ($keys as $k) {
      if (isset($stds[$k])) $stds[$k]['items'][] = $row;
    }
  }

  /* ------------------------------------------------ أرقام عامة */
  $one = function ($sql) use ($pdo) {
    $r = $pdo->query($sql)->fetch();
    return $r ? (int)array_values($r)[0] : 0;
  };
  $students = $one("SELECT COUNT(*) FROM users WHERE role = 'student' AND status = 'approved'");
  $classes  = $one("SELECT COUNT(*) FROM classes WHERE is_active = 1");
  $approved = $one("SELECT COUNT(*) FROM submissions WHERE status = 'approved'");
  $certs    = $one("SELECT COUNT(*) FROM certificates");
  $exc      = $one("SELECT COUNT(*) FROM excellence_board WHERE is_active = 1");
  $msgs     = $one("SELECT COUNT(*) FROM parent_messages");
  $attDays  = $one("SELECT COUNT(DISTINCT class_date) FROM attendance");

  $r = $pdo->query("SELECT
        SUM(CASE WHEN status IN ('present','late','excused') THEN 1 ELSE 0 END) AS ok,
        COUNT(*) AS total FROM attendance")->fetch();
  $attRate = ($r && (int)$r['total'] > 0) ? round(100 * (int)$r['ok'] / (int)$r['total']) : null;

  /* ------------------------------------------------ شواهد تلقائية */
  $add = function ($key, $field, $value) use (&$stds) {
    if (isset($stds[$key])) $stds[$key][$field][] = $value;
  };

  $add('classroom', 'stats', ['label_ar' => 'عدد الطالبات', 'value' => $students]);
  $add('classroom', 'stats', ['label_ar' => 'عدد الفصول', 'value' => $classes]);
  $add('classroom', 'stats', ['label_ar' => 'أيام الحضور المرصودة', 'value' => $attDays]);
  if ($attRate !== null) {
    $add('classroom', 'stats', ['label_ar' => 'نسبة الحضور العامة', 'value' => $attRate . '%']);
  }
  $add('results', 'stats', ['label_ar' => 'تسليمات معتمدة', 'value' => $approved]);
  $add('results', 'stats', ['label_ar' => 'شهادات شكر وتفوق', 'value' => $certs]);
  $add('results', 'stats', ['label_ar' => 'على لوحة الأداء المتميز', 'value' => $exc]);
  $add('parents', 'stats', ['label_ar' => 'رسائل التواصل المرسلة', 'value' => $msgs]);
  $add('planning', 'stats', ['label_ar' => 'محتوى مرفوع في المنصة', 'value' => $itemCount]);

  /* لوحة الأداء المتميز */
  $st = $pdo->query("SELECT e.student_name, e.reason_ar, e.reason_en, e.added_at
                     FROM excellence_board e WHERE e.is_active = 1
                     ORDER BY e.added_at DESC LIMIT 60");
  foreach ($st->fetchAll() as $e) {
    $card = [
      'kind' => 'excellence',
      'title_ar' => $e['reason_ar'] ? $e['reason_ar'] : 'تميّز في الأداء',
      'title_en' => $e['reason_en'],
      'date' => dt_iso($e['added_at'])
    ];
    if ($showNames) $card['student_name'] = $e['student_name'];
    $add('classroom', 'cards', $card);
    $add('results', 'cards', $card);
  }

  /* شهادات الشكر والتفوق */
  $st = $pdo->query("SELECT c.title_ar, c.title_en, c.file_path, c.issued_on, u.full_name
                     FROM certificates c LEFT JOIN users u ON u.id = c.student_id
                     ORDER BY c.issued_on DESC LIMIT 60");
  foreach ($st->fetchAll() as $c) {
    $card = [
      'kind' => 'certificate',
      'title_ar' => $c['title_ar'],
      'title_en' => $c['title_en'],
      'file_url' => portfolio_file_url($c['file_path']),
      'date' => $c['issued_on']
    ];
    if ($showNames) $card['student_name'] = $c['full_name'];
    $add('classroom', 'cards', $card);
    $add('results', 'cards', $card);
  }

  /* سجل التواصل مع أولياء الأمور، مجمّعاً بنوع الرسالة */
  $labels = [
    'excellence' => 'تهنئة بالتميز', 'absence' => 'إشعار غياب', 'late' => 'إشعار تأخر',
    'low_level' => 'تنبيه مستوى', 'report' => 'تقرير عن الطالبة', 'custom' => 'رسالة خاصة',
    'student_praise' => 'تحفيز للطالبة', 'student_nudge' => 'تنبيه للطالبة'
  ];
  $st = $pdo->query("SELECT kind, COUNT(*) c, MAX(sent_at) last_at
                     FROM parent_messages GROUP BY kind ORDER BY c DESC");
  foreach ($st->fetchAll() as $m) {
    $add('parents', 'cards', [
      'kind' => 'contact_log',
      'title_ar' => isset($labels[$m['kind']]) ? $labels[$m['kind']] : $m['kind'],
      'count' => (int)$m['c'],
      'date' => dt_iso($m['last_at'])
    ]);
  }

  /* اسم المعلمة */
  $t = $pdo->query("SELECT full_name FROM users WHERE role = 'teacher' ORDER BY id LIMIT 1")->fetch();

  header('Content-Type: application/json; charset=utf-8');
  echo json_encode([
    'data' => [
      'generated_at' => date('c'),
      'teacher_name' => $t ? $t['full_name'] : null,
      'summary' => [
        'students' => $students, 'classes' => $classes, 'content_items' => $itemCount,
        'approved_submissions' => $approved, 'certificates' => $certs,
        'excellence' => $exc, 'parent_messages' => $msgs,
        'attendance_days' => $attDays, 'attendance_rate' => $attRate
      ],
      'standards' => array_values($stds)
    ],
    'error' => null
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

/* =====================================================================
   النسخ الاحتياطي والصيانة (للمعلمة وحدها)
   ===================================================================== */
function backup_tables() {
  return ['users', 'classes', 'sections', 'section_items', 'submissions',
          'attendance', 'participation', 'excellence_board', 'certificates',
          'schedule_slots', 'feedback', 'parent_links', 'settings',
          'parent_messages', 'section_views', 'item_views', 'grade_criteria', 'grade_entries'];
}

function sql_val($pdo, $v) {
  if ($v === null) return 'NULL';
  if (is_int($v) || is_float($v)) return (string)$v;
  return $pdo->quote((string)$v);
}

/* ملف .sql كامل يُستورد مباشرة في phpMyAdmin عند الحاجة */
function handle_backup($pdo) {
  if (!is_teacher($pdo)) out(null, 'not_allowed', 403);

  $name = 'backup-' . date('Y-m-d-His') . '.sql';
  header('Content-Type: application/sql; charset=utf-8');
  header('Content-Disposition: attachment; filename="' . $name . '"');
  header('Cache-Control: no-store');

  echo "-- نسخة احتياطية من منصة المعلمة\n";
  echo "-- التاريخ: " . date('Y-m-d H:i:s') . "\n";
  echo "-- الاستعادة: phpMyAdmin ← اختاري قاعدة البيانات ← Import ← ارفعي هذا الملف\n\n";
  echo "SET NAMES utf8mb4;\n";
  echo "SET FOREIGN_KEY_CHECKS = 0;\n\n";

  foreach (backup_tables() as $tbl) {
    try {
      $c = $pdo->query("SHOW CREATE TABLE `$tbl`")->fetch(PDO::FETCH_NUM);
      if (!$c) continue;
    } catch (Exception $e) { continue; }

    echo "DROP TABLE IF EXISTS `$tbl`;\n";
    echo $c[1] . ";\n";

    $st = $pdo->query("SELECT * FROM `$tbl`");
    $cols = null;
    $buf = [];
    while ($row = $st->fetch(PDO::FETCH_ASSOC)) {
      if ($cols === null) $cols = '`' . implode('`,`', array_keys($row)) . '`';
      $vals = [];
      foreach ($row as $v) $vals[] = sql_val($pdo, $v);
      $buf[] = '(' . implode(',', $vals) . ')';
      if (count($buf) >= 100) {
        echo "INSERT INTO `$tbl` ($cols) VALUES\n" . implode(",\n", $buf) . ";\n";
        $buf = [];
      }
    }
    if (count($buf)) echo "INSERT INTO `$tbl` ($cols) VALUES\n" . implode(",\n", $buf) . ";\n";
    echo "\n";
  }

  echo "SET FOREIGN_KEY_CHECKS = 1;\n";
  exit;
}

/* ملف مضغوط لمرفقات الطالبات، إن كان الامتداد متاحاً على الاستضافة */
function handle_backup_files($pdo) {
  if (!is_teacher($pdo)) out(null, 'not_allowed', 403);
  if (!class_exists('ZipArchive')) out(null, 'zip_unavailable', 400);
  $base = realpath(__DIR__ . '/uploads');
  if (!$base) out(null, 'no_files', 400);

  $tmp = sys_get_temp_dir() . '/lms-files-' . bin2hex(random_bytes(4)) . '.zip';
  $zip = new ZipArchive();
  if ($zip->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) out(null, 'zip_failed', 500);
  $count = 0;
  $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS));
  foreach ($it as $file) {
    if (!$file->isFile()) continue;
    $full = $file->getRealPath();
    if (strpos($full, $base) !== 0) continue;
    $zip->addFile($full, 'uploads/' . ltrim(substr($full, strlen($base)), '/\\'));
    $count++;
  }
  $zip->close();
  if ($count === 0) { @unlink($tmp); out(null, 'no_files', 400); }

  header('Content-Type: application/zip');
  header('Content-Disposition: attachment; filename="backup-files-' . date('Y-m-d-His') . '.zip"');
  header('Content-Length: ' . filesize($tmp));
  header('Cache-Control: no-store');
  readfile($tmp);
  @unlink($tmp);
  exit;
}

function rrmdir($dir) {
  if (!is_dir($dir)) return;
  foreach (scandir($dir) as $i) {
    if ($i === '.' || $i === '..') continue;
    $p = $dir . '/' . $i;
    if (is_dir($p)) rrmdir($p); else @unlink($p);
  }
  @rmdir($dir);
}

/* تصفير البيانات — لا يُنفَّذ إلا بتأكيد صريح، وحساب المعلمة لا يُمس.
   تختار المعلمة بالضبط ما تريد حذفه. */
function reset_parts() {
  return ['students', 'content', 'sections', 'classes', 'schedule', 'templates'];
}

function handle_reset($pdo) {
  require_fetch_header();
  if (!is_teacher($pdo)) out(null, 'not_allowed', 403);
  $b = body_json();
  if (!isset($b['confirm']) || $b['confirm'] !== 'RESET') out(null, 'confirm_required', 400);

  $parts = isset($b['parts']) && is_array($b['parts']) ? $b['parts'] : [];
  /* توافق مع الصيغة القديمة، مع رفض أي قيمة غير معروفة بدل افتراض حذف الطالبات */
  if (!count($parts) && isset($b['scope'])) {
    if ($b['scope'] === 'all') $parts = ['students', 'content', 'classes', 'schedule'];
    elseif ($b['scope'] === 'students') $parts = ['students'];
    else out(null, 'bad_scope', 400);
  }
  $allowed = reset_parts();
  $parts = array_values(array_intersect($parts, $allowed));
  if (!count($parts)) out(null, 'nothing_selected', 400);

  $has = function ($p) use ($parts) { return in_array($p, $parts, true); };
  $teacherId = uid();
  $done = [];

  $pdo->beginTransaction();
  try {
    if ($has('students')) {
      /* سجلات الطالبات ثم حساباتهن (حساب المعلمة يبقى) */
      $pdo->exec('DELETE FROM grade_entries');
      $pdo->exec('DELETE FROM item_views');
      $pdo->exec('DELETE FROM section_views');
      $pdo->exec('DELETE FROM parent_messages');
      $pdo->exec('DELETE FROM parent_links');
      $pdo->exec('DELETE FROM certificates');
      $pdo->exec('DELETE FROM excellence_board');
      $pdo->exec('DELETE FROM participation');
      $pdo->exec('DELETE FROM attendance');
      $pdo->exec('DELETE FROM submissions');
      $pdo->exec('DELETE FROM feedback');
      $st = $pdo->prepare('DELETE FROM users WHERE id <> ?');
      $st->execute([$teacherId]);
      $done[] = 'students';
    }

    if ($has('sections')) {
      /* حذف الأقسام يحذف محتواها تلقائياً (علاقة متتالية) */
      $pdo->exec('DELETE FROM submissions');
      $pdo->exec('DELETE FROM item_views');
      $pdo->exec('DELETE FROM section_views');
      $pdo->exec('DELETE FROM sections');
      $done[] = 'sections';
    } elseif ($has('content')) {
      /* المحتوى فقط مع إبقاء هيكل الأقسام */
      $pdo->exec('DELETE FROM submissions');
      $pdo->exec('DELETE FROM item_views');
      $pdo->exec('DELETE FROM section_views');
      $pdo->exec('DELETE FROM section_items');
      $done[] = 'content';
    }

    if ($has('classes')) {
      $pdo->exec('UPDATE users SET class_id = NULL');
      $pdo->exec('DELETE FROM classes');
      $done[] = 'classes';
    }
    if ($has('schedule')) {
      $pdo->exec('DELETE FROM schedule_slots');
      $done[] = 'schedule';
    }
    if ($has('templates')) {
      $pdo->exec('DELETE FROM settings');
      $done[] = 'templates';
    }
    $pdo->commit();
  } catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    out(null, 'reset_failed: ' . $e->getMessage(), 500);
  }

  /* المرفقات على القرص */
  if ($has('students')) rrmdir(__DIR__ . '/uploads/portfolios');
  if ($has('content') || $has('sections')) rrmdir(__DIR__ . '/uploads/materials');
  ensure_dirs();

  out(['parts' => $done, 'done' => true]);
}

/* أعداد السجلات — تُعرض قبل الحذف حتى تعرف المعلمة ما ستفقده */
function handle_db_stats($pdo) {
  if (!is_teacher($pdo)) out(null, 'not_allowed', 403);
  $rows = [];
  foreach (backup_tables() as $tbl) {
    try {
      $c = $pdo->query("SELECT COUNT(*) c FROM `$tbl`")->fetch();
      $rows[] = ['table' => $tbl, 'count' => (int)$c['c']];
    } catch (Exception $e) { /* جدول غير موجود */ }
  }
  out($rows);
}

/* =====================================================================
   بوابة ولي الأمر
   دخول بطريقتين: اختيار الطالبة + رقم جوالها المسجل (الأساسي)،
   أو عبر رمز مباشر من المعلمة (رابط ?parent=CODE).
   ===================================================================== */

/* قائمة الطالبات لاختيار ولي الأمر (الاسم والمعرّف فقط، المعتمدات) */
function handle_parent_students($pdo) {
  $st = $pdo->query("SELECT id, full_name FROM users
                     WHERE role = 'student' AND status = 'approved'
                     ORDER BY full_name ASC");
  $rows = [];
  foreach ($st->fetchAll() as $u) {
    $rows[] = ['id' => (int)$u['id'], 'full_name' => $u['full_name']];
  }
  out($rows);
}

function build_parent_report($pdo, $sid) {
  $sid = (int)$sid;
  $st = $pdo->prepare('SELECT full_name FROM users WHERE id = ?');
  $st->execute([$sid]);
  $stu = $st->fetch();

  $st = $pdo->prepare('SELECT status, COUNT(*) c FROM attendance WHERE student_id = ? GROUP BY status');
  $st->execute([$sid]);
  $att = [];
  foreach ($st->fetchAll() as $a) $att[$a['status']] = (int)$a['c'];

  $st = $pdo->prepare("SELECT title, grade, max_grade, teacher_feedback, evaluated_at
                       FROM submissions WHERE student_id = ? AND status = 'approved'
                       ORDER BY evaluated_at DESC");
  $st->execute([$sid]);
  $grades = [];
  foreach ($st->fetchAll() as $g) {
    $grades[] = [
      'title' => $g['title'],
      'grade' => $g['grade'] !== null ? (float)$g['grade'] : null,
      'max' => (float)$g['max_grade'],
      'feedback' => $g['teacher_feedback'],
      'date' => dt_iso($g['evaluated_at'])
    ];
  }

  $st = $pdo->prepare('SELECT title_ar, title_en, issued_on FROM certificates
                       WHERE student_id = ? ORDER BY issued_on DESC');
  $st->execute([$sid]);
  $certs = [];
  foreach ($st->fetchAll() as $c) {
    $certs[] = ['title_ar' => $c['title_ar'], 'title_en' => $c['title_en'], 'date' => $c['issued_on']];
  }

  $st = $pdo->prepare('SELECT COUNT(*) c FROM excellence_board WHERE student_id = ? AND is_active = 1');
  $st->execute([$sid]);
  $exc = (int)$st->fetch()['c'] > 0;

  return [
    'student' => ['full_name' => $stu ? $stu['full_name'] : ''],
    'attendance' => $att ?: new stdClass(),
    'grades' => $grades,
    'certificates' => $certs,
    'excellence' => $exc
  ];
}

function handle_parent_portal($pdo) {
  $sid = 0;

  /* الطريقة الأساسية: معرّف الطالبة + رقم جوالها المسجل (أو رقم أمها) */
  $qsid = isset($_GET['student_id']) ? (int)$_GET['student_id'] : 0;
  $phone = normalize_phone(isset($_GET['phone']) ? $_GET['phone'] : '');
  if ($qsid > 0 && $phone !== '') {
    $st = $pdo->prepare("SELECT id FROM users
                         WHERE id = ? AND role = 'student'
                           AND (phone = ? OR mother_phone = ?)");
    $st->execute([$qsid, $phone, $phone]);
    $row = $st->fetch();
    if (!$row) out(['error' => 'not_match']);
    $sid = (int)$row['id'];
  } else {
    /* الطريقة الثانية: رمز مباشر من المعلمة */
    $code = isset($_GET['code']) ? strtolower(trim($_GET['code'])) : '';
    if ($code === '') out(['error' => 'invalid_code']);
    $st = $pdo->prepare('SELECT student_id FROM parent_links WHERE access_code = ? AND is_active = 1');
    $st->execute([$code]);
    $link = $st->fetch();
    if (!$link) out(['error' => 'invalid_code']);
    $sid = (int)$link['student_id'];
  }

  out(build_parent_report($pdo, $sid));
}

/* =====================================================================
   الموجه
   ===================================================================== */
$action = isset($_GET['action']) ? $_GET['action'] : '';
try {
  switch ($action) {
    case 'login':         handle_login($pdo); break;
    case 'register':      handle_register($pdo); break;
    case 'me':            handle_me($pdo); break;
    case 'logout':        handle_logout(); break;
    case 'q':             handle_q($pdo); break;
    case 'upload':        handle_upload($pdo); break;
    case 'file':          handle_file($pdo); break;
    case 'parent_portal': handle_parent_portal($pdo); break;
    case 'parent_students': handle_parent_students($pdo); break;
    case 'unread':        handle_unread($pdo); break;
    case 'section_counts': handle_section_counts($pdo); break;
    case 'delete_student': handle_delete_student($pdo); break;
    case 'progress':      handle_progress($pdo); break;
    case 'points_all':    handle_points_all($pdo); break;
    case 'backup':        handle_backup($pdo); break;
    case 'backup_files':  handle_backup_files($pdo); break;
    case 'reset':         handle_reset($pdo); break;
    case 'db_stats':      handle_db_stats($pdo); break;
    case 'mark_seen':     handle_mark_seen($pdo); break;
    case 'portfolio':     handle_portfolio($pdo); break;
    default: out(null, 'unknown_action', 404);
  }
} catch (Exception $e) {
  out(null, 'server_error: ' . $e->getMessage(), 500);
}
