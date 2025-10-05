#!/usr/bin/env node

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')

// Working directory ayarları - Git repo public_html'de ise
const projectRoot = path.join(__dirname) // commerce klasörü
const isInPublicHtml = __dirname.includes('public_html')

console.log(`🔧 Project Root: ${projectRoot}`)
console.log(`🌐 Public HTML Mode: ${isInPublicHtml}`)

// Environment değişkenleri
const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 3000

// Next.js uygulamasını oluştur - doğru dizinde
const app = next({ 
  dev, 
  hostname, 
  port,
  dir: projectRoot, // Commerce klasörünü explicit olarak belirt
  conf: {
    // Public HTML'de ise static file serving ayarları
    assetPrefix: isInPublicHtml ? '' : undefined,
  }
})
const handle = app.getRequestHandler()

// Log dizinini kontrol et ve oluştur
const fs = require('fs')
const logDir = path.join(projectRoot, 'logs')

if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true })
    console.log(`📁 Log dizini oluşturuldu: ${logDir}`)
  } catch (error) {
    console.warn(`⚠️  Log dizini oluşturulamadı: ${error.message}`)
  }
}

// Graceful shutdown için signal handler'lar
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} sinyali alındı. Sunucu kapatılıyor...`)
  
  server.close(() => {
    console.log('HTTP sunucusu kapatıldı.')
    process.exit(0)
  })
  
  // 30 saniye sonra zorla kapat
  setTimeout(() => {
    console.error('Zorla kapatılıyor...')
    process.exit(1)
  }, 30000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Hata yakalama
process.on('uncaughtException', (err) => {
  console.error('Yakalanmamış Exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Yakalanmamış Promise Rejection:', reason)
  process.exit(1)
})

let server

app.prepare().then(() => {
  // HTTP sunucusu oluştur
  server = createServer(async (req, res) => {
    try {
      // Headers
      res.setHeader('X-Powered-By', 'Next.js/RDHN-Commerce')
      
      // Public HTML'de ise özel route handling
      if (isInPublicHtml) {
        // Static file check for public_html
        const url = req.url
        if (url.startsWith('/commerce/')) {
          // Commerce prefix'i varsa kaldır
          req.url = url.replace('/commerce', '')
        }
      }
      
      // URL'i parse et
      const parsedUrl = parse(req.url, true)
      
      // Next.js'e yönlendir
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Sunucu hatası:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  // Keep-alive ayarları
  server.keepAliveTimeout = 30000
  server.headersTimeout = 35000

  // Sunucuyu başlat
  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('Sunucu başlatma hatası:', err)
      process.exit(1)
    }
    
    const publicUrl = isInPublicHtml ? 
      `Hosting domain'iniz` : 
      `http://${hostname}:${port}`
    
    console.log(`
🚀 RDHN Commerce başarıyla başlatıldı!

🌍 URL: ${publicUrl}
📁 Mod: ${dev ? 'Development' : 'Production'}
📂 Proje: ${projectRoot}
🔧 Node.js: ${process.version}
💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
⏰ Zaman: ${new Date().toLocaleString('tr-TR')}
🌐 Public HTML: ${isInPublicHtml ? 'Evet' : 'Hayır'}

${isInPublicHtml ? 
  '📝 Not: Git repo public_html\'de tespit edildi.\n📱 Uygulamanıza domain adresinizden erişebilirsiniz.' :
  'Sunucuyu durdurmak için Ctrl+C tuşlarına basın.'
}
    `)
  })

  // Error handling for server
  server.on('error', (err) => {
    console.error('Sunucu hatası:', err)
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} zaten kullanımda. Başka bir port deneyin.`)
    }
    process.exit(1)
  })

}).catch((ex) => {
  console.error('Uygulama başlatma hatası:', ex)
  process.exit(1)
}) 