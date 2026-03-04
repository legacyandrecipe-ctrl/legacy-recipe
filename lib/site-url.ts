export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  return (url && url.length > 0) ? url.replace(/\/$/, "") : "http://localhost:3000";
}
