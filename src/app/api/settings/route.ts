import { NextResponse } from 'next/server'
import { getSiteSettings } from '@/services/site-settings'

export async function GET() {
  try {
    const settings = await getSiteSettings()
    
    // Sosyal medya widget için gerekli alanları döndür
    const socialSettings = {
      whatsapp_number: settings.whatsapp_number || null,
      whatsapp_url: settings.whatsapp_url || null,
      instagram_url: settings.instagram_url || null,
      facebook_url: settings.facebook_url || null,
      youtube_url: settings.youtube_url || null,
      linkedin_url: settings.linkedin_url || null,
      twitter_url: settings.twitter_url || null,
      show_social_widget: settings.show_social_widget ?? true, // Varsayılan true
      social_widget_position: settings.social_widget_position || 'bottom-right',
      social_widget_style: settings.social_widget_style || 'floating'
    }
    
    console.log('🔍 API Settings Response:', socialSettings)
    
    return NextResponse.json({ 
      success: true, 
      data: socialSettings 
    })
  } catch (error) {
    console.error('Site ayarları API hatası:', error)
    
    // Hata durumunda varsayılan değerler döndür
    const fallbackSettings = {
      whatsapp_number: null,
      whatsapp_url: null,
      instagram_url: null,
      facebook_url: null,
      youtube_url: null,
      linkedin_url: null,
      twitter_url: null,
      show_social_widget: true,
      social_widget_position: 'bottom-right',
      social_widget_style: 'floating'
    }
    
    return NextResponse.json({ 
      success: true, 
      data: fallbackSettings,
      note: 'Fallback data used due to error'
    })
  }
} 