import { createSupabaseServer } from "@/lib/supabase/server";

type Recipe = {
  id: string;
  title: string;
  category?: string | null;
  photo_url?: string | null;
};

export default async function HomePage() {
  const supabase = createSupabaseServer();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id,title,category,photo_url")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="max-w-6xl mx-auto p-6 grid gap-8">
      <div>
        <h1 className="text-3xl font-bold">Legacy & Recipe</h1>
        <p className="text-slate-600 mt-2">
          Build family cookbooks and preserve recipes across generations.
        </p>
      </div>

      {!recipes || recipes.length === 0 ? (
        <div className="rounded-xl border bg-slate-50 p-8 text-slate-600">
          No recipes yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {recipes.map((r: Recipe) => (
            <div
              key={r.id}
              className="rounded-2xl border bg-white overflow-hidden hover:shadow-md transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.photo_url || "/placeholder.jpg"}
                alt={r.title}
                className="w-full h-48 object-cover"
              />

              <div className="p-4">
                <div className="font-semibold">{r.title}</div>

                {r.category && (
                  <div className="text-xs text-slate-500 mt-1">{r.category}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
