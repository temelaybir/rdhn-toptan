import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trendyol Integration - Admin Panel',
  description: 'Trendyol integration admin panel for RDHN Commerce',
}

export default function TrendyolAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {children}
    </div>
  )
}