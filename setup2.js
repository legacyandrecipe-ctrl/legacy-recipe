const fs = require("fs");
const path = require("path");

function write(filePath, content) {
  const full = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("Wrote:", filePath);
}

/** ---------- Types ---------- **/
write("lib/types.ts", `export type Occasion = "wedding" | "holiday" | "remembrance" | "family" | "kids";

export type Cookbook = {
  id: string;
  owner_id: string;
  title: string;
  subtitle: string | null;
  occasion: Occasion;
  theme_id: string | null;
  status: "draft" | "ready" | "purchased" | "archived";
};

export type Theme = {
  id: string;
  name: string;
  type: Occasion;
};

export type RecipeLite = {
  id: string;
  title: string;
  source_name: string | null;
  source_side: string | null;
};
`);

/** ---------- Cookbooks list ---------- **/
write("app/app/cookbooks/page.tsx", `import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Cookbook } from "@/lib/types";

export default async function CookbooksPage() {
  const supabase = await createSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user!;
  const { data } = await supabase
    .from("cookbooks")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const cookbooks = (data ?? []) as Cookbook[];

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cookbooks</h1>
        <Link className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/app/cookbooks/new">
          New cookbook
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cookbooks.map((c) => (
          <Link key={c.id} href={\`/app/cookbooks/\${c.id}\`} className="rounded-2xl border p-5 hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{c.title}</div>
              <div className="text-xs text-slate-500">{c.status}</div>
            </div>
            <div className="mt-1 text-sm text-slate-600">{c.occasion} • theme {c.theme_id ? "set" : "none"}</div>
          </Link>
        ))}
        {cookbooks.length === 0 ? (
          <div className="rounded-2xl border p-6 text-slate-600">No cookbooks yet. Create your first project.</div>
        ) : null}
      </div>
    </div>
  );
}
`);

/** ---------- New cookbook (theme picker) ---------- **/
write("app/app/cookbooks/new/page.tsx", `"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { Occasion, Theme } from "@/lib/types";

export default function NewCookbookPage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [occasion, setOccasion] = useState<Occasion>("family");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeId, setThemeId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("themes").select("id,name,type").order("name");
      if (!error) setThemes((data as Theme[]) ?? []);
    })();
  }, [supabase]);

  async function createCookbook() {
    setMsg(null);
    if (!title.trim()) return setMsg("Title is required.");

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) return setMsg("Not logged in.");

    const { data, error } = await supabase
      .from("cookbooks")
      .insert({
        owner_id: user.id,
        title,
        subtitle: subtitle || null,
        occasion,
        theme_id: themeId,
        status: "draft",
      })
      .select("id")
      .single();

    if (error) return setMsg(error.message);
    router.push(\`/app/cookbooks/\${data.id}\`);
  }

  const themeOptions = themes.filter((t) => t.type === occasion);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">New cookbook</h1>

      <div className="mt-6 grid gap-4">
        <input className="rounded-xl border px-4 py-3" placeholder="Cookbook title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="rounded-xl border px-4 py-3" placeholder="Subtitle (optional)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />

        <div className="grid gap-2">
          <label className="text-sm font-medium">Occasion</label>
          <select className="rounded-xl border px-4 py-3" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
            <option value="wedding">Wedding</option>
            <option value="holiday">Holiday</option>
            <option value="remembrance">Remembrance</option>
            <option value="family">Family</option>
            <option value="kids">Kids</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Theme</label>
          <select className="rounded-xl border px-4 py-3" value={themeId ?? ""} onChange={(e) => setThemeId(e.target.value || null)}>
            <option value="">Select a theme</option>
            {themeOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500">Themes will control PDF styling (cover, fonts, layout) in the next step.</p>
        </div>

        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
        <button onClick={createCookbook} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white">
          Create cookbook
        </button>
      </div>
    </div>
  );
}
`);

/** ---------- Recipes list + new recipe ---------- **/
write("app/app/recipes/page.tsx", `import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function RecipesPage() {
  const supabase = await createSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user!;

  const { data } = await supabase
    .from("recipes")
    .select("id,title,source_name,source_side,created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const recipes = data ?? [];

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recipes</h1>
        <Link className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/app/recipes/new">
          New recipe
        </Link>
      </div>

      <div className="grid gap-3">
        {recipes.map((r: any) => (
          <div key={r.id} className="rounded-2xl border p-4">
            <div className="font-semibold">{r.title}</div>
            <div className="text-sm text-slate-600">
              {r.source_name ? \`From \${r.source_name}\` : "—"}
              {r.source_side ? \` • \${r.source_side}\` : ""}
            </div>
          </div>
        ))}
        {recipes.length === 0 ? <div className="rounded-2xl border p-6 text-slate-600">No recipes yet.</div> : null}
      </div>
    </div>
  );
}
`);

write("app/app/recipes/new/page.tsx", `"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function NewRecipePage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceSide, setSourceSide] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function parseLines(text: string) {
    return text.split("\\n").map((l) => l.trim()).filter(Boolean);
  }

  async function save() {
    setMsg(null);
    if (!title.trim()) return setMsg("Title required.");

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) return setMsg("Not logged in.");

    const ingredients = parseLines(ingredientsText).map((line) => ({ item: line }));
    const instructions = parseLines(instructionsText).map((line) => ({ step: line }));

    const { error } = await supabase.from("recipes").insert({
      owner_id: user.id,
      title,
      source_name: sourceName || null,
      source_side: sourceSide || null,
      ingredients,
      instructions,
    });

    if (error) return setMsg(error.message);
    router.push("/app/recipes");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">New recipe</h1>
      <div className="mt-6 grid gap-4">
        <input className="rounded-xl border px-4 py-3" placeholder="Recipe title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid gap-3 md:grid-cols-2">
          <input className="rounded-xl border px-4 py-3" placeholder="From (name)" value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
          <input className="rounded-xl border px-4 py-3" placeholder="Family side (optional)" value={sourceSide} onChange={(e) => setSourceSide(e.target.value)} />
        </div>
        <textarea className="rounded-xl border px-4 py-3" rows={6} placeholder="Ingredients (one per line)" value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} />
        <textarea className="rounded-xl border px-4 py-3" rows={8} placeholder="Instructions (one step per line)" value={instructionsText} onChange={(e) => setInstructionsText(e.target.value)} />

        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
        <button onClick={save} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white">Save recipe</button>
      </div>
    </div>
  );
}
`);

/** ---------- Cookbook page + builder UI ---------- **/
write("app/app/cookbooks/[id]/page.tsx", `import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import CookbookBuilder from "./ui";

export default async function CookbookPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user!;

  const { data: cookbook } = await supabase
    .from("cookbooks")
    .select("*")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single();

  if (!cookbook) return <div>Not found</div>;

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id,title,source_name,source_side,created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data: cookbookRecipes } = await supabase
    .from("cookbook_recipes")
    .select("id,sort_order,recipe_id, recipes(id,title,source_name,source_side)")
    .eq("cookbook_id", params.id)
    .order("sort_order", { ascending: true });

  const { data: invite } = await supabase
    .from("cookbook_invites")
    .select("token")
    .eq("cookbook_id", params.id)
    .maybeSingle();

  const inviteUrl = invite?.token ? \`\${process.env.NEXT_PUBLIC_APP_URL}/invite/\${invite.token}\` : null;

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{cookbook.title}</h1>
          <p className="text-slate-600">{cookbook.occasion} • {cookbook.status}</p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-xl border px-4 py-2 text-sm font-medium" href="/app/recipes/new">New recipe</Link>
          <Link className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white" href={\`/app/cookbooks/\${params.id}/export\`}>
            Export (PDF)
          </Link>
        </div>
      </div>

      <CookbookBuilder
        cookbookId={params.id}
        allRecipes={recipes ?? []}
        cookbookRecipes={cookbookRecipes ?? []}
        existingInviteUrl={inviteUrl}
      />
    </div>
  );
}
`);

write("app/app/cookbooks/[id]/ui.tsx", `"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

type AnyRecipe = {
  id: string;
  title: string;
  source_name?: string | null;
  source_side?: string | null;
};

type AnyCookbookRecipe = {
  id: string;
  sort_order: number;
  recipe_id: string;
  recipes: AnyRecipe;
};

export default function CookbookBuilder({
  cookbookId,
  allRecipes,
  cookbookRecipes,
  existingInviteUrl,
}: {
  cookbookId: string;
  allRecipes: AnyRecipe[];
  cookbookRecipes: AnyCookbookRecipe[];
  existingInviteUrl: string | null;
}) {
  const supabase = createSupabaseBrowser();
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [items, setItems] = useState<AnyCookbookRecipe[]>(cookbookRecipes);
  const [inviteUrl, setInviteUrl] = useState<string | null>(existingInviteUrl);

  const recipeOptions = useMemo(() => {
    const used = new Set(items.map((i) => i.recipe_id));
    return allRecipes.filter((r) => !used.has(r.id));
  }, [allRecipes, items]);

  async function addRecipe() {
    setMsg(null);
    if (!selectedRecipeId) return;

    const sort_order = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    const { data, error } = await supabase
      .from("cookbook_recipes")
      .insert({ cookbook_id: cookbookId, recipe_id: selectedRecipeId, sort_order })
      .select("id,sort_order,recipe_id, recipes(id,title,source_name,source_side)")
      .single();

    if (error) return setMsg(error.message);
    setItems((prev) => [...prev, data as any]);
    setSelectedRecipeId("");
  }

  async function removeItem(id: string) {
    setMsg(null);
    const { error } = await supabase.from("cookbook_recipes").delete().eq("id", id);
    if (error) return setMsg(error.message);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  async function onDragEnd(result: any) {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    const updated = Array.from(items);
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);

    const normalized = updated.map((it, idx) => ({ ...it, sort_order: idx }));
    setItems(normalized);

    for (const it of normalized) {
      await supabase.from("cookbook_recipes").update({ sort_order: it.sort_order }).eq("id", it.id);
    }
  }

  async function createInvite() {
    setMsg(null);
    const res = await fetch("/api/invites/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cookbookId }),
    });
    const json = await res.json();
    if (!res.ok) return setMsg(json.error ?? "Failed to create invite.");
    setInviteUrl(json.inviteUrl);
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border p-5">
        <h2 className="font-semibold">Add recipes to this cookbook</h2>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
          <select
            className="w-full rounded-xl border px-4 py-3 md:w-2/3"
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
          >
            <option value="">Select from your recipe library</option>
            {recipeOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}{r.source_name ? \` — \${r.source_name}\` : ""}{r.source_side ? \` (\${r.source_side})\` : ""}
              </option>
            ))}
          </select>
          <button onClick={addRecipe} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white">
            Add
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Recipes are reusable assets — you can attach them to multiple cookbooks.</p>
      </div>

      <div className="rounded-2xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Invite family/friends (no account needed)</h2>
          <button onClick={createInvite} className="rounded-xl border px-4 py-2 text-sm font-medium">
            {inviteUrl ? "Regenerate link" : "Create invite link"}
          </button>
        </div>

        {inviteUrl ? (
          <div className="mt-3">
            <div className="rounded-xl bg-slate-50 p-3 text-sm break-all">{inviteUrl}</div>
            <p className="mt-2 text-xs text-slate-500">Share this link. They can submit recipes into your project.</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Create a link you can text/email to contributors.</p>
        )}
      </div>

      <div className="rounded-2xl border p-5">
        <h2 className="font-semibold">Cookbook order (drag & drop)</h2>
        {items.length === 0 ? (
          <p className="mt-3 text-slate-600">No recipes added yet.</p>
        ) : (
          <div className="mt-4">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="recipes">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="grid gap-2">
                    {items.map((it, idx) => (
                      <Draggable draggableId={it.id} index={idx} key={it.id}>
                        {(p) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3"
                          >
                            <div>
                              <div className="font-medium">{it.recipes.title}</div>
                              <div className="text-xs text-slate-500">
                                {it.recipes.source_name ? \`From \${it.recipes.source_name}\` : "—"}
                                {it.recipes.source_side ? \` • \${it.recipes.source_side}\` : ""}
                              </div>
                            </div>
                            <button onClick={() => removeItem(it.id)} className="rounded-lg border px-3 py-1 text-xs font-medium hover:bg-slate-50">
                              Remove
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
        {msg ? <p className="mt-3 text-sm text-red-600">{msg}</p> : null}
      </div>
    </div>
  );
}
`);

/** ---------- Export placeholder ---------- **/
write("app/app/cookbooks/[id]/export/page.tsx", `import { createSupabaseServer } from "@/lib/supabase/server";

export default async function ExportPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user!;

  const { data: cookbook } = await supabase
    .from("cookbooks")
    .select("id,title,occasion,theme_id,status")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single();

  if (!cookbook) return <div>Not found</div>;

  return (
    <div className="max-w-2xl grid gap-4">
      <h1 className="text-2xl font-bold">Export</h1>
      <p className="text-slate-600">
        Next step: generate themed PDF (cover + table of contents + recipe pages) and gate final download behind purchase.
      </p>

      <div className="rounded-2xl border p-5">
        <div className="font-semibold">{cookbook.title}</div>
        <div className="text-sm text-slate-600">{cookbook.occasion} • {cookbook.status}</div>
      </div>
    </div>
  );
}
`);

/** ---------- Invite public page + API routes ---------- **/
write("app/invite/[token]/page.tsx", `"use client";

import { useState } from "react";

export default function InvitePage({ params }: { params: { token: string } }) {
  const [title, setTitle] = useState("");
  const [fromName, setFromName] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit() {
    setMsg(null);
    setOk(false);

    const res = await fetch("/api/invites/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: params.token,
        title,
        source_name: fromName,
        ingredientsText,
        instructionsText,
      }),
    });

    const json = await res.json();
    if (!res.ok) return setMsg(json.error ?? "Failed to submit.");
    setOk(true);
    setTitle("");
    setFromName("");
    setIngredientsText("");
    setInstructionsText("");
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold">Add a family recipe</h1>
      <p className="mt-2 text-slate-600">No account needed — submit your recipe and it will be added to the cookbook project.</p>

      <div className="mt-8 grid gap-4">
        <input className="rounded-xl border px-4 py-3" placeholder="Recipe title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="rounded-xl border px-4 py-3" placeholder="Your name (optional)" value={fromName} onChange={(e) => setFromName(e.target.value)} />
        <textarea className="rounded-xl border px-4 py-3" rows={6} placeholder="Ingredients (one per line)" value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} />
        <textarea className="rounded-xl border px-4 py-3" rows={8} placeholder="Instructions (one step per line)" value={instructionsText} onChange={(e) => setInstructionsText(e.target.value)} />

        <button onClick={submit} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white">Submit recipe</button>

        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
        {ok ? <p className="text-sm text-green-700">Recipe submitted — thank you!</p> : null}
      </div>
    </main>
  );
}
`);

write("app/api/invites/create/route.ts", `import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

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
      { cookbook_id: cookbookId, owner_id: user.id, token, role: "contributor", expires_at: null },
      { onConflict: "cookbook_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const inviteUrl = \`\${process.env.NEXT_PUBLIC_APP_URL}/invite/\${token}\`;
  return NextResponse.json({ inviteUrl });
}
`);

write("app/api/invites/submit/route.ts", `import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function parseLines(text: string) {
  return (text ?? "").split("\\n").map((l) => l.trim()).filter(Boolean);
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
`);

console.log("\\n✅ Cookbooks + Recipes + Invite + Builder files created.");
console.log("Next: restart dev server and test /app/cookbooks/new");