import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'
import { validateAdminAuth } from '@/lib/auth/admin-api-auth'
import fs from 'fs'
import path from 'path'

/**
 * SEO URL Mapping Generation API
 * Eski URL'leri otomatik olarak yeni ürünlerle eşleştirir
 */

// Ürün isimlerini normalize et
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// String similarity (gelişmiş versiyon)
function improvedStringMatch(str1: string, str2: string): { score: number, reason: string } {
  const s1 = normalizeProductName(str1)
  const s2 = normalizeProductName(str2)

  // 1. Tam eşleşme
  if (s1 === s2) return { score: 1.0, reason: 'exact match' }

  // 2. Bir string diğerini içeriyor
  if (s1.includes(s2) || s2.includes(s1)) return { score: 0.9, reason: 'substring match' }

  // 3. Ortak kelimeler (2+ karakter - DAHA ESNEK!)
  const words1 = s1.split(/\s+/).filter(w => w.length >= 2)
  const words2 = s2.split(/\s+/).filter(w => w.length >= 2)

  const commonWords = words1.filter(w1 =>
    words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))
  )

  // En az 2 ortak kelime gerekli
  if (commonWords.length >= 2) {
    const score = Math.min(0.85, 0.5 + (commonWords.length * 0.15))
    return { score, reason: `common words: ${commonWords.join(', ')}` }
  }

  // 1 ortak kelime bile yeterli (4+ karakter)
  if (commonWords.length === 1 && commonWords[0].length >= 4) {
    return { score: 0.65, reason: `strong word: ${commonWords[0]}` }
  }

  // Partial matching (kelime başlangıçları)
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.length >= 4 && word2.length >= 4) {
        if (word1.substring(0, 3) === word2.substring(0, 3)) {
          return { score: 0.55, reason: `partial match: ${word1} ~ ${word2}` }
        }
      }
    }
  }

  return { score: 0, reason: 'insufficient similarity' }
}

// URL'leri parse et
function parseOldUrls(content: string) {
  const urls = content.split('\n')
    .filter(line => line.trim())
    .map(line => line.trim())

  return urls.map(url => {
    // URL'den slug ve barkod çıkar
    const match = url.match(/\/([^\/]+)_([A-Za-z0-9\-]+)\.html$/)
    if (match) {
      return {
        fullUrl: url.replace('https://catkapinda.com.tr', ''), // Relative URL
        slug: match[1],
        barcode: match[2],
        productName: match[1].replace(/-/g, ' ')
      }
    }
    return null
  }).filter(Boolean) as Array<{
    fullUrl: string
    slug: string
    barcode: string
    productName: string
  }>
}

// Kategori fallback belirle - GÜVENLİ YÖNLENDIRMELER
function getCategoryFallback(productName: string): string {
  const name = productName.toLowerCase()
  
  // Basit kategori yönlendirmeleri - Çalışan URL'ler
  const categoryMappings = [
    { keywords: ['cakmak', 'çakmak', 'ateş'], url: '/urunler?kategori=cakmak' },
    { keywords: ['oyuncak', 'bebek', 'robot', 'araba', 'drone'], url: '/urunler?kategori=oyuncak' },
    { keywords: ['elektronik', 'sarj', 'kamera'], url: '/urunler?kategori=elektronik' },
    { keywords: ['spor', 'scooter', 'kaykay'], url: '/urunler?kategori=spor' },
    { keywords: ['aksesuar', 'kolye', 'bileklik'], url: '/urunler?kategori=aksesuar' }
  ]

  for (const mapping of categoryMappings) {
    if (mapping.keywords.some(keyword => name.includes(keyword))) {
      return mapping.url
    }
  }

  return '/urunler' // Güvenli fallback - Tüm ürünler sayfası
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAdminAuth()
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim' }, { status: 401 })
    }

    console.log('🚀 URL Mapping generation başlatılıyor...')

    const body = await request.json()
    const { urlFileContent, threshold = 0.6, dryRun = false } = body

    if (!urlFileContent) {
      return NextResponse.json({
        success: false,
        error: 'URL dosya içeriği gerekli'
      }, { status: 400 })
    }

    const supabase = await createAdminSupabaseClient()

    // 1. Eski URL'leri parse et
    const oldUrls = parseOldUrls(urlFileContent)
    console.log(`📋 ${oldUrls.length} eski URL parse edildi`)

    // 2. Site ürünlerini çek
    const { data: siteProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, barcode, is_active')
      .eq('is_active', true)

    if (productsError) {
      console.error('Products fetch error:', productsError)
      return NextResponse.json({
        success: false,
        error: 'Ürünler alınırken hata: ' + productsError.message
      }, { status: 500 })
    }

    console.log(`🏪 ${siteProducts?.length || 0} site ürünü alındı`)

    const mappings = {
      exact: [] as any[],
      similar: [] as any[],
      fallback: [] as any[]
    }

    // 3. Eşleştirme yap
    for (const oldUrl of oldUrls) {
      let bestMatch = null
      let bestScore = 0
      let matchReason = ''

      // A) Barkod ile eşleştir
      if (oldUrl.barcode) {
        const barcodeMatch = siteProducts?.find(p =>
          p.barcode && p.barcode.toLowerCase() === oldUrl.barcode.toLowerCase()
        )

        if (barcodeMatch) {
          mappings.exact.push({
            old_url: oldUrl.fullUrl,
            new_url: `/urunler/${barcodeMatch.slug}`,
            match_type: 'exact',
            confidence: 1.0,
            old_product_name: oldUrl.productName,
            old_barcode: oldUrl.barcode,
            product_id: barcodeMatch.id,
            reason: 'barcode match'
          })
          continue
        }
      }

      // B) İsim benzerliği ile eşleştir
      for (const product of siteProducts || []) {
        const matchResult = improvedStringMatch(oldUrl.productName, product.name)
        if (matchResult.score > bestScore) {
          bestScore = matchResult.score
          bestMatch = product
          matchReason = matchResult.reason
        }
      }

      if (bestScore >= threshold) {
        mappings.similar.push({
          old_url: oldUrl.fullUrl,
          new_url: `/urunler/${bestMatch.slug}`,
          match_type: 'similarity',
          confidence: bestScore,
          old_product_name: oldUrl.productName,
          old_barcode: oldUrl.barcode,
          product_id: bestMatch.id,
          reason: matchReason
        })
      } else {
        // C) Kategori fallback
        const fallbackUrl = getCategoryFallback(oldUrl.productName)
        mappings.fallback.push({
          old_url: oldUrl.fullUrl,
          new_url: fallbackUrl,
          match_type: 'fallback',
          confidence: 0.5,
          old_product_name: oldUrl.productName,
          old_barcode: oldUrl.barcode,
          product_id: null,
          reason: 'category fallback'
        })
      }
    }

    const stats = {
      total: oldUrls.length,
      exact: mappings.exact.length,
      similar: mappings.similar.length,
      fallback: mappings.fallback.length,
      exactPercentage: Math.round((mappings.exact.length / oldUrls.length) * 100),
      similarPercentage: Math.round((mappings.similar.length / oldUrls.length) * 100),
      fallbackPercentage: Math.round((mappings.fallback.length / oldUrls.length) * 100)
    }

    console.log('📊 Eşleştirme İstatistikleri:')
    console.log(`   Toplam: ${stats.total}`)
    console.log(`   Tam eşleşme: ${stats.exact} (${stats.exactPercentage}%)`)
    console.log(`   Benzer eşleşme: ${stats.similar} (${stats.similarPercentage}%)`)
    console.log(`   Kategori fallback: ${stats.fallback} (${stats.fallbackPercentage}%)`)

    // 4. Database'e kaydet (dryRun değilse)
    if (!dryRun) {
      const allMappings = [
        ...mappings.exact,
        ...mappings.similar,
        ...mappings.fallback
      ]

      console.log(`💾 ${allMappings.length} mapping database'e kaydediliyor...`)

      const { data: insertResult, error: insertError } = await supabase
        .rpc('bulk_insert_url_mappings', {
          mappings: allMappings
        })

      if (insertError) {
        console.error('Bulk insert error:', insertError)
        return NextResponse.json({
          success: false,
          error: 'Mappings kaydedilirken hata: ' + insertError.message
        }, { status: 500 })
      }

      console.log(`✅ ${insertResult} mapping başarıyla kaydedildi`)

      return NextResponse.json({
        success: true,
        message: `${insertResult} URL mapping başarıyla oluşturuldu`,
        data: {
          statistics: stats,
          insertedCount: insertResult,
          preview: {
            exact: mappings.exact.slice(0, 3),
            similar: mappings.similar.slice(0, 3),
            fallback: mappings.fallback.slice(0, 3)
          }
        }
      })
    }

    // Dry run sonuçları
    return NextResponse.json({
      success: true,
      message: 'Dry run tamamlandı (database\'e kayıt yapılmadı)',
      data: {
        statistics: stats,
        preview: {
          exact: mappings.exact.slice(0, 5),
          similar: mappings.similar.slice(0, 5),
          fallback: mappings.fallback.slice(0, 5)
        },
        fullResults: {
          exact: mappings.exact,
          similar: mappings.similar,
          fallback: mappings.fallback
        }
      }
    })

  } catch (error: any) {
    console.error('URL mapping generation error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Mapping generation hatası'
    }, { status: 500 })
  }
}
