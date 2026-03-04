"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function RecipesPage() {
  const supabase = createSupabaseBrowser();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return;

      const { data } = await supabase
        .from("recipes")
        .select("id,title,category,source_name,source_side,photo_url,created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      setRecipes(data ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recipes</h1>
        <Link
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          href="/app/recipes/new"
        >
          New recipe
        </Link>
      </div>

      {loading ? <div className="text-slate-600">Loading…</div> : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => (
          <div key={r.id} className="rounded-2xl border overflow-hidden">
            {r.photo_url ? (
              <img src={r.photo_url} alt="" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-slate-50 text-xs text-slate-500">
                No photo yet
              </div>
            )}

            <div className="p-4">
              <div className="font-semibold">{r.title}</div>

              <div className="mt-1 text-sm text-slate-600">
                {r.source_name ? `From ${r.source_name}` : "—"}
                {r.source_side ? ` • ${r.source_side}` : ""}
              </div>

              {r.category ? (
                <div className="mt-3">
                  <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {r.category}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {!loading && recipes.length === 0 ? (
          <div className="rounded-2xl border p-6 text-slate-600">No recipes yet.</div>
        ) : null}
      </div>
    </div>
  );
}