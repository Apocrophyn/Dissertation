import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { MobileProvider } from "@/components/providers/mobile-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MedicAI - Healthcare Assistant",
  description: "Your intelligent medical assistant for symptom checking, report analysis, and mental health support",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <MobileProvider>
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster />
        </MobileProvider>
      </body>
    </html>
  )
}
