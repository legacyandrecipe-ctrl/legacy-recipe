import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-slate-900">
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Legacy & Recipe
            </p>

            <h1 className="mt-4 text-5xl leading-[1.05] font-semibold tracking-tight">
              Turn family recipes into a{" "}
              <span className="italic">forever</span> cookbook.
            </h1>

            <p className="mt-5 text-lg text-slate-600 max-w-xl">
              Collect recipes, photos, and memories from the people you love — then
              organize everything into a beautiful cookbook you can keep, share, and
              pass down.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                Create your cookbook
              </Link>

              <Link
                href="/app"
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium hover:bg-slate-50"
              >
                Go to the app
              </Link>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Perfect for weddings, growing families, and honoring loved ones.
            </p>
          </div>

          {/* HERO VISUAL */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
              <div className="text-sm font-semibold">What you’ll make</div>
              <div className="mt-3 grid gap-3">
                <div className="rounded-2xl border bg-white p-4">
                  <div className="text-xs text-slate-500">Wedding Cookbook</div>
                  <div className="font-medium mt-1">Recipes from both families</div>
                </div>
                <div className="rounded-2xl border bg-white p-4">
                  <div className="text-xs text-slate-500">Family Legacy</div>
                  <div className="font-medium mt-1">Traditions passed down</div>
                </div>
                <div className="rounded-2xl border bg-white p-4">
                  <div className="text-xs text-slate-500">In Remembrance</div>
                  <div className="font-medium mt-1">Honoring someone you love</div>
                </div>
              </div>
              <div className="mt-5 text-xs text-slate-500">
                One link. Everyone contributes. You keep the legacy.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Weddings",
              body:
                "Skip the guestbook. Invite guests to share a favorite recipe and create your first family cookbook together.",
            },
            {
              title: "Growing Families",
              body:
                "Preserve the meals and traditions you want your children (and grandchildren) to remember.",
            },
            {
              title: "In Remembrance",
              body:
                "Honor loved ones by preserving the recipes that carry their stories and memories forward.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-lg font-semibold">{c.title}</div>
              <p className="mt-2 text-sm text-slate-600">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OUR STORY (OLIVE) */}
      <section className="bg-[#6F7863] text-[#F5F3EE]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* PHOTO */}
            <div className="rounded-3xl bg-white/10 p-3 border border-white/15">
              <div className="rounded-2xl overflow-hidden bg-white/5">
                {/* Replace this with your real photo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="YOUR_PHOTO_URL_HERE"
                  alt="Where Legacy & Recipe began"
                  className="h-[360px] w-full object-cover"
                  onError={(e) => {
                    // if you haven't added a photo yet, show a placeholder gradient
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="h-[360px] w-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <div className="text-sm text-white/70">
                    Add your photo here (wedding day / cookbook moment)
                  </div>
                </div>
              </div>
            </div>

            {/* STORY */}
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-white/80">
                Our story
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight">
                Where Legacy &amp; Recipe began
              </h2>

              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-white/90">
                <p>
                  What started as a simple idea on our wedding day became something truly special.
                  Instead of a traditional guestbook, we asked friends and family to share a treasured
                  recipe with us.
                </p>
                <p>
                  I was overwhelmed by the love behind every submission — these weren’t just recipes;
                  they were memories, traditions, and pieces of the people who raised us.
                </p>
                <p>
                  I spent months turning them into a cookbook for our family. It became more than a keepsake —
                  it was a way to honor our roots and create something our children could cherish for years.
                </p>
                <p className="text-white/95 font-medium">
                  Now, I want to help you create the same kind of legacy — one recipe at a time.
                </p>
              </div>

              <p className="mt-6 text-sm text-white/80">
                With love, <span className="font-semibold text-white">Presley</span> — Founder
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
              How it works
            </p>
            <h3 className="mt-3 text-3xl font-semibold">Your family cookbook — created together</h3>
            <p className="mt-3 text-slate-600 max-w-2xl">
              Start a cookbook, share one link, and watch recipes roll in. Approve submissions, then export a
              beautiful keepsake.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Create your cookbook",
                body: "Choose a theme and set up your cookbook in minutes.",
              },
              {
                n: "02",
                title: "Invite loved ones",
                body: "Share one link so friends + family can submit recipes (no login required).",
              },
              {
                n: "03",
                title: "Approve + export",
                body: "Review submissions, keep everything organized, and export your cookbook.",
              },
            ].map((s) => (
              <div key={s.n} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-xs font-semibold text-slate-500">{s.n}</div>
                <div className="mt-2 text-lg font-semibold">{s.title}</div>
                <p className="mt-2 text-sm text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              Start your cookbook
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-500">
          © {new Date().getFullYear()} Legacy & Recipe
        </div>
      </footer>
    </main>
  );
}