"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import CookbookBuilder from "./ui";
import { QRCodeCanvas } from "qrcode.react";

export default function CookbookPage() {
  const supabase = createSupabaseBrowser();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [cookbook, setCookbook] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [cookbookRecipes, setCookbookRecipes] = useState<any[]>([]);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // QR refs
  const qrSmallRef = useRef<HTMLCanvasElement | null>(null);
  const qrCardRef = useRef<HTMLCanvasElement | null>(null);

  // ✅ Use NEXT_PUBLIC_SITE_URL (works locally + on Vercel)
  const baseUrl = useMemo(() => {
    const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    return env && env.length ? env : "http://localhost:3000";
  }, []);

  const inviteUrl = useMemo(() => {
    if (!inviteToken) return null;
    return `${baseUrl}/invite/${inviteToken}`;
  }, [inviteToken, baseUrl]);

  const inviteMessage = useMemo(() => {
    if (!inviteUrl) return "";
    const title = cookbook?.title ? `"${cookbook.title}"` : "my cookbook";
    return `Hi! I’m collecting recipes for ${title} ❤️\n\nPlease add your recipe using this link:\n${inviteUrl}\n\nThank you so much!`;
  }, [inviteUrl, cookbook?.title]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setMsg(null);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) {
        if (!cancelled) {
          setLoading(false);
          setCookbook(null);
        }
        return;
      }

      const { data: c, error: cErr } = await supabase
        .from("cookbooks")
        .select("*")
        .eq("id", id)
        .single();

      if (cErr) {
        if (!cancelled) {
          setMsg(cErr.message);
          setCookbook(null);
          setLoading(false);
        }
        return;
      }

      const { data: r, error: rErr } = await supabase
        .from("recipes")
        .select("id,title,category,source_name,source_side,photo_url,created_at,status")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (rErr && !cancelled) setMsg(rErr.message);

      const { data: cr, error: crErr } = await supabase
        .from("cookbook_recipes")
        .select(
          "id,sort_order,recipe_id, recipes(id,title,category,source_name,source_side,photo_url,status,submitted_by,note)"
        )
        .eq("cookbook_id", id)
        .order("sort_order", { ascending: true });

      if (crErr && !cancelled) setMsg(crErr.message);

      const { data: inv, error: invErr } = await supabase
        .from("cookbook_invites")
        .select("token")
        .eq("cookbook_id", id)
        .maybeSingle();

      if (invErr && !cancelled) setMsg(invErr.message);

      if (!cancelled) {
        setCookbook(c);
        setRecipes(r ?? []);
        setCookbookRecipes(cr ?? []);
        setInviteToken(inv?.token ?? null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, id]);

  async function copy(text: string, success: string) {
    await navigator.clipboard.writeText(text);
    setMsg(success);
    setTimeout(() => setMsg(null), 1500);
  }

  function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }

  function downloadSmallQR() {
    if (!qrSmallRef.current) return;
    downloadCanvasAsPng(qrSmallRef.current, "invite-qr.png");
    setMsg("QR code downloaded!");
    setTimeout(() => setMsg(null), 1500);
  }

  // Creates a clean, printable PNG "Invite Card" (no extra libraries)
  function downloadInviteCardPng() {
    if (!inviteUrl) return;
    const qr = qrCardRef.current;
    if (!qr) return;

    const W = 1200;
    const H = 800;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 52px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText("Share Your Favorite Recipe ❤️", 80, 140);

    ctx.fillStyle = "#334155";
    ctx.font = "28px system-ui, -apple-system, Segoe UI, Roboto";
    const subtitle = `Scan the QR code to add your recipe to "${cookbook?.title ?? "this cookbook"}"`;
    wrapText(ctx, subtitle, 80, 200, 720, 38);

    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = 360;
      const qrX = W - 80 - qrSize;
      const qrY = 170;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 26px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText("Or visit:", 80, 520);

      ctx.fillStyle = "#1d4ed8";
      ctx.font = "24px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas";
      wrapText(ctx, inviteUrl, 80, 565, W - 160, 34);

      ctx.fillStyle = "#64748b";
      ctx.font = "20px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText("Legacy & Recipe", 80, H - 90);

      downloadCanvasAsPng(canvas, "recipe-invite-card.png");
      setMsg("Invite card downloaded!");
      setTimeout(() => setMsg(null), 1500);
    };

    qrImg.src = qr.toDataURL("image/png");
  }

  function printInviteCard() {
    if (!inviteUrl) return;
    const w = window.open("", "_blank", "width=900,height=650");
    if (!w) return;

    const title = cookbook?.title ?? "Cookbook";
    const link = inviteUrl;

    w.document.write(`
      <html>
      <head>
        <title>Invite Card</title>
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto; padding: 24px; }
          .card {
            width: 8.5in;
            max-width: 900px;
            border: 4px solid #0f172a;
            padding: 28px;
            border-radius: 18px;
          }
          h1 { margin: 0 0 10px 0; font-size: 28px; }
          p { margin: 8px 0; color: #334155; }
          .row { display:flex; gap: 18px; align-items: center; margin-top: 18px; }
          .qr { width: 220px; height: 220px; border: 2px solid #e2e8f0; border-radius: 14px; display:flex; align-items:center; justify-content:center; }
          .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas; color:#1d4ed8; word-break: break-all; }
          .footer { margin-top: 18px; color:#64748b; font-size: 12px; }
          @media print {
            body { padding: 0; }
            .card { border-radius: 0; width: 100%; max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Share Your Favorite Recipe ❤️</h1>
          <p>Scan the QR code to add your recipe to "<b>${escapeHtml(title)}</b>"</p>
          <div class="row">
            <div class="qr">
              <img src="${qrCardRef.current?.toDataURL("image/png") ?? ""}" style="width:200px;height:200px;" />
            </div>
            <div>
              <p><b>Or visit:</b></p>
              <p class="mono">${escapeHtml(link)}</p>
              <p class="footer">Legacy & Recipe</p>
            </div>
          </div>
        </div>
        <script>
          setTimeout(() => window.print(), 250);
        </script>
      </body>
      </html>
    `);
    w.document.close();
  }

  // ✅ Matches your /api/invites/create route: expects { cookbookId } and returns { inviteUrl }
  async function createInviteLink() {
    setMsg(null);

    const res = await fetch("/api/invites/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cookbookId: id }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMsg(json?.error ?? "Failed to create invite link.");
      return;
    }

    // json.inviteUrl is full url; token is not returned. Extract token for our state.
    const inviteUrlFromApi: string | undefined = json?.inviteUrl;
    if (!inviteUrlFromApi) {
      setMsg("Invite created, but missing inviteUrl response.");
      return;
    }

    const parts = inviteUrlFromApi.split("/invite/");
    const token = parts.length === 2 ? parts[1] : null;
    if (!token) {
      setMsg("Invite created, but could not parse token.");
      return;
    }

    setInviteToken(token);
    setMsg("Invite link created!");
    setTimeout(() => setMsg(null), 1500);
  }

  if (loading) return <div className="text-slate-600">Loading…</div>;
  if (!cookbook) return <div className="text-slate-600">Not found</div>;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-3 flex-1">
          <div>
            <h1 className="text-2xl font-bold">{cookbook.title}</h1>
            <p className="text-slate-600">
              {cookbook.occasion} • {cookbook.status}
            </p>
          </div>

          {cookbook.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cookbook.cover_image_url}
              alt=""
              className="h-56 w-full rounded-2xl border object-cover"
            />
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 min-w-[220px]">
          <Link
            className="rounded-xl border px-4 py-2 text-sm font-medium text-center hover:bg-slate-50"
            href="/app/recipes/new"
          >
            New recipe
          </Link>

          <Link
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white text-center"
            href={`/app/cookbooks/${id}/export`}
          >
            Download PDF
          </Link>

          {inviteUrl ? (
            <button
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              onClick={() => copy(inviteUrl, "Invite link copied!")}
            >
              Copy invite link
            </button>
          ) : (
            <button
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
              onClick={createInviteLink}
            >
              Create invite link
            </button>
          )}
        </div>
      </div>

      {msg ? <p className="text-sm text-slate-600">{msg}</p> : null}

      {/* Share box + QR */}
      {inviteUrl ? (
        <div className="rounded-2xl border p-5 grid gap-4">
          <div>
            <div className="font-semibold">Invite family & friends</div>
            <div className="text-sm text-slate-600">
              They can submit recipes without creating an account.
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_190px]">
            <div className="grid gap-2">
              <label className="text-xs text-slate-500">Invite link</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="w-full rounded-xl border px-4 py-3 text-sm"
                />
                <button
                  className="rounded-xl border px-4 py-3 text-sm font-medium hover:bg-slate-50"
                  onClick={() => copy(inviteUrl, "Copied!")}
                >
                  Copy
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                  onClick={() => copy(inviteMessage, "Invite message copied!")}
                >
                  Copy invite message
                </button>

                <a
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                  href={`sms:&body=${encodeURIComponent(inviteMessage)}`}
                >
                  Text it
                </a>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-3 grid place-items-center gap-2">
              <QRCodeCanvas value={inviteUrl} size={140} includeMargin ref={qrSmallRef} />
              <button
                onClick={downloadSmallQR}
                className="rounded-xl border px-3 py-2 text-xs hover:bg-slate-50"
              >
                Download QR Code
              </button>
            </div>
          </div>

          {/* Printable card preview */}
          <div className="mt-2 rounded-2xl border p-4 grid gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold">Printable Invite Card</div>
                <div className="text-sm text-slate-600">
                  Perfect for tables at events (weddings, memorials, reunions).
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={downloadInviteCardPng}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Download Card (PNG)
                </button>
                <button
                  onClick={printInviteCard}
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Print Card
                </button>
              </div>
            </div>

            <div className="rounded-2xl border p-5 grid gap-3 md:grid-cols-[1fr_240px] bg-white">
              <div className="grid gap-2">
                <div className="text-xl font-bold">Share Your Favorite Recipe ❤️</div>
                <div className="text-slate-600">
                  Scan the QR code to add your recipe to{" "}
                  <span className="font-semibold">“{cookbook.title}”</span>
                </div>

                <div className="pt-2 text-sm font-semibold">Or visit:</div>
                <div className="rounded-xl bg-slate-50 border px-4 py-3 font-mono text-sm text-blue-700 break-all">
                  {inviteUrl}
                </div>

                <div className="text-xs text-slate-500 pt-2">Legacy & Recipe</div>
              </div>

              <div className="rounded-xl border p-3 grid place-items-center gap-2">
                <QRCodeCanvas value={inviteUrl} size={200} includeMargin ref={qrCardRef} />
                <div className="text-xs text-slate-500">Scan to submit</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Builder */}
      <CookbookBuilder cookbookId={id} allRecipes={recipes} cookbookRecipes={cookbookRecipes} />
    </div>
  );
}

/** Wraps text onto multiple lines for canvas export */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, yy);
      line = words[n] + " ";
      yy += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, yy);
}

/** Prevent HTML injection in print window */
function escapeHtml(str: string) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}