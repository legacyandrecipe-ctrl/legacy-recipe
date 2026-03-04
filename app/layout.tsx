import "./globals.css";

export const metadata = {
  title: "Legacy & Recipe",
  description: "Create and share digital cookbooks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}
