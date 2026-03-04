"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import CookbookDocument from "@/lib/pdf/CookbookDocument";

export default function ExportPage() {
  const supabase = createSupabaseBrowser();
  const params = useParams<{ id: string }>();
  const cookbookId = params.id;

  const [cookbook, setCookbook] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [orderedRecipes, setOrderedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return;

      const { data: c } = await supabase.from("cookbooks").select("*").eq("id", cookbookId).single();
      setCookbook(c);

      if (c?.theme_id) {
        const { data: t } = await supabase.from("themes").select("id,name,type").eq("id", c.theme_id).single();
        setTheme(t);
      }

      const { data: cr } = await supabase
        .from("cookbook_recipes")
        .select("sort_order, recipes(id,title,category,source_name,source_side,photo_url,ingredients,instructions)")
        .eq("cookbook_id", cookbookId)
        .order("sort_order", { ascending: true });

      const recs = (cr ?? []).map((x: any) => x.recipes).filter(Boolean);
      setOrderedRecipes(recs);

      setLoading(false);
    })();
  }, [supabase, cookbookId]);

  const fileName = useMemo(() => {
    const safe = (cookbook?.title ?? "cookbook").replaceAll(/[^a-zA-Z0-9-_ ]/g, "").trim().replaceAll(" ", "_");
    return `${safe}.pdf`;
  }, [cookbook?.title]);

  if (loading) return <div className="text-slate-600">Loading export…</div>;
  if (!cookbook) return <div className="text-slate-600">Not found</div>;

  return (
    <div className="max-w-2xl grid gap-4">
      <h1 className="text-2xl font-bold">Export PDF</h1>
      <p className="text-slate-600">
        This generates a print-ready PDF in your browser. Next step: connect Stripe + print partner.
      </p>

      <div className="rounded-2xl border p-5 grid gap-2">
        <div className="font-semibold">{cookbook.title}</div>
        <div className="text-sm text-slate-600">
          {theme?.name ? `Theme: ${theme.name}` : cookbook.occasion} • {orderedRecipes.length} recipes
        </div>

        <div className="pt-3">
          <PDFDownloadLink
            document={<CookbookDocument cookbook={cookbook} theme={theme} orderedRecipes={orderedRecipes} />}
            fileName={fileName}
          >
            {({ loading }) => (
              <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60" disabled={loading}>
                {loading ? "Building PDF..." : "Download PDF"}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        Tip: If images don’t show in the PDF, make sure your storage buckets are public and the image URLs load in a normal browser tab.
      </div>
    </div>
  );
}