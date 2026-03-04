"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

type AnyRecipe = {
  id: string;
  title: string;
  category?: string | null;
  source_name?: string | null;
  source_side?: string | null;
  photo_url?: string | null;

  // for pending / invite submissions (optional columns)
  status?: string | null;
  submitted_by?: string | null;
  note?: string | null;
};

type CookbookRecipeRow = {
  id: string; // cookbook_recipes row id
  recipe_id: string;
  sort_order: number;
  recipes: AnyRecipe;
};

const CATEGORY_ORDER = [
  "Appetizers",
  "Breakfast",
  "Soups & Salads",
  "Main Dishes",
  "Side Dishes",
  "Desserts",
  "Drinks",
  "Sauces & Seasonings",
  "Holiday Favorites",
  "Kids",
  "Other",
];

function normalizeCategory(cat?: string | null) {
  const c = (cat ?? "").trim();
  return c.length ? c : "Other";
}

function catIndex(cat?: string | null) {
  const c = normalizeCategory(cat);
  const i = CATEGORY_ORDER.indexOf(c);
  return i === -1 ? 999 : i;
}

/**
 * Supabase joins can sometimes come back as:
 * - object (expected)
 * - array (depending on relationship typing)
 * - null
 */
function normalizeRecipe(r: any): AnyRecipe | null {
  if (!r) return null;
  if (Array.isArray(r)) return (r[0] as AnyRecipe) ?? null;
  return r as AnyRecipe;
}

export default function CookbookBuilder({
  cookbookId,
  allRecipes,
  cookbookRecipes,
}: {
  cookbookId: string;
  allRecipes: AnyRecipe[];
  cookbookRecipes: any[];
}) {
  const supabase = createSupabaseBrowser();

  // --- MAIN LIST (approved / normal cookbook order) ---
  const normalizedInitial = useMemo<CookbookRecipeRow[]>(() => {
    return (cookbookRecipes ?? [])
      .map((r: any) => ({
        id: r.id,
        recipe_id: r.recipe_id,
        sort_order: r.sort_order ?? 0,
        recipes: normalizeRecipe(r.recipes),
      }))
      .filter((r: any) => r.recipes && r.recipes.id)
      .map((r: any) => ({ ...r, recipes: r.recipes as AnyRecipe }))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [cookbookRecipes]);

  const [items, setItems] = useState<CookbookRecipeRow[]>(normalizedInitial);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // --- PENDING LIST (invite submissions) ---
  const [pending, setPending] = useState<AnyRecipe[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  useEffect(() => {
    setItems(normalizedInitial);
  }, [normalizedInitial]);

  const inCookbookIds = useMemo(() => new Set(items.map((x) => x.recipe_id)), [items]);

  const availableRecipes = useMemo(() => {
    return (allRecipes ?? []).filter((r) => !inCookbookIds.has(r.id));
  }, [allRecipes, inCookbookIds]);

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(null), 1500);
  }

  // Fetch pending recipes connected to this cookbook (only if your schema supports recipes.status)
  async function loadPending() {
    setPendingLoading(true);
    try {
      const { data, error } = await supabase
        .from("cookbook_recipes")
        .select(
          "recipe_id, recipes(id,title,category,photo_url,status,submitted_by,note,source_name,source_side)"
        )
        .eq("cookbook_id", cookbookId);

      if (error) {
        setPending([]);
        return;
      }

      const pendingRecipes: AnyRecipe[] =
        (data ?? [])
          .map((row: any) => normalizeRecipe(row.recipes))
          .filter((r: any) => r && r.id && String(r.status || "").toLowerCase() === "pending")
          .map((r: any) => r as AnyRecipe) ?? [];

      setPending(pendingRecipes);
    } finally {
      setPendingLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookbookId]);

  async function addSelectedRecipe() {
    if (!selectedRecipeId) return;

    setSaving(true);
    try {
      const nextOrder = items.length ? Math.max(...items.map((x) => x.sort_order ?? 0)) + 1 : 0;

      const { data, error } = await supabase
        .from("cookbook_recipes")
        .insert({
          cookbook_id: cookbookId,
          recipe_id: selectedRecipeId,
          sort_order: nextOrder,
        })
        .select("id,sort_order,recipe_id, recipes(id,title,category,source_name,source_side,photo_url)")
        .single();

      if (error) {
        setMsg(error.message);
        return;
      }

      const recipeObj = normalizeRecipe(data?.recipes);
      if (!recipeObj) {
        setMsg("Recipe added, but details failed to load. Refresh the page.");
        return;
      }

      const row: CookbookRecipeRow = {
        id: data.id,
        recipe_id: data.recipe_id,
        sort_order: data.sort_order ?? nextOrder,
        recipes: recipeObj,
      };

      setItems((prev) => [...prev, row]);
      setSelectedRecipeId("");
      flash("Added!");
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(rowId: string) {
    setSaving(true);
    try {
      const { error } = await supabase.from("cookbook_recipes").delete().eq("id", rowId);
      if (error) {
        setMsg(error.message);
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== rowId));
      flash("Removed");
    } finally {
      setSaving(false);
    }
  }

  function reorder<T>(list: T[], startIndex: number, endIndex: number) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }

  async function persistOrder(newItems: CookbookRecipeRow[]) {
    const updates = newItems.map((row, idx) =>
      supabase.from("cookbook_recipes").update({ sort_order: idx }).eq("id", row.id)
    );
    await Promise.all(updates);
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;

    const newItems = reorder(items, result.source.index, result.destination.index).map((x, idx) => ({
      ...x,
      sort_order: idx,
    }));

    setItems(newItems);

    try {
      await persistOrder(newItems);
    } catch {
      setMsg("Could not save order.");
    }
  }

  async function autoSort() {
    setSaving(true);
    try {
      const newItems = [...items]
        .sort((a, b) => {
          const ca = catIndex(a.recipes.category);
          const cb = catIndex(b.recipes.category);
          if (ca !== cb) return ca - cb;
          return a.recipes.title.localeCompare(b.recipes.title);
        })
        .map((x, idx) => ({ ...x, sort_order: idx }));

      setItems(newItems);
      await persistOrder(newItems);
      flash("Sorted by category!");
    } finally {
      setSaving(false);
    }
  }

  async function approveRecipe(recipeId: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/recipes/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json?.error ?? "Could not approve.");
        return;
      }
      flash("Approved!");
      await loadPending();
    } finally {
      setSaving(false);
    }
  }

  async function rejectRecipe(recipeId: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/recipes/reject", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json?.error ?? "Could not reject.");
        return;
      }
      flash("Rejected.");
      await loadPending();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      {/* Pending recipes */}
      <div className="rounded-2xl border p-5 grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Pending recipe submissions</div>
            <div className="text-sm text-slate-600">
              Approve or reject recipes submitted via your invite link.
            </div>
          </div>

          <button
            onClick={loadPending}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            disabled={pendingLoading}
          >
            {pendingLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {pendingLoading ? (
          <div className="text-sm text-slate-600">Loading pending recipes…</div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
            No pending recipes right now.
          </div>
        ) : (
          <div className="grid gap-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-2xl border p-4 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {r.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.photo_url}
                        alt=""
                        className="h-14 w-14 rounded-xl object-cover border"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl border bg-slate-50" />
                    )}

                    <div>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-slate-500">
                        {r.submitted_by ? `Submitted by ${r.submitted_by}` : "Submitted via invite"}
                        {r.category ? ` • ${r.category}` : ""}
                      </div>
                      {r.note ? <div className="mt-2 text-sm text-slate-700">“{r.note}”</div> : null}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectRecipe(r.id)}
                      className="rounded-xl border px-3 py-2 text-xs hover:bg-slate-50"
                      disabled={saving}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => approveRecipe(r.id)}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                      disabled={saving}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add recipes */}
      <div className="rounded-2xl border p-5 grid gap-3">
        <div>
          <div className="font-semibold">Add recipes to this cookbook</div>
          <div className="text-sm text-slate-600">Recipes can be reused across cookbooks.</div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <select
            className="w-full rounded-xl border px-4 py-3 text-sm"
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
          >
            <option value="">Select from your recipe library</option>
            {availableRecipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>

          <button
            onClick={addSelectedRecipe}
            disabled={!selectedRecipeId || saving}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            Add
          </button>
        </div>

        {msg ? <div className="text-sm text-slate-600">{msg}</div> : null}
      </div>

      {/* Cookbook order */}
      <div className="rounded-2xl border p-5 grid gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Cookbook order</div>
            <div className="text-sm text-slate-600">Drag and drop to reorder</div>
          </div>

          <button
            onClick={autoSort}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            disabled={saving}
          >
            Auto-sort
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-sm text-slate-600">
            No recipes added yet.
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="cookbook-recipes">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="grid gap-3">
                  {items.map((it, idx) => {
                    const currentCat = normalizeCategory(it.recipes.category);
                    const prevCat =
                      idx === 0 ? null : normalizeCategory(items[idx - 1]?.recipes?.category);

                    const showDivider = idx === 0 || currentCat !== prevCat;

                    return (
                      <div key={it.id} className="grid gap-2">
                        {showDivider ? (
                          <div className="mt-2 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {currentCat}
                          </div>
                        ) : null}

                        <Draggable draggableId={it.id} index={idx}>
                          {(drag) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              className="rounded-2xl border p-4 bg-white"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    {...drag.dragHandleProps}
                                    className="cursor-grab rounded-lg border bg-slate-50 px-2 py-2 text-xs text-slate-600"
                                    title="Drag"
                                  >
                                    ⇅
                                  </div>

                                  {it.recipes.photo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={it.recipes.photo_url}
                                      alt=""
                                      className="h-14 w-14 rounded-xl object-cover border"
                                    />
                                  ) : (
                                    <div className="h-14 w-14 rounded-xl border bg-slate-50" />
                                  )}

                                  <div>
                                    <div className="font-medium">{it.recipes.title}</div>
                                    {it.recipes.category ? (
                                      <span className="inline-block mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                                        {it.recipes.category}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                <button
                                  onClick={() => removeRow(it.id)}
                                  className="rounded-xl border px-3 py-2 text-xs hover:bg-slate-50"
                                  disabled={saving}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      </div>
                    );
                  })}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}