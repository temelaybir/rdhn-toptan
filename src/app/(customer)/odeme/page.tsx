'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Banknote,
  ShieldCheck,
  Loader2,
  LogIn
} from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/context/cart-context'
import { Customer } from '@/services/customer-auth-service'
import type { CheckoutStep, Address, PaymentMethod, CardDetails, CheckoutFormData, BankTransferSettings } from '@/types/checkout'

// Payment methods - dinamik olarak API'den yüklenecek
const defaultPaymentMethods: PaymentMethod[] = [
  { id: '1', type: 'credit_card', label: 'Kredi Kartı', icon: 'CreditCard' },
  { id: '2', type: 'debit_card', label: 'Banka Kartı', icon: 'CreditCard' },
  { id: '3', type: 'bank_transfer', label: 'Havale/EFT', icon: 'Banknote' }
]

// Turkish cities - Türkiye'nin 81 ili (Alfabetik sıra)
const cities = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin',
  'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur',
  'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir',
  'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
]

// Global function declaration for TypeScript
declare global {
  interface Window {
    close3DSModal?: () => void
    forceClose3DSModal?: () => void
    showModal3DSResult?: (type: 'success' | 'failure', data: any) => void
    redirectToOrderTracking?: (orderNumber: string) => void
    backToCart?: () => void
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getTotalPrice, getSubtotal, getShippingCost, clearCart } = useCart()
  const items = cart.items || []
  
  // 3DS popup timer reference
  const popupPollTimerRef = useRef<NodeJS.Timeout | null>(null)
  // 3DS modal payment polling timer
  const modalPollTimerRef = useRef<NodeJS.Timeout | null>(null)
  // iframe reference - React lifecycle dışında tut
  const iframeElementRef = useRef<HTMLIFrameElement | null>(null)
  // Modal container reference
  const modalContainerRef = useRef<HTMLDivElement | null>(null)
  
  const [currentStep, setCurrentStep] = useState(1)
  
  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])
  const [isProcessing, setIsProcessing] = useState(false)
  const [is3DSecureWaiting, setIs3DSecureWaiting] = useState(false)
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null)
  // Message deduplication
  const processedMessagesRef = useRef<Set<string>>(new Set())
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(defaultPaymentMethods)
  const [bankTransferSettings, setBankTransferSettings] = useState<BankTransferSettings | null>(null)
  const [isLoadingPaymentSettings, setIsLoadingPaymentSettings] = useState(true)
  const [paymentError, setPaymentError] = useState<{message: string, code: string} | null>(null)
  // Modal final state management
  const [modalFinalState, setModalFinalState] = useState<'processing' | 'success' | 'failure' | null>(null)
  const [modalFinalData, setModalFinalData] = useState<{
    orderNumber?: string
    errorMessage?: string
    errorCode?: string
  } | null>(null)
  // Order creation deduplication
  const orderCreationInProgressRef = useRef<Set<string>>(new Set())
  
  // Customer autocomplete states
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false)
  const [customerFound, setCustomerFound] = useState<Customer | null>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  
  // Form data
  const [formData, setFormData] = useState<CheckoutFormData>({
    customerType: 'individual', // Default: Bireysel
    identityNumber: '',
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    deliveryAddress: {
      fullName: '',
      phone: '',
      email: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      postalCode: ''
    },
    billingAddress: {
      fullName: '',
      phone: '',
      email: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      postalCode: ''
    },
    sameAsDelivery: true,
    paymentMethod: '', // Dinamik olarak yüklenecek
    cardDetails: {
      cardNumber: '',
      cardHolder: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      saveCard: false
    },
    acceptTerms: false,
    notes: ''
  })

  // Steps
  const steps: CheckoutStep[] = [
    { id: 1, label: 'Teslimat Adresi', completed: false, active: true },
    { id: 2, label: 'Ödeme Yöntemi', completed: false, active: false },
    { id: 3, label: 'Sipariş Onayı', completed: false, active: false }
  ]

  const [checkoutSteps, setCheckoutSteps] = useState(steps)

  // Customer authentication check
  useEffect(() => {
    const customerData = sessionStorage.getItem('customer')
    if (customerData) {
      try {
        const parsedCustomer = JSON.parse(customerData) as Customer
        setCurrentCustomer(parsedCustomer)
        
        // Auto-fill form with customer data
        if (parsedCustomer.email && !formData.deliveryAddress.email) {
          setFormData(prev => ({
            ...prev,
            deliveryAddress: {
              ...prev.deliveryAddress,
              email: parsedCustomer.email,
              fullName: `${parsedCustomer.first_name || ''} ${parsedCustomer.last_name || ''}`.trim() || '',
              phone: parsedCustomer.phone || ''
            }
          }))
        }
      } catch (error) {
        console.error('Invalid customer data:', error)
      }
    }
  }, [])

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && currentStep !== 3) {
      router.push('/sepet')
    }
  }, [items, router, currentStep])

  // Load payment methods and bank transfer settings
  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        const response = await fetch('/api/settings/bank-transfer')
        const result = await response.json()
        
        if (result.success) {
          const { paymentMethods: activeMethods, bankTransferSettings } = result.data
          
          // Aktif ödeme yöntemlerini kullan
          if (activeMethods && activeMethods.length > 0) {
            const mappedMethods = activeMethods.map((method: any, index: number) => ({
              id: (index + 1).toString(),
              type: method.method_type,
              label: method.display_name,
              icon: method.icon || 'CreditCard'
            }))
            setPaymentMethods(mappedMethods)
            
            // İlk aktif ödeme yöntemini default olarak seç (display_order'a göre sıralı)
            if (mappedMethods.length > 0) {
              setFormData(prev => ({
                ...prev,
                paymentMethod: 'credit_card' // Default değer olarak credit_card
              }))
            }
          }
          
          // Banka havalesi ayarlarını kaydet
          setBankTransferSettings(bankTransferSettings)
        }
      } catch (error) {
        console.error('Error loading payment settings:', error)
        toast.error('Ödeme ayarları yüklenirken hata oluştu')
      } finally {
        setIsLoadingPaymentSettings(false)
      }
    }

    loadPaymentSettings()
  }, [])

  // Price calculations
  const subtotal = getSubtotal() // Zaten KDV dahil
  const discount = 0 // İndirim sistemi henüz implement edilmedi
  const shipping = 0 // 🚚 Tüm ürünlerde ücretsiz kargo!
  const total = getTotalPrice() + shipping // Zaten KDV dahil + kargo
  


  // Customer autocomplete when email changes
  const checkCustomerByEmail = async (email: string) => {
    if (!email.includes('@') || email.length < 5) {
      setCustomerFound(null)
      setShowLoginPrompt(false)
      return
    }

    setIsCheckingCustomer(true)
    try {
      const response = await fetch('/api/customer/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.customer) {
          setCustomerFound(result.customer)
          setShowLoginPrompt(true)
          console.log('🔍 Customer found:', result.customer)
          console.log('🏠 Available addresses:', result.addresses)
          
          // Store addresses for later use
          setCustomerFound({
            ...result.customer,
            addresses: result.addresses
          })
        } else {
          setCustomerFound(null)
          setShowLoginPrompt(false)
        }
      }
    } catch (error) {
      console.error('Customer autocomplete error:', error)
    } finally {
      setIsCheckingCustomer(false)
    }
  }

  // Fill address from customer data
  const fillAddressFromCustomer = () => {
    if (!customerFound?.addresses) {
      toast.error('Adres bilgisi bulunamadı')
      return
    }

    const shippingAddress = customerFound.addresses.shipping || customerFound.addresses.billing
    
    if (!shippingAddress) {
      toast.error('Kayıtlı adres bulunamadı')
      return
    }

    console.log('🏠 Filling address:', shippingAddress)

    setFormData(prev => ({
      ...prev,
      deliveryAddress: {
        ...prev.deliveryAddress,
        fullName: shippingAddress.contactName || `${customerFound.first_name || ''} ${customerFound.last_name || ''}`.trim(),
        phone: shippingAddress.phone || customerFound.phone || prev.deliveryAddress.phone,
        addressLine1: shippingAddress.address || prev.deliveryAddress.addressLine1,
        city: shippingAddress.city || prev.deliveryAddress.city,
        district: shippingAddress.district || prev.deliveryAddress.district,
        postalCode: shippingAddress.postalCode || prev.deliveryAddress.postalCode
      }
    }))

    toast.success('Adres bilgileri dolduruldu!')
    setShowLoginPrompt(false)
  }

  // Update address fields
  const updateDeliveryAddress = (field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryAddress: { ...prev.deliveryAddress, [field]: value }
    }))

    // Customer autocomplete on email change
    if (field === 'email' && !currentCustomer) {
      checkCustomerByEmail(value)
    }
  }

  // Update card details
  const updateCardDetails = (field: keyof CardDetails, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      cardDetails: { ...prev.cardDetails!, [field]: value }
    }))
  }

  // Format card number
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const match = cleaned.match(/.{1,4}/g)
    return match ? match.join(' ') : cleaned
  }

  // Validate step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Müşteri tipi kontrolü
        if (formData.customerType === 'corporate') {
          if (!formData.companyName || !formData.taxNumber || !formData.taxOffice) {
            toast.error('Kurumsal müşteriler için şirket adı, vergi numarası ve vergi dairesi zorunludur')
            return false
          }
        }
        
        const { fullName, phone, email, addressLine1, city, district } = formData.deliveryAddress
        if (!fullName || !phone || !email || !addressLine1 || !city || !district) {
          toast.error('Lütfen tüm zorunlu alanları doldurun')
          return false
        }
        if (!email.includes('@')) {
          toast.error('Geçerli bir e-posta adresi girin')
          return false
        }
        return true
      
      case 2:
        // Ödeme yöntemlerinin yüklendiğini kontrol et
        if (isLoadingPaymentSettings) {
          toast.error('Ödeme yöntemleri yükleniyor, lütfen bekleyin')
          return false
        }
        
        // Aktif ödeme yöntemi var mı kontrol et
        if (paymentMethods.length === 0) {
          toast.error('Aktif ödeme yöntemi bulunamadı')
          return false
        }
        
        // Ödeme yöntemi seçildi mi kontrol et
        if (!formData.paymentMethod) {
          toast.error('Lütfen bir ödeme yöntemi seçin')
          return false
        }
        
        // Kart ödemesi seçildi ise kart bilgilerini kontrol et
        if (formData.paymentMethod === 'credit_card' || formData.paymentMethod === 'debit_card') {
          const { cardNumber, cardHolder, expiryMonth, expiryYear, cvv } = formData.cardDetails!
          if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
            toast.error('Lütfen tüm kart bilgilerini doldurun')
            return false
          }
          if (cardNumber.replace(/\s/g, '').length !== 16) {
            toast.error('Kart numarası 16 haneli olmalıdır')
            return false
          }
          if (cvv.length !== 3) {
            toast.error('CVV 3 haneli olmalıdır')
            return false
          }
        }
        return true
      
      case 3:
        if (!formData.acceptTerms) {
          toast.error('Lütfen satış sözleşmesini kabul edin')
          return false
        }
        return true
      
      default:
        return true
    }
  }

  // Navigate steps
  const goToStep = (step: number) => {
    // 2. adıma (ödeme yöntemi) geçerken ödeme yöntemlerinin yüklenmiş olduğunu kontrol et
    if (step === 2 && isLoadingPaymentSettings) {
      toast.error('Ödeme yöntemleri yükleniyor, lütfen bekleyin')
      return
    }
    
    if (step < currentStep || validateStep(currentStep)) {
      setCurrentStep(step)
      setCheckoutSteps(prev => prev.map(s => ({
        ...s,
        active: s.id === step,
        completed: s.id < step
      })))
    }
  }

  const nextStep = () => {
    if (currentStep < 3 && validateStep(currentStep)) {
      goToStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1)
    }
  }

  // Check payment status after 3DS completion
  const checkPaymentStatus = async (orderNumber: string, shouldCloseModal: boolean = true) => {
    try {
      console.log('[API] Checking payment status for order:', orderNumber)
      
      const response = await fetch(`/api/payment/status?orderNumber=${orderNumber}`)
      const result = await response.json()
      
      if (result.success) {
        const transaction = result.data
        
        if (transaction.status === 'SUCCESS') {
          console.log('[SUCCESS] Payment successful, redirecting to success page')
          
          // Modal ve timer'ları temizle
          if (shouldCloseModal) {
            cleanup3DSModal()
          }
          
          clearCart() // Başarılı ödeme sonrası sepeti temizle
          toast.success('Ödeme başarılı! Sipariş oluşturuldu.')
          router.push(`/siparis-basarili?orderNumber=${orderNumber}&paymentId=${transaction.iyzico_payment_id}`)
          return true // Success indicator
        } else if (transaction.status === 'FAILURE') {
          console.log('[ERROR] Payment failed, redirecting to error page')
          
          // Modal ve timer'ları temizle
          if (shouldCloseModal) {
            cleanup3DSModal()
          }
          
          toast.error('Ödeme başarısız oldu.')
          router.push(`/odeme/hata?orderNumber=${orderNumber}&error=${transaction.error_code}&message=${encodeURIComponent(transaction.error_message || 'Ödeme başarısız')}`)
          return true // Completed (even if failed)
        } else {
          console.log('[PENDING] Payment still pending, will continue polling...')
          return false // Still pending, continue polling
        }
      } else {
        console.log('[ERROR] Could not get payment status')
        return false // Continue polling
      }
    } catch (error) {
      console.error('[ERROR] Error checking payment status:', error)
      return false // Continue polling
    }
  }

  // Fast Refresh Safe: Modal Creation Function - React lifecycle dışında
  const createModal3DS = () => {
            // Creating 3DS modal
    
    // Varolan modal'ı temizle
    const existingModal = document.getElementById('iyzico-3ds-modal')
    if (existingModal) {
      existingModal.remove()
    }
    
    // Modal container oluştur - enhanced CSS
    const modalContainer = document.createElement('div')
    modalContainer.id = 'iyzico-3ds-modal'
    modalContainer.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(0,0,0,0.85) !important;
      z-index: 999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      overflow: auto !important;
    `
    
    // Modal content oluştur - enhanced visibility
    const modalContent = document.createElement('div')
    modalContent.style.cssText = `
      background: white !important;
      width: 95% !important;
      max-width: 600px !important;
      height: 90% !important;
      min-height: 400px !important;
      border-radius: 8px !important;
      position: relative !important;
      overflow: hidden !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
      border: 2px solid #007bff !important;
    `
    
    // Header oluştur - enhanced visibility
    const header = document.createElement('div')
    header.id = 'modal-header'
    header.style.cssText = `
      background: #007bff !important;
      color: white !important;
      padding: 15px !important;
      font-weight: bold !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      font-size: 16px !important;
      min-height: 50px !important;
      z-index: 1 !important;
    `
    header.innerHTML = `
      <span id="modal-title">3D Güvenlik Doğrulaması</span>
      <div style="display: flex; gap: 15px; align-items: center;">
        <button onclick="window.forceClose3DSModal()" style="
          background: #3b82f6;
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          font-weight: bold;
        ">🛒 Sepete Dön</button>
        <button onclick="window.close3DSModal()" style="
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
        ">×</button>
      </div>
    `
    
    // Final result container (initially hidden)
    const finalResultContainer = document.createElement('div')
    finalResultContainer.id = 'modal-final-result'
    finalResultContainer.style.cssText = `
      display: none !important;
      padding: 40px !important;
      text-align: center !important;
      height: calc(100% - 70px) !important;
      overflow-y: auto !important;
      background: white !important;
    `
    
    // iframe oluştur - sandbox ve security attributes ile
    const iframe = document.createElement('iframe')
    iframe.id = 'iyzico-3ds-frame'
    iframe.style.cssText = `
      width: 100% !important;
      height: calc(100% - 70px) !important;
      border: none !important;
      background: white !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      min-height: 300px !important;
    `
    
    // iframe sandbox permissions - bank form'lar için gerekli (maksimum permission)
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-top-navigation allow-popups allow-pointer-lock allow-presentation allow-downloads')
    iframe.setAttribute('allowfullscreen', 'true')
    iframe.setAttribute('frameborder', '0')
    iframe.setAttribute('loading', 'eager')
    iframe.setAttribute('importance', 'high')
    
            // iframe sandbox permissions set
    
    // Elements'leri birleştir
    modalContent.appendChild(header)
    modalContent.appendChild(iframe)
    modalContent.appendChild(finalResultContainer)
    modalContainer.appendChild(modalContent)
    
    // DOM'a ekle
    document.body.appendChild(modalContainer)
    
    // References'leri kaydet
    modalContainerRef.current = modalContainer
    iframeElementRef.current = iframe
    
    // Global function: Show final result in modal
    window.showModal3DSResult = (type: 'success' | 'failure', data: any) => {
      console.log(`[MODAL_RESULT] Showing ${type} result:`, data)
      console.log('[MODAL_DEBUG] Looking for modal elements...')
      
      const iframe = document.getElementById('iyzico-3ds-frame') as HTMLIFrameElement
      const finalResult = document.getElementById('modal-final-result') as HTMLDivElement
      const modalTitle = document.getElementById('modal-title') as HTMLSpanElement
      const modalHeader = document.getElementById('modal-header') as HTMLDivElement
      
      console.log('[MODAL_DEBUG] Elements found:', {
        iframe: !!iframe,
        finalResult: !!finalResult,
        modalTitle: !!modalTitle,
        modalHeader: !!modalHeader
      })
      
      if (!iframe || !finalResult || !modalTitle || !modalHeader) {
        console.error('[MODAL_RESULT] Modal elements not found')
        return
      }
      
      // Hide iframe, show result
      iframe.style.display = 'none'
      finalResult.style.display = 'block'
      
      console.log('[MODAL_DEBUG] Iframe hidden, final result shown')
      
      if (type === 'success') {
        // SUCCESS STATE
        modalTitle.textContent = '✅ Ödeme Başarılı!'
        modalHeader.style.background = '#22c55e'
        
        // Update header buttons for success state
        const headerButtons = modalHeader.querySelector('div')
        console.log('[MODAL_DEBUG] Header buttons container found:', !!headerButtons)
        
        if (headerButtons) {
          console.log('[MODAL_DEBUG] Updating header buttons for success state...')
          headerButtons.innerHTML = 
            '<button onclick="window.redirectToOrderTracking(\'' + data.orderNumber + '\')" style="' +
              'background: #22c55e;' +
              'border: none;' +
              'color: white;' +
              'padding: 8px 16px;' +
              'border-radius: 4px;' +
              'font-size: 12px;' +
              'cursor: pointer;' +
              'font-weight: bold;' +
            '">📋 Sipariş Takibi</button>' +
            '<button onclick="window.redirectToOrderTracking(\'' + data.orderNumber + '\')" style="' +
              'background: none;' +
              'border: none;' +
              'color: white;' +
              'font-size: 20px;' +
              'cursor: pointer;' +
            '">×</button>'
          console.log('[MODAL_DEBUG] Header buttons updated successfully')
        } else {
          console.error('[MODAL_DEBUG] Header buttons container not found!')
        }
        
        finalResult.innerHTML = 
          '<div style="margin-bottom: 30px;">' +
            '<div style="font-size: 72px; margin-bottom: 20px;">✅</div>' +
            '<h2 style="color: #22c55e; margin-bottom: 10px; font-size: 24px;">Ödeme Başarıyla Tamamlandı!</h2>' +
            '<p style="color: #666; font-size: 16px; margin-bottom: 20px;">' +
              'Siparişiniz başarıyla alındı ve işleme konuldu.' +
            '</p>' +
            '<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">' +
              '<div style="color: #166534; font-weight: bold; margin-bottom: 10px;">📋 Sipariş Detayları</div>' +
              '<div style="color: #166534;">' +
                '<div>Sipariş No: <strong>' + (data.orderNumber || 'N/A') + '</strong></div>' +
                '<div>Ödeme ID: <strong>' + (data.paymentId || 'N/A') + '</strong></div>' +
                '<div>Tutar: <strong>' + (data.amount || 'N/A') + '</strong></div>' +
                '<div>Tarih: <strong>' + new Date().toLocaleDateString('tr-TR') + '</strong></div>' +
              '</div>' +
            '</div>' +
            '<div style="background: #e0f2fe; border: 1px solid #81d4fa; border-radius: 8px; padding: 15px; margin: 20px 0;">' +
              '<div style="color: #0277bd; font-size: 14px; line-height: 1.5;">' +
                '✅ <strong>Ödemeniz başarıyla alındı</strong><br/>' +
                '📦 <strong>Siparişiniz hazırlanıyor</strong><br/>' +
                '🚚 <strong>Kargo bilgileri SMS ile gönderilecek</strong>' +
              '</div>' +
            '</div>' +
            '<p style="color: #666; font-size: 14px; margin-bottom: 30px;">' +
              '🎯 <strong>Modal\'ı kapatarak sipariş takibi sayfasına gidin</strong>' +
            '</p>' +
          '</div>' +
          '<div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">' +
            '<button onclick="window.redirectToOrderTracking(\'' + data.orderNumber + '\')" style="' +
              'background: #22c55e;' +
              'color: white;' +
              'border: none;' +
              'padding: 15px 25px;' +
              'border-radius: 8px;' +
              'font-size: 16px;' +
              'font-weight: bold;' +
              'cursor: pointer;' +
              'min-width: 180px;' +
              'transition: all 0.3s ease;' +
            '" onmouseover="this.style.background=\'#16a34a\'" onmouseout="this.style.background=\'#22c55e\'">' +
              '📋 Sipariş Takibi' +
            '</button>' +
          '</div>'
        
      } else {
        // FAILURE STATE
        modalTitle.textContent = '❌ Ödeme Başarısız'
        modalHeader.style.background = '#ef4444'
        
        // Update header buttons for failure state
        const headerButtons = modalHeader.querySelector('div')
        console.log('[MODAL_DEBUG] Header buttons container found (failure):', !!headerButtons)
        
        if (headerButtons) {
          console.log('[MODAL_DEBUG] Updating header buttons for failure state...')
          headerButtons.innerHTML = 
            '<button onclick="window.backToCart()" style="' +
              'background: #3b82f6;' +
              'border: none;' +
              'color: white;' +
              'padding: 8px 16px;' +
              'border-radius: 4px;' +
              'font-size: 12px;' +
              'cursor: pointer;' +
              'font-weight: bold;' +
            '">🛒 Sepete Dön</button>' +
            '<button onclick="window.backToCart()" style="' +
              'background: none;' +
              'border: none;' +
              'color: white;' +
              'font-size: 20px;' +
              'cursor: pointer;' +
            '">×</button>'
          console.log('[MODAL_DEBUG] Header buttons updated for failure')
        } else {
          console.error('[MODAL_DEBUG] Header buttons container not found (failure)!')
        }
        
        finalResult.innerHTML = 
          '<div style="margin-bottom: 30px;">' +
            '<div style="font-size: 72px; margin-bottom: 20px;">❌</div>' +
            '<h2 style="color: #ef4444; margin-bottom: 10px; font-size: 24px;">Ödeme İşlemi Başarısız</h2>' +
            '<p style="color: #666; font-size: 16px; margin-bottom: 20px;">' +
              'Üzgünüz, ödeme işleminiz tamamlanamadı.' +
            '</p>' +
            '<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">' +
              '<div style="color: #991b1b; font-weight: bold; margin-bottom: 10px;">⚠️ Hata Detayı</div>' +
              '<div style="color: #991b1b;">' +
                '<div>Hata Kodu: <strong>' + (data.errorCode || 'UNKNOWN_ERROR') + '</strong></div>' +
                '<div>Açıklama: <strong>' + (data.errorMessage || 'Ödeme işlemi başarısız oldu') + '</strong></div>' +
              '</div>' +
            '</div>' +
            '<p style="color: #666; font-size: 14px; margin-bottom: 30px;">' +
              '💡 Lütfen kart bilgilerinizi kontrol ederek tekrar deneyin veya farklı bir ödeme yöntemi seçin.' +
            '</p>' +
          '</div>' +
          '<div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">' +
            '<button onclick="window.backToCart()" style="' +
              'background: #3b82f6;' +
              'color: white;' +
              'border: none;' +
              'padding: 15px 25px;' +
              'border-radius: 8px;' +
              'font-size: 16px;' +
              'font-weight: bold;' +
              'cursor: pointer;' +
              'min-width: 180px;' +
              'transition: all 0.3s ease;' +
            '" onmouseover="this.style.background=\'#2563eb\'" onmouseout="this.style.background=\'#3b82f6\'">' +
              '🛒 Sepete Dön' +
            '</button>' +
          '</div>'
      }
    }
    
    // Global function: Redirect to order tracking - ONLY called by user button click
    window.redirectToOrderTracking = (orderNumber: string) => {
      console.log('[MODAL_REDIRECT] User clicked Sipariş Takibi button, redirecting to:', orderNumber)
      
      // Clear sessionStorage since we're manually redirecting
      sessionStorage.removeItem('successfulOrder')
      
      // Clean up modal
      cleanup3DSModal()
      clearCart()
      
      // Navigate to order tracking
      router.push(`/siparis-takibi/${orderNumber}`)
      
      console.log('[MODAL_REDIRECT] Successfully redirected to order tracking')
    }
    
    // Global function: Back to cart - ONLY called by user button click
    window.backToCart = () => {
      console.log('[MODAL_REDIRECT] User clicked Sepete Dön button, going back to cart')
      
      // Clean up modal
      cleanup3DSModal()
      
      console.log('[MODAL_REDIRECT] Successfully returned to cart')
    }
    
    console.log('[3DS] Fast Refresh safe modal created with final result UI')
    return iframe
  }

  // Bank form auto-submit trigger function
  const triggerBankFormSubmit = (iframe: HTMLIFrameElement) => {
    try {
      console.log('[3DS] Triggering bank form submit...')
      
      // Method 1: postMessage to iframe - inject auto-submit script
      const autoSubmitScript = `
        console.log('[BANK_FORM] Auto-submit script injected');
        
        // Find bank form
        var form = document.querySelector('form[name="returnform"]') || 
                   document.querySelector('form[method="post"]') || 
                   document.querySelector('form');
        
        if (form) {
          console.log('[BANK_FORM] Form found:', form);
          console.log('[BANK_FORM] Form action:', form.action);
          console.log('[BANK_FORM] Form method:', form.method);
          
          // Submit form after 1 second
          setTimeout(function() {
            console.log('[BANK_FORM] Auto-submitting form...');
            form.submit();
          }, 1000);
        } else {
          console.error('[BANK_FORM] No form found for auto-submit');
        }
      `;
      
             // Try to execute script in iframe
       if (iframe.contentWindow) {
         try {
           iframe.contentWindow.eval(autoSubmitScript);
           console.log('[3DS] Auto-submit script executed successfully')
         } catch (evalError) {
           console.log('[3DS] Direct eval failed, trying postMessage approach:', evalError)
           
           // Fallback: inject script via postMessage
           iframe.contentWindow.postMessage({
             type: 'INJECT_AUTO_SUBMIT',
             script: autoSubmitScript
           }, '*');
         }
       }
       
                  // Additional check: try to inspect iframe content after 3 seconds  
           setTimeout(() => {
             try {
               // Check iframe URL first
               const iframeUrl = iframe.contentWindow?.location?.href || iframe.src
               console.log('[3DS] iframe URL check:', iframeUrl)
               
               if (iframeUrl && (iframeUrl.includes('/odeme/hata') || iframeUrl.includes('error'))) {
                 console.log('[3DS] ERROR URL DETECTED in iframe - treating as error result')
                 
                 // Extract error from URL parameters
                 const url = new URL(iframeUrl)
                 const errorCode = url.searchParams.get('error') || 'UNKNOWN_ERROR'
                 const errorMessage = url.searchParams.get('message') || 'Ödeme işlemi başarısız'
                 
                 // Send error result to parent
                 window.postMessage({
                   type: 'IYZICO_PAYMENT_RESULT',
                   source: 'iyzico_callback',
                   success: false,
                   errorCode: errorCode,
                   errorMessage: decodeURIComponent(errorMessage),
                   orderNumber: currentOrderNumber,
                   timestamp: Date.now()
                 }, '*')
                 
                 return // Don't continue with content checking
               }
               
               if (iframe.contentDocument && iframe.contentDocument.body) {
                 const forms = iframe.contentDocument.querySelectorAll('form');
                 const inputs = iframe.contentDocument.querySelectorAll('input');
                 const bodyHTML = iframe.contentDocument.body.innerHTML;
                 
                 console.log('[3DS] iframe content inspection:', {
                   bodyHTML: bodyHTML.substring(0, 200),
                   formsCount: forms.length,
                   inputsCount: inputs.length,
                   forms: Array.from(forms).map(f => ({
                     name: f.getAttribute('name'),
                     action: f.getAttribute('action'),
                     method: f.getAttribute('method')
                   }))
                 })
                 
                 // Check for error pages in iframe content
                 const hasErrorPage = bodyHTML.includes('Ödeme Başarısız') || 
                                     bodyHTML.includes('Missing callback') ||
                                     bodyHTML.includes('THREEDS_FAILED') ||
                                     bodyHTML.includes('Error') ||
                                     iframe.contentDocument.title.includes('Error')
                 
                 if (hasErrorPage) {
                   console.log('[3DS] ERROR PAGE DETECTED in iframe - extracting error info')
                   
                   // Try to extract error information from iframe
                   const errorContainer = iframe.contentDocument.querySelector('.container')
                   const errorMessage = errorContainer?.textContent || 'Ödeme işlemi başarısız'
                   
                   console.log('[3DS] Error extracted from iframe:', errorMessage)
                   
                   // Send error result to parent
                   window.postMessage({
                     type: 'IYZICO_PAYMENT_RESULT',
                     source: 'iyzico_callback',
                     success: false,
                     errorCode: 'IFRAME_ERROR_DETECTED',
                     errorMessage: errorMessage,
                     orderNumber: currentOrderNumber,
                     timestamp: Date.now()
                   }, '*')
                   
                   return // Don't continue with form checking
                 }
                 
                 // If form exists but auto-submit didn't work, try manual submit
                 if (forms.length > 0 && !bodyHTML.includes('FORM BULUNDU')) {
                   console.log('[3DS] Manual form submit attempt...')
                   const form = forms[0] as HTMLFormElement
                   if (form) {
                     // Add manual submit button
                     const manualButton = iframe.contentDocument.createElement('button')
                     manualButton.innerText = 'BANKA SAYFASINA GİT (MANUEL)'
                     manualButton.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:red;color:white;padding:20px;font-size:16px;z-index:99999;border:none;cursor:pointer;'
                     manualButton.onclick = () => {
                       console.log('[3DS] Manual button clicked')
                       form.submit()
                     }
                     iframe.contentDocument.body.appendChild(manualButton)
                   }
                 }
               }
             } catch (inspectionError) {
               console.log('[3DS] iframe content inspection failed (CORS):', inspectionError)
             }
           }, 3000)
      
    } catch (error) {
      console.error('[3DS] Error triggering bank form submit:', error)
    }
  }

  // Clean up 3DS modal and timers
  const cleanup3DSModal = () => {
    console.log('[CLEANUP] Cleaning up 3DS modal and timers')
    
    // Modal'ı kapat (ref ile)
    if (modalContainerRef.current) {
      modalContainerRef.current.remove()
      modalContainerRef.current = null
    }
    
    // Fallback: ID ile de kontrol et
    const modal = document.getElementById('iyzico-3ds-modal')
    if (modal) {
      modal.remove()
    }
    
    // References'leri temizle
    iframeElementRef.current = null
    
    // Timer'ları temizle
    if (modalPollTimerRef.current) {
      clearInterval(modalPollTimerRef.current)
      modalPollTimerRef.current = null
    }
    
    if (popupPollTimerRef.current) {
      clearInterval(popupPollTimerRef.current)
      popupPollTimerRef.current = null
    }
    
    // Global functions cleanup
    if (typeof window !== 'undefined') {
      delete window.close3DSModal
      delete window.forceClose3DSModal
      delete window.showModal3DSResult
      delete window.redirectToOrderTracking
      delete window.backToCart
    }
    
    // State'leri temizle
    setIs3DSecureWaiting(false)
    setCurrentOrderNumber(null)
    setIsProcessing(false)
    
    // Clear processed messages for next payment
    processedMessagesRef.current.clear()
    
    // Clear order creation in-progress set
    orderCreationInProgressRef.current.clear()
  }

  // Payment polling removed - user will close modal manually after viewing bank result

  // Process bank transfer order
  const processBankTransferOrder = async (orderNumber: string) => {
    try {
      // Sipariş verilerini hazırla
      const orderData = {
        orderNumber,
        email: formData.deliveryAddress.email,
        phone: formData.deliveryAddress.phone,
        // Müşteri tipi bilgileri
        customerType: formData.customerType,
        identityNumber: formData.identityNumber,
        companyName: formData.companyName,
        taxNumber: formData.taxNumber,
        taxOffice: formData.taxOffice,
        totalAmount: total,
        subtotalAmount: items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), // KDV dahil
        taxAmount: items.reduce((sum, item) => {
          const itemTotal = item.product.price * item.quantity
          const taxAmount = itemTotal - (itemTotal / 1.2) // KDV tutarı
          return sum + taxAmount
        }, 0),
        shippingAmount: 0, // 🚚 Ücretsiz kargo
        discountAmount: 0,
        currency: 'TRY',
        billingAddress: formData.sameAsDelivery ? formData.deliveryAddress : formData.billingAddress,
        shippingAddress: formData.deliveryAddress,
        notes: formData.notes,
        paymentMethod: 'bank_transfer',
        paymentStatus: 'awaiting_payment',
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          sku: item.product.sku || '',
          image: item.product.images?.[0] || ''
        })),
        userId: null // TODO: Get from user context if logged in
      }

      // Sipariş API'sini çağır
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Sipariş oluşturulamadı')
      }

              console.log('[SUCCESS] Bank transfer order created:', result.data)
      
      // E-posta gönderimi tetikle (opsiyonel)
      if (bankTransferSettings) {
        await sendBankTransferEmail(orderNumber, total, bankTransferSettings)
      }

      // Sepeti temizle
      clearCart()
      
      // Başarı sayfasına yönlendir
      router.push(`/siparis-basarili?orderNumber=${orderNumber}&paymentMethod=bank_transfer`)
      
    } catch (error: any) {
      console.error('Bank transfer order error:', error)
      toast.error('Sipariş oluşturulurken hata oluştu: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Send bank transfer email notification
  const sendBankTransferEmail = async (orderNumber: string, amount: number, settings: BankTransferSettings) => {
    try {
      // E-posta API çağrısı burada yapılacak
      const emailData = {
        to: formData.deliveryAddress.email,
        subject: settings.email_subject.replace('{ORDER_NUMBER}', orderNumber),
        orderNumber,
        amount,
        currency: 'TRY',
        bankSettings: settings,
        deadline: settings.payment_deadline_hours
      }
      
      console.log('Bank transfer email data:', emailData)
      // TODO: Gerçek e-posta gönderimi API'si entegre edilecek
      
    } catch (error) {
      console.error('Error sending bank transfer email:', error)
      // E-posta hatası siparişi engellemez
    }
  }

  // Complete order with İyzico payment
  const completeOrder = async () => {
    if (!validateStep(3)) return

    setIsProcessing(true)
    
    try {
      // Generate order number
      const orderNumber = `SIP-${Date.now()}`

      // Banka havalesi için özel işlem
      if (formData.paymentMethod === 'bank_transfer') {
        await processBankTransferOrder(orderNumber)
        return
      }
      
      // Prepare basket items from cart
      const basketItems = items.map((item, index) => ({
        id: item.product.id.toString(),
        name: item.product.name,
        category: 'Elektronik', // TODO: Get from product category
        price: item.product.price
      }))

      // Prepare buyer information
      const buyer = {
        name: formData.deliveryAddress.fullName.split(' ')[0],
        surname: formData.deliveryAddress.fullName.split(' ').slice(1).join(' ') || 'Kullanıcı',
        email: formData.deliveryAddress.email,
        phone: formData.deliveryAddress.phone,
        identityNumber: '11111111111', // TODO: Get from user profile or form
        address: formData.deliveryAddress.addressLine1,
        city: formData.deliveryAddress.city,
        country: 'Turkey',
        zipCode: formData.deliveryAddress.postalCode
      }

      // Prepare payment request
      const paymentRequest = {
        orderNumber,
        amount: total,
        currency: 'TRY' as const,
        installment: 1, // TODO: Add installment selection
        basketItems,
        buyer,
        billingAddress: formData.sameAsDelivery ? {
          contactName: formData.deliveryAddress.fullName,
          address: formData.deliveryAddress.addressLine1,
          city: formData.deliveryAddress.city,
          country: 'Turkey',
          zipCode: formData.deliveryAddress.postalCode
        } : {
          contactName: formData.billingAddress.fullName,
          address: formData.billingAddress.addressLine1,
          city: formData.billingAddress.city,
          country: 'Turkey',
          zipCode: formData.billingAddress.postalCode
        },
        shippingAddress: {
          contactName: formData.deliveryAddress.fullName,
          address: formData.deliveryAddress.addressLine1,
          city: formData.deliveryAddress.city,
          country: 'Turkey',
          zipCode: formData.deliveryAddress.postalCode
        },
        card: {
          cardHolderName: formData.cardDetails?.cardHolder || 'Test User',
          cardNumber: formData.cardDetails?.cardNumber?.replace(/\s/g, '') || '5528790000000008',
          expireMonth: formData.cardDetails?.expiryMonth || '12',
          expireYear: formData.cardDetails?.expiryYear || '2030',
          cvc: formData.cardDetails?.cvv || '123',
          saveCard: formData.cardDetails?.saveCard || false
        }
      }

             // 3DS başlatma işlemi - MODAL version (popup yerine)
       console.log('[3DS] Starting 3D Secure payment with MODAL instead of popup')
       
       // Debug: Form data'yı kontrol et
       console.log('[DEBUG] Form Data:', {
         paymentMethod: formData.paymentMethod,
         sameAsDelivery: formData.sameAsDelivery,
         cardDetails: formData.cardDetails,
         billingAddress: formData.billingAddress,
         deliveryAddress: formData.deliveryAddress
       })
       
       // Form validation - Zorunlu alanları kontrol et
       // Sadece kredi kartı seçiliyse kart bilgilerini kontrol et
       if (formData.paymentMethod === 'credit_card' || formData.paymentMethod === 'debit_card') {
         if (!formData.cardDetails?.cardHolder || !formData.cardDetails?.cardNumber || !formData.cardDetails?.expiryMonth || !formData.cardDetails?.expiryYear || !formData.cardDetails?.cvv) {
           toast.error('Lütfen kart bilgilerini eksiksiz doldurun.')
           return
         }
       }
       
       // Billing address kontrolü - eğer "aynı adres" seçiliyse teslimat adresini kullan
       const billingToCheck = formData.sameAsDelivery ? formData.deliveryAddress : formData.billingAddress
       if (!billingToCheck?.fullName || !billingToCheck?.email) {
         toast.error('Lütfen fatura bilgilerini eksiksiz doldurun.')
         return
       }
       
       if (!formData.deliveryAddress?.fullName || !formData.deliveryAddress?.addressLine1) {
         toast.error('Lütfen teslimat bilgilerini eksiksiz doldurun.')
         return
       }
      
             const result = await fetch('/api/payment/iyzico/initialize', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           // Backend Zod schema'sına uygun format
           orderNumber: orderNumber,
           amount: total,
           currency: 'TRY',
           installment: 1,
           
           // Kart bilgileri (Backend schema: "card")
           card: {
             cardHolderName: formData.cardDetails?.cardHolder || '',
             cardNumber: (formData.cardDetails?.cardNumber || '').replace(/\s/g, ''),
             expireYear: formData.cardDetails?.expiryYear || '',
             expireMonth: formData.cardDetails?.expiryMonth || '', 
             cvc: formData.cardDetails?.cvv || '',
             saveCard: formData.cardDetails?.saveCard || false
           },
           
           // Müşteri bilgileri (Backend schema formatı) - billing ya da delivery kullan
          buyer: (() => {
            const addressToUse = formData.sameAsDelivery ? formData.deliveryAddress : formData.billingAddress
            return {
              name: formData.customerType === 'corporate' ? formData.companyName : addressToUse?.fullName?.split(' ')[0] || '',
              surname: formData.customerType === 'corporate' ? '' : addressToUse?.fullName?.split(' ').slice(1).join(' ') || '',
              email: addressToUse?.email || '',
              phone: addressToUse?.phone || '',
              identityNumber: formData.identityNumber || '11111111111', // TC Kimlik No veya default
              address: addressToUse?.addressLine1 || '',
              city: addressToUse?.city || '',
              country: 'Turkey',
              zipCode: addressToUse?.postalCode || '34000'
            }
          })(),
           
           // Adres bilgileri (Backend schema formatı)
           shippingAddress: {
             contactName: formData.deliveryAddress?.fullName || '',
             address: formData.deliveryAddress?.addressLine1 || '',
             city: formData.deliveryAddress?.city || '',
             country: 'Turkey',
             zipCode: formData.deliveryAddress?.postalCode || '34000'
           },
           
           billingAddress: (() => {
             const addressToUse = formData.sameAsDelivery ? formData.deliveryAddress : formData.billingAddress
             return {
               contactName: addressToUse?.fullName || '',
               address: addressToUse?.addressLine1 || '',
               city: addressToUse?.city || '',
               country: 'Turkey',
               zipCode: addressToUse?.postalCode || '34000'
             }
           })(),
           
           // Sepet items (Backend schema: "category" not "category1")
           basketItems: items.map(item => ({
             id: item.id.toString(),
             name: item.product.name,
             category: item.product.category || 'Genel',
             price: item.product.price
           }))
         })
       })

      const response = await result.json()

                 if (response.success && response.data) {
                     console.log('[3DS] 3D Secure başlatıldı, PaymentId:', response.data.paymentId)
        
        // MODAL'ı aç - popup yerine!
        setIs3DSecureWaiting(true)
        setCurrentOrderNumber(orderNumber)
        setPaymentError(null) // Yeni ödeme başlarken error'u temizle
        
                     // iframe için en iyi 3DS content'i seç
             let threeDSContent = response.data.threeDSHtmlContent || response.data.htmlContent
             
             if (!threeDSContent) {
               console.error('[3DS] Ne threeDSHtmlContent ne htmlContent mevcut!')
               toast.error('3D Secure içeriği alınamadı. Lütfen tekrar deneyin.')
               setIsProcessing(false)
               return
             }
             
             console.log('[3DS] Kullanılan content source:', response.data.threeDSHtmlContent ? 'threeDSHtmlContent' : 'htmlContent')
        
        // Fast Refresh Safe Modal Creation
        const iframe = createModal3DS()
        
        // iframe reference'ı zaten createModal3DS'den aldık
        if (!iframe) {
          console.error('[3DS] iframe oluşturulamadı!')
          return
        }
        
        // Modal created successfully - no color test needed
             
             // Base64 decode kontrol et
             let htmlContent = threeDSContent
             console.log('[3DS] Raw content type check:', typeof threeDSContent)
             
             // Base64 mi kontrol et (sadece base64 karakterleri içeriyorsa)
             if (threeDSContent && threeDSContent.match(/^[A-Za-z0-9+/]+=*$/)) {
               console.log('[3DS] Base64 encoded content detected, decoding...')
               try {
                 htmlContent = atob(threeDSContent)
                 console.log('[3DS] Base64 decode successful, length:', htmlContent.length)
               } catch (e) {
                 console.error('[3DS] Base64 decode failed:', e)
                 htmlContent = threeDSContent // fallback
               }
             } else {
               console.log('[3DS] HTML content direct kullanılıyor (Base64 değil)')
             }
             
             console.log('[3DS] Final HTML content length:', htmlContent.length)
             console.log('[3DS] Final HTML preview:', htmlContent.substring(0, 300))
             
                     // Enhanced iframe content loading - Multiple fallback methods
        const loadContent = () => {
          try {
            console.log('[3DS] Enhanced iframe content loading başlatılıyor...')
            console.log('[3DS] HTML content preview (first 300 chars):', htmlContent.substring(0, 300))
            
            // Method 1: Blob URL (most compatible with banking forms)
            try {
              const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
              const blobUrl = URL.createObjectURL(blob)
              
              iframe.onload = () => {
                console.log('[3DS] ✅ Blob URL method başarılı')
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
              }
              
              iframe.onerror = (e) => {
                console.error('[3DS] ❌ Blob URL method başarısız:', e)
                fallbackMethods()
              }
              
              iframe.src = blobUrl
              console.log('[3DS] Blob URL set, loading...')
              return
            } catch (blobError) {
              console.error('[3DS] Blob URL creation failed:', blobError)
              fallbackMethods()
            }
            
            function fallbackMethods() {
              console.log('[3DS] Fallback methods denenecek')
              // Method 2: srcdoc
              try {
                iframe.srcdoc = htmlContent
                console.log('[3DS] ✅ srcdoc method kullanıldı')
              } catch (srcdocError) {
                console.error('[3DS] srcdoc method başarısız:', srcdocError)
                // Method 3: data URL
                try {
                  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
                  iframe.src = dataUrl
                  console.log('[3DS] ✅ data URL method kullanıldı')
                } catch (dataError) {
                  console.error('[3DS] ❌ Tüm methods başarısız:', dataError)
                  toast.error('3D Secure form yüklenemedi. Lütfen sayfayı yenileyin.')
                }
              }
            }
            
                         // Auto-submit script'i HEAD'e ekle
             const autoSubmitScript = `
               <script type="text/javascript">
                 console.log('[BANK_FORM] Enhanced auto-submit script loaded');
                 
                 function findAndSubmitForm() {
                   console.log('[BANK_FORM] Looking for form to submit...');
                   
                   var form = document.querySelector('form[name="returnform"]') || 
                              document.querySelector('form[method="post"]') || 
                              document.querySelector('form');
                   
                   if (form) {
                     console.log('[BANK_FORM] Form found:', form);
                     console.log('[BANK_FORM] Form action:', form.action);
                     console.log('[BANK_FORM] Form inputs:', form.querySelectorAll('input').length);
                     
                     // Visual indicator
                     document.body.style.backgroundColor = '#90EE90';
                     document.body.innerHTML += '<div style="position:fixed;top:10px;left:10px;background:green;color:white;padding:10px;z-index:99999;">FORM BULUNDU - 2 SANİYE SONRA SUBMIT</div>';
                     
                     // Notify parent about form detection
                     try {
                       parent.postMessage({
                         type: 'FORM_SUBMIT_DETECTED',
                         source: 'iyzico_bank_form',
                         timestamp: Date.now(),
                         message: 'Bank form found and will be submitted'
                       }, '*');
                       console.log('[BANK_FORM] Form detection notified to parent');
                     } catch (e) {
                       console.log('[BANK_FORM] Parent notification failed:', e);
                     }
                     
                     setTimeout(function() {
                       console.log('[BANK_FORM] Auto-submitting form NOW...');
                       try {
                         form.submit();
                         
                         // Notify parent about form submission
                         try {
                           parent.postMessage({
                             type: 'FORM_SUBMITTED',
                             source: 'iyzico_bank_form',
                             timestamp: Date.now(),
                             message: 'Bank form submitted successfully'
                           }, '*');
                           console.log('[BANK_FORM] Form submission notified to parent');
                         } catch (e) {
                           console.log('[BANK_FORM] Submit notification failed:', e);
                         }
                       } catch (e) {
                         console.error('[BANK_FORM] Form submit error:', e);
                         // Manual click fallback
                         var submitBtn = form.querySelector('input[type="submit"]');
                         if (submitBtn) submitBtn.click();
                       }
                     }, 2000);
                   } else {
                     console.error('[BANK_FORM] No form found!');
                     document.body.innerHTML += '<div style="position:fixed;top:10px;left:10px;background:red;color:white;padding:10px;z-index:99999;">FORM BULUNAMADI!</div>';
                   }
                 }
                 
                 // Multiple triggers
                 if (document.readyState === 'loading') {
                   document.addEventListener('DOMContentLoaded', findAndSubmitForm);
                 } else {
                   findAndSubmitForm();
                 }
                 
                 window.addEventListener('load', function() {
                   setTimeout(findAndSubmitForm, 500);
                 });
               </script>
             `
            
            debugHtml = debugHtml.replace('</head>', autoSubmitScript + '</head>')
            
            // Load HTML content into iframe
            iframe.srcdoc = htmlContent
            
            // iframe load durumunu kontrol et
            setTimeout(() => {
              console.log('[3DS] iframe load check:', {
                src: iframe.src,
                srcdoc: iframe.srcdoc ? 'set' : 'not set',
                width: iframe.offsetWidth,
                height: iframe.offsetHeight,
                visible: iframe.offsetParent !== null,
                style: iframe.style.cssText
              })
              
              // Modal visibility check
              if (modalContainerRef.current) {
                console.log('[3DS] Modal visibility check:', {
                  display: modalContainerRef.current.style.display,
                  zIndex: modalContainerRef.current.style.zIndex,
                  visible: modalContainerRef.current.offsetParent !== null,
                  bounds: modalContainerRef.current.getBoundingClientRect()
                })
              }
            }, 1000)
            
          } catch (error) {
            console.error('[3DS] iframe content yazma hatası:', error)
            
            // Fallback: data URL kullan
            try {
              let debugHtml = htmlContent.replace(
                '<body',
                '<body style="border: 3px solid blue; background-color: #e6f3ff;"'
              )
              
              // Auto-submit script'i fallback için de ekle
              const fallbackAutoSubmitScript = `
                <script type="text/javascript">
                  console.log('[BANK_FORM] Fallback auto-submit script loaded');
                  
                  function findAndSubmitFormFallback() {
                    console.log('[BANK_FORM] Fallback: Looking for form to submit...');
                    
                    var form = document.querySelector('form[name="returnform"]') || 
                               document.querySelector('form[method="post"]') || 
                               document.querySelector('form');
                    
                                         if (form) {
                       console.log('[BANK_FORM] Fallback: Form found:', form);
                       document.body.style.backgroundColor = '#87CEEB';
                       document.body.innerHTML += '<div style="position:fixed;top:10px;left:10px;background:blue;color:white;padding:10px;z-index:99999;">FALLBACK FORM BULUNDU - SUBMIT</div>';
                       
                       // Notify parent about fallback form detection
                       try {
                         parent.postMessage({
                           type: 'FORM_SUBMIT_DETECTED',
                           source: 'iyzico_bank_form',
                           timestamp: Date.now(),
                           message: 'Fallback: Bank form found and will be submitted'
                         }, '*');
                       } catch (e) {
                         console.log('[BANK_FORM] Fallback notification failed:', e);
                       }
                       
                       setTimeout(function() {
                         console.log('[BANK_FORM] Fallback: Auto-submitting form...');
                         try {
                           form.submit();
                           
                           // Notify parent about fallback form submission
                           try {
                             parent.postMessage({
                               type: 'FORM_SUBMITTED',
                               source: 'iyzico_bank_form',
                               timestamp: Date.now(),
                               message: 'Fallback: Bank form submitted successfully'
                             }, '*');
                           } catch (e) {
                             console.log('[BANK_FORM] Fallback submit notification failed:', e);
                           }
                         } catch (submitError) {
                           console.error('[BANK_FORM] Fallback submit error:', submitError);
                         }
                       }, 2000);
                    } else {
                      console.error('[BANK_FORM] Fallback: No form found!');
                      document.body.innerHTML += '<div style="position:fixed;top:10px;left:10px;background:red;color:white;padding:10px;z-index:99999;">FALLBACK: FORM BULUNAMADI!</div>';
                    }
                  }
                  
                  setTimeout(findAndSubmitFormFallback, 1000);
                  window.addEventListener('load', findAndSubmitFormFallback);
                </script>
              `
              
              debugHtml = debugHtml.replace('</head>', fallbackAutoSubmitScript + '</head>')
              
              // Enhanced fallback: Try Blob URL first, then data URL
              try {
                console.log('[3DS] Fallback: Trying Blob URL for enhanced content loading')
                const fallbackBlob = new Blob([debugHtml], { type: 'text/html;charset=utf-8' })
                const fallbackBlobUrl = URL.createObjectURL(fallbackBlob)
                
                iframe.src = fallbackBlobUrl
                console.log('[3DS] Fallback Blob URL method successful')
                
                // Cleanup
                iframe.addEventListener('load', () => {
                  URL.revokeObjectURL(fallbackBlobUrl)
                  console.log('[3DS] Fallback Blob URL cleaned up')
                }, { once: true })
                
              } catch (fallbackBlobError) {
                console.warn('[3DS] Fallback Blob URL also failed, using data URL:', fallbackBlobError)
                const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(debugHtml)}`
                iframe.src = dataUrl
                console.log('[3DS] HTML content data URL ile yazıldı (final fallback with blue debug styling)')
              }
              
              // Fallback success check
              setTimeout(() => {
                console.log('[3DS] Fallback load check:', {
                  src: iframe.src ? 'set' : 'not set',
                  srcLength: iframe.src ? iframe.src.length : 0
                })
              }, 1000)
              
            } catch (fallbackError) {
              console.error('[3DS] Data URL fallback da başarısız:', fallbackError)
            }
          }
        }
             
        // iframe load event'ini dinle
        iframe.onload = () => {
          console.log('[3DS] iframe onload event fired - content loaded successfully')
          
          // EARLY ERROR DETECTION: Check for error immediately after load
          setTimeout(() => {
            try {
              // Check iframe URL for errors
              const iframeUrl = iframe.contentWindow?.location?.href || iframe.src
              console.log('[3DS] Early error check - iframe URL:', iframeUrl)
              
              if (iframeUrl && (iframeUrl.includes('/odeme/hata') || iframeUrl.includes('error'))) {
                console.log('[3DS] EARLY ERROR DETECTED - iframe redirected to error page')
                
                // Extract error from URL
                const url = new URL(iframeUrl)
                const errorCode = url.searchParams.get('error') || 'UNKNOWN_ERROR'
                const errorMessage = url.searchParams.get('message') || 'Ödeme işlemi başarısız'
                
                // Send immediate error result
                window.postMessage({
                  type: 'IYZICO_PAYMENT_RESULT',
                  source: 'iyzico_callback',
                  success: false,
                  errorCode: errorCode,
                  errorMessage: decodeURIComponent(errorMessage),
                  orderNumber: currentOrderNumber,
                  timestamp: Date.now()
                }, '*')
                
                return // Don't continue with form submit attempts
              }
              
                             // Basic error detection
               try {
                 if (iframe.contentDocument && iframe.contentDocument.body) {
                   const bodyHTML = iframe.contentDocument.body.innerHTML
                   
                   // Simple error check
                   if (bodyHTML.includes('Missing callback parameters') || 
                       bodyHTML.includes('THREEDS_FAILED')) {
                     
                     window.postMessage({
                       type: 'IYZICO_PAYMENT_RESULT',
                       source: 'iyzico_callback',
                       success: false,
                       errorCode: 'IFRAME_ERROR_DETECTED',
                       errorMessage: 'Ödeme işlemi başarısız',
                       orderNumber: currentOrderNumber,
                       timestamp: Date.now()
                     }, '*')
                     
                     return
                   }
                 }
               } catch (error) {
                 // Ignore CORS errors in error detection
               }
            } catch (error) {
              console.log('[3DS] Early error detection failed (CORS):', error)
            }
            
            // If no errors detected, proceed with form submit attempts
            console.log('[3DS] No early errors detected, proceeding with form submit triggers')
            
            // Bank form auto-submit trigger - multiple attempts
            setTimeout(() => {
              console.log('[3DS] Attempting to trigger bank form auto-submit...')
              triggerBankFormSubmit(iframe)
            }, 1000) // Reduced delay since we already waited 1 second
            
          }, 1000) // Early check after 1 second
          
          // Backup trigger after 5 seconds
          setTimeout(() => {
            console.log('[3DS] Backup trigger attempt...')
            triggerBankFormSubmit(iframe)
          }, 5000)
          
          // Emergency trigger after 8 seconds
          setTimeout(() => {
            console.log('[3DS] Emergency trigger attempt...')
            triggerBankFormSubmit(iframe)
          }, 8000)
        }
        
        iframe.onerror = (error) => {
          console.error('[3DS] iframe onerror event fired:', error)
        }
        
        // Fast Refresh Safe: Direct content loading
        console.log('[3DS] iframe content yükleniyor...')
        loadContent()
        
        // Modal kapatma fonksiyonu - X butonu - DEPRECATED (Header butonları dinamik olarak güncelleniyor)
        window.close3DSModal = () => {
          console.log('[3DS] DEPRECATED: close3DSModal called - this should not happen after final state UI')
          console.log('[3DS] Modal should only be closed via dynamic header buttons in final state')
          
          // Fallback for edge cases
          cleanup3DSModal()
          toast.info('3D Secure modal kapatıldı.')
        }
        
        // Return to cart/tracking function - DEPRECATED (Header butonları dinamik olarak güncelleniyor)
        window.forceClose3DSModal = () => {
          console.log('[3DS] DEPRECATED: forceClose3DSModal called - this should not happen after final state UI')
          console.log('[3DS] Modal should only be closed via dynamic header buttons in final state')
          
          // Fallback for edge cases
          cleanup3DSModal()
          toast.info('Ödeme işlemi iptal edildi.')
        }
        
        // User will close modal manually - no auto-close timer needed
        
                 console.log('[3DS] Modal created - user will close manually after viewing bank result')
        
        toast.success('3D Secure doğrulama modal\'ı açıldı. İşleminizi modal içinde tamamlayın.')
        
        // iframe content load monitoring
        setTimeout(() => {
          console.log('🔍 [DEBUG] Modal ve iframe durumu kontrol ediliyor...')
          
          if (!modalContainerRef.current) {
            console.error('❌ [ERROR] Modal container bulunamadı!')
          } else {
            console.log('✅ [SUCCESS] Modal container mevcut')
          }
          
          if (!iframeElementRef.current) {
            console.error('❌ [ERROR] iframe element bulunamadı!')
          } else {
            console.log('✅ [SUCCESS] iframe element mevcut')
            console.log('📊 [INFO] iframe properties:', {
              hasContent: !!iframeElementRef.current.srcdoc || !!iframeElementRef.current.src,
              srcdocLength: iframeElementRef.current.srcdoc?.length || 0,
              srcLength: iframeElementRef.current.src?.length || 0,
              readyState: (iframeElementRef.current as any).readyState
            })
          }
        }, 3000)
      } else {
        throw new Error(response.error || 'Ödeme başlatılamadı')
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      toast.error(error.message || 'Ödeme işlemi başlatılırken hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  // ✨ ENHANCED MESSAGE HANDLER - Ultimate Solution ✨
  useEffect(() => {
    console.log('[MESSAGE_SYSTEM] Enhanced message handler initialized')
    
    const handleMessage = (event: MessageEvent) => {
      // 🔒 Security: Trusted origins check
      const trustedOrigins = [
        window.location.origin,
        'https://sandbox-api.iyzipay.com', 
        'https://api.iyzipay.com',
        'https://goguvenliodeme.bkm.com.tr', // BKM güvenli ödeme
        'null' // For blob/data URLs
      ]
      
      if (!trustedOrigins.includes(event.origin) && event.origin !== 'null') {
        console.warn('[🔒 SECURITY] Blocked untrusted origin:', event.origin)
        return
      }
      
      console.log('[📨 MESSAGE] Received:', {
        type: event.data?.type,
        source: event.data?.source,
        origin: event.origin,
        timestamp: Date.now()
      })
      
      // 🎯 İyzico Payment Result Handler
      if (event.data?.type === 'IYZICO_PAYMENT_RESULT' && 
          (event.data?.source === 'iyzico_callback' || 
           event.data?.source === 'callback_direct' ||
           event.data?.source === 'callback_broadcast' ||
           event.data?.source === 'callback_localStorage')) {
        
        // Deduplication check
        const messageId = `${event.data.orderNumber}_${event.data.paymentId}_${event.data.success ? 'success' : 'failure'}`
        if (processedMessagesRef.current.has(messageId)) {
          console.log('[🔄 DEDUPE] Message already processed, ignoring:', messageId)
          return
        }
        processedMessagesRef.current.add(messageId)
        
        console.log('[💳 PAYMENT] İyzico callback received (NEW):', event.data)
        
        // Stop all timers immediately
        if (modalPollTimerRef.current) {
          clearInterval(modalPollTimerRef.current)
          modalPollTimerRef.current = null
          console.log('[⏰ TIMER] Modal polling stopped by callback')
        }
        
        if (popupPollTimerRef.current) {
          clearInterval(popupPollTimerRef.current)
          popupPollTimerRef.current = null  
          console.log('[⏰ TIMER] Popup polling stopped by callback')
        }
        
        if (event.data.success) {
          console.log('[✅ SUCCESS] Payment successful - creating order in database...')
          setPaymentError(null) // Error state'i temizle
          
          // Success state'i set et ama modalı kapatma - kullanıcı görecek
          setIs3DSecureWaiting(false)
          setIsProcessing(false)
          
          // 🎯 **KEY FIX**: Create order in database immediately after successful payment
          const createOrderInDatabase = async () => {
            // Duplicate check: Bu order için zaten creation işlemi devam ediyor mu?
            if (orderCreationInProgressRef.current.has(event.data.orderNumber)) {
              console.log('[🔄 ORDER_DEDUPE] Order creation already in progress for:', event.data.orderNumber)
              return
            }
            
            // Mark as in progress
            orderCreationInProgressRef.current.add(event.data.orderNumber)
            
            try {
              console.log('[📝 DATABASE] Creating order in database for:', event.data.orderNumber)
              
              // Prepare order data - same format as bank transfer
              const orderData = {
                orderNumber: event.data.orderNumber,
                email: formData.deliveryAddress.email,
                phone: formData.deliveryAddress.phone,
                totalAmount: total,
                subtotalAmount: items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), // KDV dahil
                taxAmount: items.reduce((sum, item) => {
                  const itemTotal = item.product.price * item.quantity
                  const taxAmount = itemTotal - (itemTotal / 1.2) // KDV tutarı
                  return sum + taxAmount
                }, 0),
                shippingAmount: 0, // 🚚 Ücretsiz kargo
                discountAmount: 0,
                currency: 'TRY',
                billingAddress: formData.sameAsDelivery ? formData.deliveryAddress : formData.billingAddress,
                shippingAddress: formData.deliveryAddress,
                notes: formData.notes,
                paymentMethod: 'credit_card',
                paymentStatus: 'paid', // ✅ Payment successful
                items: items.map(item => ({
                  productId: item.product.id,
                  productName: item.product.name,
                  quantity: item.quantity,
                  price: item.product.price,
                  sku: item.product.sku,
                  image: item.product.images?.[0]
                })),
                userId: null // TODO: Get from user context if logged in
              }

              // Create order via API
              const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
              })

              const result = await response.json()

              if (result.success) {
                console.log('[✅ DATABASE] Order created successfully in database:', result.data)
                
                // Success data'sını store et - modal kapatıldığında kullanacağız
                sessionStorage.setItem('successfulOrder', JSON.stringify({
                  orderNumber: event.data.orderNumber,
                  paymentId: event.data.paymentId,
                  success: true
                }))
                
                // Show success result in modal using new final state UI
                if (window.showModal3DSResult) {
                  console.log('[🎉 MODAL_SUCCESS] Showing success result in modal')
                  window.showModal3DSResult('success', {
                    orderNumber: event.data.orderNumber,
                    paymentId: event.data.paymentId,
                    conversationId: event.data.conversationId,
                    amount: `${total.toLocaleString('tr-TR')} ₺`
                  })
                } else {
                  console.error('[❌ MODAL_ERROR] showModal3DSResult function not available')
                }
                
                console.log('[📋 SUCCESS] Success final state shown in modal - user can click "Sipariş Takibi" button')
                console.log('[🚨 CRITICAL] Modal must stay open - user will manually close by clicking buttons')
                
              } else {
                console.error('[❌ DATABASE] Order creation failed:', result.error)
                toast.error('Sipariş oluşturulurken hata oluştu: ' + result.error)
                
                // Even if database fails, show payment success (payment was successful)
                if (window.showModal3DSResult) {
                  window.showModal3DSResult('success', {
                    orderNumber: event.data.orderNumber,
                    paymentId: event.data.paymentId,
                    conversationId: event.data.conversationId,
                    amount: `${total.toLocaleString('tr-TR')} ₺`
                  })
                }
              }
              
            } catch (error) {
              console.error('[❌ DATABASE] Order creation error:', error)
              toast.error('Sipariş oluşturulurken hata oluştu.')
              
              // Even if database fails, show payment success (payment was successful)
              if (window.showModal3DSResult) {
                window.showModal3DSResult('success', {
                  orderNumber: event.data.orderNumber,
                  paymentId: event.data.paymentId,
                  conversationId: event.data.conversationId,
                  amount: `${total.toLocaleString('tr-TR')} ₺`
                })
              }
            } finally {
              // Remove from in-progress set
              orderCreationInProgressRef.current.delete(event.data.orderNumber)
            }
          }
          
          // Create order in database async
          createOrderInDatabase()
        } else {
          // Show failure result in modal instead of closing immediately
          console.log('[❌ FAILED] Payment failed:', event.data.errorMessage)
          const errorMsg = event.data.errorMessage || 'Bilinmeyen hata'
          const errorCode = event.data.errorCode || 'UNKNOWN'
          
          // Türkçe karakter encoding sorununu önlemek için decode et
          const decodedErrorMsg = decodeURIComponent(errorMsg || '')
            .replace(/\+/g, ' ') // + karakterlerini boşluk yap
            .trim()
          
          // Set error state for background page
          setIs3DSecureWaiting(false)
          setCurrentOrderNumber(null)
          setIsProcessing(false)
          
          setPaymentError({
            message: decodedErrorMsg || 'Bilinmeyen hata oluştu',
            code: errorCode
          })
          
          // Show failure result in modal using new final state UI
          if (window.showModal3DSResult) {
            console.log('[💥 MODAL_FAILURE] Showing failure result in modal')
            window.showModal3DSResult('failure', {
              errorCode: errorCode,
              errorMessage: decodedErrorMsg || 'Ödeme işlemi başarısız oldu',
              orderNumber: event.data.orderNumber
            })
          } else {
            console.error('[❌ MODAL_ERROR] showModal3DSResult function not available - falling back to immediate close')
            cleanup3DSModal()
            
            // Fallback toast if modal function not available
            toast.error(`❌ Ödeme Başarısız: ${decodedErrorMsg}`, {
              duration: 10000,
              description: 'Lütfen kart bilgilerinizi kontrol edip tekrar deneyin.',
              action: {
                label: 'Tekrar Dene',
                onClick: () => {
                  setCurrentStep(3)
                }
              }
            })
          }
          
          console.log('[📝 FAILURE] Failure final state shown in modal - user can click "Sepete Dön" button')
        }
        return
      }
      
      // 🔄 Form Submit Detection (for debugging)
      if (event.data?.type === 'FORM_SUBMITTED' || 
          event.data?.type === 'FORM_SUBMIT_DETECTED') {
        console.log('[📋 FORM] Bank form activity detected:', event.data.message)
        toast.info('Banka formu işleniyor...')
        return
      }
      
      // 🚪 Modal Close Request
      if (event.data?.type === 'CLOSE_3DS_MODAL') {
        console.log('[🚪 MODAL] Close request received')
        cleanup3DSModal()
        
        // Check payment status after modal close
        if (currentOrderNumber) {
          setTimeout(() => {
            checkPaymentStatus(currentOrderNumber, false)
          }, 2000)
        }
        return
      }
      
      // 📊 Debug: Unknown message types
      if (event.data?.type && 
          !['IYZICO_PAYMENT_RESULT', 'FORM_SUBMITTED', 'FORM_SUBMIT_DETECTED', 'CLOSE_3DS_MODAL'].includes(event.data.type)) {
        console.log('[🔍 DEBUG] Unknown message type:', event.data.type, event.data)
      }
    }
    
    // 🎧 Multi-layer event listeners for maximum compatibility
    window.addEventListener('message', handleMessage, { capture: true })
    window.addEventListener('message', handleMessage, { capture: false })
    document.addEventListener('message', handleMessage as any, { capture: true })
    
    // 📡 localStorage listener (fallback channel)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'iyzico_payment_result' && e.newValue) {
        try {
          const paymentData = JSON.parse(e.newValue)
          console.log('[💾 STORAGE] Payment result from localStorage:', paymentData)
          handleMessage({ 
            data: { 
              type: 'IYZICO_PAYMENT_RESULT', 
              source: 'iyzico_callback',
              ...paymentData 
            }, 
            origin: window.location.origin 
          } as MessageEvent)
          localStorage.removeItem('iyzico_payment_result') // Cleanup
        } catch (e) {
          console.error('[💾 STORAGE] Parse error:', e)
        }
      }
    }
    
    window.addEventListener('storage', storageHandler)
    
    // 📡 BroadcastChannel listener (fallback channel 2)
    let broadcastChannel: BroadcastChannel | null = null
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        broadcastChannel = new BroadcastChannel('iyzico_payment')
        broadcastChannel.addEventListener('message', (e) => {
          console.log('[📡 BROADCAST] Payment result from BroadcastChannel:', e.data)
          if (e.data?.type === 'IYZICO_PAYMENT_RESULT') {
            handleMessage({ 
              data: e.data, 
              origin: window.location.origin 
            } as MessageEvent)
          }
        })
        console.log('[📡 BROADCAST] BroadcastChannel listener active')
      }
    } catch (e) {
      console.log('[📡 BROADCAST] BroadcastChannel not supported:', e)
    }
    
    // 🏷️ window.name polling (fallback channel 3)
    const windowNameChecker = setInterval(() => {
      try {
        // Check current window name
        if (window.name.startsWith('IYZICO_RESULT:')) {
          const messageData = window.name.replace('IYZICO_RESULT:', '')
          const paymentData = JSON.parse(messageData)
          console.log('[🏷️ WINDOW_NAME] Payment result from window.name:', paymentData)
          
          handleMessage({ 
            data: { 
              type: 'IYZICO_PAYMENT_RESULT', 
              source: 'iyzico_callback',
              ...paymentData 
            }, 
            origin: window.location.origin 
          } as MessageEvent)
          
          // Clear the window name
          window.name = ''
          clearInterval(windowNameChecker)
        }
        
        // Check if we have modal/iframe references
        if (modalContainerRef.current && iframeElementRef.current) {
          const iframe = iframeElementRef.current
          try {
            // Check iframe's parent window name
            if (iframe.contentWindow?.parent?.name?.startsWith('IYZICO_RESULT:')) {
              const messageData = iframe.contentWindow.parent.name.replace('IYZICO_RESULT:', '')
              const paymentData = JSON.parse(messageData)
              console.log('[🏷️ IFRAME_NAME] Payment result from iframe parent name:', paymentData)
              
              handleMessage({ 
                data: { 
                  type: 'IYZICO_PAYMENT_RESULT', 
                  source: 'iyzico_callback',
                  ...paymentData 
                }, 
                origin: window.location.origin 
              } as MessageEvent)
              
              // Clear the iframe parent name
              iframe.contentWindow.parent.name = ''
              clearInterval(windowNameChecker)
            }
          } catch (e) {
            // Cross-origin access - ignore silently
          }
        }
      } catch (e) {
        // JSON parse error or other - ignore silently
      }
    }, 500) // Check every 500ms
    
    console.log('[🚀 MESSAGE_SYSTEM] All listeners active (PostMessage + Storage + Broadcast + WindowName)')
    
    // 🧹 Cleanup function
    return () => {
      window.removeEventListener('message', handleMessage, { capture: true })
      window.removeEventListener('message', handleMessage, { capture: false }) 
      document.removeEventListener('message', handleMessage as any, { capture: true })
      window.removeEventListener('storage', storageHandler)
      
      // Close BroadcastChannel
      if (broadcastChannel) {
        broadcastChannel.close()
      }
      
      // Clear window.name checker interval
      if (windowNameChecker) {
        clearInterval(windowNameChecker)
      }
      
      cleanup3DSModal()
      delete window.close3DSModal
      delete window.forceClose3DSModal
      
      console.log('[🧹 CLEANUP] All message listeners removed (PostMessage + Storage + Broadcast + WindowName)')
    }
  }, [router, toast, clearCart]) // currentOrderNumber kaldırıldı - modal kapatma sorununu çözer

  return (
    <div className="container mx-auto px-2 md:px-4 py-3 md:py-8">
      {/* Payment Error Banner */}
      {paymentError && (
        <div className="max-w-3xl mx-auto mb-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Ödeme İşlemi Başarısız Oldu
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {paymentError.message}
                </p>
                {paymentError.code && (
                  <p className="mt-1 text-xs text-red-600">
                    Hata Kodu: {paymentError.code}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setPaymentError(null) // Error'u temizle
                      setCurrentStep(3) // Payment step'e dön
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Tekrar Dene
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setPaymentError(null)}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Login Status Banner */}
      {!currentCustomer && (
        <Card className="mb-3 md:mb-6 bg-blue-50 border-blue-200">
          <CardContent className="py-2.5 md:py-4 px-3 md:px-6">
            <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <LogIn className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-blue-900">
                    Üye değil misiniz?
                  </p>
                  <p className="text-[10px] md:text-xs text-blue-700 hidden sm:block">
                    Giriş yaparak kayıtlı adreslerinizi kullanabilir ve siparişlerinizi takip edebilirsiniz
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50 text-xs md:text-sm h-8 md:h-9"
                onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent('/odeme')}`)}
              >
                <LogIn className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Giriş Yap / Üye Ol</span>
                <span className="sm:hidden">Giriş</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Customer Info */}
      {currentCustomer && (
        <Card className="mb-3 md:mb-6 bg-green-50 border-green-200">
          <CardContent className="py-2.5 md:py-4 px-3 md:px-6">
            <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-green-900">
                    Hoş geldiniz, {currentCustomer.first_name || currentCustomer.email}!
                  </p>
                  <p className="text-[10px] md:text-xs text-green-700 hidden sm:block">
                    Kayıtlı adres bilgileriniz otomatik olarak gelecektir
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-green-700 hover:bg-green-100 text-xs md:text-sm h-8 md:h-9"
                onClick={() => {
                  sessionStorage.removeItem('customer')
                  setCurrentCustomer(null)
                  toast.info('Çıkış yapıldı')
                }}
              >
                Çıkış Yap
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto mb-4 md:mb-8">
        <div className="flex items-center justify-between">
          {checkoutSteps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => goToStep(step.id)}
                disabled={step.id > currentStep && !checkoutSteps[step.id - 2]?.completed}
                className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-colors ${
                  step.completed
                    ? 'bg-primary border-primary text-primary-foreground'
                    : step.active
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground text-muted-foreground'
                }`}
              >
                {step.completed ? <CheckCircle className="h-4 w-4 md:h-5 md:w-5" /> : step.id}
              </button>
              <div className="ml-1 md:ml-3 flex-1">
                <p className={`text-xs md:text-sm font-medium ${
                  step.active ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
              </div>
              {index < checkoutSteps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 md:mx-4 ${
                  step.completed ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-8">
        {/* Left - Form Steps */}
        <div className="lg:col-span-2">
          {/* Step 1: Delivery Address */}
          {currentStep === 1 && (
            <Card>
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                  Teslimat Adresi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6 pt-0">
                {/* Müşteri Tipi Seçimi */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                  <Label className="text-base font-semibold">Müşteri Tipi *</Label>
                  <RadioGroup
                    value={formData.customerType}
                    onValueChange={(value: 'individual' | 'corporate') => 
                      setFormData(prev => ({ ...prev, customerType: value }))
                    }
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <RadioGroupItem value="individual" id="individual" className="shrink-0" />
                      <Label htmlFor="individual" className="cursor-pointer flex-1 py-2">
                        👤 Bireysel Müşteri
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 flex-1">
                      <RadioGroupItem value="corporate" id="corporate" className="shrink-0" />
                      <Label htmlFor="corporate" className="cursor-pointer flex-1 py-2">
                        🏢 Kurumsal Müşteri
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Bireysel için TC Kimlik No */}
                  {formData.customerType === 'individual' && (
                    <div className="pt-2">
                      <Label htmlFor="identityNumber">TC Kimlik No (Opsiyonel)</Label>
                      <Input
                        id="identityNumber"
                        value={formData.identityNumber || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, identityNumber: e.target.value }))}
                        placeholder="12345678901"
                        maxLength={11}
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Fatura için gerekli olabilir
                      </p>
                    </div>
                  )}

                  {/* Kurumsal için Şirket Bilgileri */}
                  {formData.customerType === 'corporate' && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label htmlFor="companyName">Şirket Adı *</Label>
                        <Input
                          id="companyName"
                          value={formData.companyName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                          placeholder="ABC Teknoloji A.Ş."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="taxNumber">Vergi Numarası *</Label>
                          <Input
                            id="taxNumber"
                            value={formData.taxNumber || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                            placeholder="1234567890"
                            maxLength={10}
                          />
                        </div>
                        <div>
                          <Label htmlFor="taxOffice">Vergi Dairesi *</Label>
                          <Input
                            id="taxOffice"
                            value={formData.taxOffice || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, taxOffice: e.target.value }))}
                            placeholder="Kadıköy"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Ad Soyad *</Label>
                    <Input
                      id="fullName"
                      value={formData.deliveryAddress.fullName}
                      onChange={(e) => updateDeliveryAddress('fullName', e.target.value)}
                      placeholder="Ahmet Yılmaz"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      value={formData.deliveryAddress.phone}
                      onChange={(e) => updateDeliveryAddress('phone', e.target.value)}
                      placeholder="0555 123 45 67"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">E-posta *</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.deliveryAddress.email}
                      onChange={(e) => updateDeliveryAddress('email', e.target.value)}
                      placeholder="ahmet@example.com"
                    />
                    {isCheckingCustomer && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Current Customer Info */}
                  {currentCustomer && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Giriş yapıldı: {currentCustomer.first_name || currentCustomer.email}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Customer Found Prompt */}
                  {showLoginPrompt && customerFound && !currentCustomer && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm text-blue-800 font-medium mb-1">
                            Bu e-mail adresine kayıtlı hesabınız var!
                          </p>
                          <p className="text-xs text-blue-700 mb-3">
                            Giriş yaparak kayıtlı adres bilgilerinizi kullanabilirsiniz.
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={fillAddressFromCustomer}
                            >
                              🏠 Adresi Getir
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-blue-700 border-blue-300 hover:bg-blue-100"
                              onClick={() => {
                                // Magic link gönder
                                fetch('/api/customer/magic-login', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: formData.deliveryAddress.email })
                                }).then(() => {
                                  toast.success('Giriş linki e-mail adresinize gönderildi!')
                                }).catch(() => {
                                  toast.error('Giriş linki gönderilemedi')
                                })
                              }}
                            >
                              Giriş Linki Gönder
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setShowLoginPrompt(false)}
                            >
                              Kapat
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="addressLine1">Adres *</Label>
                  <Input
                    id="addressLine1"
                    value={formData.deliveryAddress.addressLine1}
                    onChange={(e) => updateDeliveryAddress('addressLine1', e.target.value)}
                    placeholder="Mahalle, Sokak, No"
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2">Adres Detayı (Opsiyonel)</Label>
                  <Input
                    id="addressLine2"
                    value={formData.deliveryAddress.addressLine2}
                    onChange={(e) => updateDeliveryAddress('addressLine2', e.target.value)}
                    placeholder="Bina, Daire, vb."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">İl *</Label>
                    <Select
                      value={formData.deliveryAddress.city}
                      onValueChange={(value) => updateDeliveryAddress('city', value)}
                    >
                      <SelectTrigger id="city">
                        <SelectValue placeholder="İl seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="district">İlçe *</Label>
                    <Input
                      id="district"
                      value={formData.deliveryAddress.district}
                      onChange={(e) => updateDeliveryAddress('district', e.target.value)}
                      placeholder="İlçe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Posta Kodu (Opsiyonel)</Label>
                    <Input
                      id="postalCode"
                      value={formData.deliveryAddress.postalCode}
                      onChange={(e) => updateDeliveryAddress('postalCode', e.target.value)}
                      placeholder="34000"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAsDelivery"
                    checked={formData.sameAsDelivery}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, sameAsDelivery: checked as boolean }))
                    }
                  />
                  <Label htmlFor="sameAsDelivery" className="cursor-pointer">
                    Fatura adresim teslimat adresimle aynı
                  </Label>
                </div>

                <div className="flex justify-between gap-2">
                  <Button variant="outline" asChild size="sm" className="h-9 md:h-10">
                    <Link href="/sepet">
                      <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                      <span className="text-xs md:text-sm">Sepete Dön</span>
                    </Link>
                  </Button>
                  <Button onClick={nextStep} size="sm" className="h-9 md:h-10">
                    <span className="text-xs md:text-sm">Devam Et</span>
                    <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 2 && (
            <Card>
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                  Ödeme Yöntemi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-3 md:p-6 pt-0">
                {isLoadingPaymentSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Ödeme yöntemleri yükleniyor...</span>
                    </div>
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Aktif ödeme yöntemi bulunamadı</p>
                    <p className="text-sm">Lütfen yöneticiyle iletişime geçin</p>
                  </div>
                ) : (
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, paymentMethod: value as PaymentMethod['type'] }))
                    }
                  >
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-2 p-2.5 md:p-4 border rounded-lg hover:border-primary/50 transition-colors">
                        <RadioGroupItem value={method.type} id={method.id} className="shrink-0" />
                        <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            {method.icon === 'CreditCard' && <CreditCard className="h-4 w-4 shrink-0" />}
                            {method.icon === 'Banknote' && <Banknote className="h-4 w-4 shrink-0" />}
                            <span className="font-medium text-sm md:text-base">{method.label}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Card Details */}
                {(formData.paymentMethod === 'credit_card' || formData.paymentMethod === 'debit_card') && (
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="cardNumber">Kart Numarası *</Label>
                      <Input
                        id="cardNumber"
                        value={formatCardNumber(formData.cardDetails?.cardNumber || '')}
                        onChange={(e) => updateCardDetails('cardNumber', e.target.value.replace(/\s/g, ''))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>

                    <div>
                      <Label htmlFor="cardHolder">Kart Üzerindeki İsim *</Label>
                      <Input
                        id="cardHolder"
                        value={formData.cardDetails?.cardHolder || ''}
                        onChange={(e) => updateCardDetails('cardHolder', e.target.value.toUpperCase())}
                        placeholder="AHMET YILMAZ"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="expiryMonth">Ay *</Label>
                        <Select
                          value={formData.cardDetails?.expiryMonth || ''}
                          onValueChange={(value) => updateCardDetails('expiryMonth', value)}
                        >
                          <SelectTrigger id="expiryMonth">
                            <SelectValue placeholder="Ay" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                                {month.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="expiryYear">Yıl *</Label>
                        <Select
                          value={formData.cardDetails?.expiryYear || ''}
                          onValueChange={(value) => updateCardDetails('expiryYear', value)}
                        >
                          <SelectTrigger id="expiryYear">
                            <SelectValue placeholder="Yıl" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          type="password"
                          value={formData.cardDetails?.cvv || ''}
                          onChange={(e) => updateCardDetails('cvv', e.target.value)}
                          placeholder="123"
                          maxLength={3}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="saveCard"
                        checked={formData.cardDetails?.saveCard || false}
                        onCheckedChange={(checked) => updateCardDetails('saveCard', checked as boolean)}
                        className="shrink-0"
                      />
                      <Label htmlFor="saveCard" className="cursor-pointer text-xs md:text-sm leading-tight">
                        Kartımı sonraki alışverişlerim için kaydet
                      </Label>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Info */}
                {formData.paymentMethod === 'bank_transfer' && (
                  <div className="space-y-4">
                    {/* 24 Saat Uyarısı - Belirgin */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-5 rounded-lg border-2 border-orange-400 shadow-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-orange-900 text-lg mb-2">ÖNEMLİ UYARI</p>
                          <p className="text-orange-800 font-semibold text-base">
                            ⏰ Ödemenizi <span className="underline decoration-2 underline-offset-2">{bankTransferSettings?.payment_deadline_hours || 24} saat içinde</span> yapmanız gerekmektedir.
                          </p>
                          <p className="text-orange-700 text-sm mt-2">
                            Belirtilen süre içinde ödeme yapılmayan siparişler otomatik olarak iptal edilecektir.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Genel Bilgi */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium mb-2 text-blue-900">Havale/EFT Bilgileri</p>
                          <p className="text-blue-800">
                            {bankTransferSettings?.customer_message || 
                             'Sipariş onayından sonra banka hesap bilgilerimiz e-posta adresinize gönderilecektir.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Banka Hesap Bilgileri */}
                    {bankTransferSettings && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Banknote className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-blue-900">Banka Hesap Bilgileri</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Banka Adı:</p>
                            <p className="font-medium">{bankTransferSettings.bank_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Hesap Sahibi:</p>
                            <p className="font-medium">{bankTransferSettings.account_holder}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-gray-600 font-semibold mb-1">IBAN Numarası:</p>
                            <div className="bg-white p-4 rounded-lg border-2 border-blue-400 shadow-md">
                              <p className="font-mono font-bold text-xl md:text-2xl text-blue-900 tracking-wider break-all select-text">
                                {bankTransferSettings.iban}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                💡 IBAN numarasını seçerek kopyalayabilirsiniz
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Hesap No:</p>
                            <p className="font-medium">{bankTransferSettings.account_number}</p>
                          </div>
                          {bankTransferSettings.swift_code && (
                            <div>
                              <p className="text-gray-600">SWIFT Kodu:</p>
                              <p className="font-medium">{bankTransferSettings.swift_code}</p>
                            </div>
                          )}
                        </div>

                        {/* Ödeme Notu */}
                        {bankTransferSettings.payment_note && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                              <p className="text-sm text-yellow-800 font-medium">
                                {bankTransferSettings.payment_note}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Alternatif Hesaplar */}
                        {bankTransferSettings.alternative_accounts && 
                         bankTransferSettings.alternative_accounts.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-blue-900 mb-2">Alternatif Hesaplar:</h4>
                            <div className="space-y-2">
                              {bankTransferSettings.alternative_accounts.map((account: any, index: number) => (
                                <div key={index} className="p-3 bg-white rounded border border-blue-100">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-600">{account.bank_name} - </span>
                                      <span className="font-medium">{account.account_holder}</span>
                                    </div>
                                    <div className="font-mono text-blue-800">
                                      {account.iban}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Yükleme durumu */}
                    {isLoadingPaymentSettings && (
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Banka bilgileri yükleniyor...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}



                <div className="flex justify-between gap-2">
                  <Button variant="outline" onClick={prevStep} size="sm" className="h-9 md:h-10">
                    <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">Geri</span>
                  </Button>
                  <Button 
                    onClick={nextStep}
                    disabled={isLoadingPaymentSettings || paymentMethods.length === 0}
                    size="sm"
                    className="h-9 md:h-10"
                  >
                    {isLoadingPaymentSettings ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2 animate-spin" />
                        <span className="text-xs md:text-sm">Yükleniyor...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs md:text-sm">Devam Et</span>
                        <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Order Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Delivery Address Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Teslimat Adresi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{formData.deliveryAddress.fullName}</p>
                    <p>{formData.deliveryAddress.phone}</p>
                    <p>{formData.deliveryAddress.addressLine1}</p>
                    {formData.deliveryAddress.addressLine2 && (
                      <p>{formData.deliveryAddress.addressLine2}</p>
                    )}
                    <p>{formData.deliveryAddress.district} / {formData.deliveryAddress.city} {formData.deliveryAddress.postalCode}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Ödeme Yöntemi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {(formData.paymentMethod === 'credit_card' || formData.paymentMethod === 'debit_card') && (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span className="text-sm">
                          {paymentMethods.find(m => m.type === formData.paymentMethod)?.label}
                          {formData.cardDetails?.cardNumber && (
                            <span className="ml-2">
                              (**** {formData.cardDetails.cardNumber.slice(-4)})
                            </span>
                          )}
                        </span>
                      </>
                    )}
                    {formData.paymentMethod === 'bank_transfer' && (
                      <>
                        <Banknote className="h-4 w-4" />
                        <span className="text-sm">
                          {paymentMethods.find(m => m.type === formData.paymentMethod)?.label}
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sipariş Notu (Opsiyonel)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Siparişinizle ilgili eklemek istediğiniz notlar..."
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              <Card>
                <CardContent className="pt-4 md:pt-6 pb-3 md:pb-4">
                  <div className="flex items-start space-x-2 md:space-x-3">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))
                      }
                      className="shrink-0 mt-0.5"
                    />
                    <Label htmlFor="acceptTerms" className="cursor-pointer text-xs md:text-sm leading-tight">
                      <Link href="/sozlesmeler/satis" className="underline text-primary hover:text-primary/80">Satış sözleşmesi</Link> ve{' '}
                      <Link href="/sozlesmeler/gizlilik" className="underline text-primary hover:text-primary/80">gizlilik politikası</Link>'nı okudum ve kabul ediyorum.
                    </Label>
                  </div>
                  {!formData.acceptTerms && (
                    <div className="flex items-center gap-1.5 md:gap-2 text-amber-600 text-[10px] md:text-xs mt-2 ml-6 md:ml-7">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>Siparişi tamamlamak için sözleşmeleri kabul etmeniz gerekmektedir.</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 3D Secure Waiting State */}
              {is3DSecureWaiting && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-1">3D Güvenlik Doğrulaması Bekleniyor</h3>
                        <p className="text-sm text-blue-700 mb-2">
                          Ödeme işlemi devam ediyor. 3D Secure doğrulama modal'ında işleminizi tamamlayın.
                        </p>
                        {currentOrderNumber && (
                          <p className="text-xs text-blue-600">Sipariş No: {currentOrderNumber}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => currentOrderNumber && checkPaymentStatus(currentOrderNumber)}
                        className="text-blue-700 border-blue-300"
                      >
                                                    Ödeme Durumunu Kontrol Et
                      </Button>
                                            <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          console.log('[CANCEL] 3DS işlemi iptal ediliyor - smart routing check...')
                          
                          // Başarılı sipariş var mı kontrol et (same logic as forceClose3DSModal)
                          const successOrderData = sessionStorage.getItem('successfulOrder')
                          if (successOrderData) {
                            const orderData = JSON.parse(successOrderData)
                            console.log('[✅ CANCEL_REDIRECT] Successful order detected during cancel, redirecting to tracking:', orderData)
                            
                            cleanup3DSModal()
                            sessionStorage.removeItem('successfulOrder') // Temizle
                            clearCart() // Sepeti temizle
                            toast.success('Ödeme başarılı! Sipariş takibi sayfasına yönlendiriliyorsunuz.')
                            
                            // Order tracking sayfasına git
                            router.push(`/siparis-takibi/${orderData.orderNumber}`)
                            return
                          }
                          
                          // Başarılı sipariş yoksa normal iptal işlemi
                          cleanup3DSModal()
                          toast.info('3D Secure işlemi iptal edildi.')
                        }}
                        className="text-gray-600 border-gray-300"
                      >
                        İptal Et
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={prevStep} disabled={is3DSecureWaiting} size="sm" className="h-9 md:h-10">
                  <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="text-xs md:text-sm">Geri</span>
                </Button>
                <Button 
                  onClick={completeOrder} 
                  disabled={!formData.acceptTerms || isProcessing || is3DSecureWaiting}
                  size="sm"
                  className="min-w-[120px] md:min-w-[150px] h-9 md:h-10"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-3.5 w-3.5 md:h-4 md:w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-1 md:mr-2" />
                      <span className="text-xs md:text-sm">İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs md:text-sm">Siparişi Tamamla</span>
                      <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right - Order Summary (Sticky) */}
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-4">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-base md:text-lg">Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6 pt-0">
              {/* Items */}
              <div className="space-y-2 md:space-y-3 max-h-48 md:max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-xs md:text-sm">
                    <div className="flex-1 pr-2">
                      <p className="font-medium line-clamp-2">{item.product.name}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">{item.quantity} adet</p>
                    </div>
                    <p className="font-medium shrink-0">
                      {(item.product.price * item.quantity).toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Price Details */}
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span className="font-medium">{subtotal.toLocaleString('tr-TR')} ₺</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs md:text-sm text-green-600">
                    <span>İndirimler</span>
                    <span>-{discount.toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
                <div className="flex justify-between text-xs md:text-sm">
                  <div className="flex items-center gap-1.5">
                    <span>Kargo</span>
                    <span className="text-[9px] md:text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                      ÜCRETSİZ
                    </span>
                  </div>
                  <span className="text-green-600 font-medium">
                    Ücretsiz
                  </span>
                </div>

              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="font-semibold">Toplam</span>
                <div className="text-right">
                  <p className="text-xl font-bold">
                    {total.toLocaleString('tr-TR')} ₺
                  </p>
                  <p className="text-xs text-muted-foreground">KDV Dahil</p>
                </div>
              </div>

              {/* Security Info */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="flex flex-col items-center text-center gap-1">
                  <Truck className="h-4 w-4 text-primary" />
                  <p className="text-xs">Hızlı Teslimat</p>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-xs">Güvenli Ödeme</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 