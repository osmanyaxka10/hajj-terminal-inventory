import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hajj Terminal Inventory",
  description: "Daily inventory, movement, forecasting and weekend ordering for Hajj Terminal",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
