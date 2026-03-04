"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("themes")
        .select("id,name,type,preview_url")
        .order("name");
      if (!error) setThemes((data as any) ?? []);
    })();
  }, [supabase]);

  const themeOptions = useMemo(() => themes.filter((t) => t.type === occasion), [themes, occasion]);

  useEffect(() => {
    // if you switch occasion, auto-clear selection if it's no longer valid
    if (themeId && !themeOptions.some((t) => t.id === themeId)) setThemeId(null);
  }, [occasion]); // eslint-disable-line react-hooks/exhaustive-deps

  async function uploadCover(userId: string) {
    if (!coverFile) return null;

    const ext = coverFile.name.split(".").pop() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const up = await supabase.storage.from("cookbook-covers").upload(path, coverFile, {
      cacheControl: "3600",
      upsert: false,
    });

    if (up.error) throw new Error(up.error.message);

    const pub = supabase.storage.from("cookbook-covers").getPublicUrl(path);
    return pub.data.publicUrl;
  }

  async function createCookbook() {
    setMsg(null);
    if (!title.trim()) return setMsg("Title is required.");
    if (!themeId) return setMsg("Please select a theme.");
    if (saving) return;

    setSaving(true);
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) return setMsg("Not logged in.");

      const cover_image_url = await uploadCover(user.id);

      const { data, error } = await supabase
        .from("cookbooks")
        .insert({
          owner_id: user.id,
          title,
          subtitle: subtitle || null,
          occasion,
          theme_id: themeId,
          status: "draft",
          cover_image_url,
        })
        .select("id")
        .single();

      if (error) return setMsg(error.message);

      router.push(`/app/cookbooks/${data.id}`);
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">New cookbook</h1>

      <div className="mt-6 grid gap-4">
        <input
          className="rounded-xl border px-4 py-3"
          placeholder="Cookbook title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="rounded-xl border px-4 py-3"
          placeholder="Subtitle (optional)"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />

        <div className="grid gap-2">
          <label className="text-sm font-medium">Occasion</label>
          <select
            className="rounded-xl border px-4 py-3"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value as Occasion)}
          >
            <option value="wedding">Wedding</option>
            <option value="holiday">Holiday</option>
            <option value="remembrance">Remembrance</option>
            <option value="family">Family</option>
            <option value="kids">Kids</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Select a theme</label>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {themeOptions.map((t: any) => {
              const selected = themeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeId(t.id)}
                  className={[
                    "overflow-hidden rounded-2xl border text-left transition",
                    selected ? "ring-2 ring-slate-900" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  {t.preview_url ? (
                    <img src={t.preview_url} alt="" className="h-28 w-full object-cover" />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center bg-slate-50 text-xs text-slate-500">
                      Add preview_url
                    </div>
                  )}
                  <div className="p-3">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.type}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500">
            Tip: upload theme preview images in Supabase Storage bucket <span className="font-mono">theme-previews</span> and paste the public URL into each theme.
          </p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Cover image (optional)</label>
          <input
            type="file"
            accept="image/*"
            className="rounded-xl border px-4 py-3"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          />
          {coverFile ? <p className="text-xs text-slate-500">Selected: {coverFile.name}</p> : null}
        </div>

        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}

        <button
          onClick={createCookbook}
          disabled={saving}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create cookbook"}
        </button>
      </div>
    </div>
  );
}