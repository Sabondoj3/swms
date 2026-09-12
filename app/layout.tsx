import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "SWMS — Smart Waste Management System",
  description: "Cleaner Communities Through Smart Technology. Report waste, improve collection.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "SWMS" },
};

export const viewport: Viewport = { themeColor: "#16a34a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f6faf7] text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
