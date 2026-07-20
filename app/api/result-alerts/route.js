import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = "result_alert_subscriptions";
const REQUEST_TIMEOUT_MS = 10_000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 6;
const rateBuckets = new Map();

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function cleanText(value, maxLength = 120) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function toWesternDigits(value) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(eastern.indexOf(digit)));
}

function normalizeWhatsApp(value) {
  let digits = toWesternDigits(value).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `222${digits}`;
  return digits;
}

function requestKey(request) {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function rateLimited(key) {
  const now = Date.now();
  const recent = (rateBuckets.get(key) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    rateBuckets.set(key, recent);
    return true;
  }
  recent.push(now);
  rateBuckets.set(key, recent);

  if (rateBuckets.size > 2_000) {
    for (const [bucketKey, entries] of rateBuckets) {
      if (!entries.some((time) => now - time < RATE_WINDOW_MS)) rateBuckets.delete(bucketKey);
    }
  }
  return false;
}

async function supabase(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      ...options,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(text || response.statusText);
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json({ error: "خدمة الإشعارات غير متاحة حالياً." }, 503);
  }

  if (rateLimited(requestKey(request))) {
    return json({ error: "تم إرسال طلبات كثيرة. حاول بعد دقائق قليلة." }, 429);
  }

  try {
    const body = await request.json();

    // Honeypot field for automated bots. A successful empty response avoids teaching bots.
    if (cleanText(body.website, 200)) return json({ ok: true });

    const fullName = cleanText(body.full_name, 100);
    const whatsapp = cleanText(body.whatsapp, 40);
    const whatsappNormalized = normalizeWhatsApp(whatsapp);
    const examSlug = body.exam_slug === "bac-2026" ? "bac-2026" : "bac-2026";

    if (fullName.length < 2) {
      return json({ error: "اكتب الاسم بصورة صحيحة." }, 400);
    }
    if (whatsappNormalized.length < 8 || whatsappNormalized.length > 15) {
      return json({ error: "اكتب رقم واتساب صحيحاً، مثل 22xxxxxx أو +22222xxxxxx." }, 400);
    }

    const params = new URLSearchParams({ on_conflict: "exam_slug,whatsapp_normalized" });
    const rows = await supabase(`/rest/v1/${TABLE}?${params}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        exam_slug: examSlug,
        full_name: fullName,
        whatsapp,
        whatsapp_normalized: whatsappNormalized,
        updated_at: new Date().toISOString(),
      }),
    });

    return json({
      ok: true,
      message: "تم تسجيلك. سنخبرك عند صدور نتائج باكالوريا 2026.",
      subscription: rows?.[0]
        ? { id: rows[0].id, full_name: rows[0].full_name, whatsapp: rows[0].whatsapp }
        : null,
    });
  } catch (error) {
    console.error("[Result alerts registration]", error);
    return json({ error: "تعذر تسجيل الطلب الآن. حاول مرة أخرى." }, 500);
  }
}
