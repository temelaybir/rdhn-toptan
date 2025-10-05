import type { Metadata } from 'next'
import { 
  Inter, 
  Playfair_Display, 
  Lora, 
  Poppins, 
  Open_Sans,
  Montserrat,
  Source_Sans_3,
  Space_Grotesk,
  DM_Sans,
  Merriweather,
  Crimson_Text,
  Bebas_Neue,
  Roboto,
  Righteous,
  Quicksand,
  Fira_Code,
  Space_Mono,
  IBM_Plex_Mono,
  JetBrains_Mono,
  Roboto_Mono,
  Courier_Prime
} from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeConfigProvider } from '@/context/theme-context'
import { Toaster } from '@/components/ui/sonner'
import { getSiteMetadata } from '@/services/site-settings'

// Font tanımlamaları
const inter = Inter({ subsets: ['latin'] })
const playfairDisplay = Playfair_Display({ subsets: ['latin'] })
const lora = Lora({ subsets: ['latin'] })
const poppins = Poppins({ weight: ['400', '500', '600', '700'], subsets: ['latin'] })
const openSans = Open_Sans({ subsets: ['latin'] })
const montserrat = Montserrat({ subsets: ['latin'] })
const sourceSans = Source_Sans_3({ subsets: ['latin'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })
const dmSans = DM_Sans({ subsets: ['latin'] })
const merriweather = Merriweather({ weight: ['400', '700'], subsets: ['latin'] })
const crimsonText = Crimson_Text({ weight: ['400', '600'], subsets: ['latin'] })
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] })
const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'] })
const righteous = Righteous({ weight: '400', subsets: ['latin'] })
const quicksand = Quicksand({ subsets: ['latin'] })
const firaCode = Fira_Code({ subsets: ['latin'] })
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'] })
const ibmPlexMono = IBM_Plex_Mono({ weight: ['400', '600'], subsets: ['latin'] })
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'] })
const robotoMono = Roboto_Mono({ subsets: ['latin'] })
const courierPrime = Courier_Prime({ weight: ['400', '700'], subsets: ['latin'] })

// Dinamik metadata oluşturucu
export async function generateMetadata(): Promise<Metadata> {
  const siteMetadata = await getSiteMetadata()
  
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    
    title: {
      default: siteMetadata.title || 'RDHN Commerce',
      template: `%s | ${siteMetadata.title || 'RDHN Commerce'}`
    },
    description: siteMetadata.description || 'Ardahan Ticaret - Kaliteli ürünler, uygun fiyatlar',
    keywords: siteMetadata.keywords?.split(',').map(k => k.trim()) || ['e-ticaret', 'online alışveriş'],
    authors: [{ name: siteMetadata.author || 'RDHN Commerce' }],
    robots: siteMetadata.robots || 'index, follow',
    
    // OpenGraph
    openGraph: {
      title: siteMetadata.title || 'RDHN Commerce',
      description: siteMetadata.description || 'Ardahan Ticaret - Kaliteli ürünler, uygun fiyatlar',
      type: 'website',
      locale: 'tr_TR',
      siteName: siteMetadata.title || 'RDHN Commerce',
      images: siteMetadata.socialImage ? [
        {
          url: siteMetadata.socialImage,
          width: 1200,
          height: 630,
          alt: siteMetadata.title || 'RDHN Commerce'
        }
      ] : []
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: siteMetadata.title || 'RDHN Commerce',
      description: siteMetadata.description || 'Ardahan Ticaret - Kaliteli ürünler, uygun fiyatlar',
      images: siteMetadata.socialImage ? [siteMetadata.socialImage] : []
    },
    
    // Icons
    icons: {
      icon: siteMetadata.favicon || '/favicon.ico',
      shortcut: siteMetadata.favicon || '/favicon.ico',
      apple: siteMetadata.favicon || '/favicon.ico'
    },
    
    // Manifest
    manifest: '/manifest.json',
    
    // Meta tags
    other: {
      'theme-color': '#ffffff',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'format-detection': 'telephone=no'
    }
  }
}

// Viewport ayrı export (Next.js 15 requirement)
export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#ffffff'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Font değişkenlerini birleştir
  const fontVariables = [
    inter.variable,
    playfairDisplay.variable,
    lora.variable,
    poppins.variable,
    openSans.variable,
    montserrat.variable,
    sourceSans.variable,
    spaceGrotesk.variable,
    dmSans.variable,
    merriweather.variable,
    crimsonText.variable,
    bebasNeue.variable,
    roboto.variable,
    righteous.variable,
    quicksand.variable,
    firaCode.variable,
    spaceMono.variable,
    ibmPlexMono.variable,
    jetBrainsMono.variable,
    robotoMono.variable,
    courierPrime.variable
  ].join(' ')

  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Aggressive Mobile Touch Optimization */}
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="E-ticaret platformu - Ardahan Ticaret" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Force touch-action CSS property globally */}
        <style dangerouslySetInnerHTML={{
          __html: `
            * { 
              -webkit-tap-highlight-color: transparent !important;
              -webkit-touch-callout: none !important;
              touch-action: manipulation !important;
            }
            a, button, [role="button"] {
              -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
              -webkit-touch-callout: none !important;
              -webkit-user-select: none !important;
              touch-action: manipulation !important;
              cursor: pointer !important;
            }
            input, textarea {
              touch-action: auto !important;
              -webkit-user-select: auto !important;
            }
          `
        }} />
      </head>
      <body className={`${inter.className} ${fontVariables}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeConfigProvider>
            {children}
            <Toaster 
              position="bottom-left"
              expand={true}
              richColors={true}
              closeButton={true}
              toastOptions={{
                style: {
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                  fontSize: '14px',
                  padding: '16px',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  minWidth: '320px',
                  minHeight: '60px'
                },
                className: 'group toast-custom',
                duration: 4000,
              }}
              className="hidden md:block"
            />
            {/* Mobile Toaster */}
            <Toaster 
              position="bottom-center"
              expand={true}
              richColors={true}
              closeButton={true}
              toastOptions={{
                style: {
                  background: 'hsl(var(--background) / 0.85)', // Transparanlık artırıldı
                  border: '1px solid hsl(var(--border) / 0.7)',
                  color: 'hsl(var(--foreground))',
                  fontSize: '14px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 8px -2px rgb(0 0 0 / 0.15)', // Hafif gölge
                  minWidth: '280px',
                  minHeight: '50px',
                  marginBottom: '16px', // Alt boşluk
                  backdropFilter: 'blur(8px)', // Blur efekti
                  WebkitBackdropFilter: 'blur(8px)' // Safari desteği
                },
                className: 'group toast-custom toast-mobile',
                duration: 2500, // Daha hızlı gitsin
              }}
              className="md:hidden"
            />
          </ThemeConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
