import type { ThemeSettings } from '@/services/site-settings'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

class ThemeSettingsService {
  private baseUrl = '/api/admin/theme-settings'

  // Tema ayarlarını getir
  async getThemeSettings(): Promise<ThemeSettings> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<ThemeSettings> = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Tema ayarları getirilemedi')
      }

      return result.data
    } catch (error) {
      console.error('Tema ayarları getirme hatası:', error)
      // Fallback değerler
      return {
        theme_color_scheme: 'light',
        theme_design_style: 'default', 
        theme_font_style: 'modern-sans',
        theme_product_card_style: 'default'
      }
    }
  }

  // Tema ayarlarını güncelle
  async updateThemeSettings(settings: Partial<ThemeSettings>): Promise<ThemeSettings> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<ThemeSettings> = await response.json()
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Tema ayarları güncellenemedi')
      }

      return result.data
    } catch (error) {
      console.error('Tema ayarları güncelleme hatası:', error)
      throw error
    }
  }

  // Tek bir tema ayarını güncelle
  async updateColorTheme(colorTheme: ThemeSettings['theme_color_scheme']): Promise<ThemeSettings> {
    return this.updateThemeSettings({ theme_color_scheme: colorTheme })
  }

  async updateDesignStyle(designStyle: ThemeSettings['theme_design_style']): Promise<ThemeSettings> {
    return this.updateThemeSettings({ theme_design_style: designStyle })
  }

  async updateFontStyle(fontStyle: ThemeSettings['theme_font_style']): Promise<ThemeSettings> {
    return this.updateThemeSettings({ theme_font_style: fontStyle })
  }

  async updateProductCardStyle(cardStyle: ThemeSettings['theme_product_card_style']): Promise<ThemeSettings> {
    return this.updateThemeSettings({ theme_product_card_style: cardStyle })
  }
}

// Singleton instance
export const themeSettingsService = new ThemeSettingsService()
export default themeSettingsService 