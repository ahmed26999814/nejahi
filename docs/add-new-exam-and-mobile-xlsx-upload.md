# MauriResults — إضافة مسابقة جديدة ونشر ملف XLSX من الهاتف

هذا الدليل هو القاعدة التي سنستخدمها عند صدور أي مسابقة جديدة.

## الهدف

عندما يصدر ملف النتائج بصيغة `.xlsx` تستطيع من الهاتف أن:

1. تفتح صفحة الأدمن.
2. تختار ملف XLSX.
3. تعمل معاينة للأعمدة وعدد الصفوف.
4. تنشر النتائج في Supabase.
5. بعدها نربط المسابقة بالواجهة والبحث والترتيب السريع.

## صفحة الرفع من الهاتف

الرابط:

```text
/admin/results
```

تحتاج إدخال:

```text
ADMIN_SECRET
```

ثم تختار:

- مسابقة موجودة مثل الباك أو البريفيه.
- أو `مسابقة جديدة / جدول مخصص` وتكتب اسم الجدول في Supabase.

## مهم جدًا قبل النشر

أول مرة ارفع الملف مع تفعيل:

```text
وضع المعاينة فقط
```

هذا لا ينشر البيانات، فقط يعطيك:

- اسم الورقة داخل Excel.
- عدد الصفوف.
- أسماء الأعمدة.
- أول 5 صفوف للمعاينة.

بعد التأكد أن الأعمدة صحيحة، ألغِ وضع المعاينة واضغط:

```text
نشر النتائج الآن
```

## ملف XLSX

الصف الأول في ملف Excel يجب أن يحتوي أسماء الأعمدة.

مثال:

```text
Numero | NOM | MOD | KR | WL | MS | MD
```

كل صف بعده يكون نتيجة مترشح.

## مسابقة جديدة

أي مسابقة جديدة تحتاج 5 أشياء:

1. جدول في Supabase.
2. رفع ملف XLSX إلى ذلك الجدول من `/admin/results`.
3. View سريعة باسم ينتهي بـ `_ranked_results`.
4. إضافة إعدادها في `/api/search`.
5. إضافة إعدادها في `/api/ranking` وبطاقة في الواجهة.

## قاعدة الـ Ranked View

أي جدول نتائج يجب أن يكون له View مشابه:

```sql
create or replace view public.example_ranked_results as
select
  *,
  row_number() over (
    order by score_column desc nulls last
  ) as rank
from public.example_results;

grant select on public.example_ranked_results to anon;
grant select on public.example_ranked_results to authenticated;
```

استبدل:

```text
example_results
example_ranked_results
score_column
```

حسب اسم الجدول وعمود المعدل أو المجموع.

## ملاحظات أمان

- لا تضع `SUPABASE_SERVICE_ROLE_KEY` في الواجهة.
- الرفع يتم فقط من Route server:

```text
/api/admin/results-upload
```

- يجب أن يكون `ADMIN_SECRET` مضبوطًا في Vercel/Netlify.
- صفحة الهاتف ترسل السر في Header اسمه:

```text
x-admin-secret
```

## ما لا يفعله الرفع تلقائيًا الآن

الرفع لا ينشئ جدول Supabase من الصفر. يجب إنشاء الجدول أولًا.

الرفع لا يربط المسابقة الجديدة تلقائيًا بالواجهة. بعد الرفع نضيف:

- بطاقة المسابقة.
- إعداد البحث.
- إعداد الترتيب.
- View سريعة.

## أمر الفحص بعد النشر

بعد أي تعديل، افتح:

```text
/api/health
```

لو ظهر:

```json
"ok": true
```

فالنظام السريع جاهز.
