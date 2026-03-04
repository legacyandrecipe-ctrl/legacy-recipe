"use client";

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
