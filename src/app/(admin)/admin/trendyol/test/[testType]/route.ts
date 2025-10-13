import { getTrendyolClient } from '@ardahanticaret/trendyol-integration';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { testType: string } }
) {
  try {
    // params'ı await et
    const { testType } = await params;
    
    // GEÇICI: Gerçek değerleri buraya yazın (TEST için)
    const credentials = {
      apiKey: 'yw4UtOoEwgOCRhzl9G8L',  // .env.local'dan gelen değer
      apiSecret: 'XUWxIj7TGafpPcue67Og', // .env.local'dan gelen değer
      supplierId: '153031',
    };

    // Settings'den mock mode ve test mode'u oku
    let mockMode = false;
    let testMode = false;
    
    try {
      const settingsResponse = await fetch(`${new URL(request.url).origin}/api/trendyol/settings`);
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        mockMode = settings.mock_mode || false;
        testMode = settings.test_mode || false;
      }
    } catch (error) {
      console.log('⚠️ Settings okunamadı, default değerler kullanılıyor');
    }

    // Debug: Environment variables'ları logla
    console.log('🔍 Environment Variables Debug:', {
      TRENDYOL_API_KEY: process.env.TRENDYOL_API_KEY ? `${process.env.TRENDYOL_API_KEY.substring(0, 8)}***` : 'NOT_SET',
      TRENDYOL_SECRET_KEY: process.env.TRENDYOL_SECRET_KEY ? `${process.env.TRENDYOL_SECRET_KEY.substring(0, 8)}***` : 'NOT_SET',
      TRENDYOL_SUPPLIER_ID: process.env.TRENDYOL_SUPPLIER_ID || 'NOT_SET',
      TRENDYOL_PROXY_URL: process.env.TRENDYOL_PROXY_URL || 'NOT_SET',
      TRENDYOL_TEST_MODE: 'FORCED_FALSE_PRODUCTION_MODE',
      MOCK_MODE: mockMode,
      TEST_MODE: testMode
    });

    const trendyolClient = getTrendyolClient(credentials, mockMode, testMode);

    switch (testType) {
      case 'connection':
        console.log('🧪 API Test: Bağlantı testi başlatılıyor (Auth bypass mode)...');
        const isConnected = await trendyolClient.testConnection();
        return new NextResponse(
          JSON.stringify({
            success: isConnected,
            message: isConnected
              ? 'Trendyol API bağlantısı başarılı!'
              : 'Trendyol API bağlantısı başarısız. Detaylar için logları kontrol edin.',
            details: {
              baseURL: trendyolClient.getBaseURL(),
              testMode: testMode,
              proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
              authMode: 'bypass (development test)',
              credentials: {
                supplierId: credentials.supplierId,
                hasApiKey: !!credentials.apiKey && credentials.apiKey !== 'test_api_key',
                hasApiSecret: !!credentials.apiSecret && credentials.apiSecret !== 'test_secret_key'
              }
            }
          }),
          {
            status: isConnected ? 200 : 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );

             case 'products':
         console.log('📦 API Test: Ürün listesi alınıyor...');
         try {
           const products = await trendyolClient.getProducts(0, 5); // İlk 5 ürün
           return new NextResponse(
             JSON.stringify({
               success: true,
               message: `Ürün listesi başarıyla alındı! (${products.totalElements || 0} toplam ürün)`,
               details: {
                 baseURL: trendyolClient.getBaseURL(),
                 testMode: testMode,
                 proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                 authMode: 'bypass (development test)',
                 totalElements: products.totalElements || 0,
                 totalPages: products.totalPages || 0,
                 currentPage: products.page || 0,
                 itemCount: products.items?.length || 0,
                 sampleProducts: products.items?.slice(0, 5).map(item => ({
                   id: item.id,
                   barcode: item.barcode,
                   title: item.title,
                   approved: item.approved,
                   archived: item.archived,
                   onSale: item.onSale,
                   rejected: item.rejected,
                   brand: item.brand,
                   categoryName: item.categoryName,
                   description: item.description,
                   stockQuantity: item.quantity || item.stockQuantity,
                   listPrice: item.listPrice,
                   salePrice: item.salePrice,
                   vatRate: item.vatRate,
                   dimensionalWeight: item.dimensionalWeight,
                   stockCode: item.stockCode,
                   productMainId: item.productMainId,
                   platformListingId: item.platformListingId,
                   stockId: item.stockId,
                   hasActiveCampaign: item.hasActiveCampaign,
                   locked: item.locked,
                   productContentId: item.productContentId,
                   pimCategoryId: item.pimCategoryId,
                   brandId: item.brandId,
                   version: item.version,
                   color: item.color,
                   size: item.size,
                   lockedByUnSuppliedReason: item.lockedByUnSuppliedReason,
                   onsale: item.onsale,
                   productUrl: item.productUrl,
                   gender: item.gender,
                   createDateTime: item.createDateTime,
                   lastUpdateDate: item.lastUpdateDate,
                   batchRequestId: item.batchRequestId,
                   stockUnitType: item.stockUnitType,
                   deliveryOption: item.deliveryOption,
                   images: item.images,
                   attributes: item.attributes
                 })) || []
               }
             }),
             {
               status: 200,
               headers: { 'Content-Type': 'application/json' },
             }
           );
        } catch (error: any) {
          console.error('Ürün listesi alma hatası:', error);
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: `Ürün listesi alınamadı: ${error.message}`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                error: error.message
              }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'approved-products':
        console.log('✅ API Test: Onaylı ürün listesi alınıyor...');
        try {
          const products = await trendyolClient.getProducts(0, 10, { approved: true }); // Onaylı ürünler
          return new NextResponse(
            JSON.stringify({
              success: true,
              message: `Onaylı ürün listesi başarıyla alındı! (${products.totalElements || 0} onaylı ürün)`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                filter: 'approved=true',
                totalElements: products.totalElements || 0,
                totalPages: products.totalPages || 0,
                currentPage: products.page || 0,
                itemCount: products.items?.length || 0,
                sampleProducts: products.items?.slice(0, 5).map(item => ({
                  id: item.id,
                  barcode: item.barcode,
                  title: item.title,
                  approved: item.approved,
                  stockQuantity: item.stockQuantity,
                  listPrice: item.listPrice,
                  salePrice: item.salePrice,
                  brand: item.brand,
                  categoryName: item.categoryName
                })) || []
              }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error: any) {
          console.error('Onaylı ürün listesi alma hatası:', error);
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: `Onaylı ürün listesi alınamadı: ${error.message}`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                filter: 'approved=true',
                error: error.message
              }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'brands':
        console.log('🏷️ API Test: Marka listesi alınıyor...');
        try {
          const brands = await trendyolClient.getBrands();
          return new NextResponse(
            JSON.stringify({
              success: true,
              message: `Marka listesi başarıyla alındı! (${brands.content?.length || 0} marka)`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                totalBrands: brands.content?.length || 0,
                sampleBrands: brands.content?.slice(0, 10).map(brand => ({
                  id: brand.id,
                  name: brand.name
                })) || []
              }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error: any) {
          console.error('Marka listesi alma hatası:', error);
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: `Marka listesi alınamadı: ${error.message}`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                error: error.message
              }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'categories':
        console.log('📂 API Test: Kategori listesi alınıyor...');
        try {
          const categories = await trendyolClient.getCategories();
          return new NextResponse(
            JSON.stringify({
              success: true,
              message: `Kategori listesi başarıyla alındı! (${categories.length || 0} kategori)`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                totalCategories: categories.length || 0,
                sampleCategories: categories.slice(0, 10).map(cat => ({
                  id: cat.id,
                  name: cat.name,
                  parentId: cat.parentId
                })) || []
              }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error: any) {
          console.error('Kategori listesi alma hatası:', error);
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: `Kategori listesi alınamadı: ${error.message}`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                error: error.message
              }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'approved-products':
        console.log('✅ API Test: Onaylanmış ürünler alınıyor...');
        try {
          const products = await trendyolClient.getProducts(0, 5, { approved: true });
          return new NextResponse(
            JSON.stringify({
              success: true,
              message: `Onaylanmış ürünler başarıyla alındı! (${products.totalElements || 0} onaylanmış ürün)`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                filter: 'approved=true',
                totalElements: products.totalElements || 0,
                totalPages: products.totalPages || 0,
                currentPage: products.page || 0,
                itemCount: products.items?.length || 0,
                sampleProducts: products.items?.slice(0, 3).map(item => ({
                  id: item.id,
                  barcode: item.barcode,
                  title: item.title,
                  approved: item.approved,
                  archived: item.archived,
                  brand: item.brand,
                  categoryName: item.categoryName,
                  listPrice: item.listPrice,
                  salePrice: item.salePrice,
                  quantity: item.quantity
                })) || []
              }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error: any) {
          console.error('Onaylanmış ürünler alma hatası:', error);
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: `Onaylanmış ürünler alınamadı: ${error.message}`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                filter: 'approved=true',
                error: error.message
              }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'archived-products':
        console.log('📦 API Test: Arşivlenmiş ürünler alınıyor...');
        try {
          const products = await trendyolClient.getProducts(0, 5, { archived: true });
          return new NextResponse(
            JSON.stringify({
              success: true,
              message: `Arşivlenmiş ürünler başarıyla alındı! (${products.totalElements || 0} arşivlenmiş ürün)`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                filter: 'archived=true',
                totalElements: products.totalElements || 0,
                totalPages: products.totalPages || 0,
                currentPage: products.page || 0,
                itemCount: products.items?.length || 0,
                sampleProducts: products.items?.slice(0, 3).map(item => ({
                  id: item.id,
                  barcode: item.barcode,
                  title: item.title,
                  approved: item.approved,
                  archived: item.archived,
                  brand: item.brand,
                  categoryName: item.categoryName,
                  listPrice: item.listPrice,
                  salePrice: item.salePrice,
                  quantity: item.quantity
                })) || []
              }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error: any) {
          console.error('Arşivlenmiş ürünler alma hatası:', error);
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: `Arşivlenmiş ürünler alınamadı: ${error.message}`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                filter: 'archived=true',
                error: error.message
              }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'on-sale-products':
        console.log('🛍️ API Test: Satıştaki ürünler alınıyor...');
        try {
          const products = await trendyolClient.getProducts(0, 5, { onSale: true });
          return new NextResponse(
            JSON.stringify({
              success: true,
              message: `Satıştaki ürünler başarıyla alındı! (${products.totalElements || 0} satıştaki ürün)`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                filter: 'onSale=true',
                totalElements: products.totalElements || 0,
                totalPages: products.totalPages || 0,
                currentPage: products.page || 0,
                itemCount: products.items?.length || 0,
                sampleProducts: products.items?.slice(0, 3).map(item => ({
                  id: item.id,
                  barcode: item.barcode,
                  title: item.title,
                  approved: item.approved,
                  onSale: item.onSale,
                  brand: item.brand,
                  categoryName: item.categoryName,
                  listPrice: item.listPrice,
                  salePrice: item.salePrice,
                  quantity: item.quantity
                })) || []
              }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error: any) {
          console.error('Satıştaki ürünler alma hatası:', error);
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: `Satıştaki ürünler alınamadı: ${error.message}`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                filter: 'onSale=true',
                error: error.message
              }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      case 'rejected-products':
        console.log('❌ API Test: Reddedilen ürünler alınıyor...');
        try {
          const products = await trendyolClient.getProducts(0, 5, { rejected: true });
          return new NextResponse(
            JSON.stringify({
              success: true,
              message: `Reddedilen ürünler başarıyla alındı! (${products.totalElements || 0} reddedilen ürün)`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                filter: 'rejected=true',
                totalElements: products.totalElements || 0,
                totalPages: products.totalPages || 0,
                currentPage: products.page || 0,
                itemCount: products.items?.length || 0,
                sampleProducts: products.items?.slice(0, 3).map(item => ({
                  id: item.id,
                  barcode: item.barcode,
                  title: item.title,
                  approved: item.approved,
                  rejected: item.rejected,
                  brand: item.brand,
                  categoryName: item.categoryName,
                  listPrice: item.listPrice,
                  salePrice: item.salePrice,
                  quantity: item.quantity
                })) || []
              }
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } catch (error: any) {
          console.error('Reddedilen ürünler alma hatası:', error);
          return new NextResponse(
            JSON.stringify({
              success: false,
              message: `Reddedilen ürünler alınamadı: ${error.message}`,
              details: {
                baseURL: trendyolClient.getBaseURL(),
                testMode: testMode,
                proxyEnabled: !!process.env.TRENDYOL_PROXY_URL,
                authMode: 'bypass (development test)',
                filter: 'rejected=true',
                error: error.message
              }
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

      default:
        return new NextResponse(
          JSON.stringify({ error: 'Geçersiz test tipi.' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (error: any) {
    console.error('API Test Hatası:', {
      message: error.message,
      stack: error.stack,
    });
    return new NextResponse(JSON.stringify({ 
      error: error.message,
      details: {
        authMode: 'bypass (development test)',
        proxyEnabled: !!process.env.TRENDYOL_PROXY_URL
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 