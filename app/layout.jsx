import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata = {
  title: "Upright — Get your business up and to the right",
  description:
    "Operations software for small businesses — track items, recipes, and batches in one place.",
  icons: {
    icon: [{ url: "/icon.ico", type: "image/x-icon" }],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-nv-canvas font-sans text-nv-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
