"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const CATEGORY_OPTIONS = [
  "Appetizers",
  "Main Dishes",
  "Side Dishes",
  "Desserts",
  "Drinks",
  "Breakfast",
  "Soups & Salads",
  "Sauces & Seasonings",
  "Holiday Favorites",
  "Kids",
  "Other",
];

export default function NewRecipePage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Main Dishes");
  const [sourceName, setSourceName] = useState("");
  const [sourceSide, setSourceSide] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function parseLines(text: string) {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  async function save() {
    setMsg(null);
    if (!title.trim()) return setMsg("Title required.");
    if (saving) return;

    setSaving(true);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) {
        setSaving(false);
        return setMsg("Not logged in.");
      }

      const ingredients = parseLines(ingredientsText).map((line) => ({ item: line }));
      const instructions = parseLines(instructionsText).map((line) => ({ step: line }));

      let photo_url: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

        const up = await supabase.storage.from("recipe-photos").upload(path, photoFile, {
          cacheControl: "3600",
          upsert: false,
        });

        if (up.error) {
          setSaving(false);
          return setMsg(up.error.message);
        }

        const pub = supabase.storage.from("recipe-photos").getPublicUrl(path);
        photo_url = pub.data.publicUrl;
      }

      const { error } = await supabase.from("recipes").insert({
        owner_id: user.id,
        title,
        category: category || null,
        source_name: sourceName || null,
        source_side: sourceSide || null,
        ingredients,
        instructions,
        photo_url,
      });

      if (error) {
        setSaving(false);
        return setMsg(error.message);
      }

      router.push("/app/recipes");
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">New recipe</h1>

      <div className="mt-6 grid gap-4">
        <input
          className="rounded-xl border px-4 py-3"
          placeholder="Recipe title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid gap-2">
          <label className="text-sm font-medium">Category</label>
          <select
            className="rounded-xl border px-4 py-3"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="From (name)"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
          />
          <input
            className="rounded-xl border px-4 py-3"
            placeholder="Family side (optional)"
            value={sourceSide}
            onChange={(e) => setSourceSide(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Recipe photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            className="rounded-xl border px-4 py-3"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          />
          {photoFile ? <p className="text-xs text-slate-500">Selected: {photoFile.name}</p> : null}
        </div>

        <textarea
          className="rounded-xl border px-4 py-3"
          rows={6}
          placeholder="Ingredients (one per line)"
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
        />

        <textarea
          className="rounded-xl border px-4 py-3"
          rows={8}
          placeholder="Instructions (one step per line)"
          value={instructionsText}
          onChange={(e) => setInstructionsText(e.target.value)}
        />

        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}

        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save recipe"}
        </button>
      </div>
    </div>
  );
}