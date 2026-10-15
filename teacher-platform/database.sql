-- =====================================================================
-- database.sql — قاعدة بيانات منصة المعلمة (MySQL / MariaDB)
--
-- ملف واحد يجمع: إنشاء الجداول + كل التحديثات اللاحقة
--   (سجل العناصر المفتوحة، الجمهور حسب الفصل، ملف الإنجاز ومعاييره).
--
-- الاستيراد: من phpMyAdmin اختاري قاعدة البيانات ثم تبويب Import
-- وارفعي هذا الملف واضغطي Go. آمن لإعادة الاستيراد على قاعدة موجودة:
-- لا يكرر البيانات ولا يحذف محتوى، ويضيف الناقص فقط.
--
-- حساب المعلمة الجاهز: رقم الجوال 0500000000
-- كلمة المرور لا تُكتب هنا لأن المستودع عام؛ احتفظي بها عندك.
--
-- الطالبات: التسجيل والدخول بالاسم ورقم الجوال فقط، بدون كلمة مرور.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- المستخدمون: المعلمة والطالبات
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(190) NOT NULL,
  phone         VARCHAR(15)  NOT NULL UNIQUE,
  mother_phone  VARCHAR(20)  NULL,
  mother_name   VARCHAR(190) NULL,
  class_id      INT          NULL,
  password_hash VARCHAR(255) NULL,
  role          ENUM('teacher','student') NOT NULL DEFAULT 'student',
  status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- الأقسام
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sections (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  slug                VARCHAR(80)  NOT NULL UNIQUE,
  title_ar            VARCHAR(190) NOT NULL,
  title_en            VARCHAR(190) NOT NULL,
  kind                ENUM('static_page','content_list') NOT NULL DEFAULT 'content_list',
  allowed_types       VARCHAR(190) NOT NULL DEFAULT 'text,link,image,file',
  is_system           TINYINT(1) NOT NULL DEFAULT 0,
  visible_to_students TINYINT(1) NOT NULL DEFAULT 1,
  visible_to_parents  TINYINT(1) NOT NULL DEFAULT 0,
  sort_order          INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- عناصر الأقسام
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS section_items (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  section_id           INT NOT NULL,
  title_ar             VARCHAR(255) NOT NULL,
  title_en             VARCHAR(255) NULL,
  body_ar              MEDIUMTEXT NULL,
  body_en              MEDIUMTEXT NULL,
  item_type            VARCHAR(20) NOT NULL DEFAULT 'text',
  file_path            VARCHAR(255) NULL,
  external_url         VARCHAR(500) NULL,
  accepts_submissions  TINYINT(1) NOT NULL DEFAULT 0,
  due_at               DATETIME NULL,
  audience             ENUM('all','named') NOT NULL DEFAULT 'all',
  audience_student_ids TEXT NULL,
  is_published         TINYINT(1) NOT NULL DEFAULT 1,
  sort_order           INT NOT NULL DEFAULT 0,
  created_by           INT NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_section FOREIGN KEY (section_id)
    REFERENCES sections(id) ON DELETE CASCADE,
  INDEX idx_items_section (section_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- التسليمات (ملفات الإنجاز)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  student_id       INT NOT NULL,
  item_id          INT NULL,
  title            VARCHAR(255) NOT NULL,
  note             TEXT NULL,
  file_path        VARCHAR(255) NULL,
  external_url     VARCHAR(500) NULL,
  status           ENUM('pending','approved','rejected','needs_revision') NOT NULL DEFAULT 'pending',
  grade            DECIMAL(5,2) NULL,
  max_grade        DECIMAL(5,2) NOT NULL DEFAULT 10,
  teacher_feedback TEXT NULL,
  evaluated_at     DATETIME NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sub_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_item FOREIGN KEY (item_id)
    REFERENCES section_items(id) ON DELETE SET NULL,
  INDEX idx_sub_student (student_id, created_at),
  INDEX idx_sub_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- الحضور والمشاركة
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_date DATE NOT NULL,
  status     ENUM('present','absent','late','excused') NOT NULL,
  note       VARCHAR(255) NULL,
  UNIQUE KEY uq_att (student_id, class_date),
  CONSTRAINT fk_att_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS participation (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_date DATE NOT NULL,
  points     INT NOT NULL DEFAULT 1,
  note       VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_part_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_part_date (class_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- لوحة الأداء المتميز والشهادات
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS excellence_board (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  student_id           INT NOT NULL,
  student_name         VARCHAR(190) NOT NULL DEFAULT '',
  reason_ar            VARCHAR(255) NULL,
  reason_en            VARCHAR(255) NULL,
  source_submission_id INT NULL,
  is_active            TINYINT(1) NOT NULL DEFAULT 1,
  added_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exc_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificates (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  title_ar   VARCHAR(255) NOT NULL,
  title_en   VARCHAR(255) NULL,
  file_path  VARCHAR(255) NULL,
  issued_on  DATE NOT NULL,
  CONSTRAINT fk_cert_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- الجدول الأسبوعي والملاحظات وروابط الأهالي
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_slots (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  day_of_week   INT NOT NULL,
  period_no     INT NOT NULL,
  class_name_ar VARCHAR(190) NOT NULL,
  class_name_en VARCHAR(190) NULL,
  starts_at     TIME NULL,
  ends_at       TIME NULL,
  room          VARCHAR(100) NULL,
  UNIQUE KEY uq_slot (day_of_week, period_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  author_id     INT NOT NULL,
  body          TEXT NOT NULL,
  teacher_reply TEXT NULL,
  is_public     TINYINT(1) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fb_author FOREIGN KEY (author_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS parent_links (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  access_code VARCHAR(20) NOT NULL UNIQUE,
  parent_name VARCHAR(190) NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pl_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- إعدادات المنصة: قوالب رسائل الأمهات (تعدّلها المعلمة من لوحتها)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  skey   VARCHAR(60) NOT NULL UNIQUE,
  svalue TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- سجل التنبيهات المرسلة لأمهات الطالبات (لمنع التكرار ومعرفة آخر تواصل)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parent_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  kind       ENUM('excellence','absence','late','low_level','report','custom',
                  'student_praise','student_nudge') NOT NULL,
  note       VARCHAR(255) NULL,
  sent_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pm_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pm_student (student_id, sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- آخر مرة فتحت فيها الطالبة كل قسم (لتنبيهات الجديد)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS section_views (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  section_id   INT NOT NULL,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_view (student_id, section_id),
  CONSTRAINT fk_sv_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sv_section FOREIGN KEY (section_id)
    REFERENCES sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- الفصول الدراسية (تختارها الطالبة عند التسجيل)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(80) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- بنود سجل الدرجات (مطابقة لنموذج إدارة الإشراف التربوي)
-- كل بند له عدد خانات رصد تُجمع تلقائياً وتُسقَّف بالدرجة القصوى
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grade_criteria (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ckey        VARCHAR(40) NOT NULL UNIQUE,
  group_ar    VARCHAR(120) NOT NULL,
  group_en    VARCHAR(120) NULL,
  title_ar    VARCHAR(120) NOT NULL,
  title_en    VARCHAR(120) NULL,
  max_score   DECIMAL(5,2) NOT NULL DEFAULT 10,
  slots       INT NOT NULL DEFAULT 4,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- رصدات الدرجات: خانة واحدة لكل (طالبة + بند + رقم الخانة)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grade_entries (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   INT NOT NULL,
  criterion_id INT NOT NULL,
  slot_index   INT NOT NULL DEFAULT 0,
  score        DECIMAL(5,2) NULL,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_entry (student_id, criterion_id, slot_index),
  CONSTRAINT fk_ge_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ge_criterion FOREIGN KEY (criterion_id)
    REFERENCES grade_criteria(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- ترحيل القواعد المستوردة سابقاً: إضافة أعمدة الأم إن لم تكن موجودة
-- (آمن ومتكرر التنفيذ، يعمل على MySQL و MariaDB)
-- =====================================================================
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
             AND COLUMN_NAME = 'mother_phone');
SET @s := IF(@c = 0,
  'ALTER TABLE users ADD COLUMN mother_phone VARCHAR(20) NULL AFTER phone',
  'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- توسيع أنواع رسائل التنبيه (رسائل الطالبة نفسها)
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parent_messages'
             AND COLUMN_NAME = 'kind'
             AND COLUMN_TYPE LIKE '%student_praise%');
SET @s := IF(@c = 0,
  'ALTER TABLE parent_messages MODIFY COLUMN kind ENUM(''excellence'',''absence'',''late'',''low_level'',''report'',''custom'',''student_praise'',''student_nudge'') NOT NULL',
  'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
             AND COLUMN_NAME = 'class_id');
SET @s := IF(@c = 0,
  'ALTER TABLE users ADD COLUMN class_id INT NULL',
  'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
             AND COLUMN_NAME = 'mother_name');
SET @s := IF(@c = 0,
  'ALTER TABLE users ADD COLUMN mother_name VARCHAR(190) NULL AFTER mother_phone',
  'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- =====================================================================
-- حساب المعلمة الجاهز (رقم الجوال 0500000000)
-- =====================================================================
INSERT IGNORE INTO users (full_name, phone, password_hash, role, status) VALUES
('المعلمة مديرة المنصة', '0500000000',
 '$2y$10$SZl85OfiuEVqB6ECOtlVY.uooenWZK/3NxAf6jEvY9vN5fEw3Yd8O',
 'teacher', 'approved');

-- =====================================================================
-- قوالب رسائل الأمهات (تعدّلها المعلمة من لوحتها: تواصل الأمهات > الرسائل)
-- المتغيرات المتاحة: {student} {reason} {date} {absences} {percent}
--                    {attrate} {points} {approved} {teacher} {platform}
-- =====================================================================
INSERT IGNORE INTO settings (skey, svalue) VALUES
('tpl_excellence',
 'السلام عليكم ورحمة الله\nولية أمر الطالبة {student}\n\nيسرّنا إبلاغكم بأن ابنتكم {student} حصلت على مكان في لوحة الأداء المتميز.\nسبب التميز: {reason}\n\nنشكر لكم متابعتكم ودعمكم المستمر.\n{teacher}\n{platform}'),
('tpl_absence',
 'السلام عليكم ورحمة الله\nولية أمر الطالبة {student}\n\nنودّ تنبيهكم بشأن غياب ابنتكم {student} بتاريخ {date}.\nعدد أيام الغياب حتى الآن: {absences}\nنسبة الحضور: {attrate}%\n\nنأمل متابعة الأمر وإفادتنا بالعذر إن وُجد.\n{teacher}\n{platform}'),
('tpl_late',
 'السلام عليكم ورحمة الله\nولية أمر الطالبة {student}\n\nنودّ تنبيهكم بتأخر ابنتكم {student} عن الحصة بتاريخ {date}.\n\nنأمل الحرص على الحضور في الوقت المحدد لما فيه مصلحة الطالبة.\n{teacher}\n{platform}'),
('tpl_low_level',
 'السلام عليكم ورحمة الله\nولية أمر الطالبة {student}\n\nنودّ إحاطتكم بأن مستوى ابنتكم {student} يحتاج إلى دعم ومتابعة.\nمتوسط الدرجات: {percent}%\nنسبة الحضور: {attrate}%\nالأعمال المعتمدة: {approved}\n\nنرجو التعاون معنا في متابعتها، ولدينا خطة دعم مخصصة نبدأ بها بعد موافقتكم.\n{teacher}\n{platform}'),
('sheet_subject', 'علوم'),
('sheet_semester', '1'),
('sheet_year', '1447هـ'),
('tpl_student_praise',
 'السلام عليكم\nالطالبة {student}\n\nأحسنتِ! مشاركتك في الحصص متميزة، وقد بلغت نقاط مشاركتك {points} نقطة.\nنفخر بحضورك الفاعل ونتطلع لاستمرارك بهذا التميز.\n\n{teacher}\n{platform}'),
('tpl_student_nudge',
 'السلام عليكم\nالطالبة {student}\n\nلاحظتُ أن مشاركتك في الحصص قليلة حتى الآن ({points} نقطة).\nمشاركتك مهمة ولها درجات، وأنا واثقة من قدرتك. أنتظر رأيك وإجابتك في الحصة القادمة.\n\n{teacher}\n{platform}'),
('tpl_report',
 'السلام عليكم ورحمة الله\nولية أمر الطالبة {student}\n\nتقرير متابعة الطالبة:\nنسبة الحضور: {attrate}%\nأيام الغياب: {absences}\nنقاط المشاركة: {points}\nالأعمال المعتمدة: {approved}\nمتوسط الدرجات: {percent}%\n\nنشكر لكم حسن متابعتكم.\n{teacher}\n{platform}');

-- =====================================================================
-- الفصول: تضيفها المعلمة بنفسها من لوحتها (الطالبات ← الفصول)
-- لا تُزرع فصول افتراضية، لأن كل معلمة تدرّس فصولاً مختلفة.
-- ترحيل: تُحذف الفصول الافتراضية القديمة غير المرتبطة بأي طالبة.
-- =====================================================================
DELETE FROM classes
WHERE (name LIKE '%متوسط%' OR name LIKE 'ثاني ثانوي / %')
  AND id NOT IN (SELECT DISTINCT class_id FROM (SELECT class_id FROM users WHERE class_id IS NOT NULL) x);

-- =====================================================================
-- بنود سجل الدرجات (نموذج إدارة الإشراف التربوي — نظام المسارات)
--   المهام الأدائية (20) = واجبات (10) + مشروعات وبحوث وتقارير (10)
--   المشاركة والتفاعل (20) = نشاطات وتطبيقات صفية (10) + المشاركة (10)
--   الاختبارات القصيرة (20) = تطبيق عملي (5) + تحريري (15)
-- =====================================================================
INSERT IGNORE INTO grade_criteria (ckey, group_ar, group_en, title_ar, title_en, max_score, slots, sort_order) VALUES
('homework',      'المهام الأدائية (20)',     'Performance Tasks (20)', 'واجبات (10)',                  'Homework (10)',        10, 4, 1),
('projects',      'المهام الأدائية (20)',     'Performance Tasks (20)', 'مشروعات وبحوث وتقارير (10)',   'Projects (10)',        10, 3, 2),
('class_work',    'المشاركة والتفاعل (20)',   'Participation (20)',     'نشاطات وتطبيقات صفية (10)',    'Class Activities (10)', 10, 4, 3),
('participation', 'المشاركة والتفاعل (20)',   'Participation (20)',     'المشاركة (10)',                'Participation (10)',   10, 5, 4),
('practical',     'الاختبارات القصيرة (20)',  'Quizzes (20)',           'تطبيق عملي (5)',               'Practical (5)',         5, 2, 5),
('written',       'الاختبارات القصيرة (20)',  'Quizzes (20)',           'تحريري (15)',                  'Written (15)',         15, 3, 6);

-- =====================================================================
-- أقسام المنصة (قائمة المعلمة المعتمدة، بترتيبها)
-- =====================================================================
INSERT IGNORE INTO sections (slug, title_ar, title_en, kind, allowed_types, is_system, sort_order) VALUES
('classroom-rules',   'القواعد الصفية',                 'Classroom Rules',                      'static_page',  'text',                 1, 1),
('diagnostic-tests',  'الاختبار التشخيصي (قبلي وبعدي)', 'Diagnostic Test (Pre and Post)',       'static_page',  'text,file,link',       1, 2),
('quizzes',           'الاختبارات القصيرة',             'Quizzes',                              'content_list', 'text,file,link',       1, 3),
('performance-tasks', 'المهام الأدائية',                'Performance Tasks',                    'content_list', 'text,file,link',       1, 4),
('projects',          'المشاريع',                       'Projects',                             'content_list', 'text,file,link,image', 1, 5),
('activities',        'الأنشطة الصفية واللاصفية',       'Class and Extracurricular Activities', 'content_list', 'text,image,file,link', 1, 6),
('participation',     'مشاركة الطالبات',                'Student Participation',                'content_list', 'text',                 1, 7),
('attendance',        'غياب الطالبات',                  'Student Attendance',                   'content_list', 'text',                 1, 8),
('enrichment-plan',   'إثراء المتفوقات',                'Enrichment for High Achievers',        'content_list', 'text,file,link,video', 1, 9),
('feedback',          'التغذية الراجعة',                'Feedback',                             'content_list', 'text',                 1, 10),
('remedial-plan',     'خطة الضعيفات',                   'Support Plan',                         'content_list', 'text,file,link,video', 1, 11),
('honors',            'التكريم وشهادات التفوق',         'Honors and Certificates',              'content_list', 'image,file,name',      1, 12),
('worksheets',        'أوراق العمل',                    'Worksheets',                           'content_list', 'file',                 1, 13),
('presentations',     'عروض الدروس',                    'Lesson Presentations',                 'content_list', 'file,video,link',      1, 14),
('games',             'الألعاب التفاعلية',              'Interactive Games',                    'content_list', 'link',                 1, 15),
('parents',           'أولياء الأمور',                  'Parents',                              'content_list', 'text,link,file',       1, 16);

-- =====================================================================
-- سجل العناصر التي فتحتها الطالبة (عليه يقوم وسم "جديد" داخل الأقسام)
-- =====================================================================
CREATE TABLE IF NOT EXISTS item_views (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  item_id    INT NOT NULL,
  seen_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_item_view (student_id, item_id),
  CONSTRAINT fk_iv_student FOREIGN KEY (student_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_iv_item FOREIGN KEY (item_id)
    REFERENCES section_items(id) ON DELETE CASCADE,
  INDEX idx_iv_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- توجيه المحتوى لفصل بعينه: خيار "فصل محدد" للجمهور وعمود الفصول المستهدفة
-- =====================================================================
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'section_items'
             AND COLUMN_NAME = 'audience_class_ids');
SET @s := IF(@c = 0,
  'ALTER TABLE section_items ADD COLUMN audience_class_ids VARCHAR(255) NULL AFTER audience_student_ids',
  'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- إضافة القيمة الجديدة لخيارات الجمهور
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'section_items'
             AND COLUMN_NAME = 'audience'
             AND COLUMN_TYPE LIKE '%class%');
SET @s := IF(@c = 0,
  'ALTER TABLE section_items MODIFY COLUMN audience ENUM(''all'',''named'',''class'') NOT NULL DEFAULT ''all''',
  'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- =====================================================================
-- ربط ملف الإنجاز: وسم المحتوى بمعايير الأداء الوظيفي وجدول المعايير الثمانية،
-- ثم وسم المحتوى الموجود مسبقاً بمعياره الافتراضي حسب قسمه (ما لم يُوسم يدوياً)
-- =====================================================================
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'section_items'
             AND COLUMN_NAME = 'in_portfolio');
SET @s := IF(@c = 0,
  'ALTER TABLE section_items ADD COLUMN in_portfolio TINYINT(1) NOT NULL DEFAULT 0',
  'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- عمود: المعايير التي يُدرج تحتها ("planning,environment")
SET @c := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'section_items'
             AND COLUMN_NAME = 'standards');
SET @s := IF(@c = 0,
  'ALTER TABLE section_items ADD COLUMN standards VARCHAR(255) NULL',
  'DO 0');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- جدول معايير الأداء الوظيفي
CREATE TABLE IF NOT EXISTS portfolio_standards (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  skey       VARCHAR(40) NOT NULL UNIQUE,
  title_ar   VARCHAR(190) NOT NULL,
  title_en   VARCHAR(190) NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO portfolio_standards (skey, title_ar, title_en, sort_order) VALUES
('classroom',   'الإدارة الصفية',                              'Classroom Management',  1),
('planning',    'إعداد وتنفيذ خطة التعلم',                     'Planning and Delivery', 2),
('results',     'تحسين نتائج المتعلمين',                       'Improving Outcomes',    3),
('parents',     'التفاعل مع أولياء الأمور',                    'Parent Engagement',     4),
('tech',        'توظيف تقنيات ووسائل التعلم المناسبة',          'Learning Technologies', 5),
('environment', 'تهيئة البيئة التعليمية',                      'Learning Environment',  6),
('assessment',  'تنويع أساليب التقويم',                        'Varied Assessment',     7),
('analysis',    'تحليل نتائج المتعلمين وتشخيص مستوياتهم',       'Analysis and Diagnosis', 8);

-- وسم المحتوى الموجود مسبقاً بمعياره الافتراضي حسب قسمه،
-- حتى لا تعيد المعلمة تحرير كل عنصر بيدها.
-- يُطبّق على ما لم يُوسم بعد فقط، فلا يلغي أي اختيار يدوي.
UPDATE section_items i
  JOIN sections s ON s.id = i.section_id
  SET i.standards = CASE s.slug
        WHEN 'classroom-rules'   THEN 'classroom'
        WHEN 'attendance'        THEN 'classroom'
        WHEN 'honors'            THEN 'classroom,results'
        WHEN 'worksheets'        THEN 'planning,environment'
        WHEN 'activities'        THEN 'planning,environment'
        WHEN 'remedial-plan'     THEN 'planning,results'
        WHEN 'enrichment-plan'   THEN 'planning,results'
        WHEN 'projects'          THEN 'environment'
        WHEN 'performance-tasks' THEN 'environment'
        WHEN 'presentations'     THEN 'tech'
        WHEN 'games'             THEN 'tech'
        WHEN 'diagnostic-tests'  THEN 'assessment,analysis'
        WHEN 'quizzes'           THEN 'assessment'
        WHEN 'feedback'          THEN 'results'
        WHEN 'parents'           THEN 'parents'
        ELSE NULL END,
      i.in_portfolio = CASE WHEN s.slug IN
        ('classroom-rules','attendance','honors','worksheets','activities',
         'remedial-plan','enrichment-plan','projects','performance-tasks',
         'presentations','games','diagnostic-tests','quizzes','feedback','parents')
        THEN 1 ELSE 0 END
  WHERE i.standards IS NULL AND i.in_portfolio = 0;
