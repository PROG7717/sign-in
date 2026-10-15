'use strict';
/* =====================================================================
   منصة المعلمة — script.js
   Vanilla JavaScript كامل: بدون أي مكتبات خارجية.
   عميل Supabase مكتوب يدوياً فوق fetch (Auth + PostgREST + Storage + RPC).
   ===================================================================== */

/* =====================================================================
   1) CONFIG — عدلي هذه القيم قبل النشر
   ===================================================================== */
var CONFIG = {
  /* عنوان الخلفية: api.php في نفس مجلد الموقع، لا يحتاج تعديلاً */
  API_URL: 'api.php',
  /* اختصار اختياري فقط: يُظهر خانة كلمة المرور فور كتابة رقم المعلمة.
     لو غيّرتِ رقم المعلمة في قاعدة البيانات فلا حاجة لتعديله هنا،
     لأن السيرفر يطلب كلمة المرور تلقائياً لأي حساب معلمة. */
  TEACHER_PHONE: '0500000000',
  PLATFORM_NAME_AR: 'منصة المعلمة',
  PLATFORM_NAME_EN: 'Teacher Platform',
  TEACHER_NAME_AR: 'أ. المعلمة',
  TEACHER_NAME_EN: 'The Teacher',
  EXCELLENCE_THRESHOLD: 0.9,
  MAX_FILE_MB: 10,
  ALLOWED_EXT: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'docx', 'pptx'],
  PERIODS: 7,
  SCHOOL_DAYS: [0, 1, 2, 3, 4]
};

/* =====================================================================
   2) الترجمة (i18n)
   ===================================================================== */
var I18N = {
  ar: {
    login: 'تسجيل الدخول', register: 'تسجيل طالبة جديدة', phone: 'رقم الجوال',
    phoneHint: 'مثال: 0512345678', password: 'كلمة المرور', confirmPassword: 'تأكيد كلمة المرور',
    fullName: 'الاسم الثلاثي', nameHint: 'ثلاث كلمات على الأقل',
    registerNote: 'سيتم تفعيل حسابك بعد اعتماد المعلمة', createAccount: 'إنشاء الحساب',
    logout: 'خروج', welcome: 'مرحباً', heroLine: 'مساحة تعليمية منظمة للتعلم والمتابعة والتقييم',
    parentPortal: 'بوابة ولي الأمر', backToLogin: 'العودة لتسجيل الدخول',
    pendingTitle: 'حسابك قيد المراجعة',
    pendingBody: 'تم استلام طلب التسجيل، وسيتم تفعيل حسابك بعد اعتماد المعلمة.',
    rejectedTitle: 'لم يتم اعتماد الحساب', rejectedBody: 'تواصلي مع المعلمة لمزيد من التفاصيل.',
    home: 'الرئيسية', portfolio: 'ملف الإنجاز', schedule: 'الجدول الأسبوعي',
    excellence: 'لوحة الأداء المتميز', sections: 'الأقسام', overview: 'نظرة عامة',
    manage: 'الإدارة', content: 'المحتوى', approvals: 'طلبات التسجيل',
    submissions: 'التسليمات', attendance: 'الحضور', participation: 'المشاركة',
    students: 'الطالبات', feedbackNav: 'الملاحظات', newSection: 'قسم جديد',
    approvalsSub: 'اعتمدي حسابات الطالبات الجديدة أو ارفضيها',
    submissionsSub: 'راجعي أعمال الطالبات وقيميها',
    scheduleSub: 'انقري أي خانة لإضافة حصة أو تعديلها',
    feedbackSub: 'رسائل الطالبات وملاحظاتهن',
    approve: 'اعتماد', reject: 'رفض', review: 'مراجعة', save: 'حفظ', cancel: 'إلغاء',
    close: 'إغلاق', del: 'حذف', add: 'إضافة', edit: 'تعديل', search: 'بحث',
    status: 'الحالة', actions: 'إجراءات', date: 'التاريخ', name: 'الاسم',
    points: 'النقاط', note: 'ملاحظة', grade: 'الدرجة', maxGrade: 'الدرجة الكاملة',
    teacherFeedback: 'ملاحظة المعلمة', teacherReply: 'رد المعلمة',
    st_pending: 'قيد المراجعة', st_approved: 'معتمد', st_rejected: 'مرفوض',
    st_needs_revision: 'يحتاج تعديلاً',
    at_present: 'حاضرة', at_absent: 'غائبة', at_late: 'متأخرة', at_excused: 'مستأذنة',
    markAll: 'تحديد الكل حاضرات', attSaved: 'تم حفظ الحضور',
    todayClasses: 'حصص اليوم', todaySchedule: 'جدول اليوم',
    pendingRegs: 'طلبات معلقة', pendingSubs: 'تسليمات معلقة', attToday: 'حضور اليوم',
    recorded: 'رُصد', notRecorded: 'لم يُرصد', recentSubs: 'أحدث التسليمات',
    viewAll: 'عرض الكل', noData: 'لا توجد بيانات بعد',
    upload: 'رفع الحل', resubmit: 'إعادة التسليم', uploadFree: 'رفع عمل جديد',
    freeUpload: 'عمل حر', title_: 'العنوان',
    chooseFile: 'اختاري ملفاً أو اسحبيه هنا', maxSize: 'الحد الأقصى',
    orLink: 'أو رابط خارجي', fileTooBig: 'حجم الملف يتجاوز الحد المسموح',
    badType: 'نوع الملف غير مسموح', needFileOrLink: 'أرفقي ملفاً أو رابطاً',
    dueBefore: 'التسليم قبل', open: 'فتح', video: 'مشاهدة', file: 'الملف',
    viewFile: 'عرض الملف', currentFile: 'يوجد ملف مرفوع مسبقاً، اختيار ملف جديد سيستبدله',
    attachment: 'المرفق',
    addToExc: 'إضافة إلى لوحة التميز', excReason: 'سبب التكريم',
    removeExc: 'إزالة من اللوحة', onBoard: 'على لوحة التميز',
    certificates: 'الشهادات', issueCert: 'إصدار شهادة',
    parentCode: 'رمز ولي الأمر', parentCodeHint: 'الرمز تحصلون عليه من المعلمة',
    noCode: 'لا يوجد رمز فعال', genCode: 'إنشاء رمز', regenCode: 'رمز جديد',
    copy: 'نسخ', copied: 'تم النسخ', deactivate: 'تعطيل',
    titleAr: 'العنوان بالعربية', titleEn: 'العنوان بالإنجليزية',
    nameAr: 'الاسم بالعربية', nameEn: 'الاسم بالإنجليزية', slugLabel: 'المعرف (slug)',
    allowedTypes: 'أنواع المحتوى المسموحة',
    tp_text: 'نص', tp_link: 'رابط', tp_image: 'صورة', tp_file: 'ملف',
    tp_video: 'فيديو', tp_name: 'أسماء',
    visStudents: 'ظاهر للطالبات', visParents: 'ظاهر للأهالي', order_: 'الترتيب',
    next: 'التالي', back: 'رجوع', create: 'إنشاء', preview: 'معاينة',
    addItem: 'إضافة عنصر', editItem: 'تعديل العنصر', editSection: 'تعديل القسم',
    itemType: 'نوع العنصر', bodyAr: 'المحتوى بالعربية', bodyEn: 'المحتوى بالإنجليزية',
    extUrl: 'رابط خارجي', acceptsSub: 'يقبل تسليمات الطالبات', dueDate: 'موعد التسليم',
    audience: 'الجمهور', audAll: 'جميع الطالبات', audNamed: 'طالبات محددات',
    audClass: 'فصل محدد', audClassHint: 'المحتوى يظهر لطالبات هذا الفصل فقط',
    inPortfolio: 'يظهر في ملف الإنجاز',
    standardsHint: 'اختاري المعيار الذي يُدرج تحته هذا الشاهد',
    pickStandard: 'اختاري معياراً واحداً على الأقل لملف الإنجاز',
    portfolioChip: 'ملف الإنجاز',
    noClassesYet: 'لا توجد فصول بعد، أضيفيها من إدارة الفصول',
    pickClass: 'اختاري فصلاً واحداً على الأقل',
    published: 'منشور', hiddenL: 'مخفي', publish: 'نشر', unpublish: 'إخفاء',
    day: 'اليوم', period: 'الحصة', className: 'اسم الحصة', fromT: 'من', toT: 'إلى',
    room: 'القاعة', freePeriod: 'فراغ', editSlot: 'تعديل الحصة',
    enterCode: 'أدخل رمز الدخول', showBtn: 'عرض التقرير', invalidCode: 'رمز غير صحيح',
    selectStudent: 'اختاري الطالبة', searchStudent: 'ابحثي بالاسم',
    chosenStudent: 'الطالبة المختارة', enterStudentPhone: 'أدخلي رقم جوال الطالبة المسجل',
    parentPhoneHint: 'نفس الرقم الذي سجّلت به الطالبة حسابها',
    chooseAnother: 'اختيار طالبة أخرى', phoneNotMatch: 'الرقم غير مطابق للطالبة المختارة',
    noStudentsYet: 'لا توجد حسابات طالبات بعد', noResults: 'لا نتائج',
    noSectionsYet: 'لم تُضف الأقسام بعد. إن كنتِ المعلمة فتأكدي من استيراد ملف database.sql في قاعدة البيانات.',
    attSummary: 'ملخص الحضور', grades: 'الدرجات المعتمدة',
    attRate: 'نسبة الحضور', totalPoints: 'نقاط المشاركة',
    approvedWork: 'تسليمات معتمدة', openTasks: 'مهام مفتوحة',
    confirmTitle: 'تأكيد', confirmDel: 'هل أنت متأكدة من الحذف؟', yes: 'نعم',
    saved: 'تم الحفظ', sent: 'تم الإرسال', err: 'حدث خطأ، حاولي مرة أخرى',
    loading: 'جارٍ التحميل', phoneInvalid: 'رقم الجوال غير صحيح',
    credit: 'تم برمجة هذا الموقع بواسطة محمد العيسى',
    darkMode: 'الوضع الليلي', lightMode: 'الوضع النهاري',
    installTitle: 'ثبّتي منصة المعلمة على جوالك',
    installIos: 'اضغطي زر المشاركة في سفاري ثم اختاري «إضافة إلى الشاشة الرئيسية»',
    installAndroid: 'أضيفي المنصة إلى شاشتك الرئيسية لتفتحيها مباشرة مثل التطبيق',
    installNow: 'تثبيت',
    motherPhone: 'رقم جوال الأم', motherPhoneHint: 'للتواصل مع الأم. إن لم يكن لديك جوال فاكتبي رقم أمك في الحقلين',
    motherNameOpt: 'اسم الأم (اختياري)', motherName: 'اسم الأم',
    motherPhoneInvalid: 'رقم جوال الأم غير صحيح',
    mothersNav: 'تواصل الأمهات',
    mothersSub: 'قائمة يومية بالحالات التي تحتاج تواصلاً، مع رسائل جاهزة عبر واتساب',
    followUp: 'المتابعة', allMothers: 'كل الأمهات', msgTemplates: 'الرسائل',
    tplHint: 'يمكنك تعديل نص أي رسالة. المتغيرات تُستبدل تلقائياً عند الإرسال.',
    editMother: 'تعديل بيانات الأم', sendToMother: 'إرسال إلى الأم',
    deleteAccount: 'حذف الحساب',
    deleteAccountConfirm: 'حذف حساب «{name}» نهائياً مع كل تسليماتها ودرجاتها وحضورها؟ لا يمكن التراجع.',
    accountDeleted: 'تم حذف الحساب',
    editStudent: 'تعديل بيانات الطالبة', studentName: 'اسم الطالبة الثلاثي',
    sheetTeacher: 'اسم المعلم:', sheetSubject: 'المادة:',
    sheetSemester: 'الفصل الدراسي:', sheetYear: 'العام الدراسي:',
    sem1: 'الأول', sem2: 'الثاني', sem3: 'الثالث',
    partSummary: 'ملخص المشاركة',
    partSummaryHint: 'مجموع نقاط كل طالبة، مع رسالة تحفيز أو تنبيه تُرسل للطالبة نفسها',
    partHigh: 'مشاركة متميزة', partOk: 'مشاركة جيدة',
    partLow: 'مشاركة ضعيفة', partNone: 'لا مشاركة',
    sendPraise: 'رسالة تحفيز', sendNudge: 'رسالة تنبيه',
    sendToStudent: 'إرسال إلى الطالبة',
    tpl_student_praise: 'رسالة تحفيز الطالبة', tpl_student_nudge: 'رسالة تنبيه الطالبة',
    deleted: 'تم الحذف',
    backupNav: 'النسخ الاحتياطي',
    backupSub: 'احفظي نسخة من بيانات المنصة على جهازك، أو ابدئي فصلاً جديداً',
    saveBackup: 'حفظ نسخة احتياطية',
    backupHint: 'ينزّل ملفاً واحداً يحتوي كل بيانات المنصة. احفظيه في الفلاش أو جهازك، ويمكن استعادته من phpMyAdmin عند الحاجة.',
    downloadData: 'تنزيل البيانات', downloadFiles: 'تنزيل المرفقات',
    backupStarted: 'جارٍ التنزيل', currentData: 'البيانات الحالية',
    zipUnavailable: 'الاستضافة لا تدعم ضغط الملفات، حمّلي مجلد uploads من مدير الملفات',
    noFiles: 'لا توجد مرفقات',
    resetTitle: 'حذف البيانات',
    resetWarn: 'تحذير: هذا الإجراء لا يمكن التراجع عنه. احفظي نسخة احتياطية أولاً.',
    resetScope: 'اختاري ما تريدين حذفه',
    partStudents: 'حسابات الطالبات وسجلاتهن',
    partStudentsD: 'التسليمات والحضور والمشاركة والدرجات والشهادات',
    partContent: 'محتوى الأقسام',
    partContentD: 'الدروس والمهام والملفات المرفوعة، مع بقاء الأقسام نفسها',
    partSections: 'الأقسام نفسها',
    partSectionsD: 'تحذف الأقسام ومحتواها معاً — ستحتاجين استيراد database.sql لإعادتها',
    partClasses: 'الفصول', partClassesD: 'قائمة فصولك التي تختار منها الطالبات',
    partSchedule: 'الجدول الأسبوعي', partScheduleD: 'حصص الجدول المسجلة',
    partTemplates: 'قوالب الرسائل والإعدادات',
    partTemplatesD: 'نصوص رسائل الواتساب وبيانات ترويسة ورقة الرصد',
    selectAll: 'تحديد الكل', nothingSelected: 'اختاري عنصراً واحداً على الأقل',
    typeToConfirm: 'اكتبي كلمة «حذف» للتأكيد',
    resetNow: 'حذف البيانات نهائياً',
    resetConfirm: 'سيتم حذف: {scope}. لا يمكن التراجع. هل أنتِ متأكدة؟',
    resetDone: 'تم حذف البيانات',
    itemsInside: 'عدد العناصر داخل القسم', newItems: 'جديد لم تفتحيه بعد',
    isNew: 'جديد',
    myClasses: 'فصولي', classesHint: 'أضيفي الفصول التي تدرسينها، وستظهر للطالبات عند التسجيل',
    classNamePh: 'مثال: ثاني ثانوي / 1', noClassesYet: 'لم تُضف فصول بعد',
    classExists: 'هذا الفصل مضاف مسبقاً', renameClass: 'اسم الفصل الجديد',
    classInUse: 'لا يمكن حذف الفصل، فيه {n} طالبة. انقليهن أولاً',
    noClassesForSignup: 'لم تُضف الفصول بعد، راجعي المعلمة',
    rename: 'إعادة تسمية',
    classLabel: 'الفصل', classHint: 'اختاري فصلك من القائمة',
    chooseClass: 'اختاري الفصل', allClasses: 'كل الفصول', classRequired: 'اختاري الفصل أولاً',
    gradebook: 'سجل الدرجات',
    gradebookSub: 'ترصد الدرجات وتُحفظ تلقائياً، وتفتح كما تركتِها في الحصة القادمة',
    exportPdf: 'حفظ PDF', studentNameCol: 'اسم الطالبة ثلاثياً', grandTotal: 'المجموع',
    sum: 'م', savedAt: 'آخر حفظ:', scrollHint: 'مرّري الجدول جانبياً لعرض بقية البنود', badScore: 'أدخلي رقماً صحيحاً (يمكن الكسر مثل 0.5)',
    noStudentsInClass: 'لا توجد طالبات في هذا الفصل',
    teacherLabel: 'المعلمة', popupBlocked: 'اسمحي بالنوافذ المنبثقة لحفظ الملف', noData: 'لا توجد بيانات',
    myProgress: 'تقدّمي', myPoints: 'نقاطي', studentProgress: 'تقدّم الطالبة',
    excCard: 'بطاقة تميز', excCardTitle: 'شهادة تميّز',
    excCardReason: 'سبب التميّز',
    excCardCaption: 'الطالبة {student} على لوحة الأداء المتميز',
    cardAttachHint: '(أرفقي الصورة المحفوظة في جهازك)',
    cardSaved: 'حُفظت البطاقة في جهازك', shareCard: 'مشاركة', downloadCard: 'تنزيل الصورة',
    bonusEarned: 'وسام بونص', bonusCount: 'أوسمة البونص', bonusReady: 'حصلتِ على وسام جديد',
    toNextBonus: 'باقي {n} نقاط للوسام القادم', noTasksYet: 'لا توجد مهام بعد',
    points: 'النقاط',
    studentPhone: 'رقم جوال الطالبة',
    studentPhoneHint: 'تدخل به الطالبة، فتأكدي منه قبل الحفظ',
    nameHint: 'ثلاث كلمات على الأقل',
    phoneTaken: 'الرقم مستخدم في حساب آخر',
    recipient: 'المستلمة', msgText: 'نص الرسالة',
    waHint: 'يمكنك تعديل النص قبل الإرسال. سيفتح واتساب بالرسالة جاهزة.',
    copyMsg: 'نسخ النص', openWhatsapp: 'فتح واتساب', notifyMother: 'تبليغ الأم',
    noMotherPhone: 'لا يوجد رقم للأم', addMotherPhone: 'إضافة رقم الأم',
    lastContact: 'آخر تواصل', neverContacted: 'لم يتم التواصل',
    caseExcellence: 'تميز', caseAbsence: 'غياب', caseLate: 'تأخر',
    caseLowLevel: 'مستوى متدني', sendReport: 'إرسال التقرير',
    tpl_excellence: 'رسالة التميز', tpl_absence: 'رسالة الغياب',
    tpl_late: 'رسالة التأخر', tpl_low_level: 'رسالة تدني المستوى',
    tpl_report: 'رسالة التقرير',
    allGood: 'لا توجد حالات تحتاج تواصلاً اليوم',
    absenceDays: 'أيام الغياب', avgGrade: 'متوسط الدرجات',
    msgLogged: 'تم تسجيل التواصل', copied: 'تم النسخ',
    notifyAllTitle: 'الحالات المحتاجة تواصل',
    connError: 'تعذّر الاتصال مؤقتاً بالخدمة. حاولنا تلقائياً ولم ينجح، جرّبي إعادة المحاولة.',
    retryNow: 'أعد المحاولة',
    retrying: 'جاري إعادة المحاولة…',
    dbNeedsUpdate: 'قاعدة البيانات تحتاج تحديثاً: استوردي ملف database.sql في phpMyAdmin.',
    nameInvalid: 'أدخلي الاسم الثلاثي كاملاً',
    passShort: 'كلمة المرور قصيرة (6 أحرف على الأقل)',
    passMismatch: 'كلمتا المرور غير متطابقتين', accountCreated: 'تم إنشاء الحساب',
    wrongLogin: 'بيانات الدخول غير صحيحة', enterPassword: 'أدخلي كلمة المرور', alreadyReg: 'الرقم مسجل مسبقاً',
    tasks: 'المهام المطلوبة', myWork: 'تسليماتي', myCerts: 'شهاداتي',
    myFeedback: 'ملاحظاتي', writeFeedback: 'اكتبي ملاحظتك أو استفسارك للمعلمة',
    send: 'إرسال', reply: 'الرد', saveReply: 'حفظ الرد',
    makePublic: 'نشر للجميع', makePrivate: 'إخفاء',
    publicBadge: 'عام', privateBadge: 'خاص',
    student: 'الطالبة', task: 'المهمة', submittedAt: 'سُلمت في',
    notSubmitted: 'لم تسلَّم بعد', evaluate: 'تقييم', returnRevision: 'إعادة للتعديل',
    sysSection: 'نظامي', customSection: 'مخصص',
    viewPortfolio: 'عرض الملف', backList: 'عودة', addPoints: 'تسجيل مشاركة', all: 'الكل',
    loginHint: 'الطالبة تدخل برقم الجوال فقط',
    copyLink: 'نسخ رابط ولي الأمر',
    cfgMissing: 'أكمل إعدادات CONFIG أعلى ملف script.js أولاً',
    loginFirst: 'سجلي الدخول أولاً',
    browseGuest: 'تصفح المنصة بدون تسجيل',
    welcomeGuest: 'مرحباً بكم في المنصة',
    loginToView: 'سجلي الدخول لعرض بياناتك',
    parentsHint: 'يمكن لولي الأمر متابعة تقرير الطالبة (الحضور والدرجات والشهادات) عبر رمز خاص يحصل عليه من المعلمة'
  },
  en: {
    login: 'Sign in', register: 'New student registration', phone: 'Phone number',
    phoneHint: 'Example: 0512345678', password: 'Password', confirmPassword: 'Confirm password',
    fullName: 'Full name (three parts)', nameHint: 'At least three words',
    registerNote: 'Your account will be activated after teacher approval', createAccount: 'Create account',
    logout: 'Sign out', welcome: 'Welcome', heroLine: 'An organized space for learning, follow-up and assessment',
    parentPortal: 'Parents portal', backToLogin: 'Back to sign in',
    pendingTitle: 'Your account is under review',
    pendingBody: 'Your registration was received. It will be activated once the teacher approves it.',
    rejectedTitle: 'Account not approved', rejectedBody: 'Please contact the teacher for details.',
    home: 'Home', portfolio: 'Portfolio', schedule: 'Weekly schedule',
    excellence: 'Excellence board', sections: 'Sections', overview: 'Overview',
    manage: 'Management', content: 'Content', approvals: 'Registrations',
    submissions: 'Submissions', attendance: 'Attendance', participation: 'Participation',
    students: 'Students', feedbackNav: 'Feedback', newSection: 'New section',
    approvalsSub: 'Approve or reject new student accounts',
    submissionsSub: 'Review and evaluate student work',
    scheduleSub: 'Click any cell to add or edit a period',
    feedbackSub: 'Student messages and notes',
    approve: 'Approve', reject: 'Reject', review: 'Review', save: 'Save', cancel: 'Cancel',
    close: 'Close', del: 'Delete', add: 'Add', edit: 'Edit', search: 'Search',
    status: 'Status', actions: 'Actions', date: 'Date', name: 'Name',
    points: 'Points', note: 'Note', grade: 'Grade', maxGrade: 'Out of',
    teacherFeedback: 'Teacher feedback', teacherReply: 'Teacher reply',
    st_pending: 'Pending', st_approved: 'Approved', st_rejected: 'Rejected',
    st_needs_revision: 'Needs revision',
    at_present: 'Present', at_absent: 'Absent', at_late: 'Late', at_excused: 'Excused',
    markAll: 'Mark all present', attSaved: 'Attendance saved',
    todayClasses: 'Today classes', todaySchedule: 'Today schedule',
    pendingRegs: 'Pending registrations', pendingSubs: 'Pending submissions', attToday: 'Attendance today',
    recorded: 'Recorded', notRecorded: 'Not recorded', recentSubs: 'Recent submissions',
    viewAll: 'View all', noData: 'No data yet',
    upload: 'Submit work', resubmit: 'Resubmit', uploadFree: 'Upload new work',
    freeUpload: 'Free upload', title_: 'Title',
    chooseFile: 'Choose a file or drag it here', maxSize: 'Max size',
    orLink: 'Or external link', fileTooBig: 'File exceeds the size limit',
    badType: 'File type not allowed', needFileOrLink: 'Attach a file or a link',
    dueBefore: 'Due before', open: 'Open', video: 'Watch', file: 'File',
    viewFile: 'View file', currentFile: 'A file is already attached, choosing a new one will replace it',
    attachment: 'Attachment',
    addToExc: 'Add to excellence board', excReason: 'Reason',
    removeExc: 'Remove from board', onBoard: 'On the excellence board',
    certificates: 'Certificates', issueCert: 'Issue certificate',
    parentCode: 'Parent access code', parentCodeHint: 'You can get the code from the teacher',
    noCode: 'No active code', genCode: 'Generate code', regenCode: 'New code',
    copy: 'Copy', copied: 'Copied', deactivate: 'Deactivate',
    titleAr: 'Title in Arabic', titleEn: 'Title in English',
    nameAr: 'Name in Arabic', nameEn: 'Name in English', slugLabel: 'Slug',
    allowedTypes: 'Allowed content types',
    tp_text: 'Text', tp_link: 'Link', tp_image: 'Image', tp_file: 'File',
    tp_video: 'Video', tp_name: 'Names',
    visStudents: 'Visible to students', visParents: 'Visible to parents', order_: 'Order',
    next: 'Next', back: 'Back', create: 'Create', preview: 'Preview',
    addItem: 'Add item', editItem: 'Edit item', editSection: 'Edit section',
    itemType: 'Item type', bodyAr: 'Body in Arabic', bodyEn: 'Body in English',
    extUrl: 'External link', acceptsSub: 'Accepts student submissions', dueDate: 'Due date',
    audience: 'Audience', audAll: 'All students', audNamed: 'Selected students',
    audClass: 'A specific class', audClassHint: 'Only students in this class will see it',
    inPortfolio: 'Include in the teaching portfolio',
    standardsHint: 'Pick the standard this evidence belongs under',
    pickStandard: 'Pick at least one standard for the portfolio',
    portfolioChip: 'Portfolio',
    noClassesYet: 'No classes yet — add them from class management',
    pickClass: 'Pick at least one class',
    published: 'Published', hiddenL: 'Hidden', publish: 'Publish', unpublish: 'Hide',
    day: 'Day', period: 'Period', className: 'Class name', fromT: 'From', toT: 'To',
    room: 'Room', freePeriod: 'Free', editSlot: 'Edit period',
    enterCode: 'Enter the access code', showBtn: 'View report', invalidCode: 'Invalid code',
    selectStudent: 'Select the student', searchStudent: 'Search by name',
    chosenStudent: 'Selected student', enterStudentPhone: "Enter the student's registered phone",
    parentPhoneHint: 'The same number the student registered with',
    chooseAnother: 'Choose another student', phoneNotMatch: 'The phone does not match the selected student',
    noStudentsYet: 'No student accounts yet', noResults: 'No results',
    noSectionsYet: 'No sections yet. If you are the teacher, make sure database.sql was imported into the database.',
    attSummary: 'Attendance summary', grades: 'Approved grades',
    attRate: 'Attendance rate', totalPoints: 'Participation points',
    approvedWork: 'Approved work', openTasks: 'Open tasks',
    confirmTitle: 'Confirm', confirmDel: 'Are you sure you want to delete?', yes: 'Yes',
    saved: 'Saved', sent: 'Sent', err: 'Something went wrong, please try again',
    loading: 'Loading', phoneInvalid: 'Invalid phone number',
    credit: 'This website was developed by Mohammed Al-Issa',
    darkMode: 'Dark mode', lightMode: 'Light mode',
    installTitle: 'Install the platform on your phone',
    installIos: 'Tap the Share button in Safari, then choose "Add to Home Screen"',
    installAndroid: 'Add the platform to your home screen to open it like an app',
    installNow: 'Install',
    motherPhone: "Mother's phone", motherPhoneHint: "To contact the mother. If you have no phone, use her number in both fields",
    motherNameOpt: "Mother's name (optional)", motherName: "Mother's name",
    motherPhoneInvalid: "The mother's phone number is invalid",
    mothersNav: 'Mothers contact',
    mothersSub: 'A daily list of cases needing contact, with ready WhatsApp messages',
    followUp: 'Follow-up', allMothers: 'All mothers', msgTemplates: 'Messages',
    tplHint: 'You can edit any message. Variables are replaced automatically when sending.',
    editMother: "Edit mother's details", sendToMother: 'Send to the mother',
    deleteAccount: 'Delete account',
    deleteAccountConfirm: 'Permanently delete "{name}" with all her submissions, grades and attendance? This cannot be undone.',
    accountDeleted: 'Account deleted',
    editStudent: "Edit student details", studentName: "Student's full name",
    sheetTeacher: 'Teacher:', sheetSubject: 'Subject:',
    sheetSemester: 'Semester:', sheetYear: 'Academic year:',
    sem1: 'First', sem2: 'Second', sem3: 'Third',
    partSummary: 'Participation summary',
    partSummaryHint: 'Total points per student, with a message sent to the student herself',
    partHigh: 'Excellent', partOk: 'Good',
    partLow: 'Low', partNone: 'None',
    sendPraise: 'Encourage', sendNudge: 'Nudge',
    sendToStudent: 'Send to the student',
    tpl_student_praise: 'Student praise message', tpl_student_nudge: 'Student nudge message',
    deleted: 'Deleted',
    backupNav: 'Backup',
    backupSub: 'Save a copy of the platform data, or start a new term',
    saveBackup: 'Save a backup',
    backupHint: 'Downloads one file with all platform data. Keep it on a USB drive; it can be restored from phpMyAdmin.',
    downloadData: 'Download data', downloadFiles: 'Download attachments',
    backupStarted: 'Downloading', currentData: 'Current data',
    zipUnavailable: 'Your host does not support zipping; download the uploads folder from the file manager',
    noFiles: 'No attachments',
    resetTitle: 'Delete data',
    resetWarn: 'Warning: this cannot be undone. Save a backup first.',
    resetScope: 'Choose what to delete',
    partStudents: 'Student accounts and records',
    partStudentsD: 'Submissions, attendance, participation, grades and certificates',
    partContent: 'Section content',
    partContentD: 'Lessons, tasks and uploaded files; the sections themselves stay',
    partSections: 'The sections themselves',
    partSectionsD: 'Deletes sections and their content — re-import database.sql to restore',
    partClasses: 'Classes', partClassesD: 'The class list students choose from',
    partSchedule: 'Weekly schedule', partScheduleD: 'Saved schedule periods',
    partTemplates: 'Message templates and settings',
    partTemplatesD: 'WhatsApp message texts and the grade sheet header',
    selectAll: 'Select all', nothingSelected: 'Select at least one item',
    typeToConfirm: 'Type the word «حذف» to confirm',
    resetNow: 'Delete permanently',
    resetConfirm: 'This will delete: {scope}. It cannot be undone. Are you sure?',
    resetDone: 'Data deleted',
    itemsInside: 'Items inside this section', newItems: 'New since your last visit',
    isNew: 'New',
    myClasses: 'My classes', classesHint: 'Add the classes you teach; students will pick from them',
    classNamePh: 'e.g. Grade 11 / 1', noClassesYet: 'No classes added yet',
    classExists: 'This class already exists', renameClass: 'New class name',
    classInUse: 'Cannot delete: {n} students are in it. Move them first',
    noClassesForSignup: 'No classes yet, please contact your teacher',
    rename: 'Rename',
    classLabel: 'Class', classHint: 'Choose your class from the list',
    chooseClass: 'Choose a class', allClasses: 'All classes', classRequired: 'Please choose a class',
    gradebook: 'Gradebook',
    gradebookSub: 'Scores save automatically and reopen exactly as you left them',
    exportPdf: 'Save PDF', studentNameCol: 'Student full name', grandTotal: 'Total',
    sum: 'Σ', savedAt: 'Last saved:', scrollHint: 'Scroll the table sideways to see the rest', badScore: 'Enter a valid number (decimals like 0.5 are allowed)',
    noStudentsInClass: 'No students in this class',
    teacherLabel: 'Teacher', popupBlocked: 'Allow pop-ups to save the file', noData: 'No data',
    myProgress: 'My progress', myPoints: 'My points', studentProgress: 'Student progress',
    excCard: 'Excellence card', excCardTitle: 'Certificate of Excellence',
    excCardReason: 'Reason',
    excCardCaption: '{student} is on the excellence board',
    cardAttachHint: '(attach the saved image)',
    cardSaved: 'Card saved to your device', shareCard: 'Share', downloadCard: 'Download image',
    bonusEarned: 'Bonus medal', bonusCount: 'Bonus medals', bonusReady: 'You earned a new medal',
    toNextBonus: '{n} more points to the next medal', noTasksYet: 'No tasks yet',
    points: 'Points',
    studentPhone: "Student's phone",
    studentPhoneHint: 'She signs in with it, so double-check before saving',
    nameHint: 'At least three words',
    phoneTaken: 'This number belongs to another account',
    recipient: 'Recipient', msgText: 'Message text',
    waHint: 'You can edit the text before sending. WhatsApp will open with the message ready.',
    copyMsg: 'Copy text', openWhatsapp: 'Open WhatsApp', notifyMother: 'Notify mother',
    noMotherPhone: 'No mother phone on file', addMotherPhone: "Add mother's phone",
    lastContact: 'Last contact', neverContacted: 'Not contacted yet',
    caseExcellence: 'Excellence', caseAbsence: 'Absence', caseLate: 'Late',
    caseLowLevel: 'Low performance', sendReport: 'Send report',
    tpl_excellence: 'Excellence message', tpl_absence: 'Absence message',
    tpl_late: 'Lateness message', tpl_low_level: 'Low performance message',
    tpl_report: 'Report message',
    allGood: 'No cases need contact today',
    absenceDays: 'Absence days', avgGrade: 'Average grade',
    msgLogged: 'Contact logged', copied: 'Copied',
    notifyAllTitle: 'Cases needing contact',
    connError: 'Temporarily unable to reach the service. Automatic retries did not help, please try again.',
    retryNow: 'Try again',
    retrying: 'Retrying…',
    dbNeedsUpdate: 'The database needs updating: import database.sql in phpMyAdmin.',
    nameInvalid: 'Enter your full triple name',
    passShort: 'Password too short (min 6 characters)',
    passMismatch: 'Passwords do not match', accountCreated: 'Account created',
    wrongLogin: 'Incorrect login details', enterPassword: 'Enter your password', alreadyReg: 'This number is already registered',
    tasks: 'Open tasks', myWork: 'My submissions', myCerts: 'My certificates',
    myFeedback: 'My messages', writeFeedback: 'Write your note or question to the teacher',
    send: 'Send', reply: 'Reply', saveReply: 'Save reply',
    makePublic: 'Make public', makePrivate: 'Make private',
    publicBadge: 'Public', privateBadge: 'Private',
    student: 'Student', task: 'Task', submittedAt: 'Submitted on',
    notSubmitted: 'Not submitted yet', evaluate: 'Evaluate', returnRevision: 'Return for revision',
    sysSection: 'System', customSection: 'Custom',
    viewPortfolio: 'View portfolio', backList: 'Back', addPoints: 'Record participation', all: 'All',
    loginHint: 'Students sign in with phone number only',
    copyLink: 'Copy parent link',
    cfgMissing: 'Complete the CONFIG settings at the top of script.js first',
    loginFirst: 'Please sign in first',
    browseGuest: 'Browse without signing in',
    welcomeGuest: 'Welcome to the platform',
    loginToView: 'Sign in to view your data',
    parentsHint: 'Parents can follow the student report (attendance, grades and certificates) using a code obtained from the teacher'
  }
};

var DAYS = {
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
};

var LANG = 'ar';
try {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('lms_lang')) {
    LANG = localStorage.getItem('lms_lang');
  }
} catch (e) { LANG = 'ar'; }
if (LANG !== 'ar' && LANG !== 'en') LANG = 'ar';

function t(key) {
  return (I18N[LANG] && I18N[LANG][key]) || I18N.ar[key] || key;
}

/* هل المفتاح موجود فعلاً في قواميس الترجمة؟
   يُستخدم حتى لا تُستبدل النصوص المكتوبة في HTML بأسماء المفاتيح
   إذا كان ملف script.js قديماً أو مخزّناً في ذاكرة المتصفح. */
function hasKey(key) {
  return !!((I18N[LANG] && I18N[LANG][key]) || I18N.ar[key]);
}

/* اختيار الحقل الثنائي: title_ar / title_en مع الرجوع للمتوفر */
function L(row, base) {
  if (!row) return '';
  var ar = row[base + '_ar'];
  var en = row[base + '_en'];
  return (LANG === 'en' ? (en || ar) : (ar || en)) || '';
}

function platformName() { return LANG === 'en' ? CONFIG.PLATFORM_NAME_EN : CONFIG.PLATFORM_NAME_AR; }
function teacherName() {
  /* في الرسائل نستخدم اسم حساب المعلمة الفعلي إن كانت هي المسجّلة،
     فلا تحتاج كل معلمة جديدة إلى تعديل ملف الإعدادات */
  if (state.profile && state.profile.role === 'teacher' && state.profile.full_name) {
    return state.profile.full_name;
  }
  return LANG === 'en' ? CONFIG.TEACHER_NAME_EN : CONFIG.TEACHER_NAME_AR;
}

function applyI18n() {
  if (typeof syncThemeUi === 'function' && document.getElementById('theme-toggle')) syncThemeUi();
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.classList.toggle('lang-en', LANG === 'en');
  document.title = platformName();
  $$('[data-i18n]').forEach(function (n) {
    var k = n.getAttribute('data-i18n');
    if (hasKey(k)) n.textContent = t(k);
  });
  $$('[data-i18n-ph]').forEach(function (n) {
    var k = n.getAttribute('data-i18n-ph');
    if (hasKey(k)) n.placeholder = t(k);
  });
  var brand = $('#brand-name'); if (brand) brand.textContent = platformName();
  var heroT = $('#hero-title'); if (heroT) heroT.textContent = platformName();
  var heroTe = $('#hero-teacher'); if (heroTe) heroTe.textContent = teacherName();
  var lt = $('#lang-toggle'); if (lt) lt.textContent = LANG === 'ar' ? 'EN' : 'ع';
}

function setLang(l) {
  LANG = l;
  try { localStorage.setItem('lms_lang', l); } catch (e) { /* تجاهل */ }
  applyI18n();
  refreshAfterLang();
}

/* =====================================================================
   3) بوابة الشبكة — تنظيم الطلبات وإعادة المحاولة التلقائية

   الاستضافات المشتركة تحدّ عدد اتصالات MySQL المتزامنة. وعند فتح الصفحة
   كانت عدة طلبات تنطلق في نفس اللحظة، فترفض الاستضافة بعضها ويظهر خطأ
   اتصال عابر للطالبة. فصار كل طلب يمرّ من هنا:

   - طابور: عدد محدود من الطلبات يمشي في وقت واحد، والباقي ينتظر دوره.
     ويهبط الحد إلى طلب واحد تلقائياً إذا لمسنا ضيقاً في الاستضافة.
   - إعادة محاولة: الخطأ المؤقت يُعاد مرتين بفارق قصير قبل إظهار أي شيء
     للمستخدمة، فتُخفى معظم الحالات العابرة تماماً.
   ===================================================================== */
var NET = (function () {
  var maxInflight = 2;                    /* يهبط إلى 1 عند أول خطأ عابر */
  var RETRY_DELAYS = [250, 600, 1500];    /* ميلي ثانية بين المحاولات */
  var inflight = 0;
  var queue = [];

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function pump() {
    while (inflight < maxInflight && queue.length) {
      var job = queue.shift();
      inflight++;
      job.fn().then(
        function (v) { inflight--; job.resolve(v); pump(); },
        function (e) { inflight--; job.reject(e); pump(); }
      );
    }
  }

  function queued(fn) {
    return new Promise(function (resolve, reject) {
      queue.push({ fn: fn, resolve: resolve, reject: reject });
      pump();
    });
  }

  /* فشل الاتصال بالقاعدة: السيرفر ردّ لكنه لم ينفّذ شيئاً، فإعادة
     الإرسال آمنة حتى لو كان الطلب يكتب في القاعدة */
  function dbDown(text) {
    return !!text && text.indexOf('db_connection') > -1;
  }

  /* خطأ مؤقت آخر: انقطاع شبكة أو ضيق في الاستضافة */
  function transient(res) {
    if (!res) return true;
    return res.status === 429 || res.status >= 500;
  }

  function easeOff() {
    if (maxInflight > 1) maxInflight = 1;
  }

  /* يُرسل الطلب ويقرأ نصه. safe=false تعني أن الطلب يكتب في القاعدة،
     فلا نعيده إلا إذا تأكدنا أن الاتصال بالقاعدة نفسه فشل. */
  async function send(url, opts, safe) {
    var res = null, text = '';
    for (var i = 0; ; i++) {
      res = null; text = '';
      try {
        res = await fetch(url, opts);
        text = await res.text();
      } catch (e) { res = null; }
      var again = dbDown(text) || (safe !== false && transient(res));
      if (!again) break;
      easeOff();
      if (i >= RETRY_DELAYS.length) break;
      await sleep(RETRY_DELAYS[i]);
    }
    return { res: res, text: text };
  }

  /* الواجهة الأساسية: ترجع دائماً {data, error} ولا ترمي استثناءً */
  function json(url, opts, safe) {
    return queued(function () {
      return send(url, opts, safe).then(function (r) {
        var data = null;
        if (r.text) { try { data = JSON.parse(r.text); } catch (e) { data = null; } }
        if (!data || typeof data !== 'object') {
          return { data: null, error: r.res ? ('HTTP ' + r.res.status) : 'db_connection: network' };
        }
        return data;
      });
    });
  }

  /* استجابة خام لتنزيل الملفات: لا نقرأ النص، ونعيد المحاولة عند
     انقطاع الشبكة أو ضيق الاستضافة فقط */
  function raw(url, opts) {
    return queued(async function () {
      var lastErr = null;
      for (var i = 0; i <= RETRY_DELAYS.length; i++) {
        if (i) await sleep(RETRY_DELAYS[i - 1]);
        try {
          var res = await fetch(url, opts);
          if (!transient(res)) return res;
          lastErr = new Error('HTTP ' + res.status);
        } catch (e) { lastErr = e; }
        easeOff();
      }
      throw lastErr || new Error('network');
    });
  }

  return {
    json: json,
    raw: raw,
    limit: function () { return maxInflight; },
    pending: function () { return queue.length + inflight; }
  };
})();

/* طلب GET عادي على api.php (قراءة) */
function apiGet(action) {
  return NET.json(CONFIG.API_URL + '?action=' + action, { credentials: 'same-origin' });
}

/* طلب POST على api.php. safe=false للطلبات التي تكتب في القاعدة */
function apiPost(action, bodyObj, safe) {
  return NET.json(CONFIG.API_URL + '?action=' + action, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    body: JSON.stringify(bodyObj || {})
  }, safe);
}

/* =====================================================================
   3ب) عميل قاعدة البيانات — fetch فقط، بدون مكتبات
   ===================================================================== */
var sb = (function () {
  var me = null;

  /* الاستعلامات القارئة فقط يُعاد إرسالها عند أي خطأ مؤقت،
     أما الكتابة فتُعاد فقط إذا كان فشل الاتصال بالقاعدة مؤكداً */
  function call(action, bodyObj, safe) {
    return apiPost(action, bodyObj, safe);
  }

  async function fetchMe() {
    var d = await apiGet('me');
    me = d && d.data ? d.data : null;
    return me;
  }

  async function login(phone, password) {
    var r = await call('login', { phone: phone, password: password || '' }, false);
    if (!r.error) me = r.data;
    return r;
  }

  async function register(fullName, phone, motherPhone, motherName, classId) {
    var r = await call('register', {
      full_name: fullName, phone: phone,
      mother_phone: motherPhone || '', mother_name: motherName || '',
      class_id: classId || 0
    }, false);
    if (!r.error) me = r.data;
    return r;
  }

  function signOut() {
    me = null;
    return call('logout', {}, false);
  }

  function getSession() { return me; }
  function userId() { return me ? me.id : null; }

  /* باني الاستعلامات: نفس الواجهة السابقة، ينفذ عبر api.php
     والصلاحيات كلها تُفحص في السيرفر */
  function Q(table) {
    this.table = table;
    this.filters = [];
    this.orders = [];
    this.op = 'select';
    this.values = null;
    this.conflict = null;
    this.sel = '*';
    this.lim = null;
    this.singleRow = false;
  }
  Q.prototype.select = function (cols) { this.sel = cols || '*'; return this; };
  Q.prototype.eq = function (c, v) { this.filters.push({ c: c, o: 'eq', v: v }); return this; };
  Q.prototype.neq = function (c, v) { this.filters.push({ c: c, o: 'neq', v: v }); return this; };
  Q.prototype.gte = function (c, v) { this.filters.push({ c: c, o: 'gte', v: v }); return this; };
  Q.prototype.lte = function (c, v) { this.filters.push({ c: c, o: 'lte', v: v }); return this; };
  Q.prototype.in_ = function (c, arr) { this.filters.push({ c: c, o: 'in', v: arr || [] }); return this; };
  Q.prototype.is_ = function (c, v) { this.filters.push({ c: c, o: 'is', v: v }); return this; };
  Q.prototype.order = function (c, asc) { this.orders.push({ c: c, asc: asc !== false }); return this; };
  Q.prototype.limit = function (n) { this.lim = n; return this; };
  Q.prototype.single = function () { this.singleRow = true; return this; };
  Q.prototype.insert = function (obj) { this.op = 'insert'; this.values = obj; return this; };
  Q.prototype.update = function (obj) { this.op = 'update'; this.values = obj; return this; };
  Q.prototype.upsert = function (obj, onConflict) {
    this.op = 'upsert'; this.values = obj; this.conflict = onConflict || null; return this;
  };
  Q.prototype.remove = function () { this.op = 'delete'; return this; };
  Q.prototype.run = function () {
    return call('q', {
      table: this.table, op: this.op, filters: this.filters, orders: this.orders,
      select: this.sel, limit: this.lim, single: this.singleRow,
      values: this.values, conflict: this.conflict
    }, this.op === 'select');
  };
  Q.prototype.then = function (resolve, rejectFn) { return this.run().then(resolve, rejectFn); };

  function from(table) { return new Q(table); }

  async function rpc(fn, args) {
    if (fn === 'parent_portal') {
      return await apiGet('parent_portal&code='
        + encodeURIComponent((args && args.p_code) || ''));
    }
    return { data: null, error: 'unknown_rpc' };
  }

  var storage = {
    upload: async function (bucket, fileObj, folder) {
      var fd = new FormData();
      fd.append('bucket', bucket);
      if (folder) fd.append('folder', folder);
      fd.append('file', fileObj);
      return await NET.json(CONFIG.API_URL + '?action=upload', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-Requested-With': 'fetch' },
        body: fd
      }, false);
    },
    publicUrl: function (bucket, path) {
      return 'uploads/' + path;
    },
    signedUrl: async function (bucket, path) {
      return CONFIG.API_URL + '?action=file&path=' + encodeURIComponent(path);
    }
  };

  return {
    login: login, register: register, fetchMe: fetchMe, signOut: signOut,
    getSession: getSession, userId: userId, from: from, rpc: rpc, storage: storage
  };
})();

/* =====================================================================
   4) مساعدات DOM
   ===================================================================== */
function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function show(node) { if (node) node.classList.remove('hidden'); }
function hide(node) { if (node) node.classList.add('hidden'); }

/* بناء العناصر — النصوص دائماً عبر textContent (آمن ضد XSS) */
function el(tag, attrs) {
  var n = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'checked') n.checked = !!v;
      else if (k === 'disabled') n.disabled = !!v;
      else if (k === 'value') n.value = v;
      else if (k.indexOf('on') === 0 && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
  }
  for (var i = 2; i < arguments.length; i++) {
    var c = arguments[i];
    if (c == null) continue;
    if (Array.isArray(c)) {
      c.forEach(function (cc) {
        if (cc == null) return;
        n.appendChild(typeof cc === 'string' ? document.createTextNode(cc) : cc);
      });
    } else {
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
  }
  return n;
}

var ICONS = {
  moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>',
  folder: '<svg viewBox="0 0 24 24"><path d="M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/></svg>',
  inbox: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4Z"/><path d="M4 14h5l1.5 2.5h3L15 14h5"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6Z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h7"/></svg>',
  calcheck: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M9 15.5l2 2 4-4"/></svg>',
  hand: '<svg viewBox="0 0 24 24"><path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 11V5a1.5 1.5 0 0 1 3 0v6"/><path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V13"/><path d="M17 12.5c2-1 3.4.4 2.4 2.2L16.5 20a4 4 0 0 1-3.5 2H11a5 5 0 0 1-5-5v-4a1.5 1.5 0 0 1 2-1.4"/></svg>',
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5a3.5 3.5 0 0 1 0 7"/><path d="M17.5 14.5a6.5 6.5 0 0 1 4 5.5"/></svg>',
  grid: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></svg>',
  message: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4Z"/></svg>',
  award: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 19h16"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 20h16"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L20 8l-4-4L4 16Z"/><path d="M13.5 6.5 17.5 10.5"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  key: '<svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4.5"/><path d="M11.5 11.5 20 3M16 7l3 3M14 9l2 2"/></svg>'
};

function icon(name) {
  var s = document.createElement('span');
  s.className = 'ic';
  s.innerHTML = ICONS[name] || '';
  return s;
}

function injectIcons() {
  $$('[data-icon]').forEach(function (n) {
    n.innerHTML = ICONS[n.getAttribute('data-icon')] || '';
  });
}

/* =====================================================================
   5) أدوات عامة
   ===================================================================== */
function pad2(n) { return String(n).padStart(2, '0'); }

function fmtDate(v) {
  if (!v) return '';
  var d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function fmtDateTime(v) {
  if (!v) return '';
  var d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return fmtDate(d) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

function todayStr() { return fmtDate(new Date()); }

/* ================================================ أرقام الجوال
   الصيغة المعيارية للتخزين: 05xxxxxxxx
   الصيغة المعروضة للمستخدم: +9665xxxxxxxx
   صيغة واتساب: 9665xxxxxxxx */
function normPhone(v) {
  var d = String(v == null ? '' : v).replace(/[^0-9]/g, '');
  if (!d) return '';
  if (d.indexOf('00966') === 0) d = d.slice(5);
  else if (d.indexOf('966') === 0) d = d.slice(3);
  else if (d.charAt(0) === '0') d = d.slice(1);
  if (!/^5[0-9]{8}$/.test(d)) return '';
  return '0' + d;
}

function isPhone(v) { return normPhone(v) !== ''; }

/* عرض دولي: 0512345678 -> +966512345678 */
function intlPhone(v) {
  var n = normPhone(v);
  return n ? '+966' + n.slice(1) : '';
}

/* رقم واتساب: 0512345678 -> 966512345678 */
function waPhone(v) {
  var n = normPhone(v);
  return n ? '966' + n.slice(1) : '';
}

/* التنسيق الحي أثناء الكتابة: أول ما تكتب 05 يتحول الصفر إلى +966 */
function bindPhoneInput(inp) {
  if (!inp || inp.dataset.phoneBound === '1') return;
  inp.dataset.phoneBound = '1';
  inp.setAttribute('dir', 'ltr');
  inp.addEventListener('input', function () {
    var d = inp.value.replace(/[^0-9]/g, '');
    if (d.indexOf('00966') === 0) d = d.slice(5);
    else if (d.indexOf('966') === 0) d = d.slice(3);
    else if (d.charAt(0) === '0') d = d.slice(1);
    d = d.slice(0, 9);
    inp.value = d ? '+966' + d : '';
    try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) { /* تجاهل */ }
  });
}

function bindAllPhoneInputs() {
  ['#reg-phone', '#reg-mother-phone', '#login-phone', '#parent-phone', '#mm-phone', '#mm-student-phone']
    .forEach(function (sel) { bindPhoneInput($(sel)); });
}

function toLocalInput(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
    'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

function fileExt(name) {
  var i = String(name || '').lastIndexOf('.');
  return i > -1 ? String(name).slice(i + 1).toLowerCase() : '';
}

function safeName(name) {
  var ext = fileExt(name);
  return Date.now() + (ext ? '.' + ext : '');
}

function validateFile(f) {
  var ext = fileExt(f.name);
  if (CONFIG.ALLOWED_EXT.indexOf(ext) === -1) {
    return t('badType') + ': ' + CONFIG.ALLOWED_EXT.join(', ');
  }
  if (f.size > CONFIG.MAX_FILE_MB * 1024 * 1024) {
    return t('fileTooBig') + ' (' + CONFIG.MAX_FILE_MB + 'MB)';
  }
  return null;
}

function ytEmbed(u) {
  if (!u) return null;
  var m = String(u).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? 'https://www.youtube.com/embed/' + m[1] : null;
}

function copyText(txt) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(
      function () { toast(t('copied')); },
      function () { toast(t('err'), true); }
    );
    return;
  }
  var ta = document.createElement('textarea');
  ta.value = txt;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); toast(t('copied')); } catch (e) { /* تجاهل */ }
  ta.remove();
}

function toast(msg, isErr) {
  var wrap = $('#toast-wrap');
  if (!wrap) return;
  var node = el('div', { class: 'toast' + (isErr ? ' err' : ''), text: msg });
  wrap.appendChild(node);
  setTimeout(function () {
    node.classList.add('out');
    setTimeout(function () { node.remove(); }, 320);
  }, 2800);
}

function openModal(id) { show($('#' + id)); }
function closeModal(id) { hide($('#' + id)); }

function askConfirm(msg, fn) {
  $('#confirm-msg').textContent = msg;
  state.confirmFn = fn;
  openModal('modal-confirm');
}

function loadingBox() { return el('div', { class: 'loading-box', text: t('loading') }); }
function emptyBox(msg) { return el('div', { class: 'empty', text: msg || t('noData') }); }

function subBadge(s) {
  var map = { pending: 'b-amber', approved: 'b-green', rejected: 'b-red', needs_revision: 'b-navy' };
  return el('span', { class: 'badge ' + (map[s] || 'b-gray'), text: t('st_' + s) });
}

function attBadge(s) {
  var map = { present: 'b-green', absent: 'b-red', late: 'b-amber', excused: 'b-navy' };
  return el('span', { class: 'badge ' + (map[s] || 'b-gray'), text: t('at_' + s) });
}

/* ربط منطقة سحب وإفلات بحقل ملف */
function bindDropzone(dzId, inputId, labelId, stateKey) {
  var dz = $('#' + dzId);
  var input = $('#' + inputId);
  var label = $('#' + labelId);
  if (!dz || !input || !label) return;
  input.accept = CONFIG.ALLOWED_EXT.map(function (x) { return '.' + x; }).join(',');
  function setF(f) {
    var err = validateFile(f);
    if (err) { toast(err, true); return; }
    state[stateKey] = f;
    label.textContent = f.name;
    label.classList.add('dz-name');
  }
  input.addEventListener('change', function () { if (input.files[0]) setF(input.files[0]); });
  dz.addEventListener('click', function () { input.click(); });
  dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', function () { dz.classList.remove('drag'); });
  dz.addEventListener('drop', function (e) {
    e.preventDefault();
    dz.classList.remove('drag');
    if (e.dataTransfer.files[0]) setF(e.dataTransfer.files[0]);
  });
}

function resetDropzone(labelId, hintId, stateKey) {
  state[stateKey] = null;
  var label = $('#' + labelId);
  if (label) { label.textContent = t('chooseFile'); label.classList.remove('dz-name'); }
  var hint = $('#' + hintId);
  if (hint) hint.textContent = CONFIG.ALLOWED_EXT.join(' - ') + ' | ' + t('maxSize') + ' ' + CONFIG.MAX_FILE_MB + 'MB';
}

/* =====================================================================
   6) الحالة العامة
   ===================================================================== */
var state = {
  profile: null,
  guest: false,
  sections: [],
  students: null,
  mySubs: [],
  nav: { view: 'auth', screen: null, arg: null },
  attDate: todayStr(),
  subFilter: 'pending',
  spTab: 'tasks',
  tsdTab: 'subs',
  currentSection: null,
  studentDetail: null,
  wizard: null,
  editingItem: null,
  editingSub: null,
  uploadItem: null,
  uploadFile: null,
  itemFile: null,
  certFile: null,
  certStudent: null,
  excPreselect: null,
  excOnDone: null,
  reviewSub: null,
  reviewOnDone: null,
  schedTarget: null,
  confirmFn: null,
  parentData: null,
  unread: {},    /* عدد الجديد لكل قسم */
  newItems: {},  /* معرّفات العناصر التي لم تفتحها الطالبة بعد */
  counts: {}     /* إجمالي المحتوى لكل قسم */
};

async function loadProfile() {
  var p = await sb.fetchMe();
  state.profile = p || null;
  return state.profile;
}

async function getStudents(force) {
  if (state.students && !force) return state.students;
  var r = await sb.from('profiles').select('id,full_name,phone,mother_phone,mother_name,class_id,created_at')
    .eq('role', 'student').eq('status', 'approved').order('full_name');
  state.students = r.data || [];
  return state.students;
}

async function fetchSections() {
  var r = await sb.from('sections').select('*').order('sort_order').order('created_at');
  state.sections = r.data || [];
  state.sectionsError = r.error || null;
  var banner = $('#conn-error');
  if (banner) { if (state.sectionsError) show(banner); else hide(banner); }
  return state.sections;
}

/* زر "أعد المحاولة" في شريط الخطأ: إعادة تحميل نظيفة، فتُعاد كل
   الطلبات من نقطة البداية بدل ترقيع حالة ناقصة */
function bindConnRetry() {
  var btn = $('#conn-retry');
  if (!btn) return;
  btn.addEventListener('click', function () {
    btn.disabled = true;
    var msg = $('#conn-error-msg');
    if (msg) msg.textContent = t('retrying');
    window.location.reload();
  });
}

/* =====================================================================
   7) الإقلاع والتوجيه العام
   ===================================================================== */
function showView(id) {
  $$('.view').forEach(function (v) { hide(v); });
  show($('#' + id));
  state.nav.view = id.replace('view-', '');
  window.scrollTo(0, 0);
}

function topbarUser(p) {
  var u = $('#topbar-user');
  var b = $('#btn-logout');
  var li = $('#btn-login');
  if (p) {
    u.textContent = p.full_name;
    show(u); show(b); hide(li);
  } else {
    u.textContent = '';
    hide(u); hide(b); show(li);
  }
}

async function doLogout() {
  try { await sb.signOut(); } catch (e) { /* \u062a\u062c\u0627\u0647\u0644 */ }
  window.location.reload();
}

function routeByProfile(p) {
  state.guest = false;
  topbarUser(p);
  if (p.role === 'teacher') { enterTeacher(); return; }
  if (p.status === 'approved') { enterStudent(); return; }
  showGate(p);
}

/* وضع الزائر: تصفح كامل بدون تسجيل، وأي إجراء يتطلب هوية يفتح صفحة الدخول */
async function enterGuest() {
  state.guest = true;
  state.profile = null;
  state.mySubs = [];
  state.unread = {};
  state.newItems = {};
  topbarUser(null);
  showView('view-student');
  await fetchSections();
  await loadSectionCounts();
  buildStudentSectionsNav();
  showStudentScreen('home');
}

function requireLogin() {
  toast(t('loginFirst'), true);
  gotoAuth();
}

function showGate(p) {
  showView('view-gate');
  state.nav.screen = null;
  if (p.status === 'rejected') {
    $('#gate-title').textContent = t('rejectedTitle');
    $('#gate-body').textContent = t('rejectedBody');
  } else {
    $('#gate-title').textContent = t('pendingTitle');
    $('#gate-body').textContent = t('pendingBody');
  }
}

function gotoAuth() {
  showView('view-auth');
  state.nav.screen = null;
}

function refreshAfterLang() {
  var n = state.nav;
  if (n.view === 'student') {
    buildStudentSectionsNav();
    showStudentScreen(n.screen || 'home', n.arg);
  } else if (n.view === 'teacher') {
    showTeacherScreen(n.screen || 'overview', n.arg);
  } else if (n.view === 'gate' && state.profile) {
    showGate(state.profile);
  } else if (n.view === 'parent' && state.parentData) {
    renderParentReport(state.parentData);
  }
}

async function init() {
  injectIcons();
  applyI18n();
  bindStatic();
  bindConnRetry();
  /* رابط ولي الأمر المباشر: site/?parent=CODE يفتح التقرير فوراً */
  var pcode = null;
  try {
    pcode = new URLSearchParams(window.location.search).get('parent');
  } catch (e) { pcode = null; }
  if (pcode) {
    gotoParent();
    submitParentCode(pcode);
    return;
  }
  /* الموقع يفتح على التصفح فوراً بدون تسجيل، وتظهر الأقسام مباشرة.
     ثم نتحقق من وجود جلسة نشطة (معلمة/طالبة) فنرقّي الواجهة إن وُجدت. */
  await enterGuest();
  await loadClasses();
  fillClassSelect($('#reg-class'), null, false);
  if (!(state.classes || []).length) {
    var h = $('#reg-class').parentNode.querySelector('.hint');
    if (h) h.textContent = t('noClassesForSignup');
  }
  var p = await loadProfile();
  if (p) routeByProfile(p);
}

/* =====================================================================
   8) الدخول والتسجيل
   ===================================================================== */
function switchAuthTab(which) {
  var isLogin = which === 'login';
  $('#tab-login').classList.toggle('active', isLogin);
  $('#tab-register').classList.toggle('active', !isLogin);
  if (isLogin) { show($('#form-login')); hide($('#form-register')); }
  else { hide($('#form-login')); show($('#form-register')); }
}

function toggleTeacherPass() {
  var phone = $('#login-phone').value.trim();
  if (normPhone(phone) === normPhone(CONFIG.TEACHER_PHONE)) show($('#login-pass-wrap'));
  else hide($('#login-pass-wrap'));
}

async function handleLogin(e) {
  e.preventDefault();
  var phone = normPhone($('#login-phone').value);
  if (!phone) { toast(t('phoneInvalid'), true); return; }
  var pass = '';
  var passWrap = $('#login-pass-wrap');
  /* اختصار: إظهار فوري إذا طابق الرقم المكتوب في الإعدادات (اختياري) */
  if (phone === normPhone(CONFIG.TEACHER_PHONE)) show(passWrap);
  /* تُقرأ كلمة المرور متى ما كانت الخانة ظاهرة — سواء ظهرت بالاختصار
     أو لأن السيرفر طلبها، حتى يعمل الدخول مع أي رقم معلمة */
  if (!passWrap.classList.contains('hidden')) {
    pass = $('#login-password').value;
    if (!pass) { $('#login-password').focus(); return; }
  }
  var btn = $('#login-submit');
  btn.disabled = true;
  var r = await sb.login(phone, pass);
  btn.disabled = false;
  if (r.error) {
    /* السيرفر يخبرنا أن هذا الحساب محمي بكلمة مرور (حساب المعلمة)،
       فنُظهر خانة الرمز حتى لو تغيّر رقم المعلمة في قاعدة البيانات */
    if (String(r.error).indexOf('password_required') > -1) {
      show($('#login-pass-wrap'));
      $('#login-password').focus();
      toast(t('enterPassword'));
      return;
    }
    toast(t('wrongLogin'), true);
    return;
  }
  state.profile = r.data;
  routeByProfile(r.data);
}

async function handleRegister(e) {
  e.preventDefault();
  var nameV = $('#reg-name').value.trim().replace(/\s+/g, ' ');
  var phone = normPhone($('#reg-phone').value);
  var mPhone = normPhone($('#reg-mother-phone').value);
  var mName = $('#reg-mother-name').value.trim().replace(/\s+/g, ' ');
  var classId = Number($('#reg-class').value || 0);
  if (nameV.split(' ').length < 3) { toast(t('nameInvalid'), true); return; }
  if (!classId) { toast(t('classRequired'), true); return; }
  if (!phone) { toast(t('phoneInvalid'), true); return; }
  if (!mPhone) { toast(t('motherPhoneInvalid'), true); return; }
  if (phone === normPhone(CONFIG.TEACHER_PHONE)) { toast(t('alreadyReg'), true); return; }
  var btn = $('#reg-submit');
  btn.disabled = true;
  var r = await sb.register(nameV, phone, mPhone, mName, classId);
  btn.disabled = false;
  if (r.error) {
    var msg = String(r.error).toLowerCase();
    if (msg.indexOf('already') > -1) toast(t('alreadyReg'), true);
    else if (msg.indexOf('db_needs_update') > -1) toast(t('dbNeedsUpdate'), true);
    else if (msg.indexOf('class_required') > -1) toast(t('classRequired'), true);
    else if (msg.indexOf('mother') > -1) toast(t('motherPhoneInvalid'), true);
    else if (msg.indexOf('db_connection') > -1) toast(t('connError'), true);
    else toast(t('err'), true);
    /* تفصيل الخطأ في الـ Console يساعد على التشخيص السريع */
    if (window.console && console.error) console.error('register error:', r.error);
    return;
  }
  toast(t('accountCreated'));
  state.profile = r.data;
  routeByProfile(r.data);
}

/* =====================================================================
   9) تطبيق الطالبة
   ===================================================================== */
async function enterStudent() {
  await fetchSections();
  await loadMySubs();
  await loadUnread();
  await loadSectionCounts();
  await loadClasses();
  buildStudentSectionsNav();
  showView('view-student');
  showStudentScreen('home');
}

async function loadMySubs() {
  var r = await sb.from('submissions').select('*')
    .eq('student_id', sb.userId()).order('created_at', false);
  state.mySubs = r.data || [];
  return state.mySubs;
}

function latestSubByItem() {
  var map = {};
  state.mySubs.forEach(function (s) {
    if (s.item_id && !map[s.item_id]) map[s.item_id] = s;
  });
  return map;
}

/* ================================================ تنبيهات الجديد
   الأقسام التي نزل فيها محتوى جديد تتقدم القائمة ويظهر عليها عدّاد أحمر. */
function unreadCount(sectionId) {
  return (state.unread && state.unread[sectionId]) || 0;
}

/* هل هذا العنصر بعينه جديد على الطالبة؟ */
function isNewItem(itemId) {
  return !!(state.newItems && state.newItems[itemId]);
}

async function loadUnread() {
  state.unread = {};
  state.newItems = {};
  if (state.guest || !state.profile || state.profile.status !== 'approved') return state.unread;
  var d = await apiGet('unread');
  (d && d.data ? d.data : []).forEach(function (r) {
    state.unread[r.section_id] = r.count;
    (r.item_ids || []).forEach(function (id) { state.newItems[id] = true; });
  });
  return state.unread;
}

/* تُستدعى عند فتح الطالبة عنصراً: يختفي وسم "جديد" عنه وحده،
   وينقص عدّاد قسمه بواحد. فتح القسم نفسه لا يُعلّم شيئاً. */
async function markItemSeen(item) {
  if (!item || state.guest || !state.profile || state.profile.status !== 'approved') return;
  if (!isNewItem(item.id)) return;
  delete state.newItems[item.id];
  var secId = item.section_id;
  var left = unreadCount(secId) - 1;
  if (left > 0) state.unread[secId] = left; else delete state.unread[secId];
  buildStudentSectionsNav();
  await apiPost('mark_seen', { item_id: item.id }, false);
}

/* عدّاد أحمر للجديد */
function unreadBadge(n) {
  return el('span', { class: 'new-badge', title: t('newItems'), text: n > 99 ? '99+' : String(n) });
}

/* عدّاد محايد لإجمالي المحتوى داخل القسم */
function countBadge(n) {
  return el('span', { class: 'count-badge', title: t('itemsInside'), text: n > 999 ? '999+' : String(n) });
}

function sectionCount(sectionId) {
  return (state.counts && state.counts[sectionId]) || 0;
}

async function loadSectionCounts() {
  state.counts = {};
  var d = await apiGet('section_counts');
  (d && d.data ? d.data : []).forEach(function (r) { state.counts[r.section_id] = r.count; });
  return state.counts;
}

/* يضيف العدّادين لبطاقة أو عنصر تنقل:
   الأبيض = ما بداخل القسم، والأحمر = الجديد الذي لم يُفتح بعد */
function addSectionBadges(target, sec, opts) {
  opts = opts || {};
  var total = sectionCount(sec.id);
  var fresh = opts.withUnread === false ? 0 : unreadCount(sec.id);
  if (total) target.appendChild(countBadge(total));
  if (fresh) target.appendChild(unreadBadge(fresh));
  return fresh;
}

function studentVisibleSections() {
  var list = state.sections.filter(function (s) { return s.visible_to_students; });
  /* الأقسام ذات الجديد تتصدّر، مع الحفاظ على الترتيب الأصلي داخل كل مجموعة */
  return list.slice().sort(function (a, b) {
    var ua = unreadCount(a.id) > 0 ? 0 : 1;
    var ub = unreadCount(b.id) > 0 ? 0 : 1;
    if (ua !== ub) return ua - ub;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });
}

var SECTION_ICONS = {
  'classroom-rules': 'doc', 'diagnostic-tests': 'doc', 'quizzes': 'doc',
  'performance-tasks': 'doc', 'projects': 'grid', 'activities': 'hand',
  'activities-class': 'hand', 'activities-extra': 'hand',
  'participation': 'hand', 'attendance': 'calcheck', 'feedback': 'message',
  'enrichment-plan': 'star', 'remedial-plan': 'calcheck',
  'worksheets': 'doc', 'presentations': 'doc', 'games': 'link',
  'experiments': 'eye', 'honors': 'award', 'parents': 'users'
};

function buildStudentSectionsNav() {
  var box = $('#student-sections-nav');
  box.textContent = '';
  /* لا أقسام: نوضّح السبب بدل ترك الصفحة فارغة بلا تفسير */
  var homeBox = $('#sh-sections');
  if (homeBox && !studentVisibleSections().length) {
    homeBox.textContent = '';
    var card = el('div', { class: 'card' });
    var b = el('div', { class: 'card-b', style: 'text-align:center' });
    b.appendChild(el('p', { class: 'muted', text: state.sectionsError ? t('connError') : t('noSectionsYet') }));
    card.appendChild(b);
    homeBox.appendChild(card);
  }
  studentVisibleSections().forEach(function (s) {
    var b = el('button', { type: 'button', class: 'navitem', 'data-nav': 'section', 'data-arg': s.slug });
    b.appendChild(icon(SECTION_ICONS[s.slug] || 'grid'));
    b.appendChild(el('span', { text: L(s, 'title') }));
    if (addSectionBadges(b, s)) b.classList.add('has-new');
    b.addEventListener('click', function () { showStudentScreen('section', s.slug); });
    box.appendChild(b);
  });
}

function highlightNav(rootSel, name, arg) {
  $$(rootSel + ' .navitem').forEach(function (b) {
    var on = b.getAttribute('data-nav') === name &&
      (!b.getAttribute('data-arg') || b.getAttribute('data-arg') === String(arg || ''));
    b.classList.toggle('active', on);
  });
}

var STUDENT_SCREENS = ['home', 'section', 'portfolio', 'schedule', 'excellence'];

function showStudentScreen(name, arg) {
  if (name === 'portfolio' && state.guest) { requireLogin(); return; }
  state.nav = { view: 'student', screen: name, arg: arg || null };
  STUDENT_SCREENS.forEach(function (s) {
    var node = $('#s-' + s);
    if (node) hide(node);
  });
  show($('#s-' + name));
  highlightNav('#student-nav', name, arg);
  window.scrollTo(0, 0);
  if (name === 'home') { loadSHome(); loadStudentProgress(); }
  else if (name === 'section') loadSSection(arg);
  else if (name === 'portfolio') loadSPortfolio();
  else if (name === 'schedule') loadSSchedule();
  else if (name === 'excellence') loadSExcellence('#sexc-grid');
}

async function studentStats() {
  var uid = sb.userId();
  var attR = await sb.from('attendance').select('status').eq('student_id', uid);
  var partR = await sb.from('participation').select('points').eq('student_id', uid);
  var att = attR.data || [];
  var pts = (partR.data || []).reduce(function (a, x) { return a + (x.points || 0); }, 0);
  var attended = att.filter(function (a) { return a.status === 'present' || a.status === 'late'; }).length;
  var rate = att.length ? Math.round((attended / att.length) * 100) : null;
  var approved = state.mySubs.filter(function (s) { return s.status === 'approved'; }).length;
  return { rate: rate, points: pts, approved: approved, attTotal: att.length };
}

async function openStudentTasks() {
  var r = await sb.from('section_items').select('*')
    .eq('accepts_submissions', true).eq('is_published', true)
    .order('due_at').order('created_at', false);
  return r.data || [];
}

async function loadSHome() {
  var grid = $('#sh-sections');
  grid.textContent = '';
  studentVisibleSections().forEach(function (s) {
    var card = el('button', { type: 'button', class: 'section-card' });
    var head = el('div', { class: 'sc-title' });
    head.appendChild(icon(SECTION_ICONS[s.slug] || 'grid'));
    head.appendChild(el('span', { text: L(s, 'title') }));
    if (addSectionBadges(head, s)) card.classList.add('has-new');
    card.appendChild(head);
    card.addEventListener('click', function () { showStudentScreen('section', s.slug); });
    grid.appendChild(card);
  });
  if (state.guest) {
    $('#sh-welcome').textContent = t('welcomeGuest');
    hide($('#sh-stats'));
    return;
  }
  show($('#sh-stats'));
  $('#sh-welcome').textContent = t('welcome') + ', ' + (state.profile ? state.profile.full_name : '');
  var st = await studentStats();
  $('#sh-att').textContent = st.rate == null ? '--' : st.rate + '%';
  $('#sh-points').textContent = String(st.points);
  $('#sh-approved').textContent = String(st.approved);
  var items = await openStudentTasks();
  var byItem = latestSubByItem();
  var open = items.filter(function (it) {
    var s = byItem[it.id];
    return !s || s.status === 'needs_revision';
  }).length;
  $('#sh-open').textContent = String(open);
}

function itemAttachmentNodes(it) {
  var nodes = [];
  if (it.item_type === 'image' && it.file_path) {
    nodes.push(el('img', { class: 'item-img', src: sb.storage.publicUrl('materials', it.file_path), alt: L(it, 'title') }));
  }
  var emb = ytEmbed(it.external_url);
  if (emb) {
    var wrap = el('div', { class: 'video-embed' });
    var ifr = document.createElement('iframe');
    ifr.src = emb;
    ifr.setAttribute('allowfullscreen', '');
    wrap.appendChild(ifr);
    nodes.push(wrap);
  }
  return nodes;
}

function itemFootNodes(it, forStudent) {
  var foot = [];
  if (it.file_path && it.item_type !== 'image') {
    foot.push(el('a', { class: 'btn-outline btn-sm', href: sb.storage.publicUrl('materials', it.file_path), target: '_blank', rel: 'noopener' },
      icon('doc'), el('span', { text: t('open') + ' ' + t('file') })));
  }
  if (it.external_url && !ytEmbed(it.external_url)) {
    foot.push(el('a', { class: 'btn-outline btn-sm', href: it.external_url, target: '_blank', rel: 'noopener' },
      icon('link'), el('span', { text: t('open') })));
  }
  return foot;
}

/* الجديد الذي لم تفتحه الطالبة يتقدّم القائمة، والأحدث رفعاً أولاً.
   وما فتحته يبقى على ترتيب المعلمة المعتاد تحته. */
function sortNewFirst(items) {
  var fresh = [], rest = [];
  items.forEach(function (it) { (isNewItem(it.id) ? fresh : rest).push(it); });
  fresh.sort(function (a, b) {
    var d = String(b.created_at || '').localeCompare(String(a.created_at || ''));
    return d !== 0 ? d : (b.id - a.id);
  });
  return fresh.concat(rest);
}

async function loadSSection(slug) {
  var sec = state.sections.find(function (s) { return s.slug === slug; });
  if (!sec) { showStudentScreen('home'); return; }
  $('#ss-title').textContent = L(sec, 'title');
  $('#ss-sub').textContent = '';
  var box = $('#ss-items');
  box.textContent = '';
  box.appendChild(loadingBox());
  var r = await sb.from('section_items').select('*')
    .eq('section_id', sec.id).eq('is_published', true)
    .order('sort_order').order('created_at');
  var items = sortNewFirst(r.data || []);
  box.textContent = '';
  var special = SPECIAL_SECTIONS[sec.slug];
  if (special) { await special(box); }
  if (!items.length) {
    if (!special) box.appendChild(emptyBox());
    return;
  }
  var byItem = latestSubByItem();

  items.forEach(function (it) {
    var fresh = isNewItem(it.id);
    var card = el('div', { class: 'item-card' + (fresh ? ' is-new' : '') });
    var titleRow = el('div', { class: 'item-title' });
    titleRow.appendChild(el('span', { text: L(it, 'title') }));
    if (fresh) titleRow.appendChild(el('span', { class: 'new-chip', text: t('isNew') }));
    if (it.accepts_submissions && it.due_at) {
      titleRow.appendChild(el('span', { class: 'badge b-gray', text: t('dueBefore') + ' ' + fmtDateTime(it.due_at) }));
    }
    card.appendChild(titleRow);
    /* أول لمسة على العنصر تعني أنها فتحته: يختفي الوسم والتحديد عنه
       وحده، ويبقى مكانه في القائمة حتى تعود للقسم مرة أخرى */
    if (fresh) {
      card.addEventListener('click', function () {
        if (!card.classList.contains('is-new')) return;
        card.classList.remove('is-new');
        var chip = card.querySelector('.new-chip');
        if (chip) chip.remove();
        markItemSeen(it);
      });
    }
    var body = L(it, 'body');
    if (body) card.appendChild(el('div', { class: 'item-body', text: body }));
    itemAttachmentNodes(it).forEach(function (n) { card.appendChild(n); });

    var footNodes = itemFootNodes(it, true);
    if (it.accepts_submissions) {
      var mySub = state.guest ? null : byItem[it.id];
      if (!state.guest) {
        if (mySub) footNodes.push(subBadge(mySub.status));
        else footNodes.push(el('span', { class: 'badge b-gray', text: t('notSubmitted') }));
      }
      if (!mySub) {
        footNodes.push(el('button', {
          type: 'button', class: 'btn btn-sm',
          onclick: function () { openUploadModal(it, null); }
        }, icon('upload'), el('span', { text: t('upload') })));
      } else if (mySub.status === 'needs_revision') {
        footNodes.push(el('button', {
          type: 'button', class: 'btn btn-sm',
          onclick: function () { openUploadModal(it, mySub); }
        }, icon('upload'), el('span', { text: t('resubmit') })));
      }
    }
    if (footNodes.length) {
      var foot = el('div', { class: 'item-foot' });
      footNodes.forEach(function (n) { foot.appendChild(n); });
      card.appendChild(foot);
    }
    box.appendChild(card);
  });
}

/* ------------------------------------------------ الأقسام الخاصة
   participation / attendance / feedback : الطالبة ترى بياناتها بعد الدخول
   parents : بطاقة توصل ولي الأمر للبوابة مباشرة */
function loginPromptCard() {
  var card = el('div', { class: 'card', style: 'margin-bottom:16px' });
  var b = el('div', { class: 'card-b', style: 'text-align:center' });
  b.appendChild(el('p', { class: 'muted', text: t('loginToView') }));
  b.appendChild(el('button', { type: 'button', class: 'btn', onclick: gotoAuth },
    el('span', { text: t('login') })));
  card.appendChild(b);
  return card;
}

function attCountChips(rows) {
  var chips = el('div', { class: 'chips-row' });
  var counts = { present: 0, absent: 0, late: 0, excused: 0 };
  rows.forEach(function (a) { if (counts[a.status] != null) counts[a.status]++; });
  ATT_STATUSES.forEach(function (pair) {
    chips.appendChild(el('span', {
      class: 'badge ' + { present: 'b-green', absent: 'b-red', late: 'b-amber', excused: 'b-navy' }[pair[0]],
      text: t('at_' + pair[0]) + ' ' + counts[pair[0]]
    }));
  });
  if (rows.length) {
    var rate = Math.round(((counts.present + counts.late) / rows.length) * 100);
    chips.appendChild(el('span', { class: 'badge b-gray', text: t('attRate') + ' ' + rate + '%' }));
  }
  return chips;
}

async function renderMyAttendance(box) {
  if (!state.profile) { box.appendChild(loginPromptCard()); return; }
  var r = await sb.from('attendance').select('*')
    .eq('student_id', sb.userId()).order('class_date', false).limit(60);
  var rows = r.data || [];
  var card = el('div', { class: 'card', style: 'margin-bottom:16px' });
  var body = el('div', { class: 'card-b' });
  body.appendChild(attCountChips(rows));
  if (!rows.length) {
    body.appendChild(emptyBox());
  } else {
    var wrap = el('div', { class: 'tbl-wrap', style: 'margin-top:14px' });
    var table = el('table', { class: 'tbl' });
    table.appendChild(el('thead', {}, el('tr', {},
      el('th', { text: t('date') }), el('th', { text: t('status') }))));
    var tbody = el('tbody');
    rows.forEach(function (a) {
      var tr = el('tr', {}, el('td', { text: fmtDate(a.class_date) }));
      var td = el('td'); td.appendChild(attBadge(a.status)); tr.appendChild(td);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    body.appendChild(wrap);
  }
  card.appendChild(body);
  box.appendChild(card);
}

async function renderMyParticipation(box) {
  if (!state.profile) { box.appendChild(loginPromptCard()); return; }
  var r = await sb.from('participation').select('*')
    .eq('student_id', sb.userId()).order('class_date', false).limit(100);
  var rows = r.data || [];
  var total = rows.reduce(function (a, x) { return a + (x.points || 0); }, 0);
  var card = el('div', { class: 'card', style: 'margin-bottom:16px' });
  var body = el('div', { class: 'card-b' });
  body.appendChild(el('div', { class: 'chips-row' },
    el('span', { class: 'badge b-navy', text: t('totalPoints') + ' ' + total })));
  if (!rows.length) {
    body.appendChild(emptyBox());
  } else {
    var wrap = el('div', { class: 'tbl-wrap', style: 'margin-top:14px' });
    var table = el('table', { class: 'tbl' });
    table.appendChild(el('thead', {}, el('tr', {},
      el('th', { text: t('date') }), el('th', { text: t('points') }), el('th', { text: t('note') }))));
    var tbody = el('tbody');
    rows.forEach(function (p) {
      tbody.appendChild(el('tr', {},
        el('td', { text: fmtDate(p.class_date) }),
        el('td', { text: String(p.points) }),
        el('td', { text: p.note || '' })));
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    body.appendChild(wrap);
  }
  card.appendChild(body);
  box.appendChild(card);
}

async function renderFeedbackSection(box) {
  if (!state.profile) { box.appendChild(loginPromptCard()); return; }
  var card = el('div', { class: 'card', style: 'margin-bottom:16px' });
  card.appendChild(el('div', { class: 'card-h', text: t('writeFeedback') }));
  var body = el('div', { class: 'card-b' });
  var ta = el('textarea');
  body.appendChild(el('div', { class: 'field' }, ta));
  var listWrap = el('div');
  async function refreshList() {
    listWrap.textContent = '';
    var r = await sb.from('feedback').select('*')
      .eq('author_id', sb.userId()).order('created_at', false);
    var rows = r.data || [];
    if (!rows.length) { listWrap.appendChild(emptyBox()); return; }
    rows.forEach(function (f) {
      var fc = el('div', { class: 'fb-card' });
      fc.appendChild(el('div', { class: 'fb-meta', text: fmtDateTime(f.created_at) }));
      fc.appendChild(el('div', { class: 'fb-body', text: f.body }));
      if (f.teacher_reply) {
        var rep = el('div', { class: 'fb-reply' });
        rep.appendChild(el('div', { class: 'fb-reply-label', text: t('teacherReply') }));
        rep.appendChild(el('div', { text: f.teacher_reply }));
        fc.appendChild(rep);
      }
      listWrap.appendChild(fc);
    });
  }
  body.appendChild(el('button', {
    type: 'button', class: 'btn',
    onclick: async function () {
      var txt = ta.value.trim();
      if (!txt) return;
      var r = await sb.from('feedback').insert({ author_id: sb.userId(), body: txt }).select('id');
      if (r.error) { toast(t('err'), true); return; }
      ta.value = '';
      toast(t('sent'));
      refreshList();
    }
  }, el('span', { text: t('send') })));
  card.appendChild(body);
  box.appendChild(card);
  box.appendChild(listWrap);
  await refreshList();
}

async function renderParentsSection(box) {
  var card = el('div', { class: 'card', style: 'margin-bottom:16px' });
  var body = el('div', { class: 'card-b' });
  body.appendChild(el('p', { class: 'muted', text: t('parentsHint') }));
  body.appendChild(el('button', { type: 'button', class: 'btn', onclick: gotoParent },
    icon('key'), el('span', { text: t('parentPortal') })));
  card.appendChild(body);
  box.appendChild(card);
}

var SPECIAL_SECTIONS = {
  participation: renderMyParticipation,
  attendance: renderMyAttendance,
  feedback: renderFeedbackSection,
  parents: renderParentsSection
};

/* ================================================ رسائل الأمهات (واتساب)
   القوالب محفوظة في قاعدة البيانات وتعدّلها المعلمة.
   المتغيرات تُستبدل قبل الإرسال، ثم يُفتح واتساب بالرسالة جاهزة. */
var TPL_KEYS = ['tpl_excellence', 'tpl_absence', 'tpl_late', 'tpl_low_level', 'tpl_report',
                'tpl_student_praise', 'tpl_student_nudge'];
var TPL_VARS = ['{student}', '{reason}', '{date}', '{absences}', '{percent}',
                '{attrate}', '{points}', '{approved}', '{teacher}', '{platform}'];

var TPL_FALLBACK = {
  tpl_excellence: 'السلام عليكم\nولية أمر الطالبة {student}\n\nحصلت ابنتكم على مكان في لوحة الأداء المتميز.\nسبب التميز: {reason}\n\n{teacher}\n{platform}',
  tpl_absence: 'السلام عليكم\nولية أمر الطالبة {student}\n\nتنبيه بشأن غياب ابنتكم بتاريخ {date}.\nعدد أيام الغياب: {absences}\n\n{teacher}\n{platform}',
  tpl_late: 'السلام عليكم\nولية أمر الطالبة {student}\n\nتنبيه بتأخر ابنتكم عن الحصة بتاريخ {date}.\n\n{teacher}\n{platform}',
  tpl_low_level: 'السلام عليكم\nولية أمر الطالبة {student}\n\nمستوى ابنتكم يحتاج دعماً ومتابعة.\nمتوسط الدرجات: {percent}%\nنسبة الحضور: {attrate}%\n\n{teacher}\n{platform}',
  tpl_report: 'السلام عليكم\nولية أمر الطالبة {student}\n\nتقرير متابعة:\nنسبة الحضور: {attrate}%\nأيام الغياب: {absences}\nنقاط المشاركة: {points}\nالأعمال المعتمدة: {approved}\nمتوسط الدرجات: {percent}%\n\n{teacher}\n{platform}',
  tpl_student_praise: 'السلام عليكم\nالطالبة {student}\n\nأحسنتِ! مشاركتك متميزة وبلغت {points} نقطة.\n\n{teacher}\n{platform}',
  tpl_student_nudge: 'السلام عليكم\nالطالبة {student}\n\nمشاركتك قليلة حتى الآن ({points} نقطة)، وأنا واثقة من قدرتك.\n\n{teacher}\n{platform}'
};

async function loadTemplates(force) {
  if (state.templates && !force) return state.templates;
  var map = {};
  var r = await sb.from('settings').select('*').in_('skey', TPL_KEYS);
  (r.data || []).forEach(function (row) { map[row.skey] = row.svalue || ''; });
  TPL_KEYS.forEach(function (k) { if (!map[k]) map[k] = TPL_FALLBACK[k]; });
  state.templates = map;
  return map;
}

function fillTpl(tpl, vars) {
  var out = String(tpl || '');
  Object.keys(vars).forEach(function (k) {
    var v = vars[k];
    out = out.split('{' + k + '}').join(v == null ? '' : String(v));
  });
  /* أي متغير غير معروف يُنظّف حتى لا يظهر للأم */
  return out.replace(/\{[a-z_]+\}/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function statsVars(stu, s) {
  s = s || {};
  return {
    student: stu.full_name,
    mother: stu.mother_name || '',
    date: fmtDate(s.date || new Date()),
    reason: s.reason || '',
    absences: s.absences == null ? 0 : s.absences,
    percent: s.percent == null ? '--' : s.percent,
    attrate: s.attrate == null ? '--' : s.attrate,
    points: s.points == null ? 0 : s.points,
    approved: s.approved == null ? 0 : s.approved,
    teacher: teacherName(),
    platform: platformName()
  };
}

function waUrl(phone, text) {
  return 'https://wa.me/' + waPhone(phone) + '?text=' + encodeURIComponent(text);
}

async function logParentMessage(studentId, kind, note) {
  try {
    await sb.from('parent_messages')
      .insert({ student_id: studentId, kind: kind, note: note || null }).select('id');
  } catch (e) { /* التسجيل ثانوي، لا نعطّل الإرسال */ }
}

/* نافذة المراجعة قبل الإرسال: المعلمة تقرأ الرسالة وتعدلها ثم تفتح واتساب */
function openWaModal(stu, kind, text, onSent) {
  if (!stu.mother_phone) {
    toast(t('noMotherPhone'), true);
    openMotherModal(stu, onSent);
    return;
  }
  $('#wa-to').textContent = (stu.mother_name ? stu.mother_name + ' — ' : '')
    + t('motherPhone') + ' ' + intlPhone(stu.mother_phone);
  $('#wa-text').value = text;
  $('#wa-title').textContent = t('sendToMother') + ' — ' + stu.full_name;
  $('#wa-copy').onclick = function () { copyText($('#wa-text').value); };
  $('#wa-send').onclick = function () {
    var body = $('#wa-text').value;
    window.open(waUrl(stu.mother_phone, body), '_blank');
    logParentMessage(stu.id, kind, null);
    closeModal('modal-wa');
    toast(t('msgLogged'));
    if (onSent) onSent();
  };
  openModal('modal-wa');
}

/* تعديل بيانات الطالبة: اسمها ورقمها وبيانات أمها */
function openMotherModal(stu, onDone) {
  $('#mm-student-name').value = stu.full_name || '';
  fillClassSelect($('#mm-class'), stu.class_id, false);
  $('#mm-student-phone').value = stu.phone ? intlPhone(stu.phone) : '';
  $('#mm-phone').value = stu.mother_phone ? intlPhone(stu.mother_phone) : '';
  $('#mm-name').value = stu.mother_name || '';
  bindPhoneInput($('#mm-student-phone'));
  bindPhoneInput($('#mm-phone'));

  $('#mm-save').onclick = async function () {
    var nameV = $('#mm-student-name').value.trim().replace(/\s+/g, ' ');
    var stuPhone = $('#mm-student-phone').value.trim();
    var mPhone = $('#mm-phone').value.trim();

    if (nameV.split(' ').filter(Boolean).length < 3) { toast(t('nameInvalid'), true); return; }
    if (!isPhone(stuPhone)) { toast(t('phoneInvalid'), true); return; }
    if (mPhone && !isPhone(mPhone)) { toast(t('motherPhoneInvalid'), true); return; }
    if (normPhone(stuPhone) === normPhone(CONFIG.TEACHER_PHONE)) { toast(t('alreadyReg'), true); return; }

    var payload = {
      full_name: nameV,
      class_id: Number($('#mm-class').value || 0) || null,
      phone: normPhone(stuPhone),
      mother_phone: mPhone ? normPhone(mPhone) : '',
      mother_name: $('#mm-name').value.trim()
    };
    var btn = $('#mm-save');
    btn.disabled = true;
    var r = await sb.from('profiles').update(payload).eq('id', stu.id).select('id');
    btn.disabled = false;
    if (r.error) {
      var msg = String(r.error).toLowerCase();
      if (msg.indexOf('already') > -1) toast(t('phoneTaken'), true);
      else if (msg.indexOf('invalid_name') > -1) toast(t('nameInvalid'), true);
        else if (msg.indexOf('invalid_phone') > -1) toast(t('phoneInvalid'), true);
      else toast(t('err'), true);
      return;
    }
    stu.full_name = payload.full_name;
    stu.class_id = payload.class_id;
    stu.phone = payload.phone;
    stu.mother_phone = payload.mother_phone || null;
    stu.mother_name = payload.mother_name || null;
    closeModal('modal-mother');
    toast(t('saved'));
    state.students = null;
    state.stuData = null;
    if (onDone) onDone();
  };
  /* حذف الحساب: يُستخدم لإزالة حساب مكرر أو خاطئ */
  $('#mm-delete').onclick = function () {
    askConfirm(t('deleteAccountConfirm').replace('{name}', stu.full_name), async function () {
      var btn = $('#mm-delete');
      btn.disabled = true;
      var r = await apiPost('delete_student', { student_id: stu.id, confirm: 'DELETE' }, false);
      btn.disabled = false;
      if (!r || r.error) { toast(t('err'), true); return; }
      closeModal('modal-mother');
      toast(t('accountDeleted'));
      /* تفريغ الذاكرة حتى لا يظهر الحساب المحذوف */
      state.students = null; state.stuData = null; state.mothersData = null;
      if (onDone) onDone();
      else if (state.nav.screen === 'student') showTeacherScreen('students');
    });
  };

  openModal('modal-mother');
}

/* =====================================================================
   شاشة تواصل الأمهات
   تبني قائمة الحالات تلقائياً: تميز / غياب / تأخر / تدني مستوى
   وتعطي لكل حالة رسالة جاهزة تُفتح في واتساب على رقم الأم.
   ===================================================================== */
var LOW_LEVEL_PERCENT = 60;   /* أقل من هذه النسبة يُعد مستوى متدنياً */
var ABSENCE_ALERT_DAYS = 3;   /* عدد أيام الغياب الذي يستدعي تنبيه الأم */

function moShowTab(key) {
  state.moTab = key;
  $$('#mo-tabs .tab').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-tab') === key);
  });
  ['followup', 'all', 'tpl'].forEach(function (k) {
    var p = $('#mo-panel-' + k);
    if (k === key) show(p); else hide(p);
  });
}

/* يحسب إحصاءات كل طالبة مرة واحدة ويصنّف حالتها */
async function buildMothersData() {
  var students = await getStudents(true);
  var attR = await sb.from('attendance').select('student_id,class_date,status').limit(1000);
  var partR = await sb.from('participation').select('student_id,points').limit(1000);
  var subR = await sb.from('submissions').select('student_id,status,grade,max_grade').limit(1000);
  var excR = await sb.from('excellence_board').select('student_id,student_name,reason_ar,reason_en,added_at')
    .eq('is_active', true).limit(500);
  var msgR = await sb.from('parent_messages').select('student_id,kind,sent_at')
    .order('sent_at', false).limit(1000);

  var att = attR.data || [], part = partR.data || [], subs = subR.data || [];
  var exc = excR.data || [], msgs = msgR.data || [];
  var today = todayStr();

  var lastMsg = {};
  msgs.forEach(function (m) {
    var k = m.student_id + '|' + m.kind;
    if (!lastMsg[k]) lastMsg[k] = m.sent_at;
    if (!lastMsg[m.student_id]) lastMsg[m.student_id] = m.sent_at;
  });

  var rows = students.map(function (stu) {
    var myAtt = att.filter(function (a) { return a.student_id === stu.id; });
    var absences = myAtt.filter(function (a) { return a.status === 'absent'; }).length;
    var attended = myAtt.filter(function (a) { return a.status === 'present' || a.status === 'late'; }).length;
    var attrate = myAtt.length ? Math.round((attended / myAtt.length) * 100) : null;
    var absentToday = myAtt.some(function (a) { return a.class_date === today && a.status === 'absent'; });
    var lateToday = myAtt.some(function (a) { return a.class_date === today && a.status === 'late'; });

    var points = part.filter(function (p) { return p.student_id === stu.id; })
      .reduce(function (a, p) { return a + (p.points || 0); }, 0);

    var mySubs = subs.filter(function (x) { return x.student_id === stu.id; });
    var approved = mySubs.filter(function (x) { return x.status === 'approved'; });
    var graded = approved.filter(function (x) { return x.grade != null && x.max_grade > 0; });
    var percent = graded.length
      ? Math.round((graded.reduce(function (a, x) { return a + (x.grade / x.max_grade); }, 0) / graded.length) * 100)
      : null;

    var myExc = exc.find(function (x) { return x.student_id === stu.id; }) || null;

    return {
      stu: stu, absences: absences, attrate: attrate, absentToday: absentToday,
      lateToday: lateToday, points: points, approved: approved.length,
      percent: percent, exc: myExc, lastMsg: lastMsg[stu.id] || null, lastByKind: lastMsg
    };
  });

  state.mothersData = rows;
  return rows;
}

function caseBadge(kind) {
  var map = {
    excellence: ['b-brass', 'caseExcellence'], absence: ['b-red', 'caseAbsence'],
    late: ['b-amber', 'caseLate'], low_level: ['b-navy', 'caseLowLevel']
  };
  var m = map[kind] || ['b-gray', 'caseExcellence'];
  return el('span', { class: 'badge ' + m[0], text: t(m[1]) });
}

function lastContactLine(r, kind) {
  var v = r.lastByKind[r.stu.id + '|' + kind] || null;
  return el('div', {
    class: 'muted small',
    text: t('lastContact') + ': ' + (v ? fmtDateTime(v) : t('neverContacted'))
  });
}

/* يبني نص الرسالة لحالة معينة اعتماداً على القالب المحفوظ */
async function messageFor(r, kind) {
  var tpls = await loadTemplates();
  var extra = {
    absences: r.absences, attrate: r.attrate, percent: r.percent,
    points: r.points, approved: r.approved, date: new Date()
  };
  if (kind === 'excellence' && r.exc) extra.reason = L(r.exc, 'reason') || '';
  return fillTpl(tpls[kind === 'excellence' ? 'tpl_excellence'
    : kind === 'absence' ? 'tpl_absence'
    : kind === 'late' ? 'tpl_late'
    : kind === 'low_level' ? 'tpl_low_level' : 'tpl_report'],
    statsVars(r.stu, extra));
}

function moCaseCard(r, kind) {
  var card = el('div', { class: 'mo-card' });
  var head = el('div', { class: 'mo-head' });
  var left = el('div');
  left.appendChild(el('div', { class: 'mo-name', text: r.stu.full_name }));
  var chips = el('div', { class: 'chips-row' });
  chips.appendChild(caseBadge(kind));
  if (kind === 'absence') {
    chips.appendChild(el('span', { class: 'badge b-gray', text: t('absenceDays') + ' ' + r.absences }));
  }
  if (kind === 'low_level') {
    chips.appendChild(el('span', { class: 'badge b-gray', text: t('avgGrade') + ' ' + (r.percent == null ? '--' : r.percent + '%') }));
  }
  if (r.attrate != null) {
    chips.appendChild(el('span', { class: 'badge b-gray', text: t('attRate') + ' ' + r.attrate + '%' }));
  }
  left.appendChild(chips);
  left.appendChild(lastContactLine(r, kind));
  head.appendChild(left);

  var actions = el('div', { class: 'btn-row' });
  if (!r.stu.mother_phone) {
    actions.appendChild(el('span', { class: 'badge b-red', text: t('noMotherPhone') }));
    actions.appendChild(el('button', {
      type: 'button', class: 'btn-outline btn-sm',
      onclick: function () { openMotherModal(r.stu, function () { loadTMothers(); }); }
    }, el('span', { text: t('addMotherPhone') })));
  } else {
    actions.appendChild(el('button', {
      type: 'button', class: 'btn btn-wa btn-sm',
      onclick: async function () {
        var txt = await messageFor(r, kind);
        openWaModal(r.stu, kind, txt, function () { loadTMothers(); });
      }
    }, el('span', { text: t('notifyMother') })));
    actions.appendChild(el('button', {
      type: 'button', class: 'btn-outline btn-sm',
      onclick: async function () {
        var txt = await messageFor(r, 'report');
        openWaModal(r.stu, 'report', txt, function () { loadTMothers(); });
      }
    }, el('span', { text: t('sendReport') })));
  }
  head.appendChild(actions);
  card.appendChild(head);
  return card;
}

async function loadTMothers() {
  moShowTab(state.moTab || 'followup');
  var fu = $('#mo-panel-followup');
  fu.textContent = '';
  fu.appendChild(loadingBox());
  var rows = await buildMothersData();
  await loadTemplates();

  /* --- تبويب المتابعة: الحالات فقط --- */
  fu.textContent = '';
  var cases = [];
  rows.forEach(function (r) {
    if (r.exc) cases.push({ r: r, kind: 'excellence' });
    if (r.absentToday || r.absences >= ABSENCE_ALERT_DAYS) cases.push({ r: r, kind: 'absence' });
    if (r.lateToday) cases.push({ r: r, kind: 'late' });
    if (r.percent != null && r.percent < LOW_LEVEL_PERCENT) cases.push({ r: r, kind: 'low_level' });
  });
  if (!cases.length) {
    fu.appendChild(el('div', { class: 'card' },
      el('div', { class: 'card-b', style: 'text-align:center' },
        el('p', { class: 'muted', text: t('allGood') }))));
  } else {
    var order = { absence: 0, late: 1, low_level: 2, excellence: 3 };
    cases.sort(function (a, b) { return order[a.kind] - order[b.kind]; });
    var wrap = el('div', { class: 'card' });
    wrap.appendChild(el('div', { class: 'card-h', text: t('notifyAllTitle') + ' (' + cases.length + ')' }));
    var body = el('div', { class: 'card-b' });
    cases.forEach(function (c) { body.appendChild(moCaseCard(c.r, c.kind)); });
    wrap.appendChild(body);
    fu.appendChild(wrap);
  }

  /* --- تبويب كل الأمهات: جدول مع تعديل الرقم --- */
  var box = $('#mo-all-list');
  box.textContent = '';
  if (!rows.length) { box.appendChild(emptyBox()); }
  else {
    var table = el('table', { class: 'tbl' });
    table.appendChild(el('thead', {}, el('tr', {},
      el('th', { text: t('student') }), el('th', { text: t('motherName') }),
      el('th', { text: t('motherPhone') }), el('th', { text: t('lastContact') }),
      el('th', { class: 'actions-cell', text: t('actions') }))));
    var tbody = el('tbody');
    rows.forEach(function (r) {
      var tr = el('tr', {}, el('td', { text: r.stu.full_name }),
        el('td', { text: r.stu.mother_name || '--' }));
      var pTd = el('td', { class: 'ltr' });
      if (r.stu.mother_phone) pTd.appendChild(el('span', { text: intlPhone(r.stu.mother_phone) }));
      else pTd.appendChild(el('span', { class: 'badge b-red', text: t('noMotherPhone') }));
      tr.appendChild(pTd);
      tr.appendChild(el('td', { class: 'small muted', text: r.lastMsg ? fmtDateTime(r.lastMsg) : t('neverContacted') }));
      var aTd = el('td', { class: 'actions-cell' });
      aTd.appendChild(el('button', {
        type: 'button', class: 'btn-outline btn-sm',
        onclick: function () { openMotherModal(r.stu, function () { loadTMothers(); }); }
      }, el('span', { text: t('edit') })));
      if (r.stu.mother_phone) {
        aTd.appendChild(el('button', {
          type: 'button', class: 'btn btn-wa btn-sm',
          onclick: async function () {
            var txt = await messageFor(r, 'report');
            openWaModal(r.stu, 'report', txt, function () { loadTMothers(); });
          }
        }, el('span', { text: t('sendReport') })));
      }
      tr.appendChild(aTd);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    box.appendChild(table);
  }

  /* --- تبويب الرسائل: تعديل القوالب --- */
  var varsBox = $('#mo-tpl-vars');
  varsBox.textContent = '';
  TPL_VARS.forEach(function (v) {
    varsBox.appendChild(el('span', { class: 'badge b-gray ltr', text: v }));
  });
  var tplBox = $('#mo-tpl-list');
  tplBox.textContent = '';
  TPL_KEYS.forEach(function (k) {
    var card = el('div', { class: 'card mt' });
    card.appendChild(el('div', { class: 'card-h', text: t(k) }));
    var body = el('div', { class: 'card-b' });
    var ta = el('textarea', { rows: '9' });
    ta.value = state.templates[k] || '';
    body.appendChild(el('div', { class: 'field' }, ta));
    body.appendChild(el('button', {
      type: 'button', class: 'btn',
      onclick: async function () {
        var r2 = await sb.from('settings')
          .upsert({ skey: k, svalue: ta.value }, 'skey').select('id');
        if (r2.error) { toast(t('err'), true); return; }
        state.templates[k] = ta.value;
        toast(t('saved'));
      }
    }, el('span', { text: t('save') })));
    card.appendChild(body);
    tplBox.appendChild(card);
  });
}

/* ================================================ الفصول */
async function loadClasses(force) {
  /* قائمة فارغة لا تُعتبر محمّلة: المعلمة قد تكون أنشأت أول فصل بعد
     فتح الصفحة، فلا نُبقيها ترى "لا توجد فصول" طوال الجلسة */
  if (state.classes && state.classes.length && !force) return state.classes;
  var r = await sb.from('classes').select('*').eq('is_active', true).order('sort_order');
  state.classes = r.data || [];
  return state.classes;
}

function className(id) {
  var c = (state.classes || []).find(function (x) { return x.id === id; });
  return c ? c.name : '';
}

/* أسماء الفصول التي وُجّه إليها المحتوى، لعرضها على بطاقة المعلمة */
function classNamesFor(ids) {
  var names = (ids || []).map(className).filter(function (n) { return n; });
  if (!names.length) return t('audClass');
  return names.join(' • ');
}

function fillClassSelect(sel, selectedId, withAll) {
  if (!sel) return;
  sel.textContent = '';
  if (withAll) sel.appendChild(el('option', { value: '', text: t('allClasses') }));
  else sel.appendChild(el('option', { value: '', text: t('chooseClass') }));
  (state.classes || []).forEach(function (c) {
    var o = el('option', { value: String(c.id), text: c.name });
    if (selectedId && c.id === selectedId) o.selected = true;
    sel.appendChild(o);
  });
  if (withAll && !selectedId) sel.value = '';
}

/* إدارة الفصول: تضيفها المعلمة وتعدّلها وتحذفها */
async function renderClassesAdmin() {
  var box = $('#cls-list');
  if (!box) return;
  await loadClasses(true);
  box.textContent = '';
  var list = state.classes || [];
  if (!list.length) {
    box.appendChild(el('p', { class: 'muted small', text: t('noClassesYet') }));
    return;
  }
  var counts = {};
  (state.students || []).forEach(function (u) {
    if (u.class_id) counts[u.class_id] = (counts[u.class_id] || 0) + 1;
  });
  var wrap = el('div', { class: 'chips-row' });
  list.forEach(function (c) {
    var chip = el('span', { class: 'class-chip' });
    chip.appendChild(el('span', { text: c.name }));
    var n = counts[c.id] || 0;
    chip.appendChild(el('span', { class: 'class-count', text: String(n) }));
    chip.appendChild(el('button', {
      type: 'button', class: 'chip-x', title: t('rename'),
      onclick: function () { renameClass(c); }
    }, icon('edit')));
    chip.appendChild(el('button', {
      type: 'button', class: 'chip-x', title: t('del'),
      onclick: function () { deleteClass(c, n); }
    }, icon('trash')));
    wrap.appendChild(chip);
  });
  box.appendChild(wrap);
}

async function addClass() {
  var inp = $('#cls-name');
  var name = inp.value.trim().replace(/\s+/g, ' ');
  if (!name) { inp.focus(); return; }
  var exists = (state.classes || []).some(function (c) { return c.name === name; });
  if (exists) { toast(t('classExists'), true); return; }
  var order = (state.classes || []).length + 1;
  var r = await sb.from('classes').insert({ name: name, sort_order: order }).select('id');
  if (r.error) {
    toast(String(r.error).indexOf('Duplicate') > -1 ? t('classExists') : t('err'), true);
    return;
  }
  inp.value = '';
  toast(t('saved'));
  await renderClassesAdmin();
  refreshClassSelects();
}

function renameClass(c) {
  var name = window.prompt(t('renameClass'), c.name);
  if (name === null) return;
  name = name.trim().replace(/\s+/g, ' ');
  if (!name || name === c.name) return;
  sb.from('classes').update({ name: name }).eq('id', c.id).select('id').then(async function (r) {
    if (r.error) { toast(t('err'), true); return; }
    toast(t('saved'));
    await renderClassesAdmin();
    refreshClassSelects();
  });
}

function deleteClass(c, count) {
  if (count > 0) { toast(t('classInUse').replace('{n}', String(count)), true); return; }
  askConfirm(t('confirmDel'), async function () {
    var r = await sb.from('classes').remove().eq('id', c.id);
    if (r.error) { toast(t('err'), true); return; }
    toast(t('deleted'));
    await renderClassesAdmin();
    refreshClassSelects();
  });
}

/* تحديث كل قوائم الفصول في الصفحة بعد أي تعديل */
function refreshClassSelects() {
  fillClassSelect($('#reg-class'), null, false);
  fillClassSelect($('#stu-class'), state.stuClass, true);
  fillClassSelect($('#gb-class'), state.gbClass, true);
  fillClassSelect($('#ps-class'), state.psClass, true);
}

/* ================================================ النسخ الاحتياطي والصيانة */
var RESET_WORD = 'حذف';

/* أسماء الجداول كما تفهمها المعلمة */
var TABLE_LABELS = {
  users: 'الحسابات', classes: 'الفصول', sections: 'الأقسام',
  section_items: 'محتوى الأقسام', submissions: 'التسليمات',
  attendance: 'سجل الحضور', participation: 'نقاط المشاركة',
  excellence_board: 'لوحة الأداء المتميز', certificates: 'الشهادات',
  schedule_slots: 'الجدول الأسبوعي', feedback: 'التغذية الراجعة',
  parent_links: 'روابط أولياء الأمور', settings: 'الإعدادات والقوالب',
  parent_messages: 'سجل الرسائل', section_views: 'سجل المتابعة',
  item_views: 'سجل فتح المحتوى',
  grade_criteria: 'بنود الدرجات', grade_entries: 'الدرجات المرصودة'
};

/* تنزيل ملف من نقطة في الخلفية عبر رابط مباشر */
function downloadFromApi(action) {
  var url = CONFIG.API_URL + '?action=' + action;
  var a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function loadBackupStats() {
  var box = $('#bk-stats');
  if (!box) return;
  box.textContent = '';
  var d = await apiGet('db_stats');
  var rows = d && d.data ? d.data : null;
  if (!rows) return;

  box.appendChild(el('div', { class: 'card-h', style: 'padding:0 0 8px', text: t('currentData') }));
  var wrap = el('div', { class: 'chips-row' });
  rows.forEach(function (r) {
    if (!r.count) return;
    var chip = el('span', { class: 'class-chip' });
    chip.appendChild(el('span', { text: TABLE_LABELS[r.table] || r.table }));
    chip.appendChild(el('span', { class: 'class-count', text: String(r.count) }));
    wrap.appendChild(chip);
  });
  if (!wrap.children.length) {
    box.appendChild(el('p', { class: 'muted small', text: t('noData') }));
    return;
  }
  box.appendChild(wrap);
}

async function loadTBackup() {
  await loadBackupStats();
  var conf = $('#rs-confirm');
  if (conf && !conf.dataset.bound) {
    conf.dataset.bound = '1';
    conf.addEventListener('input', refreshResetBtn);
    $$('#rs-parts input[type="checkbox"]').forEach(function (c) {
      c.addEventListener('change', refreshResetBtn);
    });
    $('#rs-all').addEventListener('click', function () {
      var boxes = $$('#rs-parts input[type="checkbox"]');
      var allOn = boxes.every(function (b) { return b.checked; });
      boxes.forEach(function (b) { b.checked = !allOn; });
      refreshResetBtn();
    });
  }
  if (conf) conf.value = '';
  refreshResetBtn();
}

var PART_LABELS = {
  students: 'partStudents', content: 'partContent', sections: 'partSections',
  classes: 'partClasses', schedule: 'partSchedule', templates: 'partTemplates'
};

function selectedParts() {
  return $$('#rs-parts input[type="checkbox"]')
    .filter(function (c) { return c.checked; })
    .map(function (c) { return c.value; });
}

/* الزر يُفعَّل فقط عند اختيار شيء وكتابة كلمة التأكيد بالضبط */
function refreshResetBtn() {
  var conf = $('#rs-confirm');
  var go = $('#rs-go');
  if (!conf || !go) return;
  go.disabled = !(selectedParts().length && conf.value.trim() === RESET_WORD);
}

async function doReset() {
  var parts = selectedParts();
  var conf = $('#rs-confirm');
  if (!parts.length) { toast(t('nothingSelected'), true); return; }
  if (conf.value.trim() !== RESET_WORD) { toast(t('typeToConfirm'), true); return; }

  var names = parts.map(function (p) { return t(PART_LABELS[p]); }).join('، ');
  askConfirm(t('resetConfirm').replace('{scope}', names), async function () {
    var btn = $('#rs-go');
    btn.disabled = true;
    var r = await apiPost('reset', { confirm: 'RESET', parts: parts }, false);
    if (!r || r.error) { toast(t('err'), true); refreshResetBtn(); return; }

    toast(t('resetDone'));
    conf.value = '';
    /* تفريغ الذاكرة المحلية حتى لا تظهر بيانات محذوفة */
    state.students = null; state.stuData = null; state.classes = null;
    state.sections = []; state.templates = null; state.sheet = null;
    state.gbEntries = {}; state.unread = {}; state.newItems = {}; state.mothersData = null;
    refreshResetBtn();
    await loadBackupStats();
    if (parts.indexOf('sections') > -1 || parts.indexOf('content') > -1) await fetchSections();
  });
}

/* ================================================ تقدّم الطالبة ونقاطها */
async function loadProgress(studentId) {
  var d = await apiGet('progress'
    + (studentId ? '&student_id=' + encodeURIComponent(studentId) : ''));
  return (d && d.data) ? d.data : null;
}

/* بطاقة النقاط والبونص */
function renderPoints(box, data) {
  box.textContent = '';
  var wrap = el('div', { class: 'points-row' });
  var main = el('div', { class: 'points-main' });
  main.appendChild(el('span', { class: 'points-num', text: String(data.points) }));
  main.appendChild(el('span', { class: 'points-lbl', text: t('myPoints') }));
  wrap.appendChild(main);

  var right = el('div', { class: 'points-side' });
  if (data.bonus_count > 0) {
    var medals = el('div', { class: 'medal-row' });
    var show = Math.min(data.bonus_count, 8);
    for (var i = 0; i < show; i++) {
      medals.appendChild(el('span', { class: 'medal', title: t('bonusEarned') }, icon('award')));
    }
    if (data.bonus_count > show) {
      medals.appendChild(el('span', { class: 'muted small', text: '+' + (data.bonus_count - show) }));
    }
    right.appendChild(medals);
    right.appendChild(el('div', { class: 'small',
      text: t('bonusCount') + ': ' + data.bonus_count }));
  }
  var need = data.to_next;
  right.appendChild(el('div', { class: 'muted small',
    text: need === 0 ? t('bonusReady') : t('toNextBonus').replace('{n}', String(need)) }));
  wrap.appendChild(right);
  box.appendChild(wrap);

  /* شريط التقدم نحو البونص التالي */
  var step = data.bonus_step || 5;
  var inStep = data.points % step;
  var bar = el('div', { class: 'bonus-bar' });
  var fill = el('div', { class: 'bonus-fill' });
  fill.style.width = Math.round((inStep / step) * 100) + '%';
  bar.appendChild(fill);
  box.appendChild(bar);
}

/* رسم بياني بسيط بالأشرطة: المنجز مقابل المطلوب لكل قسم */
function renderProgressChart(box, rows) {
  box.textContent = '';
  var data = (rows || []).filter(function (r) { return r.total > 0; });
  if (!data.length) {
    box.appendChild(el('p', { class: 'muted small', style: 'margin-top:12px', text: t('noTasksYet') }));
    return;
  }
  var chart = el('div', { class: 'chart' });
  data.forEach(function (r) {
    var pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
    var row = el('div', { class: 'chart-row' });
    row.appendChild(el('div', { class: 'chart-label', text: L(r, 'title') }));
    var track = el('div', { class: 'chart-track' });
    var fill = el('div', { class: 'chart-fill' + (pct >= 100 ? ' done' : '') });
    fill.style.width = Math.max(pct, 2) + '%';
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el('div', { class: 'chart-val', text: r.done + '/' + r.total }));
    chart.appendChild(row);
  });
  box.appendChild(chart);
}

async function loadStudentProgress() {
  var card = $('#sh-progress-card');
  if (!card) return;
  if (state.guest || !state.profile || state.profile.status !== 'approved') { hide(card); return; }
  var data = await loadProgress(null);
  if (!data) { hide(card); return; }
  show(card);
  renderPoints($('#sh-bonus'), data);
  renderProgressChart($('#sh-chart'), data.sections);
}

/* ================================================ سجل الدرجات
   مطابق لنموذج الإشراف التربوي: لكل بند عدة خانات رصد تُجمع تلقائياً
   وتُسقَّف بالدرجة القصوى. الحفظ فوري عند مغادرة الخانة، فتُفتح الحصة
   القادمة بنفس ما رُصد. */
function gbGroups(criteria) {
  var groups = [];
  criteria.forEach(function (c) {
    var key = LANG === 'en' ? (c.group_en || c.group_ar) : c.group_ar;
    var g = groups.find(function (x) { return x.key === key; });
    if (!g) { g = { key: key, items: [] }; groups.push(g); }
    g.items.push(c);
  });
  return groups;
}

function gbEntryKey(sid, cid, slot) { return sid + ':' + cid + ':' + slot; }

function gbTotalFor(stu, crit) {
  var sum = 0, any = false;
  for (var i = 0; i < crit.slots; i++) {
    var v = state.gbEntries[gbEntryKey(stu.id, crit.id, i)];
    if (v !== undefined && v !== null && v !== '') { sum += Number(v) || 0; any = true; }
  }
  if (!any) return null;
  return round2(Math.min(round2(sum), Number(crit.max_score)));
}

function gbGrandTotal(stu) {
  var sum = 0, any = false;
  (state.gbCriteria || []).forEach(function (c) {
    var v = gbTotalFor(stu, c);
    if (v !== null) { sum += v; any = true; }
  });
  return any ? round2(sum) : null;
}

/* إعدادات ترويسة الورقة (المادة والفصل الدراسي والعام) تُحفظ في قاعدة البيانات */
var SHEET_KEYS = ['sheet_subject', 'sheet_semester', 'sheet_year'];

async function loadSheetHeader() {
  var r = await sb.from('settings').select('*').in_('skey', SHEET_KEYS);
  var map = {};
  (r.data || []).forEach(function (x) { map[x.skey] = x.svalue || ''; });
  state.sheet = map;
  $('#sh-teacher').textContent = teacherName();
  $('#sh-subject').value = map.sheet_subject || '';
  $('#sh-year').value = map.sheet_year || '';
  $('#sh-semester').value = map.sheet_semester || '1';

  SHEET_KEYS.forEach(function (k) {
    var id = k === 'sheet_subject' ? '#sh-subject' : (k === 'sheet_year' ? '#sh-year' : '#sh-semester');
    var inp = $(id);
    if (inp.dataset.bound) return;
    inp.dataset.bound = '1';
    inp.addEventListener('change', async function () {
      state.sheet[k] = inp.value;
      var res = await sb.from('settings').upsert({ skey: k, svalue: inp.value }, 'skey').select('id');
      if (res.error) toast(t('err'), true);
    });
  });
}

async function loadSheet() {
  await loadSheetHeader();
  await loadTGradebook();
}

async function loadTGradebook() {
  await loadClasses();
  var sel = $('#gb-class');
  if (!sel.dataset.bound) {
    sel.dataset.bound = '1';
    sel.addEventListener('change', function () {
      state.gbClass = this.value ? Number(this.value) : null;
      renderGradebook();
    });
  }
  fillClassSelect(sel, state.gbClass, true);

  var cr = await sb.from('grade_criteria').select('*').eq('is_active', true).order('sort_order');
  state.gbCriteria = cr.data || [];

  var en = await sb.from('grade_entries').select('*').limit(1000);
  state.gbEntries = {};
  (en.data || []).forEach(function (e) {
    state.gbEntries[gbEntryKey(e.student_id, e.criterion_id, e.slot_index)] = e.score;
  });

  await getStudents(true);
  renderGradebook();
}

function gbStudents() {
  var list = (state.students || []).slice();
  if (state.gbClass) {
    list = list.filter(function (s) { return s.class_id === state.gbClass; });
  }
  return list;
}

function renderGradebook() {
  var box = $('#gb-table');
  box.textContent = '';
  var criteria = state.gbCriteria || [];
  var students = gbStudents();
  if (!criteria.length) { box.appendChild(emptyBox()); return; }
  if (!students.length) {
    box.appendChild(el('p', { class: 'muted', style: 'padding:14px', text: t('noStudentsInClass') }));
    return;
  }

  var groups = gbGroups(criteria);
  var table = el('table', { class: 'tbl gb-tbl' });

  /* صف المجموعات */
  var thead = el('thead');
  var r1 = el('tr');
  r1.appendChild(el('th', { rowspan: '3', class: 'gb-name', text: t('studentNameCol') }));
  groups.forEach(function (g) {
    var span = g.items.reduce(function (a, c) { return a + c.slots + 1; }, 0);
    r1.appendChild(el('th', { colspan: String(span), class: 'gb-group', text: g.key }));
  });
  r1.appendChild(el('th', { rowspan: '3', class: 'gb-total-h', text: t('grandTotal') }));
  thead.appendChild(r1);

  /* صف البنود */
  var r2 = el('tr');
  groups.forEach(function (g) {
    g.items.forEach(function (c) {
      r2.appendChild(el('th', { colspan: String(c.slots + 1), class: 'gb-crit', text: L(c, 'title') }));
    });
  });
  thead.appendChild(r2);

  /* صف أرقام الخانات */
  var r3 = el('tr');
  groups.forEach(function (g) {
    g.items.forEach(function (c) {
      for (var i = 0; i < c.slots; i++) {
        r3.appendChild(el('th', { class: 'gb-slot-h', text: String(i + 1) }));
      }
      r3.appendChild(el('th', { class: 'gb-sub-h', text: t('sum') }));
    });
  });
  thead.appendChild(r3);
  table.appendChild(thead);

  var tbody = el('tbody');
  students.forEach(function (stu, idx) {
    var tr = el('tr');
    var nameTd = el('td', { class: 'gb-name' });
    nameTd.appendChild(el('span', { class: 'gb-idx', text: String(idx + 1) }));
    nameTd.appendChild(el('span', { text: stu.full_name }));
    tr.appendChild(nameTd);

    criteria.forEach(function (c) {
      var subTd = null;
      for (var i = 0; i < c.slots; i++) {
        (function (slot) {
          var td = el('td', { class: 'gb-cell' });
          var inp = el('input', {
            type: 'text', inputmode: 'decimal', autocomplete: 'off', class: 'gb-in',
            'data-stu': String(stu.id), 'data-crit': String(c.id), 'data-slot': String(slot)
          });
          var cur = state.gbEntries[gbEntryKey(stu.id, c.id, slot)];
          inp.value = (cur === undefined || cur === null) ? '' : String(cur);
          inp.addEventListener('change', function () { gbSaveCell(inp, stu, c); });
          inp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { inp.blur(); }
          });
          td.appendChild(inp);
          tr.appendChild(td);
        })(i);
      }
      subTd = el('td', { class: 'gb-sub', 'data-sub': stu.id + ':' + c.id });
      var tv = gbTotalFor(stu, c);
      subTd.textContent = tv === null ? '' : String(tv);
      tr.appendChild(subTd);
    });

    var gt = el('td', { class: 'gb-total', 'data-total': String(stu.id) });
    var g = gbGrandTotal(stu);
    gt.textContent = g === null ? '' : String(g);
    tr.appendChild(gt);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  box.appendChild(table);
}

function gbRefreshTotals(stu, crit) {
  var sub = $('[data-sub="' + stu.id + ':' + crit.id + '"]');
  if (sub) {
    var v = gbTotalFor(stu, crit);
    sub.textContent = v === null ? '' : String(v);
    sub.classList.toggle('capped', v !== null && v >= Number(crit.max_score));
  }
  var tot = $('[data-total="' + stu.id + '"]');
  if (tot) {
    var g = gbGrandTotal(stu);
    tot.textContent = g === null ? '' : String(g);
  }
}

/* تقبل الأرقام العربية والإنجليزية والكسور: 0.5 و ٠٫٥ و 0,5 */
function parseScore(txt) {
  var raw = String(txt == null ? '' : txt).trim();
  raw = raw.replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); })
           .replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); })
           .replace(/[٫,،]/g, '.')
           .replace(/\s/g, '');
  if (raw === '') return { empty: true };
  if (!/^\d*\.?\d+$/.test(raw)) return { bad: true };
  var n = Number(raw);
  if (isNaN(n) || n < 0) return { bad: true };
  return { value: n };
}

/* تقريب لخانتين عشريتين لتفادي أخطاء الفاصلة العائمة (0.1+0.2) */
function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

async function gbSaveCell(inp, stu, crit) {
  var parsed = parseScore(inp.value);
  var val = null;
  if (parsed.bad) { toast(t('badScore'), true); inp.value = ''; return; }
  if (!parsed.empty) {
    var n = round2(parsed.value);
    if (n > Number(crit.max_score)) { n = Number(crit.max_score); }
    val = n;
    inp.value = String(n);
  }
  var slot = Number(inp.getAttribute('data-slot'));
  var key = gbEntryKey(stu.id, crit.id, slot);
  if (val === null) delete state.gbEntries[key]; else state.gbEntries[key] = val;
  gbRefreshTotals(stu, crit);

  inp.classList.add('saving');
  var r = await sb.from('grade_entries')
    .upsert({ student_id: stu.id, criterion_id: crit.id, slot_index: slot, score: val },
            'student_id,criterion_id,slot_index')
    .select('id');
  inp.classList.remove('saving');
  if (r.error) { toast(t('err'), true); inp.classList.add('save-err'); return; }
  inp.classList.remove('save-err');
  inp.classList.add('saved');
  setTimeout(function () { inp.classList.remove('saved'); }, 900);
  $('#gb-saved').textContent = t('savedAt') + ' ' + fmtDateTime(new Date());
}

/* تصدير سجل الدرجات: نافذة طباعة يمكن حفظها PDF من المتصفح */
function gbExportPdf() {
  var table = $('#gb-table table');
  if (!table) { toast(t('noData'), true); return; }
  var sh = state.sheet || {};
  var semMap = { '1': t('sem1'), '2': t('sem2'), '3': t('sem3') };
  var title = platformName();
  var meta = [t('sheetTeacher') + ' ' + teacherName()];
  if (sh.sheet_subject) meta.push(t('sheetSubject') + ' ' + sh.sheet_subject);
  meta.push(t('sheetSemester') + ' ' + (semMap[sh.sheet_semester] || t('sem1')));
  if (sh.sheet_year) meta.push(t('sheetYear') + ' ' + sh.sheet_year);
  if (state.gbClass) meta.push(t('classLabel') + ': ' + className(state.gbClass));

  var w = window.open('', '_blank');
  if (!w) { toast(t('popupBlocked'), true); return; }
  var css = [
    '@page { size: A4 landscape; margin: 10mm; }',
    'body { font-family: "Segoe UI", Tahoma, sans-serif; direction: rtl; color: #1C2733; }',
    'h1 { font-size: 16px; margin: 0 0 4px; }',
    '.meta { font-size: 11px; color: #5B6875; margin-bottom: 10px; display: flex; gap: 18px; }',
    'table { width: 100%; border-collapse: collapse; font-size: 10px; }',
    'th, td { border: 1px solid #9AA6B2; padding: 3px 4px; text-align: center; }',
    'td.gb-sub, td.gb-total { background: #EEF3F8; }',
    'th { background: #DCE6F1; font-weight: 600; }',
    'td.gb-name, th.gb-name { text-align: right; white-space: nowrap; padding-inline: 6px; }',
    '.gb-idx { display: inline-block; min-width: 16px; color: #5B6875; }',
    'td.gb-sub, td.gb-total { background: #F1F5F9; font-weight: 700; }',
    'input { border: none; width: 100%; text-align: center; font: inherit; background: none; }',
    '.credit { margin-top: 10px; font-size: 9px; color: #5B6875; text-align: center; }'
  ].join('\n');

  /* نحوّل الحقول إلى نص ثابت في النسخة المطبوعة */
  var clone = table.cloneNode(true);
  Array.prototype.forEach.call(clone.querySelectorAll('input'), function (inp) {
    var td = inp.parentNode;
    td.textContent = inp.value || '';
  });

  w.document.write('<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8">'
    + '<title>' + title + '</title><style>' + css + '</style></head><body>'
    + '<h1>' + title + '</h1>'
    + '<div class="meta"><span>' + meta.join('</span><span>') + '</span></div>'
    + clone.outerHTML
    + '<div class="credit">' + t('credit') + '</div>'
    + '</body></html>');
  w.document.close();
  setTimeout(function () { w.focus(); w.print(); }, 350);
}

/* ------------------------------------------------ ملف الإنجاز */
function spShowTab(key) {
  state.spTab = key;
  $$('#sp-tabs .tab').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-tab') === key);
  });
  ['tasks', 'subs', 'certs', 'feedback'].forEach(function (k) {
    var p = $('#sp-panel-' + k);
    if (k === key) show(p); else hide(p);
  });
  if (key === 'tasks') spLoadTasks();
  else if (key === 'subs') spLoadSubs();
  else if (key === 'certs') spLoadCerts();
  else if (key === 'feedback') spLoadFeedback();
}

async function loadSPortfolio() {
  $('#sp-name').textContent = state.profile.full_name;
  var st = await studentStats();
  $('#sp-att').textContent = st.rate == null ? '--' : st.rate + '%';
  $('#sp-points').textContent = String(st.points);
  $('#sp-approved').textContent = String(st.approved);
  var ex = await sb.from('excellence_board').select('id')
    .eq('student_id', sb.userId()).eq('is_active', true).limit(1);
  if (ex.data && ex.data.length) show($('#sp-exc')); else hide($('#sp-exc'));
  spShowTab(state.spTab || 'tasks');
}

async function spLoadTasks() {
  var box = $('#sp-panel-tasks');
  box.textContent = '';
  box.appendChild(loadingBox());
  var items = await openStudentTasks();
  var byItem = latestSubByItem();
  var secById = {};
  state.sections.forEach(function (s) { secById[s.id] = s; });
  box.textContent = '';
  if (!items.length) { box.appendChild(emptyBox()); return; }
  items.forEach(function (it) {
    var mySub = byItem[it.id];
    var card = el('div', { class: 'sub-card' });
    var head = el('div', { class: 'sub-head' });
    var left = el('div');
    left.appendChild(el('div', { class: 'sub-title', text: L(it, 'title') }));
    var metaTxt = secById[it.section_id] ? L(secById[it.section_id], 'title') : '';
    if (it.due_at) metaTxt += (metaTxt ? ' | ' : '') + t('dueBefore') + ' ' + fmtDateTime(it.due_at);
    left.appendChild(el('div', { class: 'sub-meta', text: metaTxt }));
    head.appendChild(left);
    head.appendChild(mySub ? subBadge(mySub.status) : el('span', { class: 'badge b-gray', text: t('notSubmitted') }));
    card.appendChild(head);
    var actions = el('div', { class: 'sub-actions' });
    if (!mySub) {
      actions.appendChild(el('button', {
        type: 'button', class: 'btn btn-sm',
        onclick: function () { openUploadModal(it, null); }
      }, icon('upload'), el('span', { text: t('upload') })));
    } else if (mySub.status === 'needs_revision') {
      actions.appendChild(el('button', {
        type: 'button', class: 'btn btn-sm',
        onclick: function () { openUploadModal(it, mySub); }
      }, icon('upload'), el('span', { text: t('resubmit') })));
    }
    if (actions.childNodes.length) card.appendChild(actions);
    box.appendChild(card);
  });
}

async function viewPortfolioFile(path) {
  var u = await sb.storage.signedUrl('portfolios', path, 3600);
  if (u) window.open(u, '_blank', 'noopener');
  else toast(t('err'), true);
}

async function spLoadSubs() {
  var box = $('#sp-panel-subs');
  box.textContent = '';
  await loadMySubs();
  if (!state.mySubs.length) { box.appendChild(emptyBox()); return; }
  state.mySubs.forEach(function (s) {
    var card = el('div', { class: 'sub-card' });
    var head = el('div', { class: 'sub-head' });
    var left = el('div');
    left.appendChild(el('div', { class: 'sub-title', text: s.title }));
    var meta = t('submittedAt') + ' ' + fmtDate(s.created_at);
    if (s.grade != null) meta += ' | ' + t('grade') + ': ' + s.grade + ' / ' + s.max_grade;
    left.appendChild(el('div', { class: 'sub-meta', text: meta }));
    head.appendChild(left);
    head.appendChild(subBadge(s.status));
    card.appendChild(head);
    if (s.note) card.appendChild(el('div', { class: 'item-body', text: s.note }));
    if (s.teacher_feedback) {
      var fb = el('div', { class: 'sub-fb' });
      fb.appendChild(el('div', { class: 'small muted', text: t('teacherFeedback') }));
      fb.appendChild(el('div', { text: s.teacher_feedback }));
      card.appendChild(fb);
    }
    var actions = el('div', { class: 'sub-actions' });
    if (s.file_path) {
      actions.appendChild(el('button', {
        type: 'button', class: 'btn-outline btn-sm',
        onclick: function () { viewPortfolioFile(s.file_path); }
      }, icon('eye'), el('span', { text: t('viewFile') })));
    }
    if (s.external_url) {
      actions.appendChild(el('a', { class: 'btn-outline btn-sm', href: s.external_url, target: '_blank', rel: 'noopener' },
        icon('link'), el('span', { text: t('open') })));
    }
    if (s.status === 'pending') {
      actions.appendChild(el('button', {
        type: 'button', class: 'btn-outline btn-sm',
        onclick: function () { openUploadModal(null, s); }
      }, icon('edit'), el('span', { text: t('edit') })));
    } else if (s.status === 'needs_revision') {
      actions.appendChild(el('button', {
        type: 'button', class: 'btn btn-sm',
        onclick: function () { openUploadModal(null, s); }
      }, icon('upload'), el('span', { text: t('resubmit') })));
    }
    if (actions.childNodes.length) card.appendChild(actions);
    box.appendChild(card);
  });
}

async function spLoadCerts() {
  var box = $('#sp-panel-certs');
  box.textContent = '';
  box.appendChild(loadingBox());
  var r = await sb.from('certificates').select('*')
    .eq('student_id', sb.userId()).order('issued_on', false);
  var rows = r.data || [];
  box.textContent = '';
  if (!rows.length) { box.appendChild(emptyBox()); return; }
  rows.forEach(function (c) {
    var card = el('div', { class: 'sub-card' });
    var head = el('div', { class: 'sub-head' });
    var left = el('div');
    left.appendChild(el('div', { class: 'sub-title', text: L(c, 'title') }));
    left.appendChild(el('div', { class: 'sub-meta', text: fmtDate(c.issued_on) }));
    head.appendChild(left);
    head.appendChild(el('span', { class: 'badge b-brass', text: t('certificates') }));
    card.appendChild(head);
    if (c.file_path) {
      var actions = el('div', { class: 'sub-actions' });
      actions.appendChild(el('a', { class: 'btn-outline btn-sm', href: sb.storage.publicUrl('materials', c.file_path), target: '_blank', rel: 'noopener' },
        icon('eye'), el('span', { text: t('viewFile') })));
      card.appendChild(actions);
    }
    box.appendChild(card);
  });
}

async function spLoadFeedback() {
  var box = $('#sp-fb-list');
  box.textContent = '';
  box.appendChild(loadingBox());
  var r = await sb.from('feedback').select('*')
    .eq('author_id', sb.userId()).order('created_at', false);
  var rows = r.data || [];
  box.textContent = '';
  if (!rows.length) { box.appendChild(emptyBox()); return; }
  rows.forEach(function (f) {
    var card = el('div', { class: 'fb-card' });
    card.appendChild(el('div', { class: 'fb-meta', text: fmtDateTime(f.created_at) }));
    card.appendChild(el('div', { class: 'fb-body', text: f.body }));
    if (f.teacher_reply) {
      var rep = el('div', { class: 'fb-reply' });
      rep.appendChild(el('div', { class: 'fb-reply-label', text: t('teacherReply') }));
      rep.appendChild(el('div', { text: f.teacher_reply }));
      card.appendChild(rep);
    }
    box.appendChild(card);
  });
}

async function sendFeedback() {
  if (!state.profile) { requireLogin(); return; }
  var txt = $('#sp-fb-text').value.trim();
  if (!txt) return;
  var r = await sb.from('feedback').insert({ author_id: sb.userId(), body: txt }).select('id');
  if (r.error) { toast(t('err'), true); return; }
  $('#sp-fb-text').value = '';
  toast(t('sent'));
  spLoadFeedback();
}

/* ------------------------------------------------ نافذة الرفع */
function openUploadModal(item, existingSub) {
  if (!state.profile) { requireLogin(); return; }
  state.uploadItem = item || null;
  state.editingSub = existingSub || null;
  resetDropzone('up-dz-label', 'up-dz-hint', 'uploadFile');
  $('#up-file').value = '';
  var info = $('#up-item-info');
  info.textContent = '';
  if (item) {
    show(info);
    info.appendChild(el('div', {}, el('b', { text: t('task') + ': ' }), el('span', { text: L(item, 'title') })));
    if (item.due_at) info.appendChild(el('div', { text: t('dueBefore') + ' ' + fmtDateTime(item.due_at) }));
  } else if (existingSub && existingSub.item_id) {
    hide(info);
  } else {
    hide(info);
  }
  var titleDefault = existingSub ? existingSub.title : (item ? L(item, 'title') : '');
  $('#up-title').value = titleDefault || '';
  $('#up-note').value = existingSub ? (existingSub.note || '') : '';
  $('#up-url').value = existingSub ? (existingSub.external_url || '') : '';
  $('#up-modal-title').textContent =
    existingSub && existingSub.status === 'needs_revision' ? t('resubmit')
      : existingSub ? t('edit')
        : item ? t('upload') : t('uploadFree');
  openModal('modal-upload');
}

async function saveUpload() {
  var title = $('#up-title').value.trim();
  var note = $('#up-note').value.trim();
  var urlV = $('#up-url').value.trim();
  if (!title) { toast(t('title_'), true); return; }
  var f = state.uploadFile;
  var existing = state.editingSub;
  if (!f && !urlV && !(existing && (existing.file_path || existing.external_url))) {
    toast(t('needFileOrLink'), true);
    return;
  }
  var btn = $('#up-save');
  btn.disabled = true;
  var filePath = existing ? existing.file_path : null;
  if (f) {
    var up = await sb.storage.upload('portfolios', f);
    if (up.error || !up.data || !up.data.path) { btn.disabled = false; toast(t('err'), true); return; }
    filePath = up.data.path;
  }
  var r;
  if (existing) {
    var patch = {
      title: title, note: note || null,
      file_path: filePath, external_url: urlV || null
    };
    if (existing.status === 'needs_revision') patch.status = 'pending';
    r = await sb.from('submissions').update(patch).eq('id', existing.id).select('id');
  } else {
    r = await sb.from('submissions').insert({
      student_id: sb.userId(),
      item_id: state.uploadItem ? state.uploadItem.id : null,
      title: title, note: note || null,
      file_path: filePath, external_url: urlV || null
    }).select('id');
  }
  btn.disabled = false;
  if (r.error) { toast(t('err'), true); return; }
  closeModal('modal-upload');
  toast(t('saved'));
  await loadMySubs();
  var n = state.nav;
  if (n.screen === 'portfolio') spShowTab(state.spTab);
  else if (n.screen === 'section') loadSSection(n.arg);
  else if (n.screen === 'home') loadSHome();
}

/* ------------------------------------------------ الجدول ولوحة التميز */
function renderScheduleGrid(container, slots, editable) {
  container.textContent = '';
  var days = CONFIG.SCHOOL_DAYS;
  var grid = el('div', { class: 'sched-grid' });
  grid.style.gridTemplateColumns = '64px repeat(' + days.length + ', minmax(120px, 1fr))';
  grid.appendChild(el('div', { class: 'sched-head' }));
  days.forEach(function (d) {
    grid.appendChild(el('div', { class: 'sched-head', text: DAYS[LANG][d] }));
  });
  var byKey = {};
  (slots || []).forEach(function (s) { byKey[s.day_of_week + '-' + s.period_no] = s; });
  for (var p = 1; p <= CONFIG.PERIODS; p++) {
    grid.appendChild(el('div', { class: 'sched-period', text: t('period') + ' ' + p }));
    days.forEach(function (d) {
      var slot = byKey[d + '-' + p];
      var cell;
      if (slot) {
        cell = el('div', { class: 'sched-cell' + (editable ? ' clickable' : '') });
        cell.appendChild(el('div', { class: 'sc-name', text: L(slot, 'class_name') }));
        var timeTxt = (slot.starts_at ? slot.starts_at.slice(0, 5) : '') +
          (slot.ends_at ? ' - ' + slot.ends_at.slice(0, 5) : '');
        if (timeTxt.trim()) cell.appendChild(el('div', { class: 'sc-time', text: timeTxt }));
        if (slot.room) cell.appendChild(el('div', { class: 'sc-time', text: slot.room }));
      } else {
        cell = el('div', { class: 'sched-cell free' + (editable ? ' clickable' : ''), text: editable ? '+' : t('freePeriod') });
      }
      if (editable) {
        (function (dd, pp, ss) {
          cell.addEventListener('click', function () { openSchedModal(dd, pp, ss); });
        })(d, p, slot);
      }
      grid.appendChild(cell);
    });
  }
  container.appendChild(grid);
}

async function loadSSchedule() {
  var box = $('#ssch-grid');
  box.textContent = '';
  box.appendChild(loadingBox());
  var r = await sb.from('schedule_slots').select('*').order('day_of_week').order('period_no');
  box.textContent = '';
  renderScheduleGrid(box, r.data || [], false);
}

async function loadSExcellence(gridSel) {
  var box = $(gridSel);
  box.textContent = '';
  box.appendChild(loadingBox());
  var r = await sb.from('excellence_board').select('*')
    .eq('is_active', true).order('added_at', false);
  var rows = r.data || [];
  box.textContent = '';
  if (!rows.length) { box.appendChild(emptyBox()); return; }
  rows.forEach(function (x) {
    var card = el('div', { class: 'exc-card' });
    card.appendChild(el('div', { class: 'exc-name', text: x.student_name }));
    var reason = L(x, 'reason');
    if (reason) card.appendChild(el('div', { class: 'exc-reason', text: reason }));
    card.appendChild(el('div', { class: 'exc-date', text: fmtDate(x.added_at) }));
    box.appendChild(card);
  });
}

/* =====================================================================
   10) لوحة المعلمة
   ===================================================================== */
var TEACHER_SCREENS = ['overview', 'approvals', 'submissions', 'attendance', 'participation',
  'students', 'student', 'backup', 'mothers', 'schedule', 'sections', 'section-items', 'excellence', 'feedback'];

function showTeacherScreen(name, arg) {
  state.nav = { view: 'teacher', screen: name, arg: arg || null };
  TEACHER_SCREENS.forEach(function (s) {
    var node = $('#t-' + s);
    if (node) hide(node);
  });
  show($('#t-' + name));
  var navKey = name === 'student' ? 'students' : (name === 'section-items' ? 'sections' : name);
  highlightNav('#teacher-nav', navKey, null);
  window.scrollTo(0, 0);
  var loaders = {
    overview: loadTOverview, approvals: loadTApprovals, submissions: loadTSubmissions,
    attendance: loadTAttendance, participation: loadTParticipation, students: loadTStudents,
    student: loadTStudent, backup: loadTBackup, mothers: loadTMothers, schedule: loadTSchedule, sections: loadTSections,
    'section-items': loadTSectionItems, excellence: loadTExcellence, feedback: loadTFeedback
  };
  if (loaders[name]) loaders[name]();
}

async function enterTeacher() {
  await fetchSections();
  showView('view-teacher');
  showTeacherScreen('overview');
}

/* ------------------------------------------------ نظرة عامة */
async function loadTOverview() {
  $('#to-date').textContent = DAYS[LANG][new Date().getDay()] + ' | ' + todayStr();
  var pendR = await sb.from('profiles').select('id,full_name,phone,created_at')
    .eq('role', 'student').eq('status', 'pending').order('created_at');
  var pend = pendR.data || [];
  $('#to-regs').textContent = String(pend.length);

  var subsR = await sb.from('submissions').select('*,profiles(full_name)')
    .eq('status', 'pending').order('created_at', false).limit(200);
  var subs = subsR.data || [];
  $('#to-subs').textContent = String(subs.length);

  var students = await getStudents();
  var attR = await sb.from('attendance').select('id').eq('class_date', todayStr());
  var attCount = (attR.data || []).length;
  $('#to-att').textContent = attCount + '/' + students.length;

  var today = new Date().getDay();
  var slotR = await sb.from('schedule_slots').select('*').eq('day_of_week', today).order('period_no');
  var slots = slotR.data || [];
  $('#to-classes').textContent = String(slots.length);

  /* قائمة الاعتمادات المصغرة */
  var apBox = $('#to-approvals');
  apBox.textContent = '';
  if (!pend.length) apBox.appendChild(emptyBox());
  else {
    pend.slice(0, 5).forEach(function (p) {
      var row = el('div', { class: 'sub-card' });
      var head = el('div', { class: 'sub-head' });
      var left = el('div');
      left.appendChild(el('div', { class: 'sub-title', text: p.full_name }));
      left.appendChild(el('div', { class: 'sub-meta ltr', text: p.phone }));
      head.appendChild(left);
      var actions = el('div', { class: 'btn-row' });
      actions.appendChild(el('button', {
        type: 'button', class: 'btn btn-sm',
        onclick: function () { approveStudent(p.id); }
      }, el('span', { text: t('approve') })));
      actions.appendChild(el('button', {
        type: 'button', class: 'btn-danger btn-sm',
        onclick: function () { rejectStudent(p.id); }
      }, el('span', { text: t('reject') })));
      head.appendChild(actions);
      row.appendChild(head);
      apBox.appendChild(row);
    });
  }

  /* جدول اليوم */
  var tdBox = $('#to-today');
  tdBox.textContent = '';
  if (!slots.length) tdBox.appendChild(emptyBox());
  else {
    slots.forEach(function (s) {
      var row = el('div', { class: 'sub-card' });
      var head = el('div', { class: 'sub-head' });
      var left = el('div');
      left.appendChild(el('div', { class: 'sub-title', text: t('period') + ' ' + s.period_no + ' | ' + L(s, 'class_name') }));
      var tm = (s.starts_at ? s.starts_at.slice(0, 5) : '') + (s.ends_at ? ' - ' + s.ends_at.slice(0, 5) : '');
      left.appendChild(el('div', { class: 'sub-meta ltr', text: tm + (s.room ? ' | ' + s.room : '') }));
      head.appendChild(left);
      row.appendChild(head);
      tdBox.appendChild(row);
    });
  }

  /* أحدث التسليمات */
  var rcBox = $('#to-recent');
  rcBox.textContent = '';
  if (!subs.length) rcBox.appendChild(emptyBox());
  else {
    subs.slice(0, 5).forEach(function (s) {
      rcBox.appendChild(subRowCard(s, function () { loadTOverview(); }));
    });
  }
}

function subRowCard(s, onDone) {
  var row = el('div', { class: 'sub-card' });
  var head = el('div', { class: 'sub-head' });
  var left = el('div');
  left.appendChild(el('div', { class: 'sub-title', text: s.title }));
  var who = s.profiles && s.profiles.full_name ? s.profiles.full_name : '';
  left.appendChild(el('div', { class: 'sub-meta', text: who + ' | ' + fmtDateTime(s.created_at) }));
  head.appendChild(left);
  var actions = el('div', { class: 'btn-row' });
  actions.appendChild(subBadge(s.status));
  actions.appendChild(el('button', {
    type: 'button', class: 'btn-outline btn-sm',
    onclick: function () { openReviewModal(s, onDone); }
  }, icon('eye'), el('span', { text: t('review') })));
  head.appendChild(actions);
  row.appendChild(head);
  return row;
}

/* ------------------------------------------------ طلبات التسجيل */
async function approveStudent(id) {
  var r = await sb.from('profiles').update({ status: 'approved' }).eq('id', id).select('id');
  if (r.error) { toast(t('err'), true); return; }
  toast(t('saved'));
  await getStudents(true);
  if (state.nav.screen === 'approvals') loadTApprovals();
  else if (state.nav.screen === 'overview') loadTOverview();
}

function rejectStudent(id) {
  askConfirm(t('reject') + '?', async function () {
    var r = await sb.from('profiles').update({ status: 'rejected' }).eq('id', id).select('id');
    if (r.error) { toast(t('err'), true); return; }
    toast(t('saved'));
    if (state.nav.screen === 'approvals') loadTApprovals();
    else if (state.nav.screen === 'overview') loadTOverview();
  });
}

async function loadTApprovals() {
  var box = $('#ta-list');
  box.textContent = '';
  box.appendChild(loadingBox());
  var r = await sb.from('profiles').select('id,full_name,phone,created_at')
    .eq('role', 'student').eq('status', 'pending').order('created_at');
  var rows = r.data || [];
  box.textContent = '';
  if (!rows.length) { box.appendChild(emptyBox()); return; }
  var table = el('table', { class: 'tbl' });
  var thead = el('thead', {}, el('tr', {},
    el('th', { text: t('name') }), el('th', { text: t('phone') }),
    el('th', { text: t('date') }), el('th', { class: 'actions-cell', text: t('actions') })));
  table.appendChild(thead);
  var tbody = el('tbody');
  rows.forEach(function (p) {
    var tr = el('tr', {},
      el('td', { text: p.full_name }),
      el('td', { class: 'ltr', text: p.phone }),
      el('td', { text: fmtDate(p.created_at) }));
    var td = el('td', { class: 'actions-cell' });
    td.appendChild(el('button', {
      type: 'button', class: 'btn btn-sm',
      onclick: function () { approveStudent(p.id); }
    }, el('span', { text: t('approve') })));
    td.appendChild(document.createTextNode(' '));
    td.appendChild(el('button', {
      type: 'button', class: 'btn-danger btn-sm',
      onclick: function () { rejectStudent(p.id); }
    }, el('span', { text: t('reject') })));
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  box.appendChild(table);
}

/* ------------------------------------------------ التسليمات */
async function loadTSubmissions() {
  var box = $('#ts-list');
  box.textContent = '';
  box.appendChild(loadingBox());
  var q = sb.from('submissions').select('*,profiles(full_name),section_items(title_ar,title_en)')
    .order('created_at', false).limit(300);
  if (state.subFilter !== 'all') q.eq('status', state.subFilter);
  var r = await q;
  var rows = r.data || [];
  box.textContent = '';
  if (!rows.length) { box.appendChild(emptyBox()); return; }
  var table = el('table', { class: 'tbl' });
  table.appendChild(el('thead', {}, el('tr', {},
    el('th', { text: t('student') }), el('th', { text: t('title_') }),
    el('th', { text: t('task') }), el('th', { text: t('date') }),
    el('th', { text: t('status') }), el('th', { class: 'actions-cell', text: t('actions') }))));
  var tbody = el('tbody');
  rows.forEach(function (s) {
    var taskName = s.section_items ? L(s.section_items, 'title') : t('freeUpload');
    var tr = el('tr', {},
      el('td', { text: s.profiles && s.profiles.full_name || '' }),
      el('td', { text: s.title }),
      el('td', { text: taskName }),
      el('td', { text: fmtDate(s.created_at) }));
    var tdSt = el('td'); tdSt.appendChild(subBadge(s.status)); tr.appendChild(tdSt);
    var td = el('td', { class: 'actions-cell' });
    td.appendChild(el('button', {
      type: 'button', class: 'btn-outline btn-sm',
      onclick: function () { openReviewModal(s, loadTSubmissions); }
    }, icon('eye'), el('span', { text: t('review') })));
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  box.appendChild(table);
}

/* نافذة المراجعة والتقييم */
function updateBrassRow() {
  var g = parseFloat($('#rv-grade').value);
  var m = parseFloat($('#rv-max').value) || 10;
  var showIt = !isNaN(g) && m > 0 && (g / m) >= CONFIG.EXCELLENCE_THRESHOLD;
  if (showIt) show($('#rv-brass')); else hide($('#rv-brass'));
}

async function openReviewModal(sub, onDone) {
  state.reviewSub = sub;
  state.reviewOnDone = onDone || null;
  var meta = $('#rv-meta');
  meta.textContent = '';
  var who = sub.profiles && sub.profiles.full_name ? sub.profiles.full_name : '';
  meta.appendChild(el('div', {}, el('b', { text: t('student') + ': ' }), el('span', { text: who })));
  meta.appendChild(el('div', {}, el('b', { text: t('title_') + ': ' }), el('span', { text: sub.title })));
  var taskName = sub.section_items ? L(sub.section_items, 'title') : t('freeUpload');
  meta.appendChild(el('div', {}, el('b', { text: t('task') + ': ' }), el('span', { text: taskName })));
  meta.appendChild(el('div', {}, el('b', { text: t('submittedAt') + ' ' }), el('span', { text: fmtDateTime(sub.created_at) })));
  if (sub.note) meta.appendChild(el('div', {}, el('b', { text: t('note') + ': ' }), el('span', { text: sub.note })));

  $('#rv-grade').value = sub.grade != null ? sub.grade : '';
  $('#rv-max').value = sub.max_grade != null ? sub.max_grade : 10;
  $('#rv-fb').value = sub.teacher_feedback || '';
  $('#rv-exc').checked = false;
  $('#rv-reason').value = sub.title || '';
  updateBrassRow();

  var pv = $('#rv-preview');
  pv.textContent = '';
  pv.appendChild(loadingBox());
  openModal('modal-review');

  pv.textContent = '';
  var shown = false;
  if (sub.file_path) {
    var u = await sb.storage.signedUrl('portfolios', sub.file_path, 3600);
    if (u) {
      var ext = fileExt(sub.file_path);
      if (ext === 'pdf') {
        var ifr = document.createElement('iframe');
        ifr.className = 'preview-frame';
        ifr.src = u;
        pv.appendChild(ifr);
      } else if (['png', 'jpg', 'jpeg', 'webp'].indexOf(ext) > -1) {
        pv.appendChild(el('img', { class: 'item-img', src: u, alt: sub.title }));
      } else {
        pv.appendChild(el('a', { class: 'btn-outline', href: u, target: '_blank', rel: 'noopener' },
          icon('doc'), el('span', { text: t('open') + ' ' + t('file') })));
      }
      shown = true;
    }
  }
  if (sub.external_url) {
    var emb = ytEmbed(sub.external_url);
    if (emb) {
      var wrap = el('div', { class: 'video-embed' });
      var vi = document.createElement('iframe');
      vi.src = emb;
      vi.setAttribute('allowfullscreen', '');
      wrap.appendChild(vi);
      pv.appendChild(wrap);
    } else {
      pv.appendChild(el('div', { class: 'mt' },
        el('a', { class: 'btn-outline', href: sub.external_url, target: '_blank', rel: 'noopener' },
          icon('link'), el('span', { text: t('open') }))));
    }
    shown = true;
  }
  if (!shown) pv.appendChild(emptyBox(t('attachment') + ': ' + t('noData')));
}

async function reviewAction(newStatus) {
  var sub = state.reviewSub;
  if (!sub) return;
  var g = parseFloat($('#rv-grade').value);
  var m = parseFloat($('#rv-max').value);
  var patch = {
    status: newStatus,
    grade: isNaN(g) ? null : g,
    max_grade: isNaN(m) || m <= 0 ? 10 : m,
    teacher_feedback: $('#rv-fb').value.trim() || null,
    evaluated_at: new Date().toISOString()
  };
  var r = await sb.from('submissions').update(patch).eq('id', sub.id).select('id');
  if (r.error) { toast(t('err'), true); return; }
  if (newStatus === 'approved' && $('#rv-exc').checked && !$('#rv-brass').classList.contains('hidden')) {
    await sb.from('excellence_board').insert({
      student_id: sub.student_id,
      student_name: sub.profiles && sub.profiles.full_name || '',
      reason_ar: $('#rv-reason').value.trim() || null,
      source_submission_id: sub.id
    }).select('id');
  }
  closeModal('modal-review');
  toast(t('saved'));
  if (state.reviewOnDone) state.reviewOnDone();
}

/* ------------------------------------------------ الحضور */
var ATT_STATUSES = [
  ['present', 'on-green'], ['absent', 'on-red'], ['late', 'on-amber'], ['excused', 'on-navy']
];

function updateAttSummary(total) {
  var box = $('#att-summary');
  box.textContent = '';
  var counts = { present: 0, absent: 0, late: 0, excused: 0 };
  Object.keys(state.attMap || {}).forEach(function (k) {
    var s = state.attMap[k];
    if (counts[s] != null) counts[s]++;
  });
  ATT_STATUSES.forEach(function (pair) {
    box.appendChild(el('span', {
      class: 'badge ' + { present: 'b-green', absent: 'b-red', late: 'b-amber', excused: 'b-navy' }[pair[0]],
      text: t('at_' + pair[0]) + ' ' + counts[pair[0]]
    }));
  });
  var recorded = Object.keys(state.attMap || {}).length;
  box.appendChild(el('span', { class: 'badge b-gray', text: recorded + '/' + total }));
}

async function loadTAttendance() {
  $('#att-date').value = state.attDate;
  var box = $('#att-list');
  box.textContent = '';
  box.appendChild(loadingBox());
  var students = await getStudents();
  var r = await sb.from('attendance').select('student_id,status').eq('class_date', state.attDate);
  state.attMap = {};
  (r.data || []).forEach(function (a) { state.attMap[a.student_id] = a.status; });
  box.textContent = '';
  if (!students.length) { box.appendChild(emptyBox()); updateAttSummary(0); return; }
  var table = el('table', { class: 'tbl' });
  table.appendChild(el('thead', {}, el('tr', {},
    el('th', { text: t('student') }), el('th', { text: t('status') }),
    el('th', { class: 'actions-cell', text: t('notifyMother') }))));
  var tbody = el('tbody');
  students.forEach(function (stu) {
    var tr = el('tr', {}, el('td', { text: stu.full_name }));
    var td = el('td');
    var seg = el('div', { class: 'seg' });
    var btns = [];
    /* زر تبليغ الأم يظهر فقط إذا كانت الحالة غياباً أو تأخراً */
    var notifyTd = el('td', { class: 'actions-cell' });
    function refreshNotify() {
      notifyTd.textContent = '';
      var st = state.attMap[stu.id];
      if (st !== 'absent' && st !== 'late') return;
      if (!stu.mother_phone) {
        notifyTd.appendChild(el('button', {
          type: 'button', class: 'btn-outline btn-sm',
          onclick: function () { openMotherModal(stu, function () { loadTAttendance(); }); }
        }, el('span', { text: t('addMotherPhone') })));
        return;
      }
      notifyTd.appendChild(el('button', {
        type: 'button', class: 'btn btn-wa btn-sm',
        onclick: async function () {
          var rows = await buildMothersData();
          var r = rows.find(function (z) { return z.stu.id === stu.id; });
          if (!r) { toast(t('err'), true); return; }
          var kind = state.attMap[stu.id] === 'late' ? 'late' : 'absence';
          var txt = await messageFor(r, kind);
          openWaModal(stu, kind, txt, null);
        }
      }, el('span', { text: t('notifyMother') })));
    }
    ATT_STATUSES.forEach(function (pair) {
      var stName = pair[0], cls = pair[1];
      var b = el('button', { type: 'button', text: t('at_' + stName) });
      if (state.attMap[stu.id] === stName) b.classList.add(cls);
      b.addEventListener('click', async function () {
        var up = await sb.from('attendance')
          .upsert({ student_id: stu.id, class_date: state.attDate, status: stName }, 'student_id,class_date')
          .select('id');
        if (up.error) { toast(t('err'), true); return; }
        state.attMap[stu.id] = stName;
        btns.forEach(function (x) { x.b.className = ''; });
        b.className = cls;
        refreshNotify();
        updateAttSummary(students.length);
      });
      btns.push({ b: b, cls: cls });
      seg.appendChild(b);
    });
    td.appendChild(seg);
    tr.appendChild(td);
    refreshNotify();
    tr.appendChild(notifyTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  box.appendChild(table);
  updateAttSummary(students.length);
}

async function markAllPresent() {
  var students = await getStudents();
  if (!students.length) return;
  var rows = students.map(function (s) {
    return { student_id: s.id, class_date: state.attDate, status: 'present' };
  });
  var r = await sb.from('attendance').upsert(rows, 'student_id,class_date').select('id');
  if (r.error) { toast(t('err'), true); return; }
  toast(t('attSaved'));
  loadTAttendance();
}

/* ------------------------------------------------ المشاركة */
async function loadTParticipation() {
  loadSheet();
  loadPartSummary();
  if (!$('#part-date').value) $('#part-date').value = todayStr();
  var students = await getStudents();
  var sel = $('#part-student');
  var current = sel.value;
  sel.textContent = '';
  students.forEach(function (s) {
    sel.appendChild(el('option', { value: s.id, text: s.full_name }));
  });
  if (current) sel.value = current;

  var box = $('#part-list');
  box.textContent = '';
  box.appendChild(loadingBox());
  var day = $('#part-date').value || todayStr();
  var r = await sb.from('participation').select('*').eq('class_date', day).order('created_at', false);
  var rows = r.data || [];
  var nameById = {};
  students.forEach(function (s) { nameById[s.id] = s.full_name; });
  box.textContent = '';
  if (!rows.length) { box.appendChild(emptyBox()); return; }
  var table = el('table', { class: 'tbl' });
  table.appendChild(el('thead', {}, el('tr', {},
    el('th', { text: t('student') }), el('th', { text: t('points') }),
    el('th', { text: t('note') }), el('th', { class: 'actions-cell', text: t('actions') }))));
  var tbody = el('tbody');
  rows.forEach(function (p) {
    var tr = el('tr', {},
      el('td', { text: nameById[p.student_id] || '' }),
      el('td', { text: String(p.points) }),
      el('td', { text: p.note || '' }));
    var td = el('td', { class: 'actions-cell' });
    td.appendChild(el('button', {
      type: 'button', class: 'btn-danger btn-sm',
      onclick: function () {
        askConfirm(t('confirmDel'), async function () {
          var d = await sb.from('participation').remove().eq('id', p.id);
          if (d.error) { toast(t('err'), true); return; }
          loadTParticipation();
        });
      }
    }, icon('trash'), el('span', { text: t('del') })));
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  box.appendChild(table);
}

/* ================================================ ملخص المشاركة
   يصنّف الطالبات حسب مجموع نقاط مشاركتهن، ويتيح إرسال رسالة
   تحفيز أو تنبيه إلى الطالبة نفسها على رقمها (لا إلى الأم). */
var PART_HIGH = 10;   /* مجموع النقاط الذي يُعد مشاركة متميزة */
var PART_LOW = 3;     /* أقل من هذا يُعد مشاركة ضعيفة */

function partLevel(pts) {
  if (pts >= PART_HIGH) return 'high';
  if (pts <= 0) return 'none';
  if (pts < PART_LOW) return 'low';
  return 'ok';
}

function partBadge(level, pts) {
  var map = {
    high: ['b-green', 'partHigh'], ok: ['b-navy', 'partOk'],
    low: ['b-amber', 'partLow'], none: ['b-red', 'partNone']
  };
  var m = map[level];
  return el('span', { class: 'badge ' + m[0], text: t(m[1]) + ' · ' + pts });
}

/* رسالة تُفتح على رقم الطالبة نفسها */
async function openStudentWa(stu, kind, pts) {
  if (!stu.phone) { toast(t('err'), true); return; }
  var tpls = await loadTemplates();
  var key = kind === 'student_praise' ? 'tpl_student_praise' : 'tpl_student_nudge';
  var text = fillTpl(tpls[key], statsVars(stu, { points: pts }));
  $('#wa-to').textContent = stu.full_name + ' — ' + intlPhone(stu.phone);
  $('#wa-text').value = text;
  $('#wa-title').textContent = t('sendToStudent') + ' — ' + stu.full_name;
  $('#wa-copy').onclick = function () { copyText($('#wa-text').value); };
  $('#wa-send').onclick = function () {
    window.open(waUrl(stu.phone, $('#wa-text').value), '_blank');
    logParentMessage(stu.id, kind, null);
    closeModal('modal-wa');
    toast(t('msgLogged'));
    loadPartSummary();
  };
  openModal('modal-wa');
}

async function loadPartSummary() {
  var box = $('#ps-list');
  if (!box) return;
  await loadClasses();
  var sel = $('#ps-class');
  if (sel && !sel.dataset.bound) {
    sel.dataset.bound = '1';
    sel.addEventListener('change', function () {
      state.psClass = this.value ? Number(this.value) : null;
      loadPartSummary();
    });
  }
  fillClassSelect(sel, state.psClass, true);

  box.textContent = '';
  box.appendChild(loadingBox());
  var students = await getStudents(true);
  var pr = await sb.from('participation').select('student_id,points').limit(1000);
  var msgR = await sb.from('parent_messages').select('student_id,kind,sent_at')
    .order('sent_at', false).limit(1000);
  var msgs = msgR.data || [];
  var lastByKind = {};
  msgs.forEach(function (m) {
    var k = m.student_id + '|' + m.kind;
    if (!lastByKind[k]) lastByKind[k] = m.sent_at;
  });

  var totals = {};
  (pr.data || []).forEach(function (p) {
    totals[p.student_id] = (totals[p.student_id] || 0) + (p.points || 0);
  });

  var list = students.filter(function (s) {
    return !state.psClass || s.class_id === state.psClass;
  }).map(function (s) {
    return { stu: s, pts: totals[s.id] || 0 };
  }).sort(function (a, b) { return b.pts - a.pts; });

  box.textContent = '';
  if (!list.length) {
    box.appendChild(el('p', { class: 'muted', style: 'padding:12px', text: t('noStudentsInClass') }));
    return;
  }

  var table = el('table', { class: 'tbl' });
  table.appendChild(el('thead', {}, el('tr', {},
    el('th', { text: t('student') }), el('th', { text: t('totalPoints') }),
    el('th', { text: t('lastContact') }),
    el('th', { class: 'actions-cell', text: t('actions') }))));
  var tbody = el('tbody');

  list.forEach(function (r) {
    var lvl = partLevel(r.pts);
    var tr = el('tr', {}, el('td', { text: r.stu.full_name }));
    var ptd = el('td');
    ptd.appendChild(partBadge(lvl, r.pts));
    tr.appendChild(ptd);

    var lastP = lastByKind[r.stu.id + '|student_praise'];
    var lastN = lastByKind[r.stu.id + '|student_nudge'];
    var last = (lastP && lastN) ? (lastP > lastN ? lastP : lastN) : (lastP || lastN);
    tr.appendChild(el('td', { class: 'small muted',
      text: last ? fmtDateTime(last) : t('neverContacted') }));

    var atd = el('td', { class: 'actions-cell' });
    if (lvl === 'high') {
      atd.appendChild(el('button', {
        type: 'button', class: 'btn btn-wa btn-sm',
        onclick: function () { openStudentWa(r.stu, 'student_praise', r.pts); }
      }, el('span', { text: t('sendPraise') })));
    } else if (lvl === 'none' || lvl === 'low') {
      atd.appendChild(el('button', {
        type: 'button', class: 'btn-outline btn-sm',
        onclick: function () { openStudentWa(r.stu, 'student_nudge', r.pts); }
      }, el('span', { text: t('sendNudge') })));
    } else {
      atd.appendChild(el('button', {
        type: 'button', class: 'btn-ghost btn-sm',
        onclick: function () { openStudentWa(r.stu, 'student_praise', r.pts); }
      }, el('span', { text: t('sendPraise') })));
    }
    tr.appendChild(atd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  box.appendChild(table);
}

async function addParticipation() {
  var sid = $('#part-student').value;
  if (!sid) return;
  var pts = parseInt($('#part-points').value, 10);
  if (isNaN(pts)) pts = 1;
  if (pts < -5) pts = -5;
  if (pts > 10) pts = 10;
  var day = $('#part-date').value || todayStr();
  var r = await sb.from('participation').insert({
    student_id: sid, class_date: day, points: pts,
    note: $('#part-note').value.trim() || null
  }).select('id');
  if (r.error) { toast(t('err'), true); return; }
  $('#part-note').value = '';
  toast(t('saved'));
  loadTParticipation();
}

/* ------------------------------------------------ الطالبات */
async function loadTStudents() {
  await renderClassesAdmin();
  var cs = $('#stu-class');
  if (cs && !cs.dataset.bound) {
    cs.dataset.bound = '1';
    cs.addEventListener('change', function () {
      state.stuClass = this.value ? Number(this.value) : null;
      renderStudentsTable();
    });
  }
  fillClassSelect(cs, state.stuClass, true);
  var box = $('#stu-list');
  box.textContent = '';
  box.appendChild(loadingBox());
  var students = await getStudents(true);
  var attR = await sb.from('attendance').select('student_id,status');
  var partR = await sb.from('participation').select('student_id,points');
  var subR = await sb.from('submissions').select('student_id,status');
  var agg = {};
  students.forEach(function (s) { agg[s.id] = { att: 0, attOk: 0, pts: 0, ok: 0 }; });
  (attR.data || []).forEach(function (a) {
    if (!agg[a.student_id]) return;
    agg[a.student_id].att++;
    if (a.status === 'present' || a.status === 'late') agg[a.student_id].attOk++;
  });
  (partR.data || []).forEach(function (p) {
    if (agg[p.student_id]) agg[p.student_id].pts += (p.points || 0);
  });
  (subR.data || []).forEach(function (s) {
    if (agg[s.student_id] && s.status === 'approved') agg[s.student_id].ok++;
  });
  state.stuData = students.map(function (s) {
    var a = agg[s.id];
    return {
      stu: s,
      rate: a.att ? Math.round((a.attOk / a.att) * 100) : null,
      pts: a.pts, ok: a.ok
    };
  });
  renderStudentsTable($('#stu-search').value || '');
}

function renderStudentsTable(filterText) {
  var box = $('#stu-list');
  box.textContent = '';
  var ft = String(filterText || '').trim();
  var rows = (state.stuData || []).filter(function (r) {
    if (state.stuClass && r.stu.class_id !== state.stuClass) return false;
    if (!ft) return true;
    var mp = r.stu.mother_phone || '';
    return r.stu.full_name.indexOf(ft) > -1 || r.stu.phone.indexOf(ft) > -1 || mp.indexOf(ft) > -1;
  });
  if (!rows.length) { box.appendChild(emptyBox()); return; }
  var table = el('table', { class: 'tbl' });
  table.appendChild(el('thead', {}, el('tr', {},
    el('th', { text: t('name') }), el('th', { text: t('classLabel') }),
    el('th', { text: t('phone') }), el('th', { text: t('motherPhone') }),
    el('th', { text: t('attRate') }), el('th', { text: t('totalPoints') }),
    el('th', { text: t('approvedWork') }), el('th', { class: 'actions-cell', text: t('actions') }))));
  var tbody = el('tbody');
  rows.forEach(function (r) {
    var tr = el('tr', {},
      el('td', { text: r.stu.full_name }),
      el('td', { class: 'small', text: className(r.stu.class_id) || '--' }),
      el('td', { class: 'ltr', text: intlPhone(r.stu.phone) || r.stu.phone }));
    var mTd = el('td', { class: 'ltr' });
    if (r.stu.mother_phone) mTd.appendChild(el('span', { text: intlPhone(r.stu.mother_phone) }));
    else mTd.appendChild(el('span', { class: 'badge b-red', text: t('noMotherPhone') }));
    tr.appendChild(mTd);
    tr.appendChild(el('td', { text: r.rate == null ? '--' : r.rate + '%' }));
    tr.appendChild(el('td', { text: String(r.pts) }));
    tr.appendChild(el('td', { text: String(r.ok) }));
    var td = el('td', { class: 'actions-cell' });
    td.appendChild(el('button', {
      type: 'button', class: 'btn-outline btn-sm',
      onclick: function () { state.studentDetail = r.stu.id; showTeacherScreen('student'); }
    }, icon('folder'), el('span', { text: t('viewPortfolio') })));
    td.appendChild(el('button', {
      type: 'button', class: 'btn-outline btn-sm',
      onclick: function () { openMotherModal(r.stu, function () { loadTStudents(); }); }
    }, el('span', { text: t('editStudent') })));
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  box.appendChild(table);
}

/* ------------------------------------------------ ملف طالبة */
function tsdShowTab(key) {
  state.tsdTab = key;
  $$('#tsd-tabs .tab').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-tab') === key);
  });
  ['subs', 'att', 'certs', 'parent'].forEach(function (k) {
    var p = $('#tsd-panel-' + k);
    if (k === key) show(p); else hide(p);
  });
}

async function loadTStudent() {
  var id = state.studentDetail;
  if (!id) { showTeacherScreen('students'); return; }
  var students = await getStudents();
  var stu = students.find(function (s) { return s.id === id; });
  if (!stu) {
    var one = await sb.from('profiles').select('id,full_name,phone,mother_phone,mother_name,class_id,created_at').eq('id', id).single().run(false);
    stu = one.data;
  }
  if (!stu) { showTeacherScreen('students'); return; }
  $('#tsd-name').textContent = stu.full_name;
  var phoneBox = $('#tsd-phone');
  phoneBox.textContent = '';
  phoneBox.appendChild(el('span', { text: intlPhone(stu.phone) || stu.phone }));
  if (stu.mother_phone) {
    phoneBox.appendChild(el('span', { text: '  |  ' + t('motherPhone') + ': ' + intlPhone(stu.mother_phone) }));
  }

  var attR = await sb.from('attendance').select('*').eq('student_id', id).order('class_date', false).limit(60);
  var partR = await sb.from('participation').select('points').eq('student_id', id);
  var subR = await sb.from('submissions').select('*').eq('student_id', id).order('created_at', false);
  var excR = await sb.from('excellence_board').select('*').eq('student_id', id).eq('is_active', true).limit(1);
  var certR = await sb.from('certificates').select('*').eq('student_id', id).order('issued_on', false);
  var linkR = await sb.from('parent_links').select('*').eq('student_id', id).order('created_at', false);

  var att = attR.data || [];
  var pts = (partR.data || []).reduce(function (a, x) { return a + (x.points || 0); }, 0);
  var subs = subR.data || [];
  var okCount = subs.filter(function (s) { return s.status === 'approved'; }).length;
  var attended = att.filter(function (a) { return a.status === 'present' || a.status === 'late'; }).length;
  var rate = att.length ? Math.round((attended / att.length) * 100) : null;
  var excActive = (excR.data || [])[0] || null;

  var chips = $('#tsd-chips');
  chips.textContent = '';
  chips.appendChild(el('span', { class: 'badge b-navy', text: t('attRate') + ' ' + (rate == null ? '--' : rate + '%') }));
  chips.appendChild(el('span', { class: 'badge b-gray', text: t('totalPoints') + ' ' + pts }));
  chips.appendChild(el('span', { class: 'badge b-green', text: t('approvedWork') + ' ' + okCount }));
  if (excActive) chips.appendChild(el('span', { class: 'badge b-brass', text: t('onBoard') }));

  var excBtn = $('#tsd-exc-btn');
  excBtn.textContent = '';
  excBtn.appendChild(icon('star'));
  excBtn.appendChild(el('span', { text: excActive ? t('removeExc') : t('addToExc') }));
  excBtn.onclick = function () {
    if (excActive) {
      askConfirm(t('removeExc') + '?', async function () {
        var d = await sb.from('excellence_board').update({ is_active: false }).eq('id', excActive.id).select('id');
        if (d.error) { toast(t('err'), true); return; }
        toast(t('saved'));
        loadTStudent();
      });
    } else {
      openExcModal(stu, function () { loadTStudent(); });
    }
  };
  $('#tsd-cert-btn').onclick = function () { openCertModal(stu); };

  /* الرسم البياني: تقدّم الطالبة كما تراه هي */
  var progBox = $('#tsd-progress');
  if (progBox) {
    progBox.textContent = '';
    loadProgress(stu.id).then(function (pd) {
      if (!pd) return;
      progBox.textContent = '';
      progBox.appendChild(el('div', { class: 'card-h', style: 'padding:0 0 8px',
        text: t('studentProgress') }));
      var pts = el('div');
      renderPoints(pts, pd);
      progBox.appendChild(pts);
      var ch = el('div');
      renderProgressChart(ch, pd.sections);
      progBox.appendChild(ch);
    });
  }

  /* أزرار التواصل مع الأم في ملف الطالبة */
  var waRow = $('#tsd-wa-row');
  if (waRow) {
    waRow.textContent = '';
    waRow.appendChild(el('button', {
      type: 'button', class: 'btn-outline btn-sm',
      onclick: function () { openMotherModal(stu, function () { loadTStudent(); }); }
    }, el('span', { text: t('editStudent') })));
    if (stu.mother_phone) {
      var mkBtn = function (kind, label) {
        return el('button', {
          type: 'button', class: 'btn btn-wa btn-sm',
          onclick: async function () {
            var rows = await buildMothersData();
            var r = rows.find(function (z) { return z.stu.id === stu.id; });
            if (!r) { toast(t('err'), true); return; }
            if (kind === 'excellence') r.exc = excActive;
            var txt = await messageFor(r, kind);
            openWaModal(stu, kind, txt, null);
          }
        }, el('span', { text: label }));
      };
      waRow.appendChild(mkBtn('report', t('sendReport')));
      waRow.appendChild(mkBtn('absence', t('caseAbsence')));
      waRow.appendChild(mkBtn('low_level', t('caseLowLevel')));
      if (excActive) waRow.appendChild(mkBtn('excellence', t('caseExcellence')));
    } else {
      waRow.appendChild(el('span', { class: 'badge b-red', text: t('noMotherPhone') }));
    }
  }

  /* التسليمات */
  var subsBox = $('#tsd-panel-subs');
  subsBox.textContent = '';
  if (!subs.length) subsBox.appendChild(emptyBox());
  else {
    subs.forEach(function (s) {
      s.profiles = { full_name: stu.full_name };
      var card = subRowCard(s, function () { loadTStudent(); });
      if (s.grade != null) {
        card.appendChild(el('div', { class: 'sub-meta', text: t('grade') + ': ' + s.grade + ' / ' + s.max_grade }));
      }
      subsBox.appendChild(card);
    });
  }

  /* الحضور */
  var attBox = $('#tsd-att');
  attBox.textContent = '';
  if (!att.length) attBox.appendChild(emptyBox());
  else {
    var table = el('table', { class: 'tbl' });
    table.appendChild(el('thead', {}, el('tr', {},
      el('th', { text: t('date') }), el('th', { text: t('status') }))));
    var tbody = el('tbody');
    att.forEach(function (a) {
      var tr = el('tr', {}, el('td', { text: fmtDate(a.class_date) }));
      var td = el('td'); td.appendChild(attBadge(a.status)); tr.appendChild(td);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    attBox.appendChild(table);
  }

  /* الشهادات */
  var certBox = $('#tsd-certs');
  certBox.textContent = '';
  var certs = certR.data || [];
  if (!certs.length) certBox.appendChild(emptyBox());
  else {
    certs.forEach(function (c) {
      var card = el('div', { class: 'sub-card' });
      var head = el('div', { class: 'sub-head' });
      var left = el('div');
      left.appendChild(el('div', { class: 'sub-title', text: L(c, 'title') }));
      left.appendChild(el('div', { class: 'sub-meta', text: fmtDate(c.issued_on) }));
      head.appendChild(left);
      var actions = el('div', { class: 'btn-row' });
      if (c.file_path) {
        actions.appendChild(el('a', {
          class: 'btn-outline btn-sm', target: '_blank', rel: 'noopener',
          href: sb.storage.publicUrl('materials', c.file_path)
        }, icon('eye'), el('span', { text: t('viewFile') })));
      }
      actions.appendChild(el('button', {
        type: 'button', class: 'btn-danger btn-sm',
        onclick: function () {
          askConfirm(t('confirmDel'), async function () {
            var d = await sb.from('certificates').remove().eq('id', c.id);
            if (d.error) { toast(t('err'), true); return; }
            loadTStudent();
          });
        }
      }, icon('trash'), el('span', { text: t('del') })));
      head.appendChild(actions);
      card.appendChild(head);
      certBox.appendChild(card);
    });
  }

  /* رمز ولي الأمر */
  var pBox = $('#tsd-parent');
  pBox.textContent = '';
  var links = linkR.data || [];
  var active = links.find(function (l) { return l.is_active; }) || null;
  pBox.appendChild(el('p', { class: 'muted small', text: t('parentCodeHint') }));
  if (active) {
    pBox.appendChild(el('div', { class: 'code-box', text: active.access_code }));
    var row = el('div', { class: 'btn-row', style: 'margin-top:14px' });
    row.appendChild(el('button', {
      type: 'button', class: 'btn btn-sm',
      onclick: function () { copyText(parentLink(active.access_code)); }
    }, icon('link'), el('span', { text: t('copyLink') })));
    row.appendChild(el('button', {
      type: 'button', class: 'btn-outline btn-sm',
      onclick: function () { copyText(active.access_code); }
    }, el('span', { text: t('copy') })));
    row.appendChild(el('button', {
      type: 'button', class: 'btn-outline btn-sm',
      onclick: async function () {
        await sb.from('parent_links').update({ is_active: false }).eq('id', active.id).select('id');
        var ins = await sb.from('parent_links').insert({ student_id: id }).select('*');
        if (ins.error) { toast(t('err'), true); return; }
        toast(t('saved'));
        loadTStudent();
      }
    }, el('span', { text: t('regenCode') })));
    row.appendChild(el('button', {
      type: 'button', class: 'btn-danger btn-sm',
      onclick: function () {
        askConfirm(t('deactivate') + '?', async function () {
          var d = await sb.from('parent_links').update({ is_active: false }).eq('id', active.id).select('id');
          if (d.error) { toast(t('err'), true); return; }
          loadTStudent();
        });
      }
    }, el('span', { text: t('deactivate') })));
    pBox.appendChild(row);
  } else {
    pBox.appendChild(el('div', { class: 'muted', text: t('noCode') }));
    pBox.appendChild(el('div', { class: 'btn-row', style: 'margin-top:14px' },
      el('button', {
        type: 'button', class: 'btn',
        onclick: async function () {
          var ins = await sb.from('parent_links').insert({ student_id: id }).select('*');
          if (ins.error) { toast(t('err'), true); return; }
          toast(t('saved'));
          loadTStudent();
        }
      }, icon('key'), el('span', { text: t('genCode') }))));
  }

  tsdShowTab(state.tsdTab || 'subs');
}

/* ------------------------------------------------ الجدول الأسبوعي */
async function loadTSchedule() {
  var box = $('#tsch-grid');
  box.textContent = '';
  box.appendChild(loadingBox());
  var r = await sb.from('schedule_slots').select('*').order('day_of_week').order('period_no');
  box.textContent = '';
  renderScheduleGrid(box, r.data || [], true);
}

function openSchedModal(day, period, slot) {
  state.schedTarget = { day: day, period: period, slot: slot || null };
  $('#sc-title-label').textContent = DAYS[LANG][day] + ' | ' + t('period') + ' ' + period;
  $('#sc-name-ar').value = slot ? (slot.class_name_ar || '') : '';
  $('#sc-name-en').value = slot ? (slot.class_name_en || '') : '';
  $('#sc-start').value = slot && slot.starts_at ? slot.starts_at.slice(0, 5) : '';
  $('#sc-end').value = slot && slot.ends_at ? slot.ends_at.slice(0, 5) : '';
  $('#sc-room').value = slot ? (slot.room || '') : '';
  if (slot) show($('#sc-delete')); else hide($('#sc-delete'));
  openModal('modal-sched');
}

async function saveSched() {
  var tg = state.schedTarget;
  if (!tg) return;
  var nameAr = $('#sc-name-ar').value.trim();
  if (!nameAr) { toast(t('className'), true); return; }
  var r = await sb.from('schedule_slots').upsert({
    day_of_week: tg.day,
    period_no: tg.period,
    class_name_ar: nameAr,
    class_name_en: $('#sc-name-en').value.trim() || null,
    starts_at: $('#sc-start').value || null,
    ends_at: $('#sc-end').value || null,
    room: $('#sc-room').value.trim() || null
  }, 'day_of_week,period_no').select('id');
  if (r.error) { toast(t('err'), true); return; }
  closeModal('modal-sched');
  toast(t('saved'));
  loadTSchedule();
}

function deleteSched() {
  var tg = state.schedTarget;
  if (!tg || !tg.slot) return;
  askConfirm(t('confirmDel'), async function () {
    var r = await sb.from('schedule_slots').remove().eq('id', tg.slot.id);
    if (r.error) { toast(t('err'), true); return; }
    closeModal('modal-sched');
    loadTSchedule();
  });
}

/* ------------------------------------------------ الأقسام */
async function loadTSections() {
  await fetchSections();
  await loadSectionCounts();
  var box = $('#sec-grid');
  box.textContent = '';
  if (!state.sections.length) { box.appendChild(emptyBox()); return; }
  state.sections.forEach(function (s) {
    var card = el('button', { type: 'button', class: 'section-card' });
    var head = el('div', { class: 'sc-title' });
    head.appendChild(icon(SECTION_ICONS[s.slug] || 'grid'));
    head.appendChild(el('span', { text: L(s, 'title') }));
    addSectionBadges(head, s, { withUnread: false });
    card.appendChild(head);
    var meta = el('div', { class: 'sc-meta' });
    meta.appendChild(el('span', { class: 'badge ' + (s.is_system ? 'b-navy' : 'b-gray'), text: s.is_system ? t('sysSection') : t('customSection') }));
    if (!s.visible_to_students) meta.appendChild(el('span', { class: 'badge b-amber', text: t('hiddenL') }));
    card.appendChild(meta);
    card.addEventListener('click', function () {
      state.currentSection = s;
      showTeacherScreen('section-items');
    });
    box.appendChild(card);
  });
}

async function loadTSectionItems() {
  loadSectionCounts();
  var sec = state.currentSection;
  if (!sec) { showTeacherScreen('sections'); return; }
  $('#si-title').textContent = L(sec, 'title');
  var badges = $('#si-badges');
  badges.textContent = '';
  badges.appendChild(el('span', { class: 'badge ' + (sec.is_system ? 'b-navy' : 'b-gray'), text: sec.is_system ? t('sysSection') : t('customSection') }));
  badges.appendChild(el('span', { class: 'badge ' + (sec.visible_to_students ? 'b-green' : 'b-amber'), text: sec.visible_to_students ? t('visStudents') : t('hiddenL') }));
  (sec.allowed_types || []).forEach(function (tp) {
    badges.appendChild(el('span', { class: 'badge b-gray', text: t('tp_' + tp) }));
  });

  var box = $('#si-list');
  box.textContent = '';
  box.appendChild(loadingBox());
  await loadClasses();   /* لعرض اسم الفصل الموجّه إليه المحتوى */
  var r = await sb.from('section_items').select('*')
    .eq('section_id', sec.id).order('sort_order').order('created_at');
  var items = r.data || [];
  box.textContent = '';
  if (!items.length) { box.appendChild(emptyBox()); return; }
  items.forEach(function (it) {
    var card = el('div', { class: 'sub-card' });
    var head = el('div', { class: 'sub-head' });
    var left = el('div');
    var titleRow = el('div', { class: 'sub-title' });
    titleRow.appendChild(el('span', { text: L(it, 'title') }));
    left.appendChild(titleRow);
    var chips = el('div', { class: 'chips-row', style: 'margin-top:4px' });
    chips.appendChild(el('span', { class: 'badge b-gray', text: t('tp_' + it.item_type) }));
    chips.appendChild(el('span', { class: 'badge ' + (it.is_published ? 'b-green' : 'b-amber'), text: it.is_published ? t('published') : t('hiddenL') }));
    if (it.accepts_submissions) {
      chips.appendChild(el('span', { class: 'badge b-navy', text: t('acceptsSub') + (it.due_at ? ' | ' + fmtDateTime(it.due_at) : '') }));
    }
    if (it.in_portfolio && (it.standards || []).length) {
      chips.appendChild(el('span', {
        class: 'badge b-brass',
        title: (it.standards || []).map(standardName).join(' • '),
        text: t('portfolioChip') + ' (' + it.standards.length + ')'
      }));
    }
    if (it.audience === 'class') {
      chips.appendChild(el('span', { class: 'badge b-brass', text: classNamesFor(it.audience_class_ids) }));
    } else if (it.audience !== 'all') {
      var n = (it.audience_student_ids || []).length;
      chips.appendChild(el('span', { class: 'badge b-brass', text: t('audNamed') + ' (' + n + ')' }));
    }
    left.appendChild(chips);
    head.appendChild(left);
    var actions = el('div', { class: 'btn-row' });
    actions.appendChild(el('button', {
      type: 'button', class: 'btn-ghost btn-sm',
      onclick: async function () {
        var d = await sb.from('section_items').update({ is_published: !it.is_published }).eq('id', it.id).select('id');
        if (d.error) { toast(t('err'), true); return; }
        loadTSectionItems();
      }
    }, el('span', { text: it.is_published ? t('unpublish') : t('publish') })));
    actions.appendChild(el('button', {
      type: 'button', class: 'btn-outline btn-sm',
      onclick: function () { openItemModal(sec, it); }
    }, icon('edit'), el('span', { text: t('edit') })));
    actions.appendChild(el('button', {
      type: 'button', class: 'btn-danger btn-sm',
      onclick: function () {
        askConfirm(t('confirmDel'), async function () {
          var d = await sb.from('section_items').remove().eq('id', it.id);
          if (d.error) { toast(t('err'), true); return; }
          loadTSectionItems();
        });
      }
    }, icon('trash'), el('span', { text: t('del') })));
    head.appendChild(actions);
    card.appendChild(head);
    box.appendChild(card);
  });
}

/* تعديل قسم */
function openSecEdit(sec) {
  $('#se-title-ar').value = sec.title_ar || '';
  $('#se-title-en').value = sec.title_en || '';
  $('#se-vis-stu').checked = !!sec.visible_to_students;
  $('#se-vis-par').checked = !!sec.visible_to_parents;
  $('#se-order').value = sec.sort_order != null ? sec.sort_order : 0;
  if (sec.is_system) hide($('#se-delete')); else show($('#se-delete'));
  openModal('modal-secedit');
}

async function saveSecEdit() {
  var sec = state.currentSection;
  if (!sec) return;
  var titleAr = $('#se-title-ar').value.trim();
  if (!titleAr) { toast(t('nameAr'), true); return; }
  var r = await sb.from('sections').update({
    title_ar: titleAr,
    title_en: $('#se-title-en').value.trim() || titleAr,
    visible_to_students: $('#se-vis-stu').checked,
    visible_to_parents: $('#se-vis-par').checked,
    sort_order: parseInt($('#se-order').value, 10) || 0
  }).eq('id', sec.id).select('*');
  if (r.error) { toast(t('err'), true); return; }
  closeModal('modal-secedit');
  toast(t('saved'));
  await fetchSections();
  state.currentSection = state.sections.find(function (s) { return s.id === sec.id; }) || null;
  if (state.currentSection) loadTSectionItems();
  else showTeacherScreen('sections');
}

function deleteSecEdit() {
  var sec = state.currentSection;
  if (!sec || sec.is_system) return;
  askConfirm(t('confirmDel'), async function () {
    var r = await sb.from('sections').remove().eq('id', sec.id);
    if (r.error) { toast(t('err'), true); return; }
    closeModal('modal-secedit');
    await fetchSections();
    showTeacherScreen('sections');
  });
}

/* إضافة / تعديل عنصر */
/* ================================================ ملف الإنجاز
   معايير الأداء الوظيفي الثمانية، والمعيار الافتراضي لكل قسم حتى لا
   تضطر المعلمة لاختياره يدوياً في كل مرة. */
var STANDARDS = [
  { key: 'classroom',   ar: 'الإدارة الصفية',                        en: 'Classroom Management' },
  { key: 'planning',    ar: 'إعداد وتنفيذ خطة التعلم',               en: 'Planning and Delivery' },
  { key: 'results',     ar: 'تحسين نتائج المتعلمين',                 en: 'Improving Outcomes' },
  { key: 'parents',     ar: 'التفاعل مع أولياء الأمور',              en: 'Parent Engagement' },
  { key: 'tech',        ar: 'توظيف تقنيات ووسائل التعلم المناسبة',    en: 'Learning Technologies' },
  { key: 'environment', ar: 'تهيئة البيئة التعليمية',                en: 'Learning Environment' },
  { key: 'assessment',  ar: 'تنويع أساليب التقويم',                  en: 'Varied Assessment' },
  { key: 'analysis',    ar: 'تحليل نتائج المتعلمين وتشخيص مستوياتهم', en: 'Analysis and Diagnosis' }
];

var SECTION_STANDARDS = {
  'classroom-rules': ['classroom'],
  'attendance': ['classroom'],
  'honors': ['classroom', 'results'],
  'worksheets': ['planning', 'environment'],
  'activities': ['planning', 'environment'],
  'remedial-plan': ['planning', 'results'],
  'enrichment-plan': ['planning', 'results'],
  'projects': ['environment'],
  'performance-tasks': ['environment'],
  'presentations': ['tech'],
  'games': ['tech'],
  'diagnostic-tests': ['assessment', 'analysis'],
  'quizzes': ['assessment'],
  'feedback': ['results'],
  'parents': ['parents']
};

function standardName(key) {
  var s = STANDARDS.find(function (x) { return x.key === key; });
  return s ? (LANG === 'en' ? s.en : s.ar) : key;
}

function standardsFor(sec) {
  return (sec && SECTION_STANDARDS[sec.slug]) || [];
}

/* تُظهر قائمة المعايير حين تُعلّم المعلمة أن العنصر شاهد في الملف */
function syncPortfolioBox() {
  var on = $('#it-portfolio') && $('#it-portfolio').checked;
  var box = $('#it-standards'), hint = $('#it-std-hint');
  if (box) { if (on) show(box); else hide(box); }
  if (hint) { if (on) show(hint); else hide(hint); }
}

/* تُظهر القائمة المناسبة للجمهور المختار وتُخفي الباقي */
function syncAudienceBoxes() {
  var v = $('#it-aud') ? $('#it-aud').value : 'all';
  var stu = $('#it-aud-students'), cls = $('#it-aud-classes'), hint = $('#it-aud-hint');
  if (stu) { if (v === 'named') show(stu); else hide(stu); }
  if (cls) { if (v === 'class') show(cls); else hide(cls); }
  if (hint) { if (v === 'class') show(hint); else hide(hint); }
}

async function openItemModal(sec, item) {
  state.editingItem = item || null;
  resetDropzone('it-dz-label', 'it-dz-hint', 'itemFile');
  $('#it-file').value = '';
  $('#item-modal-title').textContent = item ? t('editItem') : t('addItem');
  var typeSel = $('#it-type');
  typeSel.textContent = '';
  (sec.allowed_types || ['text']).forEach(function (tp) {
    typeSel.appendChild(el('option', { value: tp, text: t('tp_' + tp) }));
  });
  typeSel.value = item && (sec.allowed_types || []).indexOf(item.item_type) > -1
    ? item.item_type : (sec.allowed_types || ['text'])[0];
  $('#it-title-ar').value = item ? (item.title_ar || '') : '';
  $('#it-title-en').value = item ? (item.title_en || '') : '';
  $('#it-body-ar').value = item ? (item.body_ar || '') : '';
  $('#it-body-en').value = item ? (item.body_en || '') : '';
  $('#it-url').value = item ? (item.external_url || '') : '';
  $('#it-accepts').checked = !!(item && item.accepts_submissions);
  if ($('#it-accepts').checked) show($('#it-due-wrap')); else hide($('#it-due-wrap'));
  $('#it-due').value = item ? toLocalInput(item.due_at) : '';
  $('#it-published').checked = item ? !!item.is_published : true;
  var aud = (item && item.audience) || 'all';
  $('#it-aud').value = (aud === 'class' || aud === 'named') ? aud : 'all';

  /* قائمة الطالبات بالأسماء */
  var audBox = $('#it-aud-students');
  audBox.textContent = '';
  var students = await getStudents();
  var chosen = (item && item.audience_student_ids) || [];
  students.forEach(function (s) {
    var lab = el('label', { class: 'check-row', style: 'margin-bottom:4px' });
    lab.appendChild(el('input', { type: 'checkbox', class: 'it-aud-check', value: s.id, checked: chosen.indexOf(s.id) > -1 }));
    lab.appendChild(el('span', { text: s.full_name }));
    audBox.appendChild(lab);
  });

  /* قائمة الفصول: يمكن اختيار فصل أو أكثر */
  var clsBox = $('#it-aud-classes');
  clsBox.textContent = '';
  await loadClasses();
  var chosenCls = (item && item.audience_class_ids) || [];
  var classes = state.classes || [];
  if (!classes.length) {
    clsBox.appendChild(el('p', { class: 'muted small', style: 'margin:0', text: t('noClassesYet') }));
  } else {
    classes.forEach(function (c) {
      var lab = el('label', { class: 'check-row', style: 'margin-bottom:4px' });
      lab.appendChild(el('input', {
        type: 'checkbox', class: 'it-cls-check', value: c.id,
        checked: chosenCls.indexOf(c.id) > -1
      }));
      lab.appendChild(el('span', { text: c.name }));
      clsBox.appendChild(lab);
    });
  }
  /* ملف الإنجاز: المعايير مُعلّمة مسبقاً حسب القسم في العنصر الجديد */
  var defStds = standardsFor(sec);
  var inPf = item ? !!item.in_portfolio : defStds.length > 0;
  var pickedStds = item
    ? ((item.standards && item.standards.length) ? item.standards : defStds)
    : defStds;
  $('#it-portfolio').checked = inPf;
  var stdBox = $('#it-standards');
  stdBox.textContent = '';
  STANDARDS.forEach(function (st) {
    var lab = el('label', { class: 'check-row', style: 'margin-bottom:4px' });
    lab.appendChild(el('input', {
      type: 'checkbox', class: 'it-std-check', value: st.key,
      checked: pickedStds.indexOf(st.key) > -1
    }));
    lab.appendChild(el('span', { text: LANG === 'en' ? st.en : st.ar }));
    stdBox.appendChild(lab);
  });

  syncAudienceBoxes();
  syncPortfolioBox();
  if (item && item.file_path) show($('#it-file-note')); else hide($('#it-file-note'));
  openModal('modal-item');
}

async function saveItem() {
  var sec = state.currentSection;
  if (!sec) return;
  var item = state.editingItem;
  var titleAr = $('#it-title-ar').value.trim();
  if (!titleAr) { toast(t('titleAr'), true); return; }
  var btn = $('#it-save');
  btn.disabled = true;
  var filePath = item ? item.file_path : null;
  if (state.itemFile) {
    var up = await sb.storage.upload('materials', state.itemFile, 'sections/' + sec.id);
    if (up.error || !up.data || !up.data.path) { btn.disabled = false; toast(t('err'), true); return; }
    filePath = up.data.path;
  }
  var audience = 'all';
  var audIds = null;
  var clsIds = null;
  var audPick = $('#it-aud').value;
  if (audPick === 'named') {
    audIds = $$('.it-aud-check').filter(function (c) { return c.checked; })
      .map(function (c) { return c.value; });
    if (audIds.length) audience = 'named'; else audIds = null;
  } else if (audPick === 'class') {
    clsIds = $$('.it-cls-check').filter(function (c) { return c.checked; })
      .map(function (c) { return Number(c.value); });
    /* فصل محدد بلا فصل مختار يعني لن تراه أي طالبة — نوقف الحفظ */
    if (!clsIds.length) { btn.disabled = false; toast(t('pickClass'), true); return; }
    audience = 'class';
  }
  /* ملف الإنجاز */
  var inPortfolio = $('#it-portfolio').checked;
  var stds = $$('.it-std-check').filter(function (c) { return c.checked; })
    .map(function (c) { return c.value; });
  if (inPortfolio && !stds.length) {
    btn.disabled = false; toast(t('pickStandard'), true); return;
  }
  if (!inPortfolio) stds = null;

  var accepts = $('#it-accepts').checked;
  var dueV = $('#it-due').value;
  var payload = {
    title_ar: titleAr,
    title_en: $('#it-title-en').value.trim() || null,
    body_ar: $('#it-body-ar').value.trim() || null,
    body_en: $('#it-body-en').value.trim() || null,
    item_type: $('#it-type').value,
    external_url: $('#it-url').value.trim() || null,
    file_path: filePath,
    accepts_submissions: accepts,
    due_at: accepts && dueV ? new Date(dueV).toISOString() : null,
    audience: audience,
    audience_student_ids: audIds,
    audience_class_ids: clsIds,
    in_portfolio: inPortfolio,
    standards: stds,
    is_published: $('#it-published').checked
  };
  var r;
  if (item) {
    r = await sb.from('section_items').update(payload).eq('id', item.id).select('id');
  } else {
    payload.section_id = sec.id;
    payload.created_by = sb.userId();
    r = await sb.from('section_items').insert(payload).select('id');
  }
  btn.disabled = false;
  if (r.error) { toast(t('err'), true); return; }
  closeModal('modal-item');
  toast(t('saved'));
  loadTSectionItems();
}

/* منشئ الأقسام */
var WIZ_TYPES = ['text', 'link', 'image', 'file', 'video', 'name'];

function openWizard() {
  state.wizard = {
    step: 0,
    data: {
      title_ar: '', title_en: '', slug: '',
      allowed: ['text', 'link', 'image', 'file'],
      vis_s: true, vis_p: false, order: 50
    }
  };
  renderWizard();
  openModal('modal-wizard');
}

function readWizardStep() {
  var w = state.wizard;
  if (!w) return;
  if (w.step === 0) {
    var a = $('#wz-title-ar'); if (a) w.data.title_ar = a.value.trim();
    var b = $('#wz-title-en'); if (b) w.data.title_en = b.value.trim();
    var c = $('#wz-slug'); if (c) w.data.slug = c.value.trim();
  } else if (w.step === 1) {
    w.data.allowed = $$('.wz-type-check').filter(function (x) { return x.checked; })
      .map(function (x) { return x.value; });
  } else if (w.step === 2) {
    var s = $('#wz-vis-s'); if (s) w.data.vis_s = s.checked;
    var p = $('#wz-vis-p'); if (p) w.data.vis_p = p.checked;
    var o = $('#wz-order'); if (o) w.data.order = parseInt(o.value, 10) || 0;
  }
}

function slugify(text) {
  return String(text || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function renderWizard() {
  var w = state.wizard;
  if (!w) return;
  $$('#wz-steps span').forEach(function (s, i) {
    s.classList.toggle('done', i <= w.step);
  });
  $('#wz-back').disabled = w.step === 0;
  $('#wz-next').textContent = w.step === 2 ? t('create') : t('next');
  var body = $('#wz-body');
  body.textContent = '';
  if (w.step === 0) {
    body.appendChild(el('div', { class: 'field' },
      el('label', { for: 'wz-title-ar', text: t('nameAr') }),
      el('input', { type: 'text', id: 'wz-title-ar', value: w.data.title_ar })));
    body.appendChild(el('div', { class: 'field' },
      el('label', { for: 'wz-title-en', text: t('nameEn') }),
      el('input', { type: 'text', id: 'wz-title-en', class: 'ltr', value: w.data.title_en })));
    body.appendChild(el('div', { class: 'field' },
      el('label', { for: 'wz-slug', text: t('slugLabel') }),
      el('input', { type: 'text', id: 'wz-slug', class: 'ltr', value: w.data.slug })));
  } else if (w.step === 1) {
    body.appendChild(el('div', { class: 'field' }, el('label', { text: t('allowedTypes') })));
    var grid = el('div', { class: 'check-grid' });
    WIZ_TYPES.forEach(function (tp) {
      var lab = el('label', { class: 'check-row' });
      lab.appendChild(el('input', { type: 'checkbox', class: 'wz-type-check', value: tp, checked: w.data.allowed.indexOf(tp) > -1 }));
      lab.appendChild(el('span', { text: t('tp_' + tp) }));
      grid.appendChild(lab);
    });
    body.appendChild(grid);
  } else {
    var s1 = el('label', { class: 'check-row' });
    s1.appendChild(el('input', { type: 'checkbox', id: 'wz-vis-s', checked: w.data.vis_s }));
    s1.appendChild(el('span', { text: t('visStudents') }));
    body.appendChild(s1);
    var s2 = el('label', { class: 'check-row' });
    s2.appendChild(el('input', { type: 'checkbox', id: 'wz-vis-p', checked: w.data.vis_p }));
    s2.appendChild(el('span', { text: t('visParents') }));
    body.appendChild(s2);
    body.appendChild(el('div', { class: 'field' },
      el('label', { for: 'wz-order', text: t('order_') }),
      el('input', { type: 'number', id: 'wz-order', value: w.data.order, style: 'width:110px' })));
    body.appendChild(el('div', { class: 'field' }, el('label', { text: t('preview') })));
    var pv = el('div', { class: 'section-card', style: 'cursor:default' });
    var head = el('div', { class: 'sc-title' });
    head.appendChild(icon('grid'));
    head.appendChild(el('span', { text: w.data.title_ar || '...' }));
    pv.appendChild(head);
    var meta = el('div', { class: 'sc-meta' });
    w.data.allowed.forEach(function (tp) {
      meta.appendChild(el('span', { class: 'badge b-gray', text: t('tp_' + tp) }));
    });
    pv.appendChild(meta);
    body.appendChild(pv);
  }
}

function wizardBack() {
  var w = state.wizard;
  if (!w || w.step === 0) return;
  readWizardStep();
  w.step--;
  renderWizard();
}

async function wizardNext() {
  var w = state.wizard;
  if (!w) return;
  readWizardStep();
  if (w.step === 0) {
    if (!w.data.title_ar) { toast(t('nameAr'), true); return; }
    if (!w.data.slug) {
      w.data.slug = slugify(w.data.title_en) || ('sec-' + Date.now());
    } else {
      w.data.slug = slugify(w.data.slug) || ('sec-' + Date.now());
    }
    w.step = 1;
    renderWizard();
    return;
  }
  if (w.step === 1) {
    if (!w.data.allowed.length) { toast(t('allowedTypes'), true); return; }
    w.step = 2;
    renderWizard();
    return;
  }
  /* الإنشاء */
  var btn = $('#wz-next');
  btn.disabled = true;
  var payload = {
    slug: w.data.slug,
    title_ar: w.data.title_ar,
    title_en: w.data.title_en || w.data.title_ar,
    kind: 'content_list',
    allowed_types: w.data.allowed,
    visible_to_students: w.data.vis_s,
    visible_to_parents: w.data.vis_p,
    sort_order: w.data.order
  };
  var r = await sb.from('sections').insert(payload).select('*');
  if (r.error && String(r.error).toLowerCase().indexOf('duplicate') > -1) {
    payload.slug = payload.slug + '-' + String(Date.now()).slice(-4);
    r = await sb.from('sections').insert(payload).select('*');
  }
  btn.disabled = false;
  if (r.error) { toast(t('err'), true); return; }
  closeModal('modal-wizard');
  toast(t('saved'));
  await fetchSections();
  showTeacherScreen('sections');
}

/* ------------------------------------------------ لوحة التميز (المعلمة) */
/* ================================================ بطاقة التميز
   تُرسم البطاقة في المتصفح كصورة جاهزة للمشاركة في واتساب.
   الهوية: كحلي عميق، إطار نحاسي، وزخرفة هندسية بسيطة. */
var CARD_W = 1080, CARD_H = 1350;   /* مقاس مناسب للنشر */

function cardColors() {
  return {
    bg: '#16263A', panel: '#1B3350', ink: '#F4F1EA', dim: '#C3CEDB',
    brass: '#C8A96A', brassSoft: 'rgba(200,169,106,0.16)'
  };
}

/* زخرفة سدو بسيطة: معيّنات متتابعة */
function drawSaduBand(ctx, x, y, w, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  var step = size * 1.6;
  for (var cx = x; cx < x + w; cx += step) {
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + size / 2, y - size / 2);
    ctx.lineTo(cx + size, y);
    ctx.lineTo(cx + size / 2, y + size / 2);
    ctx.closePath();
    if (Math.round((cx - x) / step) % 2 === 0) ctx.fill(); else ctx.stroke();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* يلفّ النص العربي على أسطر بما يناسب العرض */
function wrapLines(ctx, text, maxW) {
  var words = String(text || '').split(/\s+/).filter(Boolean);
  var lines = [], cur = '';
  words.forEach(function (word) {
    var test = cur ? cur + ' ' + word : word;
    if (ctx.measureText(test).width <= maxW || !cur) cur = test;
    else { lines.push(cur); cur = word; }
  });
  if (cur) lines.push(cur);
  return lines;
}

function drawExcellenceCard(canvas, data) {
  var c = cardColors();
  /* تحديد المقاس قبل الحصول على السياق: تغيير العرض لاحقاً يمسح ما رُسم */
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  var ctx = canvas.getContext('2d');
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';

  var F = '"Segoe UI", Tahoma, sans-serif';
  var mid = CARD_W / 2;
  var maxW = CARD_W - 300;

  /* الخلفية والتوهج */
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  var g = ctx.createRadialGradient(mid, CARD_H * 0.40, 60, mid, CARD_H * 0.40, CARD_W * 0.8);
  g.addColorStop(0, 'rgba(200,169,106,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  /* الإطار المزدوج */
  ctx.strokeStyle = c.brass;
  ctx.lineWidth = 6;
  roundRect(ctx, 46, 46, CARD_W - 92, CARD_H - 92, 26);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(200,169,106,0.5)';
  roundRect(ctx, 66, 66, CARD_W - 132, CARD_H - 132, 18);
  ctx.stroke();

  /* اسم المنصة وشريط الزخرفة */
  ctx.fillStyle = c.dim;
  ctx.font = '600 34px ' + F;
  ctx.fillText(data.platform, mid, 122);
  drawSaduBand(ctx, 130, 160, CARD_W - 260, 15, 'rgba(200,169,106,0.75)');
  drawSaduBand(ctx, 130, CARD_H - 160, CARD_W - 260, 15, 'rgba(200,169,106,0.75)');

  /* ---- قياس الارتفاعات أولاً حتى تُوسَّط المجموعة رأسياً ---- */
  var medalR = 88, gapAfterMedal = 62;
  ctx.font = '700 52px ' + F;
  var titleH = 52, gapAfterTitle = 54;

  ctx.font = '700 60px ' + F;
  var nameLines = wrapLines(ctx, data.name, maxW);
  var lineH = 76;
  var panelH = 56 + nameLines.length * lineH;
  var gapAfterName = 56;

  var reasonLines = [];
  if (data.reason) {
    ctx.font = '600 38px ' + F;
    reasonLines = wrapLines(ctx, data.reason, maxW).slice(0, 3);
  }
  var reasonH = reasonLines.length ? (44 + reasonLines.length * 52) : 0;
  var gapAfterReason = reasonLines.length ? 56 : 0;
  var signH = 34 + 46 + 40;   /* الفاصل + المعلمة + التاريخ */

  var totalH = medalR * 2 + gapAfterMedal + titleH + gapAfterTitle
             + panelH + gapAfterName + reasonH + gapAfterReason + signH;

  var areaTop = 200, areaBottom = CARD_H - 200;
  var y = areaTop + Math.max(0, ((areaBottom - areaTop) - totalH) / 2);

  /* ---- الوسام ---- */
  var cy = y + medalR;
  ctx.beginPath();
  ctx.arc(mid, cy, medalR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200,169,106,0.14)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = c.brass;
  ctx.stroke();
  ctx.save();
  ctx.translate(mid, cy);
  ctx.fillStyle = c.brass;
  ctx.beginPath();
  for (var i = 0; i < 10; i++) {
    var rr = i % 2 === 0 ? 44 : 19;
    var a = (Math.PI / 5) * i - Math.PI / 2;
    var px = Math.cos(a) * rr, py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  y = cy + medalR + gapAfterMedal;

  /* ---- العنوان ---- */
  ctx.fillStyle = c.brass;
  ctx.font = '700 52px ' + F;
  ctx.fillText(data.title, mid, y + titleH * 0.8);
  y += titleH + gapAfterTitle;

  /* ---- لوح الاسم ---- */
  ctx.fillStyle = c.panel;
  roundRect(ctx, 130, y, CARD_W - 260, panelH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,169,106,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = c.ink;
  ctx.font = '700 60px ' + F;
  nameLines.forEach(function (ln, k) {
    ctx.fillText(ln, mid, y + 74 + k * lineH);
  });
  y += panelH + gapAfterName;

  /* ---- سبب التميز ---- */
  if (reasonLines.length) {
    ctx.fillStyle = c.dim;
    ctx.font = '400 32px ' + F;
    ctx.fillText(data.reasonLabel, mid, y);
    y += 44;
    ctx.fillStyle = c.ink;
    ctx.font = '600 38px ' + F;
    reasonLines.forEach(function (ln) {
      ctx.fillText(ln, mid, y + 34);
      y += 52;
    });
    y += gapAfterReason - 18;
  }

  /* ---- الفاصل والتوقيع ---- */
  ctx.strokeStyle = 'rgba(200,169,106,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mid - 90, y);
  ctx.lineTo(mid + 90, y);
  ctx.stroke();
  y += 46;
  ctx.fillStyle = c.dim;
  ctx.font = '600 32px ' + F;
  ctx.fillText(data.teacher, mid, y);
  y += 44;
  ctx.fillStyle = 'rgba(195,206,219,0.72)';
  ctx.font = '400 27px ' + F;
  ctx.fillText(data.date, mid, y);
  return canvas;
}

function excCardData(x) {
  return {
    platform: platformName(),
    title: t('excCardTitle'),
    name: x.student_name || '',
    reason: L(x, 'reason') || '',
    reasonLabel: t('excCardReason'),
    teacher: teacherName(),
    date: fmtDate(x.added_at || new Date())
  };
}

/* نافذة المعاينة: ترى المعلمة البطاقة قبل التنزيل أو المشاركة */
function openExcCard(x) {
  var overlay = $('#modal-card');
  var canvas = $('#card-canvas');
  drawExcellenceCard(canvas, excCardData(x));
  $('#card-title').textContent = t('excCard') + ' — ' + (x.student_name || '');

  $('#card-download').onclick = function () {
    try {
      var url = canvas.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = url;
      a.download = 'تميز-' + (x.student_name || 'card').replace(/\s+/g, '-') + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast(t('cardSaved'));
    } catch (e) { toast(t('err'), true); }
  };

  $('#card-share').onclick = async function () {
    /* المشاركة المباشرة إن دعمها الجهاز، وإلا ننزّل الصورة ونفتح واتساب */
    var students = await getStudents();
    var stu = students.find(function (u) { return u.id === x.student_id; });
    var caption = t('excCardCaption').replace('{student}', x.student_name || '');
    try {
      if (navigator.share && navigator.canShare) {
        var blob = await new Promise(function (res) { canvas.toBlob(res, 'image/png'); });
        var file = new File([blob], 'excellence.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: caption });
          if (stu) logParentMessage(stu.id, 'excellence', 'card');
          return;
        }
      }
    } catch (e) { /* أُلغيت المشاركة أو غير مدعومة */ }
    $('#card-download').click();
    if (stu && stu.mother_phone) {
      window.open(waUrl(stu.mother_phone, caption + '\n' + t('cardAttachHint')), '_blank');
      logParentMessage(stu.id, 'excellence', 'card');
    } else {
      toast(t('noMotherPhone'), true);
    }
  };

  openModal('modal-card');
}

async function loadTExcellence() {
  var box = $('#exc-grid');
  box.textContent = '';
  box.appendChild(loadingBox());
  var r = await sb.from('excellence_board').select('*')
    .eq('is_active', true).order('added_at', false);
  var rows = r.data || [];
  box.textContent = '';
  if (!rows.length) { box.appendChild(emptyBox()); return; }
  rows.forEach(function (x) {
    var card = el('div', { class: 'exc-card' });
    card.appendChild(el('div', { class: 'exc-name', text: x.student_name }));
    var reason = L(x, 'reason');
    if (reason) card.appendChild(el('div', { class: 'exc-reason', text: reason }));
    card.appendChild(el('div', { class: 'exc-date', text: fmtDate(x.added_at) }));
    var act = el('div', { class: 'exc-actions' });
    /* بطاقة التميز: صورة جاهزة للمشاركة */
    act.appendChild(el('button', {
      type: 'button', class: 'btn-brass btn-sm',
      onclick: function () { openExcCard(x); }
    }, icon('award'), el('span', { text: t('excCard') })));
    /* تبليغ أم الطالبة بالتميز عبر واتساب */
    act.appendChild(el('button', {
      type: 'button', class: 'btn btn-wa btn-sm',
      onclick: async function () {
        var students = await getStudents();
        var stu = students.find(function (u) { return u.id === x.student_id; });
        if (!stu) { toast(t('err'), true); return; }
        var rows = state.mothersData || await buildMothersData();
        var r = rows.find(function (z) { return z.stu.id === x.student_id; })
          || { stu: stu, absences: 0, attrate: null, percent: null, points: 0, approved: 0, exc: x, lastByKind: {} };
        r.exc = x;
        var txt = await messageFor(r, 'excellence');
        openWaModal(stu, 'excellence', txt, null);
      }
    }, el('span', { text: t('notifyMother') })));
    act.appendChild(el('button', {
      type: 'button', class: 'btn-ghost btn-sm',
      onclick: function () {
        askConfirm(t('removeExc') + '?', async function () {
          var d = await sb.from('excellence_board').update({ is_active: false }).eq('id', x.id).select('id');
          if (d.error) { toast(t('err'), true); return; }
          loadTExcellence();
        });
      }
    }, el('span', { text: t('removeExc') })));
    card.appendChild(act);
    box.appendChild(card);
  });
}

async function openExcModal(preStudent, onDone) {
  state.excOnDone = onDone || null;
  var sel = $('#ex-student');
  sel.textContent = '';
  var students = await getStudents();
  students.forEach(function (s) {
    sel.appendChild(el('option', { value: s.id, text: s.full_name }));
  });
  if (preStudent) { sel.value = preStudent.id; sel.disabled = true; }
  else sel.disabled = false;
  $('#ex-reason').value = '';
  openModal('modal-exc');
}

async function saveExc() {
  var sel = $('#ex-student');
  var sid = sel.value;
  if (!sid) return;
  var sname = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent : '';
  var r = await sb.from('excellence_board').insert({
    student_id: sid,
    student_name: sname,
    reason_ar: $('#ex-reason').value.trim() || null
  }).select('id');
  if (r.error) { toast(t('err'), true); return; }
  closeModal('modal-exc');
  toast(t('saved'));
  if (state.excOnDone) state.excOnDone();
}

/* ------------------------------------------------ الشهادات */
function openCertModal(student) {
  state.certStudent = student;
  resetDropzone('ct-dz-label', 'ct-dz-hint', 'certFile');
  $('#ct-file').value = '';
  $('#ct-title-ar').value = '';
  $('#ct-title-en').value = '';
  openModal('modal-cert');
}

async function saveCert() {
  var stu = state.certStudent;
  if (!stu) return;
  var titleAr = $('#ct-title-ar').value.trim();
  if (!titleAr) { toast(t('titleAr'), true); return; }
  var btn = $('#ct-save');
  btn.disabled = true;
  var filePath = null;
  if (state.certFile) {
    var up = await sb.storage.upload('materials', state.certFile, 'certificates/' + stu.id);
    if (up.error || !up.data || !up.data.path) { btn.disabled = false; toast(t('err'), true); return; }
    filePath = up.data.path;
  }
  var r = await sb.from('certificates').insert({
    student_id: stu.id,
    title_ar: titleAr,
    title_en: $('#ct-title-en').value.trim() || null,
    file_path: filePath
  }).select('id');
  btn.disabled = false;
  if (r.error) { toast(t('err'), true); return; }
  closeModal('modal-cert');
  toast(t('saved'));
  if (state.nav.screen === 'student') loadTStudent();
}

/* ------------------------------------------------ ملاحظات الطالبات */
async function loadTFeedback() {
  var box = $('#fb-list');
  box.textContent = '';
  box.appendChild(loadingBox());
  var r = await sb.from('feedback').select('*,profiles(full_name)').order('created_at', false);
  var rows = r.data || [];
  box.textContent = '';
  if (!rows.length) { box.appendChild(emptyBox()); return; }
  rows.forEach(function (f) {
    var card = el('div', { class: 'fb-card' });
    var meta = el('div', { class: 'fb-meta' });
    meta.appendChild(el('b', { text: f.profiles && f.profiles.full_name || '' }));
    meta.appendChild(el('span', { text: fmtDateTime(f.created_at) }));
    meta.appendChild(el('span', {
      class: 'badge ' + (f.is_public ? 'b-green' : 'b-gray'),
      text: f.is_public ? t('publicBadge') : t('privateBadge')
    }));
    card.appendChild(meta);
    card.appendChild(el('div', { class: 'fb-body', text: f.body }));
    var repWrap = el('div', { class: 'fb-reply' });
    repWrap.appendChild(el('div', { class: 'fb-reply-label', text: t('reply') }));
    var ta = el('textarea', { value: f.teacher_reply || '' });
    repWrap.appendChild(ta);
    var row = el('div', { class: 'btn-row', style: 'margin-top:8px' });
    row.appendChild(el('button', {
      type: 'button', class: 'btn btn-sm',
      onclick: async function () {
        var d = await sb.from('feedback').update({ teacher_reply: ta.value.trim() || null }).eq('id', f.id).select('id');
        if (d.error) { toast(t('err'), true); return; }
        toast(t('saved'));
      }
    }, el('span', { text: t('saveReply') })));
    row.appendChild(el('button', {
      type: 'button', class: 'btn-outline btn-sm',
      onclick: async function () {
        var d = await sb.from('feedback').update({ is_public: !f.is_public }).eq('id', f.id).select('id');
        if (d.error) { toast(t('err'), true); return; }
        loadTFeedback();
      }
    }, el('span', { text: f.is_public ? t('makePrivate') : t('makePublic') })));
    repWrap.appendChild(row);
    card.appendChild(repWrap);
    box.appendChild(card);
  });
}

/* =====================================================================
   11) بوابة ولي الأمر
   ===================================================================== */
function gotoParent() {
  showView('view-parent');
  state.nav.screen = null;
  state.parentChosen = null;
  state.parentData = null;
  show($('#parent-entry'));
  hide($('#parent-report'));
  show($('#parent-step-pick'));
  hide($('#form-parent-verify'));
  var srch = $('#parent-search'); if (srch) srch.value = '';
  var ph = $('#parent-phone'); if (ph) ph.value = '';
  loadParentStudents();
}

function parentLink(code) {
  return window.location.origin + window.location.pathname + '?parent=' + code;
}

async function loadParentStudents() {
  var listBox = $('#parent-student-list');
  if (!listBox) return;
  listBox.textContent = '';
  listBox.appendChild(el('div', { class: 'muted', style: 'padding:10px', text: t('loading') }));
  var d = await apiGet('parent_students');
  state.parentStudents = (d && d.data) ? d.data : [];
  renderParentStudentList('');
}

function renderParentStudentList(filter) {
  var listBox = $('#parent-student-list');
  if (!listBox) return;
  listBox.textContent = '';
  var all = state.parentStudents || [];
  if (!all.length) {
    listBox.appendChild(el('div', { class: 'muted', style: 'padding:10px', text: t('noStudentsYet') }));
    return;
  }
  filter = (filter || '').trim();
  var arr = filter ? all.filter(function (s) { return s.full_name.indexOf(filter) > -1; }) : all;
  if (!arr.length) {
    listBox.appendChild(el('div', { class: 'muted', style: 'padding:10px', text: t('noResults') }));
    return;
  }
  arr.forEach(function (s) {
    listBox.appendChild(el('button', {
      type: 'button', class: 'parent-item',
      onclick: function () { selectParentStudent(s); }
    }, el('span', { text: s.full_name })));
  });
}

function selectParentStudent(s) {
  state.parentChosen = s;
  $('#parent-chosen-name').textContent = s.full_name;
  hide($('#parent-step-pick'));
  show($('#form-parent-verify'));
  var ph = $('#parent-phone');
  ph.value = '';
  ph.focus();
}

function backToParentPick() {
  state.parentChosen = null;
  show($('#parent-step-pick'));
  hide($('#form-parent-verify'));
  $('#parent-phone').value = '';
}

async function submitParentByPhone(e) {
  if (e) e.preventDefault();
  if (!state.parentChosen) return;
  var phone = normPhone($('#parent-phone').value);
  if (!phone) { toast(t('phoneInvalid'), true); return; }
  var btn = $('#parent-submit');
  btn.disabled = true;
  var d = await apiGet('parent_portal&student_id='
    + encodeURIComponent(state.parentChosen.id) + '&phone=' + encodeURIComponent(phone));
  btn.disabled = false;
  if (!d || d.error || !d.data || d.data.error) { toast(t('phoneNotMatch'), true); return; }
  state.parentData = d.data;
  renderParentReport(d.data);
}

/* الرابط المباشر بالرمز (?parent=CODE) من المعلمة */
async function submitParentCode(code) {
  code = String(code || '').trim().toLowerCase();
  if (!code) return;
  var d = await apiGet('parent_portal&code=' + encodeURIComponent(code));
  if (!d || d.error || !d.data || d.data.error) { toast(t('invalidCode'), true); return; }
  state.parentData = d.data;
  renderParentReport(d.data);
}

function renderParentReport(data) {
  hide($('#parent-entry'));
  show($('#parent-report'));
  $('#pr-name').textContent = data.student && data.student.full_name || '';
  if (data.excellence) show($('#pr-exc')); else hide($('#pr-exc'));

  var att = data.attendance || {};
  var attBox = $('#pr-att');
  attBox.textContent = '';
  var total = 0;
  ['present', 'absent', 'late', 'excused'].forEach(function (s) { total += (att[s] || 0); });
  ATT_STATUSES.forEach(function (pair) {
    attBox.appendChild(el('span', {
      class: 'badge ' + { present: 'b-green', absent: 'b-red', late: 'b-amber', excused: 'b-navy' }[pair[0]],
      text: t('at_' + pair[0]) + ' ' + (att[pair[0]] || 0)
    }));
  });
  if (total) {
    var rate = Math.round((((att.present || 0) + (att.late || 0)) / total) * 100);
    attBox.appendChild(el('span', { class: 'badge b-gray', text: t('attRate') + ' ' + rate + '%' }));
  } else {
    attBox.appendChild(el('span', { class: 'badge b-gray', text: t('noData') }));
  }

  var gBox = $('#pr-grades');
  gBox.textContent = '';
  var grades = data.grades || [];
  if (!grades.length) gBox.appendChild(emptyBox());
  else {
    var table = el('table', { class: 'tbl' });
    table.appendChild(el('thead', {}, el('tr', {},
      el('th', { text: t('task') }), el('th', { text: t('grade') }),
      el('th', { text: t('date') }), el('th', { text: t('teacherFeedback') }))));
    var tbody = el('tbody');
    grades.forEach(function (g) {
      tbody.appendChild(el('tr', {},
        el('td', { text: g.title || '' }),
        el('td', { text: (g.grade != null ? g.grade : '--') + ' / ' + (g.max != null ? g.max : '--') }),
        el('td', { text: fmtDate(g.date) }),
        el('td', { text: g.feedback || '' })));
    });
    table.appendChild(tbody);
    gBox.appendChild(table);
  }

  var cBox = $('#pr-certs');
  cBox.textContent = '';
  var certs = data.certificates || [];
  if (!certs.length) cBox.appendChild(emptyBox());
  else {
    certs.forEach(function (c) {
      var row = el('div', { class: 'sub-card' });
      var head = el('div', { class: 'sub-head' });
      var left = el('div');
      left.appendChild(el('div', { class: 'sub-title', text: L(c, 'title') }));
      left.appendChild(el('div', { class: 'sub-meta', text: fmtDate(c.date) }));
      head.appendChild(left);
      head.appendChild(el('span', { class: 'badge b-brass', text: t('certificates') }));
      row.appendChild(head);
      cBox.appendChild(row);
    });
  }
}

/* =====================================================================
   12) ربط الأحداث
   ===================================================================== */
/* ================================================ الوضع الليلي
   الافتراضي: يتبع إعداد الجهاز. وإذا ضغطت المستخدمة الزر
   يُحفظ اختيارها ويتقدّم على إعداد الجهاز في كل زيارة. */
function savedTheme() {
  try { return localStorage.getItem('lms_theme'); } catch (e) { return null; }
}

function devicePrefersDark() {
  try {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (e) { return false; }
}

/* الوضع المعروض فعلياً الآن */
function currentTheme() {
  var manual = document.documentElement.getAttribute('data-theme');
  if (manual === 'dark' || manual === 'light') return manual;
  return devicePrefersDark() ? 'dark' : 'light';
}

function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  try { localStorage.setItem('lms_theme', mode); } catch (e) { /* التصفح الخاص */ }
  syncThemeUi();
}

/* تحديث أيقونة الزر ولون شريط المتصفح */
function syncThemeUi() {
  var isDark = currentTheme() === 'dark';
  var btn = $('#theme-toggle');
  if (btn) {
    btn.textContent = '';
    btn.appendChild(icon(isDark ? 'sun' : 'moon'));
    var label = isDark ? t('lightMode') : t('darkMode');
    btn.title = label;
    btn.setAttribute('aria-label', label);
  }
  var meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', isDark ? '#16263A' : '#1F3A5F');
}

function toggleTheme() {
  applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
}

/* ================================================ تثبيت المنصة على الجوال
   أندرويد/كروم: زر تثبيت حقيقي بضغطة واحدة.
   آيفون/سفاري: لا يسمح النظام بالتثبيت البرمجي، فنعرض التعليمات المصوّرة.
   لا تظهر البطاقة إذا كانت المنصة مثبتة أصلاً أو أغلقتها المستخدمة. */
var deferredInstall = null;

function isStandalone() {
  try {
    return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || window.navigator.standalone === true;
  } catch (e) { return false; }
}

function isIOS() {
  var ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  /* آيباد الحديث يعرّف نفسه كماك مع لمس */
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

function isMobileLike() {
  return isIOS() || /Android/i.test(navigator.userAgent || '');
}

function installDismissed() {
  try { return localStorage.getItem('lms_install_hide') === '1'; } catch (e) { return false; }
}

function dismissInstall() {
  try { localStorage.setItem('lms_install_hide', '1'); } catch (e) { /* تصفح خاص */ }
  hide($('#install-card'));
}

function showInstallCard() {
  var card = $('#install-card');
  if (!card || isStandalone() || installDismissed() || !isMobileLike()) return;
  $('#install-title').textContent = t('installTitle');
  var actionBtn = $('#install-action');
  if (deferredInstall) {
    /* أندرويد: تثبيت مباشر */
    $('#install-text').textContent = t('installAndroid');
    actionBtn.textContent = t('installNow');
    show(actionBtn);
  } else if (isIOS()) {
    /* آيفون: تعليمات المشاركة */
    $('#install-text').textContent = t('installIos');
    hide(actionBtn);
  } else {
    return;
  }
  show(card);
}

function bindInstall() {
  var card = $('#install-card');
  if (!card) return;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstall = e;
    showInstallCard();
  });

  window.addEventListener('appinstalled', function () {
    deferredInstall = null;
    try { localStorage.setItem('lms_install_hide', '1'); } catch (err) { /* تجاهل */ }
    hide(card);
  });

  $('#install-close').addEventListener('click', dismissInstall);

  $('#install-action').addEventListener('click', async function () {
    if (!deferredInstall) return;
    try {
      deferredInstall.prompt();
      await deferredInstall.userChoice;
    } catch (e) { /* تجاهل */ }
    deferredInstall = null;
    hide(card);
  });

  /* على الآيفون لا يوجد حدث تثبيت، فنُظهر التعليمات بعد ثانيتين من الفتح */
  setTimeout(function () { if (!deferredInstall) showInstallCard(); }, 2000);
}

function bindStatic() {
  $('#lang-toggle').addEventListener('click', function () {
    setLang(LANG === 'ar' ? 'en' : 'ar');
  });
  $('#btn-logout').addEventListener('click', doLogout);
  $('#gate-logout').addEventListener('click', doLogout);
  $('#btn-login').addEventListener('click', gotoAuth);
  $('#go-guest').addEventListener('click', function (e) { e.preventDefault(); enterGuest(); });

  $('#tab-login').addEventListener('click', function () { switchAuthTab('login'); });
  $('#tab-register').addEventListener('click', function () { switchAuthTab('register'); });
  $('#form-login').addEventListener('submit', handleLogin);
  $('#form-register').addEventListener('submit', handleRegister);
  bindInstall();
  $('#gb-pdf').addEventListener('click', gbExportPdf);
  $('#cls-add').addEventListener('click', addClass);
  $('#bk-db').addEventListener('click', function () {
    downloadFromApi('backup');
    toast(t('backupStarted'));
  });
  $('#bk-files').addEventListener('click', async function () {
    /* نتحقق أولاً من توفر الضغط على الاستضافة قبل فتح التنزيل */
    try {
      var res = await NET.raw(CONFIG.API_URL + '?action=backup_files', { credentials: 'same-origin' });
      var ct = res.headers.get('Content-Type') || '';
      if (ct.indexOf('json') > -1) {
        var d = await res.json();
        var msg = String(d.error || '');
        if (msg.indexOf('zip_unavailable') > -1) toast(t('zipUnavailable'), true);
        else if (msg.indexOf('no_files') > -1) toast(t('noFiles'), true);
        else toast(t('err'), true);
        return;
      }
      var blob = await res.blob();
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'backup-files.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast(t('backupStarted'));
    } catch (e) { toast(t('err'), true); }
  });
  $('#rs-go').addEventListener('click', doReset);
  $('#cls-name').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); addClass(); }
  });
  $('#theme-toggle').addEventListener('click', toggleTheme);
  syncThemeUi();
  /* إذا لم تختر المستخدمة يدوياً، نتابع تغيّر إعداد الجهاز مباشرة */
  try {
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (!savedTheme()) syncThemeUi(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  } catch (e) { /* تجاهل */ }
  $('#login-phone').addEventListener('input', toggleTeacherPass);
  bindAllPhoneInputs();
  $('#mo-tabs').addEventListener('click', function (e) {
    var tab = e.target.closest('.tab');
    if (tab) moShowTab(tab.getAttribute('data-tab'));
  });

  $('#go-parent').addEventListener('click', function (e) { e.preventDefault(); gotoParent(); });
  $('#parent-back-login').addEventListener('click', function (e) { e.preventDefault(); gotoAuth(); });
  $('#parent-search').addEventListener('input', function () { renderParentStudentList(this.value); });
  $('#form-parent-verify').addEventListener('submit', submitParentByPhone);
  $('#parent-pick-another').addEventListener('click', function (e) { e.preventDefault(); backToParentPick(); });
  $('#pr-back').addEventListener('click', function () { gotoParent(); });

  /* تنقل الطالبة (العناصر الثابتة فقط، أقسام القائمة تُربط عند بنائها) */
  $$('#student-nav > .navitem').forEach(function (b) {
    b.addEventListener('click', function () {
      showStudentScreen(b.getAttribute('data-nav'));
    });
  });
  $('#sp-tabs').addEventListener('click', function (e) {
    var tab = e.target.closest('.tab');
    if (tab) spShowTab(tab.getAttribute('data-tab'));
  });
  $('#sp-upload-free').addEventListener('click', function () { openUploadModal(null, null); });
  $('#sp-fb-send').addEventListener('click', sendFeedback);

  /* تنقل المعلمة */
  $$('#teacher-nav .navitem').forEach(function (b) {
    b.addEventListener('click', function () {
      showTeacherScreen(b.getAttribute('data-nav'));
    });
  });
  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-goto]');
    if (go) showTeacherScreen(go.getAttribute('data-goto'));
  });
  $('#ts-tabs').addEventListener('click', function (e) {
    var tab = e.target.closest('.tab');
    if (!tab) return;
    state.subFilter = tab.getAttribute('data-key');
    $$('#ts-tabs .tab').forEach(function (b) { b.classList.toggle('active', b === tab); });
    loadTSubmissions();
  });
  $('#att-date').addEventListener('change', function () {
    state.attDate = $('#att-date').value || todayStr();
    loadTAttendance();
  });
  $('#att-all').addEventListener('click', markAllPresent);
  $('#part-add').addEventListener('click', addParticipation);
  $('#part-date').addEventListener('change', loadTParticipation);
  $('#stu-search').addEventListener('input', function () {
    renderStudentsTable($('#stu-search').value);
  });
  $('#tsd-back').addEventListener('click', function () { showTeacherScreen('students'); });
  $('#tsd-tabs').addEventListener('click', function (e) {
    var tab = e.target.closest('.tab');
    if (tab) tsdShowTab(tab.getAttribute('data-tab'));
  });
  $('#si-back').addEventListener('click', function () { showTeacherScreen('sections'); });
  $('#si-add').addEventListener('click', function () {
    if (state.currentSection) openItemModal(state.currentSection, null);
  });
  $('#si-edit').addEventListener('click', function () {
    if (state.currentSection) openSecEdit(state.currentSection);
  });
  $('#sec-new').addEventListener('click', openWizard);
  $('#wz-back').addEventListener('click', wizardBack);
  $('#wz-next').addEventListener('click', wizardNext);
  $('#se-save').addEventListener('click', saveSecEdit);
  $('#se-delete').addEventListener('click', deleteSecEdit);
  $('#it-save').addEventListener('click', saveItem);
  $('#it-accepts').addEventListener('change', function () {
    if ($('#it-accepts').checked) show($('#it-due-wrap')); else hide($('#it-due-wrap'));
  });
  $('#it-aud').addEventListener('change', syncAudienceBoxes);
  $('#it-portfolio').addEventListener('change', syncPortfolioBox);
  $('#sc-save').addEventListener('click', saveSched);
  $('#sc-delete').addEventListener('click', deleteSched);
  $('#ct-save').addEventListener('click', saveCert);
  $('#ex-save').addEventListener('click', saveExc);
  $('#exc-add').addEventListener('click', function () {
    openExcModal(null, function () { loadTExcellence(); });
  });
  $('#up-save').addEventListener('click', saveUpload);
  $('#rv-approve').addEventListener('click', function () { reviewAction('approved'); });
  $('#rv-revision').addEventListener('click', function () { reviewAction('needs_revision'); });
  $('#rv-reject').addEventListener('click', function () { reviewAction('rejected'); });
  $('#rv-grade').addEventListener('input', updateBrassRow);
  $('#rv-max').addEventListener('input', updateBrassRow);
  $('#confirm-yes').addEventListener('click', function () {
    closeModal('modal-confirm');
    var fn = state.confirmFn;
    state.confirmFn = null;
    if (fn) fn();
  });

  /* إغلاق النوافذ */
  document.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
      hide(e.target);
      return;
    }
    var closer = e.target.closest('[data-close]');
    if (closer) {
      var overlay = closer.closest('.modal-overlay');
      if (overlay) hide(overlay);
    }
  });

  /* مناطق الرفع */
  bindDropzone('up-dz', 'up-file', 'up-dz-label', 'uploadFile');
  bindDropzone('it-dz', 'it-file', 'it-dz-label', 'itemFile');
  bindDropzone('ct-dz', 'ct-file', 'ct-dz-label', 'certFile');

  /* القيم الافتراضية */
  $('#att-date').value = state.attDate;
  $('#part-date').value = todayStr();
}

/* =====================================================================
   13) الإقلاع
   ===================================================================== */
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
