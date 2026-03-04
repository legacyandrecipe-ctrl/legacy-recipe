"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setReady(true);
    })();
  }, [supabase, router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!ready) return <div className="p-6 text-slate-600">Loading…</div>;

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/app" className="font-semibold">
            Legacy & Recipe
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link className={pathname?.startsWith("/app/cookbooks") ? "underline" : "hover:underline"} href="/app/cookbooks">
              Cookbooks
            </Link>
            <Link className={pathname?.startsWith("/app/recipes") ? "underline" : "hover:underline"} href="/app/recipes">
              Recipes
            </Link>
            <button onClick={signOut} className="text-slate-600 hover:underline">
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}