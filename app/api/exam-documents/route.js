import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing.");
  }

  return { url: url.replace(/\/$/, ""), key };
}

export async function GET() {
  try {
    const { url, key } = getSupabaseConfig();
    const endpoint = new URL(`${url}/rest/v1/exam_documents`);
    endpoint.searchParams.set(
      "select",
      "id,title,competition,year,session,branch,subject,document_type,source_name,notes,sort_order"
    );
    endpoint.searchParams.set("is_active", "eq.true");
    endpoint.searchParams.set(
      "order",
      "competition.asc,year.desc.nullslast,branch.asc.nullslast,subject.asc,sort_order.asc,title.asc"
    );

    const response = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Supabase returned ${response.status}: ${details}`);
    }

    const documents = await response.json();
    return NextResponse.json(
      { documents, count: documents.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
        },
      }
    );
  } catch (error) {
    console.error("exam-documents:list", error);
    return NextResponse.json(
      { documents: [], count: 0, error: "تعذر تحميل مكتبة المواضيع حاليًا." },
      { status: 500 }
    );
  }
}
