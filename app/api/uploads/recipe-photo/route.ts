import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const token = form.get("token") as string | null;

  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify invite token exists (prevents random uploads)
  const { data: invite } = await supabase
    .from("cookbook_invites")
    .select("cookbook_id")
    .eq("token", token)
    .single();

  if (!invite) return NextResponse.json({ error: "Invalid invite token" }, { status: 403 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `invite/${token}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage.from("recipe-photos").upload(path, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data } = supabase.storage.from("recipe-photos").getPublicUrl(path);
  return NextResponse.json({ photo_url: data.publicUrl });
}