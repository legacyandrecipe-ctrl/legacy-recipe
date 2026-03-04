import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: invite, error } = await supabase
    .from("cookbook_invites")
    .select("cookbook_id")
    .eq("token", token)
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: "Invite link not found" }, { status: 404 });
  }

  const { data: cookbook } = await supabase
    .from("cookbooks")
    .select("id,title,cover_image_url")
    .eq("id", invite.cookbook_id)
    .single();

  return NextResponse.json({ cookbook });
}
