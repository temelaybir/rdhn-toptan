import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Giriş | RDHN Commerce',
  description: 'RDHN Commerce admin paneli giriş sayfası',
  robots: 'noindex, nofollow', // Admin sayfalarını arama motorlarından gizle
}

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ana admin layout artık koşullu olduğu için burada sadece children döndürüyoruz
  return <>{children}</>
} 