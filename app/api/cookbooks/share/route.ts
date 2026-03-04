import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSiteUrl } from "@/lib/site-url";

export async function POST(req: Request) {
  const { cookbook_id } = await req.json();
  if (!cookbook_id) return NextResponse.json({ error: "Missing cookbook_id" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const token = crypto.randomUUID().replace(/-/g, "");

  const { error } = await supabase.from("cookbook_shares").insert({
    cookbook_id,
    token,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = `${getSiteUrl()}/share/${token}`;
  return NextResponse.json({ url });
}