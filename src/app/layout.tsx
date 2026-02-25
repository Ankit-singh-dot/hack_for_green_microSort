import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "CarbonSense AI — Real-Time Carbon-Adaptive Logistics",
  description: "Real-time carbon-adaptive logistics platform that continuously optimizes fleet routes for minimum carbon footprint, detects green zone violations, and provides AI-powered compliance insights.",
  keywords: "carbon emissions, logistics, fleet management, green zones, route optimization, BS-VI compliance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
