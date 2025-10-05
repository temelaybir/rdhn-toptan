export type CurrencyCode = 'TRY' | 'USD' | 'EUR'

export interface Currency {
  code: CurrencyCode
  symbol: string
  name: string
  position: 'before' | 'after' // Sembol pozisyonu
  decimalSeparator: string
  thousandSeparator: string
  decimalPlaces: number
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  TRY: {
    code: 'TRY',
    symbol: '₺',
    name: 'Türk Lirası',
    position: 'before',
    decimalSeparator: ',',
    thousandSeparator: '.',
    decimalPlaces: 2
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'ABD Doları',
    position: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    position: 'before',
    decimalSeparator: ',',
    thousandSeparator: '.',
    decimalPlaces: 2
  }
}

export interface CurrencySettings {
  defaultCurrency: CurrencyCode
  exchangeRates?: {
    USD: number
    EUR: number
  }
  autoUpdate?: boolean
  lastUpdated?: Date
} 