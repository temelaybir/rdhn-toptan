// Kargo firmaları
export enum CargoCompany {
  ARAS = 'aras',
  YURTICI = 'yurtici',
  MNG = 'mng',
  UPS = 'ups',
  PTT = 'ptt'
}

// Kargo durumları - Aras Kargo API'sine uygun
export enum CargoStatus {
  CREATED = 'created', // Kargo oluşturuldu
  PICKED_UP = 'picked_up', // Kargoya verildi
  IN_TRANSIT = 'in_transit', // Transfer halinde
  IN_DISTRIBUTION = 'in_distribution', // Dağıtımda
  DELIVERED = 'delivered', // Teslim edildi
  NOT_DELIVERED = 'not_delivered', // Teslim edilemedi
  RETURNED = 'returned' // İade edildi
}

// Kargo hareketi
export interface CargoMovement {
  id: string
  date: string
  time: string
  location: string
  description: string
  status: CargoStatus
}

// Kargo bilgileri
export interface CargoInfo {
  trackingNumber: string
  company: CargoCompany
  recipientName: string
  recipientPhone: string
  senderName: string
  currentStatus: CargoStatus
  estimatedDeliveryDate?: string
  deliveryDate?: string
  movements: CargoMovement[]
}

// Aras Kargo SetDispatch Request (SOAP)
export interface ArasSetDispatchRequest {
  UserName: string
  Password: string
  CargoKey: string // Sevk İrsaliye No (16 karakter)
  InvoiceKey?: string // Fatura No (20 karakter)
  ReceiverCustName: string // Alıcı Adı (100 karakter)
  ReceiverAddress: string // Alıcı Adresi (250 karakter)
  ReceiverPhone1: string // Telefon-1 (32 karakter)
  ReceiverPhone2?: string // Telefon-2 (15 karakter)
  ReceiverPhone3?: string // Telefon-3 (15 karakter)
  CityName: string // İl – Şehir Adı (32 karakter)
  TownName: string // İlçe Adı (32 karakter)
  CustProdId?: string // Ürün Kodu (32 karakter)
  Desi?: number // Ürün Desi (6,2)
  Kg?: number // Ürün Kg (6,2)
  CargoCount?: number // Sevkedilen Kargo Sayısı (2 digit)
  WaybillNo?: string // İrsaliye No (50 karakter)
  SpecialField1?: string // Özel Alan - 1 (500 karakter)
  SpecialField2?: string // Özel Alan – 2 (500 karakter)
  SpecialField3?: string // Özel Alan – 3 (500 karakter)
  TtInvoiceAmount?: number // Tahsilatlı teslimat ürünü tutar bilgisi (18,4)
  TtCollectionType?: string // Tahsilatlı teslimat ürünü ödeme tipi (0 – Nakit, 1 - Kredi Kartı)
  TtDocumentSaveType?: string // Tahsilatlı teslimat ürünü hizmet bedeli gönderi içerisinde mi? (0 – Ayrı fatura 1 – farklı fatura)
  OrgReceiverCustId: string // Müşteri Özel kodu(Sipariş kodu) (32 karakter)
  Description?: string // Açıklama (255 karakter)
  TaxNumber?: string // Vergi No (15 karakter)
  TtDocumentId?: number // Tahsilatlı Teslimat Fatura No (12 digit)
  TaxOfficeId?: number // Vergi Dairesi Kodu (8 digit)
  OrgGeoCode?: string // Müşteri Adres Kodu (20 karakter)
  PrivilegeOrder?: string // Varış merkezi belirleme öncelik sırası (10 karakter)
}

// Aras Kargo SetDispatch Response
export interface ArasSetDispatchResponse {
  ErrorCode: string // "0" = Başarılı
  Message: string
  TrackingNumber?: string
}

// Aras Kargo GetDispatch Response
export interface ArasGetDispatchResponse {
  ShippingOrders: ArasSetDispatchRequest[]
}

// Aras Kargo API Response Types (eski versiyon - kargo takip için)
export interface ArasCargoTrackingResponse {
  RESULT: string
  TAKIPNO: string
  DURUM: string
  CIKIS_SUBE: string
  VARIS_SUBE: string
  GONDEREN: string
  ALICI: string
  TAHMINI_TESLIM: string
  HAREKETLER: Array<{
    TARIH: string
    SAAT: string
    SUBE: string
    ISLEM: string
  }>
}

// Kargo API Service Interface
export interface CargoTrackingService {
  getTrackingInfo(trackingNumber: string): Promise<CargoInfo>
  createShipment(orderData: CreateShipmentData): Promise<string>
  cancelShipment(trackingNumber: string): Promise<boolean>
}

// Kargo oluşturma verisi
export interface CreateShipmentData {
  orderNumber: string
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  recipientCity: string
  recipientDistrict: string
  recipientPostalCode: string
  senderName: string
  senderPhone: string
  senderAddress: string
  weight: number // kg
  desi: number // desi
  paymentType: 'sender' | 'recipient'
  productPrice: number
  description: string
}

// Aras Kargo Hata Kodları
export const ARAS_ERROR_CODES: Record<string, string> = {
  '0': 'Başarılı',
  '936': 'Eksik ifade.',
  '60020': 'CARGO_KEY gönderisi sistemde mevcuttur.'
}

// Kargo durumu dönüşüm map'i (Aras Kargo'dan gelen durumlar için)
export const ARAS_STATUS_MAP: Record<string, CargoStatus> = {
  'KARGO OLUŞTURULDU': CargoStatus.CREATED,
  'KARGOYA VERİLDİ': CargoStatus.PICKED_UP,
  'TRANSFER': CargoStatus.IN_TRANSIT,
  'DAĞITIMA ÇIKTI': CargoStatus.IN_DISTRIBUTION,
  'TESLİM EDİLDİ': CargoStatus.DELIVERED,
  'TESLİM EDİLEMEDİ': CargoStatus.NOT_DELIVERED,
  'İADE': CargoStatus.RETURNED
}

// NOTE: ArasTrackingUrls has been moved to aras-cargo-tracking-urls.ts for client-safe usage 