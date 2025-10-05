// Mock data for Trendyol integration
export const mockSyncLogs = [
  {
    id: 1,
    operation_type: "CREATE_PRODUCT",
    product_id: 1,
    status: "SUCCESS",
    message: "Ürün başarıyla Trendyol'a eklendi: Klasik Çakmak",
    response_data: { trendyolProductId: "TY-001" },
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 dk önce
    execution_time_ms: 1200,
    product_name: "Klasik Çakmak",
    product_sku: "CAK-001"
  },
  {
    id: 2,
    operation_type: "UPDATE_STOCK",
    product_id: 2,
    status: "SUCCESS",
    message: "Stok miktarı başarıyla güncellendi",
    response_data: { newStock: 25 },
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 dk önce
    execution_time_ms: 800,
    product_name: "Zippo Benzini",
    product_sku: "ZCB-158"
  },
  {
    id: 3,
    operation_type: "UPLOAD_IMAGE",
    product_id: 1,
    status: "ERROR",
    message: "Görsel yükleme başarısız: Geçersiz dosya formatı",
    response_data: null,
    error_details: "Only JPG, PNG formats are allowed",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 dk önce
    execution_time_ms: 450,
    product_name: "Klasik Çakmak",
    product_sku: "CAK-001"
  }
]

// Mock products data
export const mockProducts = [
  {
    id: 1,
    name: "Klasik Çakmak",
    sku: "CAK-001",
    price: 29.99,
    stock: 50,
    category: "Çakmaklar",
    trendyol_product_id: "TY-001",
    sync_status: "SYNCED",
    last_sync_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    name: "Zippo Benzini",
    sku: "ZCB-158",
    price: 15.99,
    stock: 25,
    category: "Çakmak Aksesuarları",
    trendyol_product_id: "TY-002",
    sync_status: "SYNCED",
    last_sync_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    name: "Çiçek Desenli Yelpaze",
    sku: "YLP-4606",
    price: 39.99,
    stock: 15,
    category: "Yelpazeler",
    trendyol_product_id: null,
    sync_status: "PENDING",
    last_sync_at: null
  }
]

// Mock categories data
export const mockCategories = [
  {
    id: 1,
    name: "Çakmaklar",
    trendyol_category_id: 12345,
    mapping_status: "MAPPED",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    name: "Çakmak Aksesuarları",
    trendyol_category_id: 12346,
    mapping_status: "MAPPED",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    name: "Yelpazeler",
    trendyol_category_id: null,
    mapping_status: "PENDING",
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
]

// Mock settings data
export const mockSettings = {
  api_key: "mock-api-key-123",
  supplier_id: "mock-supplier-456",
  mock_mode: true,
  auto_sync_enabled: false,
  sync_interval_hours: 24,
  auto_price_update: true,
  auto_stock_update: true,
  test_mode: true
} 