import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { MobileProvider } from "@/components/providers/mobile-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Medical AI Assistant",
  description: "Your intelligent medical assistant for symptom checking, report analysis, and mental health support",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <MobileProvider>
          <ThemeProvider>
            <main className="min-h-screen bg-gray-50">
          {children}
            </main>
          <Toaster />
        </ThemeProvider>
        </MobileProvider>
      </body>
    </html>
  )
}
