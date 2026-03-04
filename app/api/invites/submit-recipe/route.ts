import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    token,
    title,
    category,
    // support both names (older + newer)
    contributed_by,
    submitted_by,
    note,
    ingredients,
    instructions,
    photo_url,
  } = body;

  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Find invite row
  const { data: inv, error: invErr } = await supabase
    .from("cookbook_invites")
    .select("cookbook_id, owner_id")
    .eq("token", token)
    .single();

  if (invErr || !inv) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
  }

  const cookbookId = inv.cookbook_id as string;
  const ownerId = (inv as any).owner_id as string | undefined;

  // 2) Create recipe (owned by cookbook owner so it appears in their library)
  const { data: recipe, error: recErr } = await supabase
    .from("recipes")
    .insert({
      owner_id: ownerId ?? null,
      title,
      category: category || null,

      // use whichever was provided
      submitted_by: submitted_by || contributed_by || null,
      note: note || null,

      ingredients: ingredients ?? [],
      instructions: instructions ?? [],
      photo_url: photo_url || null,

      status: "pending",
    })
    .select("id")
    .single();

  if (recErr || !recipe) {
    return NextResponse.json(
      { error: recErr?.message ?? "Could not create recipe" },
      { status: 400 }
    );
  }

  // 3) Attach to cookbook at end of order (safe even if someone double-clicks submit)
  const { data: last } = await supabase
    .from("cookbook_recipes")
    .select("sort_order")
    .eq("cookbook_id", cookbookId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? -1) + 1;

  // prevent duplicate link if it somehow already exists
  const { data: existing } = await supabase
    .from("cookbook_recipes")
    .select("id")
    .eq("cookbook_id", cookbookId)
    .eq("recipe_id", recipe.id)
    .maybeSingle();

  if (!existing) {
    const { error: linkErr } = await supabase.from("cookbook_recipes").insert({
      cookbook_id: cookbookId,
      recipe_id: recipe.id,
      sort_order: nextOrder,
    });

    if (linkErr) {
      return NextResponse.json({ error: linkErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, recipe_id: recipe.id });
}