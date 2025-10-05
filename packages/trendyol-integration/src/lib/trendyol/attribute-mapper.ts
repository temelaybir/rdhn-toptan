import { createClient } from '@/lib/supabase/server'
import { getTrendyolClient } from './api-client'
import { 
  TrendyolCategory, 
  TrendyolAttribute, 
  TrendyolApiCategoryResponse,
  TrendyolApiAttributeResponse,
  SyncResult,
  TrendyolApiProduct,
  TrendyolApiCredentials
} from '@/types/trendyol'

export class AttributeMapper {
  private credentials: TrendyolApiCredentials | null = null

  constructor(credentials?: TrendyolApiCredentials) {
    this.credentials = credentials || null
  }

  /**
   * Trendyol'dan tüm kategorileri çeker ve veritabanına kaydeder
   */
  async syncCategories(): Promise<SyncResult> {
    try {
      const client = await this.getTrendyolClient()
      if (!client) {
        return { success: false, error: 'Trendyol client başlatılamadı' }
      }

      console.log('📋 Trendyol kategorileri çekiliyor...')
      // Trendyol kategorilerini çek
      const categories = await client.getCategories()
      
      console.log('📊 API Response:', {
        type: typeof categories,
        isArray: Array.isArray(categories),
        length: categories?.length || 0,
        sample: categories ? categories.slice(0, 2) : null
      })
      
      if (!categories || categories.length === 0) {
        console.log('❌ Kategoriler boş veya undefined:', categories)
        return { success: false, error: 'Kategori listesi alınamadı' }
      }

      const supabase = await createClient()
      let syncedCount = 0
      let errors: string[] = []

      // Kategorileri recursive olarak işle
      const processCategories = async (categoryList: TrendyolApiCategoryResponse[], parentId?: number) => {
        for (const category of categoryList) {
          try {
            // Veritabanına kaydet
            const { error } = await supabase
              .from('trendyol_categories')
              .upsert({
                trendyol_category_id: category.id,
                category_name: category.name,
                parent_category_id: parentId || null,
                is_active: true
              }, {
                onConflict: 'trendyol_category_id'
              })

            if (error) {
              errors.push(`Kategori ${category.name} kaydedilemedi: ${error.message}`)
            } else {
              syncedCount++
            }

            // Alt kategoriler varsa işle
            if (category.subCategories && category.subCategories.length > 0) {
              await processCategories(category.subCategories, category.id)
            }

          } catch (error) {
            errors.push(`Kategori ${category.name} işlenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
          }
        }
      }

      await processCategories(categories)

      // Sync zamanını güncelle
      await supabase
        .from('trendyol_settings')
        .update({ last_category_sync: new Date().toISOString() })
        .eq('is_active', true)

      if (errors.length > 0) {
        return {
          success: false,
          error: `${syncedCount} kategori senkronize edildi, ${errors.length} hata oluştu`,
          data: { syncedCount, errors }
        }
      }

      return {
        success: true,
        message: `${syncedCount} kategori başarıyla senkronize edildi`,
        data: { syncedCount }
      }

    } catch (error) {
      console.error('Kategori senkronizasyon hatası:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Kategori senkronizasyonu başarısız'
      }
    }
  }

  /**
   * Belirli bir kategorinin zorunlu alanlarını çeker ve kaydeder
   */
  async syncCategoryAttributes(categoryId: number): Promise<SyncResult> {
    try {
      const client = await this.getTrendyolClient()
      if (!client) {
        return { success: false, error: 'Trendyol client başlatılamadı' }
      }

      // Kategorinin attribute'larını çek
      const attributes = await client.getCategoryAttributes(categoryId)
      
      if (!attributes || attributes.length === 0) {
        return { 
          success: true, 
          message: `Kategori ${categoryId} için zorunlu alan bulunamadı` 
        }
      }

      const supabase = await createClient()
      let syncedCount = 0
      let errors: string[] = []

      for (const attributeResponse of attributes) {
        try {
          const attribute = attributeResponse.attribute

          // Allowed values hazırla
          const allowedValues = attribute.attributeValues?.map(v => v.name) || []

          // Veritabanına kaydet
          const { error } = await supabase
            .from('trendyol_attributes')
            .upsert({
              trendyol_category_id: categoryId,
              attribute_name: attribute.name,
              attribute_type: this.detectAttributeType(attribute),
              is_required: attribute.required,
              allowed_values: allowedValues.length > 0 ? allowedValues : null
            }, {
              onConflict: 'trendyol_category_id,attribute_name'
            })

          if (error) {
            errors.push(`Attribute ${attribute.name} kaydedilemedi: ${error.message}`)
          } else {
            syncedCount++
          }

        } catch (error) {
          errors.push(`Attribute işlenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: `${syncedCount} attribute senkronize edildi, ${errors.length} hata oluştu`,
          data: { syncedCount, errors }
        }
      }

      return {
        success: true,
        message: `${syncedCount} attribute başarıyla senkronize edildi`,
        data: { syncedCount }
      }

    } catch (error) {
      console.error('Attribute senkronizasyon hatası:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Attribute senkronizasyonu başarısız'
      }
    }
  }

  /**
   * Tüm aktif kategoriler için attribute'ları senkronize eder
   */
  async syncAllCategoryAttributes(): Promise<SyncResult> {
    try {
      const supabase = await createClient()
      
      // Aktif kategorileri al
      const { data: categories, error } = await supabase
        .from('trendyol_categories')
        .select('trendyol_category_id, category_name')
        .eq('is_active', true)

      if (error) {
        return { success: false, error: `Kategoriler alınamadı: ${error.message}` }
      }

      if (!categories || categories.length === 0) {
        return { success: false, error: 'Aktif kategori bulunamadı' }
      }

      let totalSynced = 0
      let totalErrors: string[] = []

      // Her kategori için attribute'ları senkronize et
      for (const category of categories) {
        try {
          const result = await this.syncCategoryAttributes(category.trendyol_category_id)
          
          if (result.success) {
            totalSynced += result.data?.syncedCount || 0
          } else {
            totalErrors.push(`${category.category_name}: ${result.error}`)
          }

          // Rate limiting için bekleme
          await new Promise(resolve => setTimeout(resolve, 1500))

        } catch (error) {
          totalErrors.push(`${category.category_name}: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
        }
      }

      if (totalErrors.length > 0) {
        return {
          success: false,
          error: `${totalSynced} attribute senkronize edildi, ${totalErrors.length} kategoride hata oluştu`,
          data: { totalSynced, errors: totalErrors }
        }
      }

      return {
        success: true,
        message: `${totalSynced} attribute ${categories.length} kategoriden başarıyla senkronize edildi`,
        data: { totalSynced, categoryCount: categories.length }
      }

    } catch (error) {
      console.error('Toplu attribute senkronizasyon hatası:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Toplu attribute senkronizasyonu başarısız'
      }
    }
  }

  /**
   * Yerel ürünü Trendyol formatına dönüştürür
   */
  async mapProductToTrendyol(productId: string): Promise<{ success: boolean; data?: TrendyolApiProduct; error?: string }> {
    try {
      const supabase = await createClient()

      // Ürün bilgilerini al
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            trendyol_categories (
              trendyol_category_id,
              category_name
            )
          )
        `)
        .eq('id', productId)
        .single()

      if (productError || !product) {
        return { success: false, error: 'Ürün bulunamadı' }
      }

      // Kategori mapping kontrolü
      const trendyolCategory = product.categories?.trendyol_categories?.[0]
      if (!trendyolCategory) {
        return { 
          success: false, 
          error: 'Ürün kategorisi Trendyol ile eşleştirilmemiş' 
        }
      }

      // Barcode kontrolü
      if (!product.barcode) {
        return { 
          success: false, 
          error: 'Ürün barkodu eksik' 
        }
      }

      // Zorunlu alanları kontrol et
      const validationResult = await this.validateProductAttributes(
        product, 
        trendyolCategory.trendyol_category_id
      )

      if (!validationResult.success) {
        return { 
          success: false, 
          error: `Zorunlu alanlar eksik: ${validationResult.error}` 
        }
      }

      // Trendyol product objesi oluştur
      const trendyolProduct: TrendyolApiProduct = {
        barcode: product.barcode,
        title: product.name,
        description: product.description || product.short_description || '',
        categoryId: trendyolCategory.trendyol_category_id,
        quantity: product.stock_quantity || 0,
        listPrice: Number(product.compare_price || product.price),
        salePrice: Number(product.price),
        images: product.images?.map(url => ({ url })) || [],
        attributes: validationResult.data?.attributes || []
      }

      return { success: true, data: trendyolProduct }

    } catch (error) {
      console.error('Ürün mapping hatası:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ürün mapping başarısız'
      }
    }
  }

  /**
   * Ürünün zorunlu alanlarını validate eder
   */
  private async validateProductAttributes(product: any, categoryId: number): Promise<{
    success: boolean;
    error?: string;
    data?: { attributes: Array<{ attributeId: number; attributeValueId: number; customAttributeValue?: string }> };
  }> {
    try {
      const supabase = await createClient()

      // Kategorinin zorunlu alanlarını al
      const { data: attributes, error } = await supabase
        .from('trendyol_attributes')
        .select('*')
        .eq('trendyol_category_id', categoryId)
        .eq('is_required', true)

      if (error) {
        return { success: false, error: `Zorunlu alanlar alınamadı: ${error.message}` }
      }

      if (!attributes || attributes.length === 0) {
        return { success: true, data: { attributes: [] } }
      }

      const missingAttributes: string[] = []
      const mappedAttributes: Array<{ 
        attributeId: number; 
        attributeValueId: number; 
        customAttributeValue?: string 
      }> = []

      for (const attr of attributes) {
        // Burada gerçek mapping logic'i olacak
        // Şimdilik placeholder değerler veriyoruz
        switch (attr.attribute_name.toLowerCase()) {
          case 'marka':
          case 'brand':
            if (!product.brand) {
              missingAttributes.push('Marka')
            } else {
              // Marka ID'si mapping'i gerekecek
              mappedAttributes.push({
                attributeId: 1, // Placeholder
                attributeValueId: 1, // Placeholder  
                customAttributeValue: product.brand
              })
            }
            break

          case 'renk':
          case 'color':
            // Renk attribute'u varsa ekle
            break

          case 'beden':
          case 'size':
            // Beden attribute'u varsa ekle
            break

          default:
            // Diğer zorunlu alanlar için generic handling
            break
        }
      }

      if (missingAttributes.length > 0) {
        return { 
          success: false, 
          error: missingAttributes.join(', ') 
        }
      }

      return { 
        success: true, 
        data: { attributes: mappedAttributes } 
      }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Validation hatası' 
      }
    }
  }

  /**
   * Attribute tipini tespit eder
   */
  private detectAttributeType(attribute: any): 'text' | 'number' | 'select' | 'multiselect' {
    if (attribute.attributeValues && attribute.attributeValues.length > 0) {
      return 'select'
    }
    
    if (attribute.allowCustom) {
      return 'text'
    }

    // Default olarak text
    return 'text'
  }

  /**
   * Trendyol client'ı al
   */
  private async getTrendyolClient() {
    if (this.credentials) {
      return getTrendyolClient(this.credentials)
    }

    // Settings'den al
    const supabase = await createClient()
    const { data: settings, error } = await supabase
      .from('trendyol_settings')
      .select('supplier_id, api_key, api_secret, mock_mode, test_mode')
      .eq('is_active', true)
      .single()

    if (error || !settings) {
      throw new Error('Aktif Trendyol ayarları bulunamadı')
    }

    return getTrendyolClient({
      supplierId: settings.supplier_id,
      apiKey: settings.api_key,
      apiSecret: settings.api_secret
    }, settings.mock_mode, settings.test_mode)
  }

  /**
   * Kategori eşleştirmesi yapar
   */
  async mapLocalCategory(localCategoryId: string, trendyolCategoryId: number): Promise<SyncResult> {
    try {
      const supabase = await createClient()

      const { error } = await supabase
        .from('trendyol_categories')
        .update({ local_category_id: localCategoryId })
        .eq('trendyol_category_id', trendyolCategoryId)

      if (error) {
        return { 
          success: false, 
          error: `Kategori eşleştirmesi başarısız: ${error.message}` 
        }
      }

      return { 
        success: true, 
        message: 'Kategori eşleştirmesi başarıyla tamamlandı' 
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Kategori eşleştirme hatası'
      }
    }
  }

  /**
   * Credentials'ı günceller
   */
  updateCredentials(credentials: TrendyolApiCredentials): void {
    this.credentials = credentials
  }
} 