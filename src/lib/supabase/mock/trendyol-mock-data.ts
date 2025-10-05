// Mock data for Trendyol API - Development mode için
export const mockTrendyolCategories = [
  {
    id: 411,
    name: "Kadın",
    parentId: null,
    subCategories: [
      {
        id: 1010,
        name: "Giyim",
        parentId: 411,
        subCategories: [
          { id: 1011, name: "Elbise", parentId: 1010 },
          { id: 1012, name: "Bluz", parentId: 1010 },
          { id: 1013, name: "Pantolon", parentId: 1010 },
          { id: 1014, name: "T-shirt", parentId: 1010 }
        ]
      },
      {
        id: 1020,
        name: "Ayakkabı",
        parentId: 411,
        subCategories: [
          { id: 1021, name: "Topuklu Ayakkabı", parentId: 1020 },
          { id: 1022, name: "Spor Ayakkabı", parentId: 1020 },
          { id: 1023, name: "Bot", parentId: 1020 }
        ]
      }
    ]
  },
  {
    id: 412,
    name: "Erkek",
    parentId: null,
    subCategories: [
      {
        id: 1030,
        name: "Giyim",
        parentId: 412,
        subCategories: [
          { id: 1031, name: "T-shirt", parentId: 1030 },
          { id: 1032, name: "Gömlek", parentId: 1030 },
          { id: 1033, name: "Pantolon", parentId: 1030 }
        ]
      }
    ]
  },
  {
    id: 413,
    name: "Elektronik",
    parentId: null,
    subCategories: [
      {
        id: 1040,
        name: "Telefon",
        parentId: 413,
        subCategories: [
          { id: 1041, name: "Akıllı Telefon", parentId: 1040 },
          { id: 1042, name: "Telefon Aksesuarları", parentId: 1040 }
        ]
      }
    ]
  }
]

export const mockTrendyolAttributes = {
  1011: [ // Elbise
    { id: 1, name: "Renk", required: true, variableTypeId: 1 },
    { id: 2, name: "Beden", required: true, variableTypeId: 1 },
    { id: 3, name: "Materyal", required: false, variableTypeId: 1 },
    { id: 4, name: "Desen", required: false, variableTypeId: 1 }
  ],
  1012: [ // Bluz
    { id: 1, name: "Renk", required: true, variableTypeId: 1 },
    { id: 2, name: "Beden", required: true, variableTypeId: 1 },
    { id: 5, name: "Yaka Tipi", required: false, variableTypeId: 1 }
  ],
  1031: [ // Erkek T-shirt
    { id: 1, name: "Renk", required: true, variableTypeId: 1 },
    { id: 2, name: "Beden", required: true, variableTypeId: 1 },
    { id: 6, name: "Kol Tipi", required: false, variableTypeId: 1 }
  ]
}

export const mockTrendyolProducts = [
  {
    id: "TY-001",
    barcode: "8690123456789",
    title: "Kadın Elbise - Çiçek Desenli",
    description: "Yaz sezonu için ideal çiçek desenli elbise",
    brandId: 1001,
    categoryId: 1011,
    quantity: 50,
    stockCode: "ELB-001",
    dimensionalWeight: 0.5,
    listPrice: 299.99,
    salePrice: 249.99,
    vatRate: 18,
    cargoCompanyId: 1,
    images: [
      { url: "https://via.placeholder.com/800x800/FF6B6B/FFFFFF?text=Elbise1" },
      { url: "https://via.placeholder.com/800x800/4ECDC4/FFFFFF?text=Elbise2" }
    ],
    status: "APPROVED",
    attributes: [
      { attributeId: 1, attributeValueId: 101, customAttributeValue: "Kırmızı" },
      { attributeId: 2, attributeValueId: 201, customAttributeValue: "M" }
    ]
  },
  {
    id: "TY-002", 
    barcode: "8690123456790",
    title: "Erkek T-shirt - Basic",
    description: "Günlük kullanım için rahat t-shirt",
    brandId: 1002,
    categoryId: 1031,
    quantity: 100,
    stockCode: "TSH-001",
    dimensionalWeight: 0.3,
    listPrice: 89.99,
    salePrice: 69.99,
    vatRate: 18,
    cargoCompanyId: 1,
    images: [
      { url: "https://via.placeholder.com/800x800/45B7D1/FFFFFF?text=T-shirt1" }
    ],
    status: "PENDING",
    attributes: [
      { attributeId: 1, attributeValueId: 102, customAttributeValue: "Mavi" },
      { attributeId: 2, attributeValueId: 203, customAttributeValue: "L" }
    ]
  }
]

export const mockSyncLogs = [
  {
    id: 1,
    operation_type: "CREATE_PRODUCT",
    product_id: 1,
    status: "SUCCESS",
    message: "Ürün başarıyla Trendyol'a gönderildi",
    response_data: { trendyolProductId: "TY-001" },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 saat önce
    execution_time_ms: 1250
  },
  {
    id: 2,
    operation_type: "UPDATE_STOCK",
    product_id: 2,
    status: "FAILED",
    message: "Stok güncelleme başarısız: Geçersiz ürün ID",
    response_data: null,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 saat önce
    execution_time_ms: 800
  },
  {
    id: 3,
    operation_type: "SYNC_CATEGORIES",
    product_id: null,
    status: "SUCCESS", 
    message: "147 kategori başarıyla senkronize edildi",
    response_data: { categoriesCount: 147 },
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 dk önce
    execution_time_ms: 3400
  }
]

export const mockQueueItems = [
  {
    id: 1,
    operation_type: "CREATE_PRODUCT",
    product_ids: [1, 2, 3],
    status: "PENDING",
    created_at: new Date().toISOString(),
    retry_count: 0
  },
  {
    id: 2,
    operation_type: "UPDATE_STOCK",
    product_ids: [4, 5],
    status: "PROCESSING",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    retry_count: 1
  }
]

// Mock API Response format helpers
// Mock local products for Product Management UI
export const mockLocalProducts = [
  {
    id: '1',
    name: 'Klasik Çakmak - Metal Gövde',
    sku: 'CAK-001',
    price: 45.99,
    stock: 150,
    description: 'Dayanıklı metal gövdeli klasik çakmak',
    image: 'https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=Çakmak',
    category: 'Çakmak',
    trendyol_status: 'approved' as const,
    trendyol_product_id: 'TY-001',
    last_sync: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 gün önce
    sync_error: null
  },
  {
    id: '2', 
    name: 'Zippo Benzini 3\'lü Set',
    sku: 'ZCB-158',
    price: 89.99,
    stock: 75,
    description: 'Orijinal Zippo çakmak benzini 3 adet',
    image: 'https://via.placeholder.com/200x200/4ECDC4/FFFFFF?text=Benzin',
    category: 'Çakmak Aksesuarları',
    trendyol_status: 'pending' as const,
    trendyol_product_id: 'TY-002',
    last_sync: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 gün önce
    sync_error: null
  },
  {
    id: '3',
    name: 'Çiçek Desenli Plastik Yelpaze',
    sku: 'YLP-4606',
    price: 25.50,
    stock: 0,
    description: 'Dantelli çiçek desenli plastik yelpaze',
    image: 'https://via.placeholder.com/200x200/45B7D1/FFFFFF?text=Yelpaze',
    category: 'Yelpaze',
    trendyol_status: 'rejected' as const,
    trendyol_product_id: null,
    last_sync: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 gün önce  
    sync_error: 'Ürün resmi kalite standartlarını karşılamıyor'
  },
  {
    id: '4',
    name: 'Lüks Metal Pipo Set',
    sku: 'PPO-030',
    price: 299.99,
    stock: 25,
    description: 'Kişiye özel gravür yapılabilen lüks metal pipo',
    image: 'https://via.placeholder.com/200x200/96CEB4/FFFFFF?text=Pipo',
    category: 'Pipo',
    trendyol_status: 'not_synced' as const,
    trendyol_product_id: null,
    last_sync: null,
    sync_error: null
  },
  {
    id: '5',
    name: 'Çakmak İkmal Seti 4\'lü',
    sku: 'SET-702',
    price: 65.99,
    stock: 100,
    description: 'Çakmak benzini ve taş ikmal seti',
    image: 'https://via.placeholder.com/200x200/FECA57/FFFFFF?text=Set',
    category: 'Çakmak Aksesuarları',
    trendyol_status: 'error' as const,
    trendyol_product_id: 'TY-005',
    last_sync: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 saat önce
    sync_error: 'API bağlantı hatası: Timeout'
  },
  {
    id: '6',
    name: 'Koko Manyetolu Çakmak 5\'li',
    sku: 'KKO-518',
    price: 89.50,
    stock: 200,
    description: 'Şeffaf gövdeli manyetolu çakmak 5 adet paket',
    image: 'https://via.placeholder.com/200x200/FF9FF3/FFFFFF?text=Koko',
    category: 'Çakmak',
    trendyol_status: 'approved' as const,
    trendyol_product_id: 'TY-006',
    last_sync: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 saat önce
    sync_error: null
  }
]

export const mockApiResponses = {
  products: {
    content: mockTrendyolProducts,
    page: 0,
    size: 50,
    totalElements: mockTrendyolProducts.length,
    totalPages: 1
  },
  localProducts: {
    products: mockLocalProducts,
    pagination: {
      page: 0,
      limit: 50,
      total: mockLocalProducts.length,
      totalPages: 1
    }
  },
  categories: mockTrendyolCategories,
  attributes: (categoryId: number) => mockTrendyolAttributes[categoryId] || [],
  createProduct: (productData: any) => ({
    batchRequestId: `MOCK-${Date.now()}`,
    itemCount: 1,
    status: "SUCCESS"
  }),
  updateStock: () => ({
    batchRequestId: `MOCK-STOCK-${Date.now()}`, 
    status: "SUCCESS"
  })
} 