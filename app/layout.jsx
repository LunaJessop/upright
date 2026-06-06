import { ServerStatusIndicator } from "../components/ServerStatusIndicator";
import Navbar from "../components/Navbar";
import "./globals.css";

export const metadata = {
  title: "Upright",
  description: "Upright app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-nv-canvas font-sans text-nv-ink">
        <ServerStatusIndicator />
        <div className="flex min-h-full">
          <Navbar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
