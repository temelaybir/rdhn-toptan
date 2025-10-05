export interface ErrorInfo {
  title: string
  description: string
  suggestion: string
  icon: string
  canRetry: boolean
  isCardIssue: boolean
  isBankIssue: boolean
}

/**
 * İyzico Error Kodları ve Anlamları
 * https://dev.iyzipay.com/tr/api/errors
 */
export const iyzicoErrorCodes: { [key: string]: ErrorInfo } = {
  // Kart ile ilgili hatalar
  '14': {
    title: 'Geçersiz Kart Numarası',
    description: 'Girilen kart numarası geçersiz veya hatalı.',
    suggestion: 'Lütfen kart numaranızı kontrol edin ve tekrar deneyin.',
    icon: 'CreditCard',
    canRetry: true,
    isCardIssue: true,
    isBankIssue: false
  },
  '54': {
    title: 'Kartın Süresi Dolmuş',
    description: 'Kullanmaya çalıştığınız kartın geçerlilik süresi dolmuş.',
    suggestion: 'Lütfen güncel bir kart kullanın veya kartınızı yenileyin.',
    icon: 'CreditCard',
    canRetry: true,
    isCardIssue: true,
    isBankIssue: false
  },
  '111': {
    title: 'Hatalı Güvenlik Kodu (CVC)',
    description: 'Girilen güvenlik kodu (CVC/CVV) hatalı.',
    suggestion: 'Kartınızın arkasındaki 3 haneli güvenlik kodunu doğru girdiğinizden emin olun.',
    icon: 'Shield',
    canRetry: true,
    isCardIssue: true,
    isBankIssue: false
  },
  '117': {
    title: 'Hatalı Son Kullanma Tarihi',
    description: 'Kartın son kullanma tarihi hatalı girilmiş.',
    suggestion: 'Kartınızın üzerindeki son kullanma tarihini (AA/YY) kontrol edin.',
    icon: 'Calendar',
    canRetry: true,
    isCardIssue: true,
    isBankIssue: false
  },

  // Bakiye ve limit hataları
  '51': {
    title: 'Yetersiz Bakiye',
    description: 'Kartınızda bu işlem için yeterli bakiye bulunmuyor.',
    suggestion: 'Bakiyenizi kontrol edin veya farklı bir kart deneyin.',
    icon: 'Wallet',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: true
  },
  '57': {
    title: 'Limit Aşımı',
    description: 'İşlem kartınızın limit aşımı nedeniyle reddedildi.',
    suggestion: 'Bankanızla iletişime geçin veya farklı bir kart kullanın.',
    icon: 'TrendingUp',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: true
  },
  '65': {
    title: 'Günlük Limit Aşımı',
    description: 'Kartınızın günlük harcama limitini aştınız.',
    suggestion: 'Yarın tekrar deneyin veya bankanızdan limit artırımı talep edin.',
    icon: 'Clock',
    canRetry: false,
    isCardIssue: false,
    isBankIssue: true
  },
  '61': {
    title: 'Tutar Limiti Aşımı',
    description: 'İşlem tutarı kartınızın tek seferde yapabileceği limitin üzerinde.',
    suggestion: 'Daha düşük tutarda ödeme yapın veya bankanızla görüşün.',
    icon: 'DollarSign',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: true
  },

  // Banka ve güvenlik hataları
  '05': {
    title: 'İşlem Reddedildi',
    description: 'Bankanız bu işlemi güvenlik nedeniyle reddetti.',
    suggestion: 'Bankanızı arayarak işlemi onaylatın veya başka bir kart deneyin.',
    icon: 'ShieldX',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: true
  },
  '07': {
    title: 'Özel Durumlu Kart',
    description: 'Kartınız özel bir durumda, işlem gerçekleştirilemiyor.',
    suggestion: 'Bankanızla iletişime geçin veya farklı bir kart kullanın.',
    icon: 'AlertTriangle',
    canRetry: false,
    isCardIssue: false,
    isBankIssue: true
  },
  '12': {
    title: 'Geçersiz İşlem',
    description: 'Bu kart için istenen işlem geçerli değil.',
    suggestion: 'Farklı bir kart deneyin veya bankanızla görüşün.',
    icon: 'X',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: true
  },
  '41': {
    title: 'Kayıp Kart',
    description: 'Kart kayıp olarak bildirilmiş.',
    suggestion: 'Bankanızla iletişime geçin veya farklı bir kart kullanın.',
    icon: 'ShieldAlert',
    canRetry: false,
    isCardIssue: true,
    isBankIssue: true
  },
  '43': {
    title: 'Çalıntı Kart',
    description: 'Kart çalıntı olarak bildirilmiş.',
    suggestion: 'Bankanızla acilen iletişime geçin.',
    icon: 'ShieldAlert',
    canRetry: false,
    isCardIssue: true,
    isBankIssue: true
  },

  // 3D Secure hataları
  '92': {
    title: '3D Secure Doğrulaması Başarısız',
    description: '3D Secure şifresi hatalı veya doğrulama tamamlanamadı.',
    suggestion: 'SMS şifrenizi doğru girdiğinizden emin olun ve tekrar deneyin.',
    icon: 'Smartphone',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: true
  },
  '99': {
    title: 'Banka Sistem Hatası',
    description: 'Banka sisteminde geçici bir problem var.',
    suggestion: 'Birkaç dakika bekleyin ve tekrar deneyin.',
    icon: 'Server',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: true
  },

  // İyzico sistem hataları
  '1': {
    title: 'İşlem Başarısız',
    description: 'Ödeme işlemi tamamlanamadı.',
    suggestion: 'Lütfen tekrar deneyin veya farklı bir kart kullanın.',
    icon: 'X',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: false
  },
  '2': {
    title: 'Banka Cevabı Bekleniyor',
    description: 'İşlem henüz tamamlanmadı, banka cevabı bekleniyor.',
    suggestion: 'Lütfen birkaç dakika bekleyin.',
    icon: 'Clock',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: true
  },
  '3': {
    title: 'Geçersiz Üye İşyeri',
    description: 'Ödeme sistemi yapılandırma hatası.',
    suggestion: 'Müşteri hizmetleri ile iletişime geçin.',
    icon: 'Settings',
    canRetry: false,
    isCardIssue: false,
    isBankIssue: false
  },
  '5': {
    title: 'İşlem Henüz Tamamlanmadı',
    description: 'Ödeme işlemi hala devam ediyor.',
    suggestion: 'Lütfen birkaç dakika bekleyin ve sayfayı yenileyin.',
    icon: 'Loader',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: false
  },

  // İnternational card errors
  '208': {
    title: 'Yabancı Kart Kabul Edilmiyor',
    description: 'Yurt dışından verilen kartlar kabul edilmiyor.',
    suggestion: 'Türkiye\'de verilen bir kart kullanın.',
    icon: 'Globe',
    canRetry: false,
    isCardIssue: true,
    isBankIssue: false
  },

  // Installment errors
  '206': {
    title: 'Taksit Seçeneği Geçersiz',
    description: 'Seçilen taksit seçeneği bu kart için geçerli değil.',
    suggestion: 'Farklı bir taksit seçeneği deneyin veya tek çekim yapın.',
    icon: 'CreditCard',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: false
  }
}

/**
 * Generic error types for other error codes
 */
export const genericErrorTypes: { [key: string]: ErrorInfo } = {
  PAYMENT_FAILED: {
    title: 'Ödeme Başarısız',
    description: 'Ödeme işlemi başarısız oldu.',
    suggestion: 'Kart bilgilerinizi kontrol edin ve tekrar deneyin.',
    icon: 'CreditCard',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: false
  },
  CALLBACK_ERROR: {
    title: 'İşlem Tamamlanamadı',
    description: '3D Secure doğrulaması sırasında bir hata oluştu.',
    suggestion: 'Lütfen tekrar deneyin.',
    icon: 'Smartphone',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: false
  },
  SYSTEM_ERROR: {
    title: 'Sistem Hatası',
    description: 'Beklenmeyen bir sistem hatası oluştu.',
    suggestion: 'Lütfen daha sonra tekrar deneyin.',
    icon: 'AlertTriangle',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: false
  },
  NETWORK_ERROR: {
    title: 'Bağlantı Hatası',
    description: 'İnternet bağlantısı sorunu.',
    suggestion: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
    icon: 'Wifi',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: false
  },
  TRANSACTION_NOT_FOUND: {
    title: 'İşlem Bulunamadı',
    description: 'Ödeme işlemi kaydı bulunamadı.',
    suggestion: 'Müşteri hizmetleri ile iletişime geçin.',
    icon: 'Search',
    canRetry: false,
    isCardIssue: false,
    isBankIssue: false
  }
}

/**
 * Maps İyzico error code to user-friendly error info
 */
export function mapIyzicoError(errorCode: string, errorMessage?: string): ErrorInfo {
  // Remove any prefixes and normalize error code
  const normalizedCode = errorCode?.toString().replace(/[^\d]/g, '')
  
  // Look for specific İyzico error code
  if (normalizedCode && iyzicoErrorCodes[normalizedCode]) {
    return iyzicoErrorCodes[normalizedCode]
  }
  
  // Look for generic error type
  const upperErrorCode = errorCode?.toUpperCase()
  if (upperErrorCode && genericErrorTypes[upperErrorCode]) {
    return genericErrorTypes[upperErrorCode]
  }
  
  // Special cases based on error message
  if (errorMessage) {
    const lowerMessage = errorMessage.toLowerCase()
    
    if (lowerMessage.includes('cvc') || lowerMessage.includes('cvv') || lowerMessage.includes('güvenlik kodu')) {
      return iyzicoErrorCodes['111']
    }
    
    if (lowerMessage.includes('bakiye') || lowerMessage.includes('insufficient')) {
      return iyzicoErrorCodes['51']
    }
    
    if (lowerMessage.includes('limit') || lowerMessage.includes('exceeded')) {
      return iyzicoErrorCodes['57']
    }
    
    if (lowerMessage.includes('expired') || lowerMessage.includes('süre') || lowerMessage.includes('tarih')) {
      return iyzicoErrorCodes['54']
    }
    
    if (lowerMessage.includes('card number') || lowerMessage.includes('kart numarası')) {
      return iyzicoErrorCodes['14']
    }
    
    if (lowerMessage.includes('3d') || lowerMessage.includes('secure')) {
      return iyzicoErrorCodes['92']
    }
  }
  
  // Default fallback
  return {
    title: 'Ödeme Başarısız',
    description: errorMessage || 'Ödeme işlemi başarısız oldu.',
    suggestion: 'Kart bilgilerinizi kontrol edin ve tekrar deneyin veya farklı bir kart kullanın.',
    icon: 'CreditCard',
    canRetry: true,
    isCardIssue: false,
    isBankIssue: false
  }
}

/**
 * Gets appropriate icon component name for error
 */
export function getErrorIcon(iconName: string): string {
  const iconMap: { [key: string]: string } = {
    'CreditCard': 'CreditCard',
    'Shield': 'Shield',
    'Calendar': 'Calendar',
    'Wallet': 'Wallet',
    'TrendingUp': 'TrendingUp',
    'Clock': 'Clock',
    'DollarSign': 'DollarSign',
    'ShieldX': 'ShieldX',
    'AlertTriangle': 'AlertTriangle',
    'X': 'X',
    'ShieldAlert': 'ShieldAlert',
    'Smartphone': 'Smartphone',
    'Server': 'Server',
    'Loader': 'Loader',
    'Settings': 'Settings',
    'Globe': 'Globe',
    'Wifi': 'Wifi',
    'Search': 'Search'
  }
  
  return iconMap[iconName] || 'AlertTriangle'
} 