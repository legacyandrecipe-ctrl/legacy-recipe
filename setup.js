const fs = require("fs");
const path = require("path");

function write(filePath, content) {
  const full = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("Wrote:", filePath);
}

write("app/layout.tsx", `import "./globals.css";

export const metadata = {
  title: "Legacy & Recipe",
  description: "Create and share digital cookbooks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}
`);

write("app/page.tsx", `import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="rounded-3xl border p-10">
        <h1 className="text-4xl font-bold tracking-tight">Legacy & Recipe</h1>
        <p className="mt-3 text-slate-600">
          Shutterfly-style cookbook builder: choose a theme, invite family, import recipes, export a beautiful digital cookbook.
        </p>
        <div className="mt-8 flex gap-3">
          <Link className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white" href="/login">
            Log in / Sign up
          </Link>
          <Link className="rounded-xl border px-5 py-3 text-sm font-medium" href="/app">
            Go to app
          </Link>
        </div>
      </div>
    </main>
  );
}
`);

write("lib/supabase/browser.ts", `import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, anon);
}
`);

write("lib/supabase/server.ts", `import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createSupabaseServer() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {}
      },
    },
  });
}
`);

write("lib/supabase/admin.ts", `import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service, { auth: { persistSession: false } });
}
`);

write("app/login/page.tsx", `"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    if (!email || !pw) return setMsg("Enter email + password.");

    const res =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password: pw })
        : await supabase.auth.signInWithPassword({ email, password: pw });

    if (res.error) return setMsg(res.error.message);
    router.push("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold">{mode === "signup" ? "Create account" : "Log in"}</h1>
      <div className="mt-6 grid gap-3">
        <input className="rounded-xl border px-4 py-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="rounded-xl border px-4 py-3" placeholder="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
        <button onClick={submit} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white">
          {mode === "signup" ? "Sign up" : "Log in"}
        </button>
        <button className="text-left text-sm text-slate-600 underline" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
          {mode === "signup" ? "Already have an account? Log in" : "Need an account? Sign up"}
        </button>
      </div>
    </main>
  );
}
`);

write("app/auth/signout/route.ts", `import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
`);

write("app/app/layout.tsx", `import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/app" className="font-semibold">Legacy & Recipe</Link>
          <nav className="flex gap-6 text-sm">
            <Link className="hover:underline" href="/app/cookbooks">Cookbooks</Link>
            <Link className="hover:underline" href="/app/recipes">Recipes</Link>
            <form action="/auth/signout" method="post">
              <button className="text-slate-600 hover:underline" type="submit">Sign out</button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
`);

write("app/app/page.tsx", `import Link from "next/link";

export default function AppHome() {
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border p-6">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <p className="mt-1 text-slate-600">Create a cookbook, invite family, and export your digital book.</p>
        <div className="mt-4 flex gap-3">
          <Link className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/app/cookbooks/new">
            New cookbook
          </Link>
          <Link className="rounded-xl border px-4 py-2 text-sm font-medium" href="/app/cookbooks">
            View cookbooks
          </Link>
        </div>
      </div>
    </div>
  );
}
`);

console.log("\\n✅ Base app + auth files created. Next: cookbooks/recipes/builder.");