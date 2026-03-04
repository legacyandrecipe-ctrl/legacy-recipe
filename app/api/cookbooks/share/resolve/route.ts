import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: share } = await supabase
    .from("cookbook_shares")
    .select("cookbook_id")
    .eq("token", token)
    .single();

  if (!share) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: cookbook } = await supabase
    .from("cookbooks")
    .select("id,title,cover_image_url,occasion,theme_id")
    .eq("id", share.cookbook_id)
    .single();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id,title,category,ingredients,instructions,note,photo_url,submitted_by")
    .eq("cookbook_id", share.cookbook_id)
    .eq("status", "approved");

  return NextResponse.json({ cookbook, recipes: recipes ?? [] });
}