"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { Cookbook } from "@/lib/types";

export default function CookbooksPage() {
  const supabase = createSupabaseBrowser();
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return;

      const { data } = await supabase
        .from("cookbooks")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      setCookbooks((data as Cookbook[]) ?? []);
      setLoading(false);
    })();
  }, [supabase]);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cookbooks</h1>
        <Link className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/app/cookbooks/new">
          New cookbook
        </Link>
      </div>

      {loading ? <div className="text-slate-600">Loading…</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {cookbooks.map((c) => (
          <Link key={c.id} href={`/app/cookbooks/${c.id}`} className="rounded-2xl border p-5 hover:bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{c.title}</div>
              <div className="text-xs text-slate-500">{c.status}</div>
            </div>
            <div className="mt-1 text-sm text-slate-600">{c.occasion}</div>
          </Link>
        ))}
        {!loading && cookbooks.length === 0 ? (
          <div className="rounded-2xl border p-6 text-slate-600">No cookbooks yet. Create your first project.</div>
        ) : null}
      </div>
    </div>
  );
}