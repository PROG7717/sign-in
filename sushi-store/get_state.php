<?php
require __DIR__ . '/config.php';
$pdo = db();

$settings = $pdo->query('SELECT * FROM settings WHERE id=1')->fetch() ?: [];
$areas    = $pdo->query('SELECT ar, en, price FROM delivery_areas ORDER BY sort_order, id')->fetchAll();
$points   = $pdo->query('SELECT id, name_ar nameAr, name_en nameEn, desc_ar descAr, desc_en descEn,
                                  address_ar addressAr, address_en addressEn, map_url mapUrl,
                                  map_label_ar mapLabelAr, map_label_en mapLabelEn, image, whatsapp, instagram
                           FROM sales_points ORDER BY sort_order, id')->fetchAll();
$cats     = $pdo->query('SELECT id, ar, en FROM categories ORDER BY sort_order, id')->fetchAll();
$products = $pdo->query('SELECT id, cat_id `cat`, name_ar `ar`, name_en `en`, desc_ar `dAr`, desc_en `dEn`,
                                  price, sale_price `salePrice`, image `img`, is_available `on`, is_featured `feat`,
                                  is_subscription `isSub`, subscription_days `subDays`,
                                  subscription_benefit_ar `subBenefitAr`, subscription_benefit_en `subBenefitEn`,
                                  is_addon `isAddon`, extras_enabled `extrasEnabled`, extras_json
                           FROM products ORDER BY sort_order, id')->fetchAll();
foreach ($products as &$pr) {
    $pr['extrasEnabled'] = (bool)$pr['extrasEnabled'];
    $pr['extras'] = json_decode($pr['extras_json'] ?? '', true) ?: [];
    unset($pr['extras_json']);
}
unset($pr);

foreach ($areas as &$a) { $a['price'] = $a['price'] !== null ? (float)$a['price'] : 0; }
unset($a);

// نعلّم كل كوبون إذا كان "مستخدم" فعلاً (استخدام واحد بس للكل، مو بس لنفس العميل) —
// نتحقق من جدول الطلبات مباشرة بدل ما نثق بأي حالة محفوظة بالمتصفح
$couponsList = json_decode($settings['coupons_json'] ?? '', true) ?: [];
if ($couponsList) {
    $usedStmt = $pdo->query("SELECT DISTINCT coupon_code FROM orders WHERE coupon_code IS NOT NULL AND status IN ('pending','confirmed')");
    $usedCodes = array_map('strtoupper', array_column($usedStmt->fetchAll(), 'coupon_code'));
    foreach ($couponsList as &$cp) {
        $cp['used'] = in_array(strtoupper(trim($cp['code'] ?? '')), $usedCodes, true);
    }
    unset($cp);
}

// تحويل settings من صفوف قاعدة البيانات لنفس أسماء الحقول اللي تستخدمها الواجهة
$defaults = default_msg_templates();
$s = [
  'brandAr'=>$settings['brand_ar'], 'brandEn'=>$settings['brand_en'],
  'kickerAr'=>$settings['kicker_ar'], 'kickerEn'=>$settings['kicker_en'],
  'taglineAr'=>$settings['tagline_ar'], 'taglineEn'=>$settings['tagline_en'],
  'aboutAr'=>$settings['about_ar'], 'aboutEn'=>$settings['about_en'],
  'logo'=>$settings['logo'], 'hero'=>$settings['hero'],
  'whatsapp'=>$settings['whatsapp'], 'instagram'=>$settings['instagram'],
  'snapchat'=>$settings['snapchat'], 'tiktok'=>$settings['tiktok'], 'phone'=>$settings['phone'],
  'mapUrl'=>$settings['map_url'], 'mapEmbed'=>$settings['map_embed'],
  'addressAr'=>$settings['address_ar'], 'addressEn'=>$settings['address_en'],
  'hoursAr'=>$settings['hours_ar'], 'hoursEn'=>$settings['hours_en'],
  'pickup'=>(bool)$settings['pickup'], 'delivery'=>(bool)$settings['delivery'],
  'storeOpen'=>isset($settings['store_open']) ? (bool)$settings['store_open'] : true,
  'discount'=>json_decode($settings['discount_json'] ?? '', true) ?: ['enabled'=>false,'percent'=>10,'scope'=>'all','categoryId'=>'','productIds'=>[]],
  'currencyAr'=>$settings['currency_ar'], 'currencyEn'=>$settings['currency_en'],
  'promoAr'=>$settings['promo_ar'], 'promoEn'=>$settings['promo_en'],
  'minOrderAr'=>$settings['min_order_ar'], 'minOrderEn'=>$settings['min_order_en'],
  'cashbackMinOrder'=>(float)$settings['cashback_min_order'],
  'cashbackPercent'=>(float)$settings['cashback_percent'],
  'cashbackExpiryDays'=>(int)$settings['cashback_expiry_days'],
  'frequentCustomerThreshold'=>(int)($settings['frequent_customer_threshold'] ?? 5),
  'msgCashback'=>$settings['msg_cashback'] ?: $defaults['msgCashback'],
  'msgVip'=>$settings['msg_vip'] ?: $defaults['msgVip'],
  'msgNearThreshold'=>$settings['msg_near_threshold'] ?: $defaults['msgNearThreshold'],
  'msgBroadcastDefault'=>$settings['msg_broadcast_default'] ?: $defaults['msgBroadcastDefault'],
  'msgDriverReady'=>$settings['msg_driver_ready'] ?: '',
  'msgDriverLate'=>$settings['msg_driver_late'] ?: '',
  'receiptPhrases'=>json_decode($settings['receipt_phrases_json'] ?? '', true) ?: [],
  'couponEnabled'=>(bool)($settings['coupon_enabled'] ?? false),
  'coupons'=>$couponsList,
  'referralEnabled'=>(bool)($settings['referral_enabled'] ?? false),
  'referralDiscountPercent'=>(int)($settings['referral_discount_percent'] ?? 10),
  'deliveryAreas'=>$areas,
  'salesPoints'=>$points,
];

foreach ($products as &$p) {
    $p['on']   = (bool)$p['on'];
    $p['feat'] = (bool)$p['feat'];
    $p['isSub'] = (bool)$p['isSub'];
    $p['price'] = (float)$p['price'];
    $p['salePrice'] = $p['salePrice'] !== null ? (float)$p['salePrice'] : 0;
}

json_ok([
  'settings'  => $s,
  'cats'      => $cats,
  'products'  => $products,
]);
