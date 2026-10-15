# مشاريع المواقع — Web Projects

مجموعة المواقع التي عملتُ عليها، كل موقع في مجلد مستقل.

الصفحة الرئيسية [`index.html`](index.html) تعرض روابط كل المواقع، وهي ما يظهر عند فتح رابط المستودع المنشور (مثل Vercel).

| المجلد | الموقع | التقنيات | التشغيل |
|---|---|---|---|
| [`teacher-eportfolio/`](teacher-eportfolio/) | **ملف الإنجاز الإلكتروني للمعلمة** — سيرة ذاتية، نمو مهني، شهادات، 12 مجلد أداء، لوحة تحكم للمسؤول، تصدير PDF، رمز QR | HTML · Tailwind · JavaScript · PHP · MySQL | استضافة تدعم PHP وMySQL (مثل InfinityFree) — التفاصيل في [دليل التركيب](teacher-eportfolio/README.md) |
| [`teacher-platform/`](teacher-platform/) | **منصة المعلمة** — إدارة الطالبات: التسليمات، الحضور، المشاركة، لوحة التميز، بوابة ولي الأمر | HTML · CSS · JavaScript · PHP · MySQL | استضافة تدعم PHP وMySQL — التفاصيل في [README](teacher-platform/README.md) · [الموقع المنشور](https://teacher.infinityfree.me/) |
| [`sushi-store/`](sushi-store/) | **متجر سوشي** — طلبات أونلاين مع كاش باك واشتراكات وكوبونات ولوحة أدمن (ملفات ناقصة: انظر [README](sushi-store/README.md)) | React · Tailwind · PHP · MySQL | استضافة تدعم PHP وMySQL — التفاصيل في [README](sushi-store/README.md) · [الموقع المنشور](https://sushi.infinityfree.me/) |
| [`login-page/`](login-page/) | **صفحة تسجيل دخول** بتصميم زجاجي | HTML · CSS | افتح `Sign-in.html` في المتصفح |
| [`baloot-calculator/`](baloot-calculator/) | **حاسبة البلوت** — حساب النشرات (صن/حكم، دبل، كبوت، مشاريع، طيحة) مع سجل ووضع الطاولة | HTML · CSS · JavaScript · PHP · MySQL | افتح `index.html`، أو استضافة PHP للحفظ في قاعدة البيانات — [التفاصيل](baloot-calculator/README.md) |
| [`grayscale-template/`](grayscale-template/) | **Grayscale** — قالب صفحة تعريفية من Start Bootstrap | HTML · Bootstrap | افتح `index.html` في المتصفح |

## إضافة موقع جديد

1. أنشئ مجلداً جديداً باسم إنجليزي بدون مسافات (الكلمات تفصلها `-`)، مثل `school-website`.
2. ضع ملفات الموقع داخله.
3. أضف سطراً للموقع في الجدول أعلاه، وبطاقة له في `index.html`.

## النشر على Vercel

المستودع يُنشر كملفات ثابتة كما هي (بدون بناء) — الإعداد في [`vercel.json`](vercel.json).
في إعدادات المشروع على Vercel اترك **Root Directory** فارغاً.
ملاحظة: ملف الإنجاز يعمل على Vercel كعرض تجريبي فقط لأن Vercel لا يشغّل PHP؛ النسخة الكاملة تحتاج استضافة PHP وMySQL.
