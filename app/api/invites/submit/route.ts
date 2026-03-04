import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function parseLines(text: string) {
  return (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
}

export async function POST(req: Request) {
  const { token, title, source_name, ingredientsText, instructionsText } = await req.json();

  if (!token || !title) return NextResponse.json({ error: "Missing token or title." }, { status: 400 });

  const admin = createSupabaseAdmin();

  const { data: invite, error: invErr } = await admin
    .from("cookbook_invites")
    .select("cookbook_id,owner_id,expires_at")
    .eq("token", token)
    .single();

  if (invErr || !invite) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite link expired." }, { status: 410 });
  }

  const ingredients = parseLines(ingredientsText).map((line) => ({ item: line }));
  const instructions = parseLines(instructionsText).map((line) => ({ step: line }));

  const { data: recipe, error: rErr } = await admin
    .from("recipes")
    .insert({
      owner_id: invite.owner_id,
      title,
      source_name: source_name || null,
      ingredients,
      instructions,
    })
    .select("id")
    .single();

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  const { data: last } = await admin
    .from("cookbook_recipes")
    .select("sort_order")
    .eq("cookbook_id", invite.cookbook_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = last && last.length ? Number(last[0].sort_order) + 1 : 0;

  const { error: crErr } = await admin
    .from("cookbook_recipes")
    .insert({ cookbook_id: invite.cookbook_id, recipe_id: recipe.id, sort_order: nextOrder });

  if (crErr) return NextResponse.json({ error: crErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
