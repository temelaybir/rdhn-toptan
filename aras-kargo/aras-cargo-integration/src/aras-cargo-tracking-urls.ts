// Client-safe utility for generating Aras Kargo tracking URLs
// This file can be safely imported in client components

export interface ArasTrackingUrls {
  byTrackingNumber: string
  byBarcode: string | null
  byOrderNumber: string | null
}

/**
 * Generate tracking URLs for Aras Kargo
 * This is a client-safe function that doesn't require any Node.js modules
 */
export function getArasTrackingUrls(trackingNumber: string, orderNumber?: string): ArasTrackingUrls {
  const accountId = '1B968CADEC80CA41A9A7855D627AD2C9' // From integration page
  
  const urls = {
    byTrackingNumber: `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${trackingNumber}`,
    byBarcode: trackingNumber.length === 20 
      ? `https://kargotakip.araskargo.com.tr/yurticigonbil.aspx?Cargo_Code=${trackingNumber}`
      : null,
    byOrderNumber: orderNumber 
      ? `https://kargotakip.araskargo.com.tr/mainpage.aspx?accountid=${accountId}&alici_kod=${orderNumber}`
      : null
  }

  return urls
}