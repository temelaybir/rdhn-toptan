# BizimHesap Integration

Bu paket e-ticaret siparişlerini BizimHesap sistemi ile entegre ederek otomatik faturalandırma sağlar.

## Özellikler

- Sipariş/Fatura ekleme (satış ve alış)
- Otomatik müşteri oluşturma
- Otomatik ürün oluşturma
- Proxy desteği
- TypeScript tip güvenliği
- Hata yönetimi ve logging

## API Dokümantasyonu

BizimHesap API belgelerini şu adreste bulabilirsiniz:
https://apidocs.bizimhesap.com/addinvoice

## Kullanım

```typescript
import { BizimHesapService } from '@rdhn-commerce/bizimhesap-integration'

const service = new BizimHesapService({
  firmId: 'YOUR_FIRM_ID',
  apiEndpoint: 'https://bizimhesap.com/api/b2b/addinvoice'
})

// Satış faturası oluştur
const result = await service.createSalesInvoice(orderData)
```

## Environment Variables

```bash
BIZIMHESAP_FIRM_ID=your_firm_id
BIZIMHESAP_API_ENDPOINT=https://bizimhesap.com/api/b2b/addinvoice
BIZIMHESAP_USE_PROXY=true
BIZIMHESAP_PROXY_HOST=api2.plante.biz
BIZIMHESAP_PROXY_PORT=3128
BIZIMHESAP_PROXY_USER=plante
BIZIMHESAP_PROXY_PASSWORD=h01h0203
``` 