"use client";

import { useEffect, useMemo, useState } from "react";

export default function SharePage({ params }: { params: { token: string } }) {
  const token = params.token;
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [cookbook, setCookbook] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/cookbooks/share/resolve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMsg(json?.error ?? "Not found");
          setLoading(false);
          return;
        }
        setCookbook(json.cookbook);
        setRecipes(json.recipes ?? []);
        setLoading(false);
      } catch (e: any) {
        setMsg(e?.message ?? "Error");
        setLoading(false);
      }
    })();
  }, [token]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const r of recipes) {
      const c = r.category || "Other";
      map.set(c, [...(map.get(c) ?? []), r]);
    }
    const order = ["Breakfast","Appetizer","Lunch","Dinner","Side","Dessert","Drink","Holiday","Other"];
    return order
      .filter((c) => map.has(c))
      .map((c) => [c, (map.get(c) ?? []).slice().sort((a,b)=>String(a.title).localeCompare(String(b.title))) ] as const);
  }, [recipes]);

  if (loading) return <div className="min-h-screen bg-[#fbfaf7] px-6 py-16 text-slate-700">Loading…</div>;
  if (!cookbook) return <div className="min-h-screen bg-[#fbfaf7] px-6 py-16 text-slate-700">{msg ?? "Not found"}</div>;

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center gap-4">
          {cookbook.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cookbook.cover_image_url} alt="" className="h-16 w-16 rounded-2xl object-cover shadow-sm" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-white border shadow-sm" />
          )}
          <div>
            <h1 className="text-3xl font-semibold">{cookbook.title}</h1>
            <p className="text-sm text-slate-600">Read-only preview</p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {grouped.map(([cat, items]) => (
            <section key={cat} className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">{cat}</h2>
              <div className="mt-4 space-y-4">
                {items.map((r) => (
                  <div key={r.id} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{r.title}</p>
                        {r.submitted_by ? <p className="text-xs text-slate-500">Submitted by {r.submitted_by}</p> : null}
                      </div>
                    </div>
                    {r.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photo_url} alt="" className="mt-3 w-full rounded-2xl object-cover max-h-[320px]" />
                    ) : null}
                    {r.note ? <p className="mt-3 text-sm text-slate-700">“{r.note}”</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
