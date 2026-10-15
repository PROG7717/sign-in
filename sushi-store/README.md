# متجر سوشي

متجر طلبات أونلاين لمطعم سوشي، بالعربي والإنجليزي. الواجهة React داخل `index.html`، والخادم PHP + MySQL.

**للعميل:** قائمة الأصناف، السلة، توصيل أو استلام، جدولة الطلب، تعديل الطلب قبل اعتماده، الكاش باك، الاشتراكات، كوبونات الخصم، وترشيح صديق.

**لوحة الأدمن:** اعتماد الطلبات ورفضها وإلغاؤها، تقرير المبيعات، العملاء، المناديب، رسائل واتساب جاهزة، وإعدادات المتجر كاملة.

| الملف | الوظيفة |
|---|---|
| `index.html` | الواجهة كاملة (العميل + الأدمن) |
| `config.php` | الاتصال بقاعدة البيانات + دوال مشتركة |
| `get_state.php` / `save_state.php` | قراءة إعدادات المتجر والأصناف / حفظها (أدمن) |
| `create_order.php` / `update_order.php` | إنشاء طلب العميل / تعديله وهو معلّق |
| `customer_status.php` | رصيد الكاش باك والاشتراك والطلب المعلّق للعميل |
| `check_referrer.php` | التحقق من رقم الصديق المرشِّح |
| `admin_orders.php` | قائمة الطلبات واعتمادها أو رفضها أو إلغاؤها |
| `admin_sales_report.php` | تقرير المبيعات |
| `database.sql` | قاعدة البيانات في ملف واحد |

## ملفات ناقصة

الواجهة تستدعي هذه الملفات، ولم تُرفع بعد:

- جداول قاعدة البيانات الأساسية (settings, products, orders, customers…) — ستُدمج في `database.sql`
- `admin_login.php`, `admin_logout.php`, `admin_account.php`
- `admin_customers.php`, `admin_customer_edit.php`, `admin_cashback.php`
- `admin_drivers.php`, `admin_broadcast.php`, `admin_carts.php`, `admin_manual_order.php`
- `save_cart.php`

## التركيب (InfinityFree أو أي استضافة PHP + MySQL)

1. استورد `database.sql` من phpMyAdmin.
2. ارفع الملفات إلى `htdocs`.
3. عدّل بيانات الاتصال في `config.php` **على الاستضافة فقط** — المستودع عام، فلا ترفع كلمة المرور الحقيقية إلى GitHub.
