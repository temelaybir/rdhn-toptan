import { CurrencyProvider } from '@/context/currency-context'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </CurrencyProvider>
  )
}