import { ServerStatusIndicator } from "../components/ServerStatusIndicator";
import "./globals.css";

export const metadata = {
  title: "Upright",
  description: "Upright app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <ServerStatusIndicator />
        {children}
      </body>
    </html>
  );
}
