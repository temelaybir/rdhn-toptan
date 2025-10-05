'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'
import { CurrencyCode, Currency, CURRENCIES } from '@/types/currency'
import type { ActionResponse } from '@/types/admin/product'

// Enhanced Currency Context Type
interface CurrencyContextType {
  // State
  currentCurrency: Currency
  exchangeRates: Record<string, number>
  isLoading: boolean
  lastUpdated: Date | null
  
  // Currency management with ActionResponse
  setCurrency: (code: CurrencyCode) => Promise<ActionResponse<Currency>>
  refreshRates: () => Promise<ActionResponse<Record<string, number>>>
  
  // Advanced formatters
  formatPrice: (amount: number, options?: Intl.NumberFormatOptions) => string
  formatPriceWithCode: (amount: number, showCode?: boolean) => string
  formatPriceRange: (minAmount: number, maxAmount: number) => string
  formatDiscount: (originalPrice: number, discountedPrice: number) => string
  
  // Currency conversion
  convertPrice: (amount: number, from?: CurrencyCode, to?: CurrencyCode) => number
  convertPriceWithFormatting: (amount: number, from: CurrencyCode, to?: CurrencyCode) => string
  
  // Bulk operations
  formatPrices: (amounts: number[]) => string[]
  convertPrices: (amounts: number[], from?: CurrencyCode, to?: CurrencyCode) => number[]
  
  // Currency utilities
  getAllCurrencies: () => Currency[]
  getSupportedCurrencies: () => CurrencyCode[]
  getCurrencyInfo: (code: CurrencyCode) => Currency | undefined
  isValidCurrency: (code: string) => boolean
  
  // Rate management
  getExchangeRate: (from: CurrencyCode, to: CurrencyCode) => number
  calculateTotal: (items: Array<{ price: number; quantity: number }>) => number
  applyDiscount: (amount: number, discountPercent: number) => number
  calculateTax: (amount: number, taxRate?: number) => number
  
  // Historical data (mock)
  getCurrencyTrend: (code: CurrencyCode) => Promise<ActionResponse<Array<{ date: string; rate: number }>>>
  
  // Settings
  updateCurrencySettings: (settings: Partial<CurrencySettings>) => Promise<ActionResponse<CurrencySettings>>
  getCurrencySettings: () => CurrencySettings
}

// Enhanced Currency Settings
interface CurrencySettings {
  defaultCurrency: CurrencyCode
  autoRefresh: boolean
  refreshInterval: number // minutes
  showCurrencyCode: boolean
  roundingMode: 'round' | 'floor' | 'ceil'
  decimalPlaces: number
  groupSeparator: boolean
  negativeCurrencyFormat: 'parentheses' | 'minus'
  exchangeRateProvider: 'manual' | 'api'
  lastUpdated?: Date
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

// Default settings
const defaultSettings: CurrencySettings = {
  defaultCurrency: 'TRY',
  autoRefresh: true,
  refreshInterval: 60,
  showCurrencyCode: false,
  roundingMode: 'round',
  decimalPlaces: 2,
  groupSeparator: true,
  negativeCurrencyFormat: 'minus',
  exchangeRateProvider: 'manual'
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<CurrencyCode>('TRY')
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [settings, setSettings] = useState<CurrencySettings>(defaultSettings)
  
  // Enhanced exchange rates with more currencies
  const [exchangeRates, setExchangeRates] = useState({
    USD: 32.50,
    EUR: 35.20,
    GBP: 40.15,
    CHF: 36.80,
    CAD: 24.20,
    AUD: 21.75,
    JPY: 0.22,
    CNY: 4.50,
    RUB: 0.35
  })

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('rdhn-commerce-currency') as CurrencyCode
      const savedSettings = localStorage.getItem('rdhn-commerce-currency-settings')
      const savedRates = localStorage.getItem('rdhn-commerce-exchange-rates')
      const savedLastUpdated = localStorage.getItem('rdhn-commerce-currency-updated')
      
      if (savedCurrency && CURRENCIES[savedCurrency]) {
        setCurrentCurrencyCode(savedCurrency)
      }
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsedSettings })
      }
      
      if (savedRates) {
        const parsedRates = JSON.parse(savedRates)
        setExchangeRates(parsedRates)
      }
      
      if (savedLastUpdated) {
        setLastUpdated(new Date(savedLastUpdated))
      }
    } catch (error) {
      console.error('Error loading currency data from localStorage:', error)
    }
  }, [])

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rdhn-commerce-currency', currentCurrencyCode)
      localStorage.setItem('rdhn-commerce-currency-settings', JSON.stringify(settings))
      localStorage.setItem('rdhn-commerce-exchange-rates', JSON.stringify(exchangeRates))
      if (lastUpdated) {
        localStorage.setItem('rdhn-commerce-currency-updated', lastUpdated.toISOString())
      }
    } catch (error) {
      console.error('Error saving currency data to localStorage:', error)
    }
  }, [currentCurrencyCode, settings, exchangeRates, lastUpdated])

  // Auto-refresh rates
  useEffect(() => {
    if (settings.autoRefresh && settings.refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshRates()
      }, settings.refreshInterval * 60 * 1000)
      
      return () => clearInterval(interval)
    }
  }, [settings.autoRefresh, settings.refreshInterval])

  // Currency management
  const setCurrency = async (code: CurrencyCode): Promise<ActionResponse<Currency>> => {
    try {
      if (!CURRENCIES[code]) {
        return {
          success: false,
          error: 'Geçersiz para birimi kodu'
        }
      }

      setCurrentCurrencyCode(code)
      toast.success(`Para birimi ${CURRENCIES[code].name} olarak değiştirildi`)

      return {
        success: true,
        data: CURRENCIES[code],
        message: 'Para birimi başarıyla değiştirildi'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Para birimi değiştirilirken hata oluştu'
      }
    }
  }

  const refreshRates = async (): Promise<ActionResponse<Record<string, number>>> => {
    setIsLoading(true)
    
    try {
      // Mock API call - gerçek uygulamada external API'den rates alınır
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate rate fluctuations
      const newRates = Object.entries(exchangeRates).reduce((acc, [currency, rate]) => {
        const fluctuation = (Math.random() - 0.5) * 0.1 // %5 fluctuation
        acc[currency] = Number((rate * (1 + fluctuation)).toFixed(4))
        return acc
      }, {} as Record<string, number>)
      
      setExchangeRates(newRates)
      setLastUpdated(new Date())
      toast.success('Döviz kurları güncellendi')

      return {
        success: true,
        data: newRates,
        message: 'Döviz kurları başarıyla güncellendi'
      }
    } catch (error) {
      toast.error('Döviz kurları güncellenirken hata oluştu')
      return {
        success: false,
        error: 'Döviz kurları güncellenirken hata oluştu'
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Advanced formatters
  const formatPrice = (amount: number, options?: Intl.NumberFormatOptions): string => {
    const currency = CURRENCIES[currentCurrencyCode]
    const locale = currentCurrencyCode === 'TRY' ? 'tr-TR' : 
                   currentCurrencyCode === 'USD' ? 'en-US' : 'de-DE'
    
    // Apply rounding mode
    let roundedAmount = amount
    switch (settings.roundingMode) {
      case 'floor':
        roundedAmount = Math.floor(amount * 100) / 100
        break
      case 'ceil':
        roundedAmount = Math.ceil(amount * 100) / 100
        break
      default:
        roundedAmount = Math.round(amount * 100) / 100
    }
    
    const formatOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: settings.decimalPlaces,
      maximumFractionDigits: settings.decimalPlaces,
      useGrouping: settings.groupSeparator,
      ...options
    }
    
    const formatted = new Intl.NumberFormat(locale, formatOptions).format(roundedAmount)
    
    // Handle negative currency format
    if (amount < 0 && settings.negativeCurrencyFormat === 'parentheses') {
      const positiveFormatted = new Intl.NumberFormat(locale, formatOptions).format(Math.abs(roundedAmount))
      return currency.position === 'before' 
        ? `(${currency.symbol}${positiveFormatted})`
        : `(${positiveFormatted}${currency.symbol})`
    }
    
    // Apply symbol position
    if (currency.position === 'before') {
      return `${currency.symbol}${formatted}`
    } else {
      return `${formatted}${currency.symbol}`
    }
  }

  const formatPriceWithCode = (amount: number, showCode = settings.showCurrencyCode): string => {
    const formatted = formatPrice(amount)
    return showCode ? `${formatted} ${currentCurrencyCode}` : formatted
  }

  const formatPriceRange = (minAmount: number, maxAmount: number): string => {
    const minFormatted = formatPrice(minAmount)
    const maxFormatted = formatPrice(maxAmount)
    return `${minFormatted} - ${maxFormatted}`
  }

  const formatDiscount = (originalPrice: number, discountedPrice: number): string => {
    const discountAmount = originalPrice - discountedPrice
    const discountPercent = Math.round((discountAmount / originalPrice) * 100)
    
    return `${formatPrice(discountAmount)} tasarruf (%${discountPercent})`
  }

  // Currency conversion
  const convertPrice = (amount: number, from: CurrencyCode = 'TRY', to: CurrencyCode = currentCurrencyCode): number => {
    if (from === to) return amount

    // Convert to TRY first
    let amountInTRY = amount
    if (from !== 'TRY') {
      const fromRate = exchangeRates[from]
      if (!fromRate) {
        console.warn(`Exchange rate not found for ${from}`)
        return amount
      }
      amountInTRY = amount * fromRate
    }

    // Convert from TRY to target currency
    if (to === 'TRY') {
      return amountInTRY
    }

    const toRate = exchangeRates[to]
    if (!toRate) {
      console.warn(`Exchange rate not found for ${to}`)
      return amount
    }

    return amountInTRY / toRate
  }

  const convertPriceWithFormatting = (amount: number, from: CurrencyCode, to: CurrencyCode = currentCurrencyCode): string => {
    const convertedAmount = convertPrice(amount, from, to)
    return formatPrice(convertedAmount)
  }

  // Bulk operations
  const formatPrices = (amounts: number[]): string[] => {
    return amounts.map(amount => formatPrice(amount))
  }

  const convertPrices = (amounts: number[], from: CurrencyCode = 'TRY', to: CurrencyCode = currentCurrencyCode): number[] => {
    return amounts.map(amount => convertPrice(amount, from, to))
  }

  // Currency utilities
  const getAllCurrencies = (): Currency[] => {
    return Object.values(CURRENCIES)
  }

  const getSupportedCurrencies = (): CurrencyCode[] => {
    return Object.keys(CURRENCIES) as CurrencyCode[]
  }

  const getCurrencyInfo = (code: CurrencyCode): Currency | undefined => {
    return CURRENCIES[code]
  }

  const isValidCurrency = (code: string): boolean => {
    return code in CURRENCIES
  }

  // Rate management
  const getExchangeRate = (from: CurrencyCode, to: CurrencyCode): number => {
    if (from === to) return 1
    
    if (from === 'TRY') {
      return 1 / (exchangeRates[to] || 1)
    }
    
    if (to === 'TRY') {
      return exchangeRates[from] || 1
    }
    
    // Convert through TRY
    const toTRY = exchangeRates[from] || 1
    const fromTRY = 1 / (exchangeRates[to] || 1)
    return toTRY * fromTRY
  }

  const calculateTotal = (items: Array<{ price: number; quantity: number }>): number => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    return subtotal
  }

  const applyDiscount = (amount: number, discountPercent: number): number => {
    return amount * (1 - discountPercent / 100)
  }

  const calculateTax = (amount: number, taxRate = 18): number => {
    return amount * (taxRate / 100)
  }

  // Historical data (mock)
  const getCurrencyTrend = async (code: CurrencyCode): Promise<ActionResponse<Array<{ date: string; rate: number }>>> => {
    try {
      // Mock historical data
      const today = new Date()
      const trend = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (29 - i))
        const baseRate = exchangeRates[code] || 1
        const fluctuation = (Math.random() - 0.5) * 0.2
        
        return {
          date: date.toISOString().split('T')[0],
          rate: Number((baseRate * (1 + fluctuation)).toFixed(4))
        }
      })

      return {
        success: true,
        data: trend,
        message: 'Geçmiş kur verisi alındı'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Geçmiş kur verisi alınırken hata oluştu'
      }
    }
  }

  // Settings
  const updateCurrencySettings = async (newSettings: Partial<CurrencySettings>): Promise<ActionResponse<CurrencySettings>> => {
    try {
      const updatedSettings = { ...settings, ...newSettings, lastUpdated: new Date() }
      setSettings(updatedSettings)
      toast.success('Para birimi ayarları güncellendi')

      return {
        success: true,
        data: updatedSettings,
        message: 'Ayarlar başarıyla güncellendi'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Ayarlar güncellenirken hata oluştu'
      }
    }
  }

  const getCurrencySettings = (): CurrencySettings => {
    return settings
  }

  const value: CurrencyContextType = {
    // State
    currentCurrency: CURRENCIES[currentCurrencyCode],
    exchangeRates,
    isLoading,
    lastUpdated,
    
    // Currency management
    setCurrency,
    refreshRates,
    
    // Advanced formatters
    formatPrice,
    formatPriceWithCode,
    formatPriceRange,
    formatDiscount,
    
    // Currency conversion
    convertPrice,
    convertPriceWithFormatting,
    
    // Bulk operations
    formatPrices,
    convertPrices,
    
    // Currency utilities
    getAllCurrencies,
    getSupportedCurrencies,
    getCurrencyInfo,
    isValidCurrency,
    
    // Rate management
    getExchangeRate,
    calculateTotal,
    applyDiscount,
    calculateTax,
    
    // Historical data
    getCurrencyTrend,
    
    // Settings
    updateCurrencySettings,
    getCurrencySettings
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
} 