import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Freedom Layer',
  description: 'A secure messaging app made with SwiftUI and End-to-End Encryption.',
  icons: {
    icon: '/The Freedom Layer (Light).png',
    apple: '/The Freedom Layer (Light).png',
    shortcut: '/The Freedom Layer (Light).png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
