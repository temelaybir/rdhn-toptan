#!/usr/bin/env node

// Basit start dosyası - Hosting panelleri için
// Bu dosya hosting panellerinde "Start Script" olarak kullanılabilir
// Git repo public_html'de ise otomatik tespit edilir

const path = require('path')
const fs = require('fs')

console.log('🚀 RDHN Commerce başlatılıyor...')
console.log(`📁 Working Directory: ${process.cwd()}`)
console.log(`📂 Script Directory: ${__dirname}`)
console.log(`🔧 Node.js Version: ${process.version}`)
console.log(`📊 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`)

// Git repo yapısını tespit et
const isInPublicHtml = __dirname.includes('public_html')
const projectRoot = __dirname

console.log(`🌐 Public HTML Mode: ${isInPublicHtml}`)
console.log(`📂 Project Root: ${projectRoot}`)

// Environment check
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'
}

if (!process.env.PORT) {
  process.env.PORT = 3000
}

if (!process.env.HOSTNAME) {
  process.env.HOSTNAME = '0.0.0.0'
}

console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
console.log(`🔌 Port: ${process.env.PORT}`)
console.log(`🌐 Hostname: ${process.env.HOSTNAME}`)

// Log klasörünü kontrol et
const logDir = path.join(projectRoot, 'logs')
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true })
    console.log(`📁 Log klasörü oluşturuldu: ${logDir}`)
  } catch (error) {
    console.log(`⚠️  Log klasörü oluşturulamadı, devam ediliyor...`)
  }
}

// Package.json'ı kontrol et
const packageJsonPath = path.join(projectRoot, 'package.json')
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json bulunamadı!')
  console.error(`Kontrol edilen yol: ${packageJsonPath}`)
  console.error('Bu scripti doğru klasörde çalıştırdığınızdan emin olun.')
  process.exit(1)
}

// Next.js build'ini kontrol et
const nextBuildPath = path.join(projectRoot, '.next')
if (!fs.existsSync(nextBuildPath)) {
  console.error('❌ .next build klasörü bulunamadı!')
  console.error('Önce "npm run build" komutunu çalıştırın.')
  process.exit(1)
}

console.log('✅ Tüm kontroller başarılı')

// Çalıştırma yöntemini belirle
const serverJsPath = path.join(projectRoot, 'server.js')
const standaloneServerPath = path.join(projectRoot, '.next/standalone/server.js')

try {
  if (fs.existsSync(standaloneServerPath)) {
    console.log('🎯 Next.js standalone server kullanılıyor')
    
    // Standalone server için environment ayarları
    process.env.NEXT_PROJECT_ROOT = projectRoot
    
    // Change working directory to project root
    process.chdir(projectRoot)
    
    require(standaloneServerPath)
    
  } else if (fs.existsSync(serverJsPath)) {
    console.log('🎯 Custom server.js kullanılıyor')
    require(serverJsPath)
    
  } else {
    console.log('🎯 Next.js default start kullanılıyor')
    
    // Change working directory to project root
    process.chdir(projectRoot)
    
    // Next.js'i manuel olarak başlat
    const { createServer } = require('http')
    const { parse } = require('url')
    const next = require('next')
    
    const app = next({ 
      dev: false,
      dir: projectRoot,
      hostname: process.env.HOSTNAME,
      port: parseInt(process.env.PORT)
    })
    
    const handle = app.getRequestHandler()
    
    app.prepare().then(() => {
      createServer((req, res) => {
        const parsedUrl = parse(req.url, true)
        handle(req, res, parsedUrl)
      }).listen(process.env.PORT, process.env.HOSTNAME, (err) => {
        if (err) throw err
        
        console.log(`
🎉 Başarılı! RDHN Commerce çalışıyor
${isInPublicHtml ? 
  '🌐 Domain adresinizden erişebilirsiniz' : 
  `🌐 http://${process.env.HOSTNAME}:${process.env.PORT}`
}
        `)
      })
    })
  }
  
} catch (error) {
  console.error('❌ Başlatma hatası:', error)
  console.error('Stack trace:', error.stack)
  process.exit(1)
} 