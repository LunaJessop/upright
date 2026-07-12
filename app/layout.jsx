import AppShell from "@/components/AppShell";
import "./globals.css";

export const metadata = {
  title: "Upright",
  description: "Upright app",
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
