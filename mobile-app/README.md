# MauriResults Mobile

تطبيق Android أصلي مستقل مبني بـ React Native وExpo. لا يستخدم WebView، ويتصل بواجهات MauriResults العامة لعرض النتائج والإحصائيات.

## المزايا

- بحث أصلي سريع بالاسم أو رقم المترشح.
- حفظ النتائج على الهاتف وعرضها دون اتصال.
- سجل بحث محلي.
- مشاركة النتيجة وتصديرها PDF.
- إحصائيات المسابقات والأوائل والولايات.
- إشعار محلي عند اكتشاف مسابقة جديدة أثناء التحديث.
- العربية والفرنسية، والوضع الفاتح والداكن.
- قواعد الشعب: لا شعب للكونكور وأبريفه، وترتيب شعب الباك SN ثم M ثم LO ثم LM.

## التشغيل المحلي

```bash
npm install
python3 -m pip install pillow
npm run assets
npm start
```

## إنشاء مشروع Android وAPK

```bash
npm run prebuild
cd android
./gradlew assembleRelease
```

ملف APK الناتج يوجد في:

```text
android/app/build/outputs/apk/release/app-release.apk
```

الإصدار الحالي: `2.0.0` — الحزمة: `com.mauriresults.app`.

يُبنى الإصدار المنشور تلقائيًا بواسطة GitHub Actions ثم يُرفع إلى موقع MauriResults للتنزيل المباشر.
