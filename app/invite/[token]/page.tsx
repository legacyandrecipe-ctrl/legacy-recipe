"use client";

import { useEffect, useState } from "react";

type CookbookLite = {
  id: string;
  title: string;
  cover_image_url?: string | null;
};

export default function InviteSubmitRecipePage({ params }: { params: { token: string } }) {
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [cookbook, setCookbook] = useState<CookbookLite | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Dinner");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [note, setNote] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setMsg(null);

        const res = await fetch("/api/invites/resolve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const text = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }

        if (!res.ok) {
          if (!cancelled) {
            setMsg(json?.error ?? `Invite resolve failed (HTTP ${res.status}).`);
            setCookbook(null);
            setLoading(false);
          }
          return;
        }

        if (!json?.cookbook) {
          if (!cancelled) {
            setMsg("Invite resolve returned no cookbook.");
            setCookbook(null);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setCookbook(json.cookbook);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setMsg(e?.message ?? "Network error.");
          setCookbook(null);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function uploadPhotoIfAny(): Promise<string | null> {
    if (!photoFile) return null;

    const fd = new FormData();
    fd.append("file", photoFile);
    fd.append("token", token);

    const res = await fetch("/api/uploads/recipe-photo", {
      method: "POST",
      body: fd,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error ?? "Photo upload failed");
    return json?.photo_url ?? null;
  }

  async function onSubmit() {
    if (!title.trim()) {
      setMsg("Please add a recipe title.");
      return;
    }

    try {
      setSubmitting(true);
      setMsg(null);

      const photo_url = await uploadPhotoIfAny();

      const res = await fetch("/api/invites/submit-recipe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          title,
          category,
          ingredients,
          instructions,
          submitted_by: submittedBy,
          note,
          photo_url,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(json?.error ?? `Submit failed (HTTP ${res.status}).`);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
    } catch (e: any) {
      setMsg(e?.message ?? "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbfaf7] text-slate-900">
        <div className="mx-auto max-w-xl px-6 py-16">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">Loading invite…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!cookbook) {
    return (
      <main className="min-h-screen bg-[#fbfaf7] text-slate-900">
        <div className="mx-auto max-w-xl px-6 py-16">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold">Invite not found</h1>
            <p className="mt-2 text-sm text-slate-600">{msg ?? "This link may have expired."}</p>
          </div>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#fbfaf7] text-slate-900">
        <div className="mx-auto max-w-xl px-6 py-16">
          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold">Thank you 💛</h1>
            <p className="mt-2 text-slate-700">
              Your recipe was submitted to <span className="font-semibold">{cookbook.title}</span>.
            </p>
            <p className="mt-4 text-sm text-slate-600">
              You can close this page — the cookbook owner will see it shortly.
            </p>
            <button
              className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-800"
              onClick={() => window.location.reload()}
            >
              Submit another recipe
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center gap-4">
          {cookbook.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cookbook.cover_image_url}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-white border shadow-sm" />
          )}
          <div>
            <p className="text-sm text-slate-600">You’re adding a recipe to</p>
            <h1 className="text-2xl font-semibold">{cookbook.title}</h1>
            <p className="text-sm text-slate-600">No account needed.</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
          {msg ? <p className="mb-4 text-sm text-red-600">{msg}</p> : null}

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium">Recipe title *</label>
              <input
                className="mt-1 w-full rounded-2xl border px-4 py-3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Grandma’s chicken soup"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  className="mt-1 w-full rounded-2xl border px-4 py-3"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {["Breakfast", "Lunch", "Dinner", "Appetizer", "Side", "Dessert", "Drink", "Holiday", "Other"].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Submitted by (optional)</label>
                <input
                  className="mt-1 w-full rounded-2xl border px-4 py-3"
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  placeholder="Aunt Maria"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Ingredients</label>
              <textarea
                className="mt-1 w-full rounded-2xl border px-4 py-3 min-h-[120px]"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="- 2 cups flour&#10;- 1 tsp salt&#10;- 1 tbsp sugar"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Instructions</label>
              <textarea
                className="mt-1 w-full rounded-2xl border px-4 py-3 min-h-[140px]"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="1) Preheat oven…&#10;2) Mix…"
              />
            </div>

            <div>
              <label className="text-sm font-medium">A note or memory (optional)</label>
              <textarea
                className="mt-1 w-full rounded-2xl border px-4 py-3 min-h-[90px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="This recipe always reminds me of…"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full rounded-2xl border px-4 py-3 bg-white"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-2 text-xs text-slate-500">
                Totally optional — a photo makes the cookbook feel extra special.
              </p>
            </div>

            <button
              onClick={onSubmit}
              disabled={submitting}
              className="mt-2 rounded-2xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit recipe"}
            </button>

            <p className="text-xs text-slate-500">
              Powered by Legacy & Recipe — a cookbook made with love.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}