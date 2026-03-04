// app/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic"; // ensures no static prerender issues on Vercel

export default async function HomePage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-slate-900">
      {/* Top nav */}
      <header className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center font-semibold">
              L
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Legacy &amp; Recipe</div>
              <div className="text-xs text-slate-600">Cookbooks made with love</div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-white"
            >
              Log in
            </Link>
            <Link
              href="/app"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Go to app
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="grid gap-6 rounded-3xl border bg-white p-8 shadow-sm md:grid-cols-2 md:items-center md:p-12">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Preserve family recipes for generations.
            </h1>
            <p className="mt-4 text-slate-600 md:text-lg">
              Create a beautiful cookbook for weddings, memorials, reunions, or growing families.
              Invite loved ones with a link — no account needed.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                Start your cookbook
              </Link>
              <Link
                href="/app"
                className="rounded-2xl border px-6 py-3 text-sm font-medium hover:bg-slate-50"
              >
                I already have an account
              </Link>
            </div>

            <div className="mt-6 grid gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                  ✓
                </span>
                Share a QR code + invite link
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                  ✓
                </span>
                Approve/reject submissions
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                  ✓
                </span>
                Download a polished PDF
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-[#fbfaf7] p-6 md:p-8">
            <div className="grid gap-4">
              <div className="rounded-2xl border bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  How it works
                </div>
                <div className="mt-3 grid gap-3">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-xl bg-slate-900 text-white grid place-items-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <div className="font-medium">Create your cookbook</div>
                      <div className="text-sm text-slate-600">
                        Choose a title + cover for the occasion.
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-xl bg-slate-900 text-white grid place-items-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <div className="font-medium">Invite your people</div>
                      <div className="text-sm text-slate-600">
                        Share a link or QR code — no login required.
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-xl bg-slate-900 text-white grid place-items-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <div className="font-medium">Approve &amp; download</div>
                      <div className="text-sm text-slate-600">
                        Review submissions, auto-sort by category, export PDF.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Perfect for
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Weddings", "Memorials", "Baby books", "Family reunions", "Holidays"].map((x) => (
                    <span
                      key={x}
                      className="rounded-full border bg-slate-50 px-3 py-1 text-xs text-slate-700"
                    >
                      {x}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="text-sm font-medium">Ready to try it?</div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/login"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Start
                  </Link>
                  <Link
                    href="/app"
                    className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                  >
                    Go to app
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our story (simple section — you can swap in your photo later) */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl border bg-white p-8 shadow-sm md:p-12">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Where Legacy &amp; Recipe began
              </h2>
              <p className="mt-4 text-slate-600">
                What started as a simple idea to preserve recipes from our wedding day turned into
                something we wanted every family to have — a way to keep stories, traditions, and
                love alive through food.
              </p>
              <p className="mt-4 text-slate-600">
                We built Legacy &amp; Recipe so your favorite people can contribute easily, and you
                can turn everything into a beautiful keepsake you’ll actually want to print and pass
                down.
              </p>
            </div>

            <div className="rounded-3xl border bg-[#fbfaf7] p-6">
              <div className="aspect-[4/3] w-full rounded-2xl border bg-white grid place-items-center text-sm text-slate-500">
                Your photo here
              </div>
              <p className="mt-3 text-xs text-slate-500">
                (We’ll replace this with your “where it began” photo.)
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-600">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} Legacy &amp; Recipe</div>
            <div className="flex gap-4">
              <Link className="hover:text-slate-900" href="/login">
                Log in
              </Link>
              <Link className="hover:text-slate-900" href="/app">
                App
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
