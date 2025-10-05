'use server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-client'

interface BulkImageUpdateResult {
  success: boolean
  message: string
  updatedCount: number
  errorCount: number
}

export async function bulkFixProductImages(): Promise<BulkImageUpdateResult> {
  try {
    const supabase = await createAdminSupabaseClient()
    
    // Step 1: Fix NULL or empty images
    const { error: error1, count: count1 } = await supabase
      .from('products')
      .update({ 
        images: ['/placeholder-product.svg'],
        updated_at: new Date().toISOString()
      })
      .or('images.is.null,images.eq.{}')
      .eq('is_active', true)
      .select('id', { count: 'exact' })

    if (error1) {
      console.error('Step 1 error:', error1)
      return {
        success: false,
        message: `Adım 1 hatası: ${error1.message}`,
        updatedCount: 0,
        errorCount: 1
      }
    }

    // Step 2: Get products with problematic URLs and fix them
    const { data: problematicProducts, error: error2 } = await supabase
      .from('products')
      .select('id, images')
      .eq('is_active', true)
      .not('images', 'is', null)

    if (error2) {
      console.error('Step 2 error:', error2)
      return {
        success: false,
        message: `Adım 2 hatası: ${error2.message}`,
        updatedCount: count1 || 0,
        errorCount: 1
      }
    }

    let fixedCount = 0
    let errorCount = 0

    // Process each product
    for (const product of problematicProducts || []) {
      try {
        const cleanImages = (product.images as string[])
          .filter(url => url && url.trim() !== '' && url !== 'null' && url !== 'undefined')
          .map(url => {
            // Fix URL patterns
            let cleanUrl = url.replace(/-550x550h\./g, '-550x550.')
            cleanUrl = cleanUrl.replace(/550x550h\./g, '550x550.')
            return cleanUrl
          })

        // Ensure at least one image
        if (cleanImages.length === 0) {
          cleanImages.push('/placeholder-product.svg')
        }

        // Update if changed
        if (JSON.stringify(cleanImages) !== JSON.stringify(product.images)) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ 
              images: cleanImages,
              updated_at: new Date().toISOString()
            })
            .eq('id', product.id)

          if (updateError) {
            console.error(`Product ${product.id} update error:`, updateError)
            errorCount++
          } else {
            fixedCount++
          }
        }
      } catch (err) {
        console.error(`Product ${product.id} processing error:`, err)
        errorCount++
      }
    }

    return {
      success: true,
      message: `Toplu görsel düzeltmesi tamamlandı`,
      updatedCount: (count1 || 0) + fixedCount,
      errorCount
    }

  } catch (error) {
    console.error('Bulk image update error:', error)
    return {
      success: false,
      message: `Genel hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      updatedCount: 0,
      errorCount: 1
    }
  }
}

export async function validateProductImages(): Promise<{
  totalProducts: number
  productsWithImages: number
  productsWithPlaceholder: number
  productsWithCustomImages: number
}> {
  try {
    const supabase = await createAdminSupabaseClient()
    
    const { data: stats } = await supabase.rpc('get_image_stats')
    
    if (!stats) {
      // Fallback: manual counting
      const { count: total } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { count: withImages } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('images', 'is', null)

      return {
        totalProducts: total || 0,
        productsWithImages: withImages || 0,
        productsWithPlaceholder: 0,
        productsWithCustomImages: 0
      }
    }

    return stats
  } catch (error) {
    console.error('Validate images error:', error)
    return {
      totalProducts: 0,
      productsWithImages: 0,
      productsWithPlaceholder: 0,
      productsWithCustomImages: 0
    }
  }
} 