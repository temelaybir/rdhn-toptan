import { NextRequest, NextResponse } from 'next/server'
import { ArasCargoService } from '../../../../../packages/aras-cargo-integration/src/aras-cargo-service'
import { CargoStatus } from '@/types/cargo'

/**
 * POST - Kargo takip bilgilerini getirir
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingNumber, company = 'aras' } = body

    if (!trackingNumber) {
      return NextResponse.json({
        success: false,
        error: 'Takip numarası gerekli'
      }, { status: 400 })
    }

    console.log(`🔍 Kargo takip sorgusu: ${trackingNumber} (${company})`)

    // Aras Kargo servisini oluştur
    const arasService = new ArasCargoService({
      serviceUrl: process.env.ARAS_CARGO_SERVICE_URL || 'http://customerservices.araskargo.com.tr/arascargoservice/arascargoservice.asmx',
      username: process.env.ARAS_CARGO_USERNAME || 'neodyum',
      password: process.env.ARAS_CARGO_PASSWORD || 'nd2580',
      customerCode: process.env.ARAS_CARGO_CUSTOMER_CODE || '1932448851342'
    })

    // Kargo durumunu sorgula
    const result = await arasService.queryCargoStatus(trackingNumber)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Kargo bilgisi alınamadı'
      }, { status: 500 })
    }

    // SOAP XML response'unu parse et
    const responseXml = result.data
    const movements = parseArasCargoResponse(responseXml)

    if (movements.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Kargo takip bilgisi bulunamadı. Henüz sisteme kaydedilmemiş olabilir.'
      })
    }

    // En son durumu belirle
    const latestMovement = movements[0] // İlk hareket en son hareket
    const currentStatus = mapArasStatusToCargoStatus(latestMovement.description)

    const mappedMovements = movements.map((movement, index) => ({
      id: `${trackingNumber}-${index}`,
      date: movement.date,
      time: movement.time,
      location: movement.location,
      description: movement.description,
      status: mapArasStatusToCargoStatus(movement.description)
    }))

    return NextResponse.json({
      success: true,
      data: {
        trackingNumber,
        company: 'ARAS',
        currentStatus,
        estimatedDeliveryDate: calculateEstimatedDelivery(currentStatus, mappedMovements),
        movements: mappedMovements
      }
    })

  } catch (error: any) {
    console.error('❌ Kargo takip API hatası:', error)
    return NextResponse.json({
      success: false,
      error: 'Kargo takip bilgisi alınırken hata oluştu'
    }, { status: 500 })
  }
}

/**
 * Aras Kargo SOAP XML response'unu parse eder
 */
function parseArasCargoResponse(xmlResponse: string) {
  const movements: Array<{
    date: string
    time: string
    location: string
    description: string
  }> = []

  try {
    // XML içinden kargo hareketlerini çıkar
    // Aras Kargo XML formatına göre parse et
    const cargoInfoMatch = xmlResponse.match(/<GetCargoInfoResult>(.*?)<\/GetCargoInfoResult>/s)
    
    if (!cargoInfoMatch) {
      console.log('XML response\'da GetCargoInfoResult bulunamadı')
      return movements
    }

    const cargoInfo = cargoInfoMatch[1]
    
    // Hareket detaylarını bul
    const movementMatches = cargoInfo.matchAll(/<Movement>.*?<Date>(.*?)<\/Date>.*?<Time>(.*?)<\/Time>.*?<Location>(.*?)<\/Location>.*?<Description>(.*?)<\/Description>.*?<\/Movement>/gs)
    
    for (const match of movementMatches) {
      movements.push({
        date: match[1].trim(),
        time: match[2].trim(),
        location: match[3].trim(),
        description: match[4].trim()
      })
    }

    // Alternatif format için de kontrol et
    if (movements.length === 0) {
      const alternativeMatches = cargoInfo.matchAll(/<row>.*?<TrackingDate>(.*?)<\/TrackingDate>.*?<TrackingTime>(.*?)<\/TrackingTime>.*?<TrackingLocation>(.*?)<\/TrackingLocation>.*?<TrackingDescription>(.*?)<\/TrackingDescription>.*?<\/row>/gs)
      
      for (const match of alternativeMatches) {
        movements.push({
          date: match[1].trim(),
          time: match[2].trim(),
          location: match[3].trim(),
          description: match[4].trim()
        })
      }
    }

    console.log(`📦 ${movements.length} kargo hareketi bulundu`)
    return movements

  } catch (error) {
    console.error('XML parsing hatası:', error)
    return movements
  }
}

/**
 * Aras Kargo durumunu system CargoStatus'a dönüştürür
 */
function mapArasStatusToCargoStatus(description: string): CargoStatus {
  const desc = description.toLowerCase()
  
  if (desc.includes('alındı') || desc.includes('kabul')) {
    return CargoStatus.PICKED_UP
  }
  
  if (desc.includes('transfer') || desc.includes('aktarma') || desc.includes('yolda')) {
    return CargoStatus.IN_TRANSIT
  }
  
  if (desc.includes('dağıtım') || desc.includes('merkez')) {
    return CargoStatus.IN_DISTRIBUTION
  }
  
  if (desc.includes('kurye') || desc.includes('teslimat')) {
    return CargoStatus.OUT_FOR_DELIVERY
  }
  
  if (desc.includes('teslim edildi')) {
    return CargoStatus.DELIVERED
  }
  
  return CargoStatus.IN_TRANSIT // Default
}

/**
 * Kargo durumuna göre tahmini teslimat tarihi hesaplar
 */
function calculateEstimatedDelivery(status: CargoStatus, movements: any[] = []): string {
  const now = new Date()
  let daysToAdd = 1
  
  // Kargo hareketlerine göre daha akıllı hesaplama
  const latestMovement = movements[0] // En son hareket
  
  switch (status) {
    case CargoStatus.PICKED_UP:
      // İlk alım, şehirlerarası mesafeye göre
      daysToAdd = 3
      break
    case CargoStatus.IN_TRANSIT:
      // Transit durumunda, kaç gündür yolda olduğuna bak
      if (latestMovement) {
        const movementDate = new Date(latestMovement.date)
        const daysSincePickup = Math.floor((now.getTime() - movementDate.getTime()) / (24 * 60 * 60 * 1000))
        
        if (daysSincePickup >= 2) {
          daysToAdd = 1 // Uzun süredir yolda, yakında dağıtım merkezine ulaşır
        } else {
          daysToAdd = 2 // Normal transit süresi
        }
      } else {
        daysToAdd = 2
      }
      break
    case CargoStatus.IN_DISTRIBUTION:
      // Dağıtım merkezinde, bugün veya yarın teslim
      const currentHour = now.getHours()
      if (currentHour < 15) {
        daysToAdd = 0.5 // Bugün teslim olabilir
      } else {
        daysToAdd = 1 // Yarın teslim
      }
      break
    case CargoStatus.OUT_FOR_DELIVERY:
      daysToAdd = 0.2 // Birkaç saat içinde
      break
    case CargoStatus.DELIVERED:
      return now.toISOString() // Zaten teslim edilmiş
    default:
      daysToAdd = 2
  }
  
  const estimatedDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
  return estimatedDate.toISOString()
} 