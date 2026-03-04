import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";
import { getSiteUrl } from "@/lib/site-url";

export async function POST(req: Request) {
  const { cookbookId } = await req.json();

  const supabase = await createSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data: cookbook } = await supabase
    .from("cookbooks")
    .select("id,owner_id")
    .eq("id", cookbookId)
    .single();

  if (!cookbook || cookbook.owner_id !== user.id) {
    return NextResponse.json({ error: "Cookbook not found" }, { status: 404 });
  }

  const admin = createSupabaseAdmin();
  const token = randomUUID().replaceAll("-", "");

  const { error } = await admin
    .from("cookbook_invites")
    .upsert(
      {
        cookbook_id: cookbookId,
        owner_id: user.id,
        token,
        role: "contributor",
        expires_at: null,
      },
      { onConflict: "cookbook_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ✅ This now works locally AND on Vercel, as long as NEXT_PUBLIC_SITE_URL is set
  const inviteUrl = `${getSiteUrl()}/invite/${token}`;

  return NextResponse.json({ inviteUrl });
}