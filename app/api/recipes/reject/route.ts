import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { recipe_id } = await req.json();

  if (!recipe_id) return NextResponse.json({ error: "Missing recipe_id" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // delete recipe + linked cookbook_recipes rows will remain unless you cascade
  // so we delete links first to keep your DB clean.
  await supabase.from("cookbook_recipes").delete().eq("recipe_id", recipe_id);

  const { error } = await supabase.from("recipes").delete().eq("id", recipe_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}