<?php
require __DIR__ . '/config.php';
require_admin();
$pdo = db();
$in = json_input();

$settings = $in['settings'] ?? [];
$cats     = $in['cats'] ?? [];
$products = $in['products'] ?? [];
$areas    = $settings['deliveryAreas'] ?? [];
$points   = $settings['salesPoints'] ?? [];

try {
    $pdo->beginTransaction();

    // ---- settings ----
    $pdo->prepare('UPDATE settings SET
        brand_ar=?, brand_en=?, kicker_ar=?, kicker_en=?, tagline_ar=?, tagline_en=?,
        about_ar=?, about_en=?, logo=?, hero=?, whatsapp=?, instagram=?, snapchat=?, tiktok=?, phone=?,
        map_url=?, map_embed=?, address_ar=?, address_en=?, hours_ar=?, hours_en=?,
        pickup=?, delivery=?, currency_ar=?, currency_en=?, promo_ar=?, promo_en=?,
        min_order_ar=?, min_order_en=?, store_open=?, discount_json=?,
        msg_cashback=?, msg_vip=?, msg_near_threshold=?, msg_broadcast_default=?, msg_driver_ready=?, msg_driver_late=?, receipt_phrases_json=?,
        coupon_enabled=?, coupons_json=?, referral_enabled=?, referral_discount_percent=?
        WHERE id=1')->execute([
        $settings['brandAr'] ?? '', $settings['brandEn'] ?? '',
        $settings['kickerAr'] ?? '', $settings['kickerEn'] ?? '',
        $settings['taglineAr'] ?? '', $settings['taglineEn'] ?? '',
        $settings['aboutAr'] ?? '', $settings['aboutEn'] ?? '',
        $settings['logo'] ?? '', $settings['hero'] ?? '',
        $settings['whatsapp'] ?? '', $settings['instagram'] ?? '', $settings['snapchat'] ?? '', $settings['tiktok'] ?? '', $settings['phone'] ?? '',
        $settings['mapUrl'] ?? '', $settings['mapEmbed'] ?? '',
        $settings['addressAr'] ?? '', $settings['addressEn'] ?? '',
        $settings['hoursAr'] ?? '', $settings['hoursEn'] ?? '',
        !empty($settings['pickup']) ? 1 : 0, !empty($settings['delivery']) ? 1 : 0,
        $settings['currencyAr'] ?? '', $settings['currencyEn'] ?? '',
        $settings['promoAr'] ?? '', $settings['promoEn'] ?? '',
        $settings['minOrderAr'] ?? '', $settings['minOrderEn'] ?? '',
        !empty($settings['storeOpen']) ? 1 : 0,
        json_encode($settings['discount'] ?? ['enabled'=>false,'percent'=>10,'scope'=>'all','categoryId'=>'','productIds'=>[]], JSON_UNESCAPED_UNICODE),
        $settings['msgCashback'] ?? '', $settings['msgVip'] ?? '', $settings['msgNearThreshold'] ?? '', $settings['msgBroadcastDefault'] ?? '',
        $settings['msgDriverReady'] ?? '', $settings['msgDriverLate'] ?? '',
        json_encode($settings['receiptPhrases'] ?? [], JSON_UNESCAPED_UNICODE),
        !empty($settings['couponEnabled']) ? 1 : 0,
        json_encode($settings['coupons'] ?? [], JSON_UNESCAPED_UNICODE),
        !empty($settings['referralEnabled']) ? 1 : 0,
        (int)($settings['referralDiscountPercent'] ?? 10),
    ]);

    // ---- delivery areas (استبدال كامل) ----
    $pdo->exec('DELETE FROM delivery_areas');
    $stmt = $pdo->prepare('INSERT INTO delivery_areas (ar, en, price, sort_order) VALUES (?,?,?,?)');
    foreach ($areas as $i => $a) $stmt->execute([$a['ar'] ?? '', $a['en'] ?? '', ($a['price'] ?? '') !== '' ? (float)$a['price'] : null, $i]);

    // ---- sales points (استبدال كامل) ----
    $pdo->exec('DELETE FROM sales_points');
    $stmt = $pdo->prepare('INSERT INTO sales_points
        (id, name_ar, name_en, desc_ar, desc_en, address_ar, address_en, map_url, map_label_ar, map_label_en, image, whatsapp, instagram, sort_order)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    foreach ($points as $i => $p) $stmt->execute([
        $p['id'] ?? ('sp_' . uniqid()), $p['nameAr'] ?? '', $p['nameEn'] ?? '',
        $p['descAr'] ?? '', $p['descEn'] ?? '', $p['addressAr'] ?? '', $p['addressEn'] ?? '',
        $p['mapUrl'] ?? '', $p['mapLabelAr'] ?? '', $p['mapLabelEn'] ?? '',
        $p['image'] ?? '', $p['whatsapp'] ?? '', $p['instagram'] ?? '', $i,
    ]);

    // ---- categories ----
    $pdo->exec('DELETE FROM categories');
    $stmt = $pdo->prepare('INSERT INTO categories (id, ar, en, sort_order) VALUES (?,?,?,?)');
    foreach ($cats as $i => $c) $stmt->execute([$c['id'], $c['ar'] ?? '', $c['en'] ?? '', $i]);

    // ---- products ----
    $pdo->exec('DELETE FROM products');
    $stmt = $pdo->prepare('INSERT INTO products
        (id, cat_id, name_ar, name_en, desc_ar, desc_en, price, sale_price, image, is_available, is_featured,
         is_subscription, subscription_days, subscription_benefit_ar, subscription_benefit_en, is_addon,
         extras_enabled, extras_json, sort_order)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    foreach ($products as $i => $p) $stmt->execute([
        $p['id'], $p['cat'] ?? null, $p['ar'] ?? '', $p['en'] ?? '', $p['dAr'] ?? '', $p['dEn'] ?? '',
        (float)($p['price'] ?? 0), (isset($p['salePrice']) && $p['salePrice'] > 0) ? (float)$p['salePrice'] : null,
        $p['img'] ?? '', !empty($p['on']) ? 1 : 0, !empty($p['feat']) ? 1 : 0,
        !empty($p['isSub']) ? 1 : 0, (int)($p['subDays'] ?? 30), $p['subBenefitAr'] ?? '', $p['subBenefitEn'] ?? '',
        !empty($p['isAddon']) ? 1 : 0,
        !empty($p['extrasEnabled']) ? 1 : 0, json_encode($p['extras'] ?? [], JSON_UNESCAPED_UNICODE), $i,
    ]);

    $pdo->commit();
    json_ok();
} catch (Exception $e) {
    $pdo->rollBack();
    json_error('save failed: ' . $e->getMessage(), 500);
}
