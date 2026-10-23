import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "FAMBUL GREEN — One Fambul, One Cleaner Future",
  description: "FAMBUL GREEN is an environmental innovation initiative by BETTEH FAMBUL INITIATIVE (BFI). Report waste, improve collection, and build a cleaner future.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "FAMBUL GREEN" },
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
