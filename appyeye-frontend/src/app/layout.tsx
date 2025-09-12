import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "AppyEye - Advanced API Monitoring & Change Detection",
  description:
    "Professional API monitoring with real-time change detection, intelligent alerts, and comprehensive analytics for modern development teams.",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Decorative grid (optional) */}
        <div className="tech-grid fixed inset-0 pointer-events-none select-none" />

        {/* Main content */}
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>

        {/* Analytics */}
        <Analytics />
      </body>
    </html>
  )
}
