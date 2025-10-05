# Plesk Multi-Service Proxy Setup - Trendyol & Aras Kargo

Bu rehber, Plesk sunucunuzda hem Trendyol test API'si hem de Aras Kargo servisleri için statik IP proxy kurulumunu açıklar.

## 🎯 Amaç
- Vercel'in dinamik IP sorununu çözme
- Trendyol test ortamı için statik IP sağlama
- Aras Kargo SOAP servisi için proxy
- Güvenli multi-service proxy bağlantısı kurma

## 📋 Gereksinimler
- Plesk sunucusu (statik IP ile)
- Domain/subdomain (örn: trendyol-proxy.yourdomain.com)
- SSL sertifikası (Let's Encrypt)

## 🔧 Kurulum Adımları

### 1. Subdomain Oluşturma
```bash
# Plesk Panel'de:
1. Websites & Domains
2. Add Subdomain
3. Subdomain name: trendyol-proxy
4. Document root: /httpdocs/proxy
```

### 2. SSL Sertifikası
```bash
# Plesk Panel'de:
1. SSL/TLS Certificates
2. Let's Encrypt
3. Secure the subdomain
```

### 3. PHP Proxy Dosyaları

#### A) Trendyol Proxy: `/httpdocs/proxy/trendyol-proxy.php`

```php
<?php
// GÜVENLİK: Bu betiğin herkese açık olmasını engellemek için!
define('PROXY_SECRET_KEY', 'UnifiedProxySecret123!@#'); // Mutlaka değiştirin!

$headers = getallheaders();

// Güvenlik anahtarını kontrol et
if (!isset($headers['Authorization']) || $headers['Authorization'] !== 'Bearer ' . PROXY_SECRET_KEY) {
    http_response_code(403);
    die('Trendyol Proxy: Erisim Reddedildi.');
}

// Request URI'yi parse et (suppliers/ sonrası path)
$request_uri = $_SERVER['REQUEST_URI'];
$path = str_replace('/suppliers/', '', parse_url($request_uri, PHP_URL_PATH));
$query_string = $_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : '';

// Trendyol test API'sine yönlendir
$target_url = 'https://stageapigw.trendyol.com/suppliers/' . $path . $query_string;

$request_body = file_get_contents('php://input');
$method = $_SERVER['REQUEST_METHOD'];

// Authorization header'ı Trendyol için düzenle (Basic auth)
$trendyol_auth = $headers['Authorization'];
if (isset($headers['X-Trendyol-Auth'])) {
    $trendyol_auth = $headers['X-Trendyol-Auth'];
}

$forward_headers = [
    'Content-Type: ' . ($headers['Content-Type'] ?? 'application/json'),
    'Authorization: ' . $trendyol_auth
];

$ch = curl_init($target_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
if ($request_body) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $request_body);
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $forward_headers);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response_body = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

http_response_code($http_code);
header('Content-Type: ' . $content_type);
echo $response_body;
?>
```

#### B) Aras Kargo Proxy: `/httpdocs/proxy/cargo-proxy.php`

```php
<?php
// GÜVENLİK: Bu betiğin herkese açık olmasını engellemek için!
define('PROXY_SECRET_KEY', 'UnifiedProxySecret123!@#'); // Mutlaka değiştirin!

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, SOAPAction");

// OPTIONS request için erken döner
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// WSDL request kontrolü - AUTHORIZATION KONTROLÜNDEN ÖNCE!
$isWsdlRequest = (isset($_GET['wsdl']) && $_GET['wsdl'] == '1') || 
                 strpos($_SERVER['REQUEST_URI'], '?wsdl') !== false ||
                 strpos($_SERVER['REQUEST_URI'], '&wsdl') !== false;

if ($isWsdlRequest) {
    // WSDL için authorization gereksiz - direkt WSDL döndür
    $wsdl_url = 'http://customerservicestest.araskargo.com.tr/arascargoservice/arascargoservice.asmx?WSDL';
    error_log("Cargo Service Proxy: " . date('Y-m-d H:i:s') . " - WSDL request to: " . $wsdl_url);
    
    // file_get_contents() yerine curl kullan (daha güvenli)
    $ch = curl_init($wsdl_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'PHP SOAP Client');
    
    $wsdl_content = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($wsdl_content === false || $http_code !== 200) {
        error_log("Cargo Service Proxy: WSDL fetch failed - HTTP: $http_code, cURL Error: $curl_error");
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to fetch WSDL', 
            'http_code' => $http_code,
            'curl_error' => $curl_error,
            'url' => $wsdl_url
        ]);
        exit();
    }
    
    header('Content-Type: text/xml; charset=utf-8');
    echo $wsdl_content;
    exit();
}

// Authorization header'ını al
$auth_header = null;
if (function_exists('getallheaders')) {
    $headers = getallheaders();
    $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : null;
} else {
    // Fallback: HTTP_AUTHORIZATION veya Authorization header'ı al
    $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : 
                  (isset($_SERVER['Authorization']) ? $_SERVER['Authorization'] : null);
}

// Debug: Authorization header'ını log et
error_log("Cargo Service Proxy: " . date('Y-m-d H:i:s') . " - Auth header: " . ($auth_header ? 'Present' : 'Missing'));

// Güvenlik anahtarını kontrol et (sadece SOAP request'leri için)
if (!$auth_header || $auth_header !== 'Bearer ' . PROXY_SECRET_KEY) {
    http_response_code(403);
    error_log("Cargo Service Proxy: " . date('Y-m-d H:i:s') . " - Access denied. Expected: Bearer " . PROXY_SECRET_KEY . ", Got: " . $auth_header);
    die('Aras Cargo Proxy: Erisim Reddedildi.');
}

// Aras Kargo'nun TEST servis adresi
$target_url = 'http://customerservicestest.araskargo.com.tr/arascargoservice/arascargoservice.asmx';

$request_body = file_get_contents('php://input');
$forward_headers = [
    'Content-Type: ' . $headers['Content-Type'],
    'SOAPAction: ' . (isset($headers['SOAPAction']) ? $headers['SOAPAction'] : '')
];

// Log dosyasına istek bilgilerini yaz
error_log("Cargo Service Proxy: " . date('Y-m-d H:i:s') . " - SOAP request to TEST server, Body size: " . strlen($request_body) . " bytes");

$ch = curl_init($target_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $request_body);
curl_setopt($ch, CURLOPT_HTTPHEADER, $forward_headers);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response_body = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

// Log dosyasına yanıt bilgilerini yaz
error_log("Cargo Service Proxy: " . date('Y-m-d H:i:s') . " - Response from TEST server, Status: " . $http_code . ", Response size: " . strlen($response_body) . " bytes");

curl_close($ch);

http_response_code($http_code);
header('Content-Type: ' . $content_type);
echo $response_body;
?>
```

### 4. Nginx Konfigürasyonu
Plesk > Apache & Nginx Settings > Additional nginx directives:

# Trendyol API Proxy Configuration - PHP ile authorization control
location /suppliers/ {
    # CORS headers
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 200;
    }
    
    # PHP proxy dosyasına yönlendir (authorization kontrollü)
    try_files $uri $uri/ /proxy/trendyol-proxy.php;
}

# Aras Kargo Proxy - PHP üzerinden
location /cargo/ {
    # CORS headers for cargo
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, SOAPAction";
    
    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, SOAPAction";
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 200;
    }
    
    # PHP proxy dosyasına yönlendir
    try_files $uri $uri/ /proxy/cargo-proxy.php;
}

# Health check endpoint
location /health {
    access_log off;
    return 200 "Multi-Service Proxy OK\n";
    add_header Content-Type text/plain;
}

# NOT: Plesk'in varsayılan location / konfigürasyonunu bozmamalıyız
# Proxy endpoint'leri (/suppliers/, /cargo/, /health) yeterli
```

### 5. IP Yetkilendirmesi (Opsiyonel)
```bash
# ✅ AVANTAJ: Authorization header kontrollü proxy ile IP yetkilendirmesi gerekmez!
# Ancak ekstra güvenlik için isterseniz IP whitelist de yapabilirsiniz:

# Trendyol için (opsiyonel):
1. Trendyol'u arayın: 0850 258 58 00
2. "Test ortamı IP yetkilendirmesi" isteyin
3. Plesk sunucunuzun IP adresini verin

# Aras Kargo için (opsiyonel):
1. Aras Kargo müşteri hizmetlerini arayın
2. "Entegrasyon IP yetkilendirmesi" isteyin
3. Plesk sunucunuzun IP adresini bildirin

# NOT: Authorization header kontrollü sistem sayesinde IP whitelist zorunlu değil!
```

### 6. Test

#### Trendyol Test:
```bash
# Tek secret ile proxy authorization + Trendyol API credentials
curl -H "Authorization: Bearer UnifiedProxySecret123!@#" \
     -H "X-Trendyol-Auth: Basic YOUR_BASE64_CREDENTIALS" \
     https://trendyol-proxy.yourdomain.com/suppliers/YOUR_SUPPLIER_ID/v2/products

# Response: Trendyol API'den veri dönmeli
```

#### Aras Kargo Test:
```bash
# Aynı secret ile Aras Kargo test
curl -X POST \
     -H "Content-Type: text/xml; charset=utf-8" \
     -H "SOAPAction: http://tempuri.org/IShippingOrderIntegrationService/QueryByReferenceNumber" \
     -H "Authorization: Bearer UnifiedProxySecret123!@#" \
     -d '<soap:Envelope>...</soap:Envelope>' \
     https://trendyol-proxy.yourdomain.com/cargo/

# Response: Aras Kargo SOAP response dönmeli
```

## 🌍 Environment Variables

### .env.local (Next.js)
```bash
# Tek Proxy Sunucusu
PROXY_BASE_URL=https://trendyol-proxy.yourdomain.com
PROXY_SECRET=UnifiedProxySecret123!@#

# Trendyol API credentials (proxy üzerinden geçecek)
TRENDYOL_API_KEY=your_trendyol_api_key
TRENDYOL_SECRET_KEY=your_trendyol_secret_key

# Test mode zorla (development)
TRENDYOL_TEST_MODE=true
```

### Vercel Environment Variables
```bash
# Vercel Dashboard > Settings > Environment Variables
PROXY_BASE_URL=https://trendyol-proxy.yourdomain.com
PROXY_SECRET=UnifiedProxySecret123!@#
TRENDYOL_API_KEY=your_trendyol_api_key
TRENDYOL_SECRET_KEY=your_trendyol_secret_key
```

## 💻 Next.js Uygulamasında Kullanım

### Trendyol API Calls:
```typescript
// services/trendyol-api.ts
const PROXY_BASE_URL = process.env.PROXY_BASE_URL!
const PROXY_SECRET = process.env.PROXY_SECRET!
const TRENDYOL_API_KEY = process.env.TRENDYOL_API_KEY!
const TRENDYOL_SECRET_KEY = process.env.TRENDYOL_SECRET_KEY!

// Base64 encode for Trendyol Basic Auth
const trendyolAuth = btoa(`${TRENDYOL_API_KEY}:${TRENDYOL_SECRET_KEY}`)

export async function getTrendyolProducts(supplierId: string) {
  const response = await fetch(`${PROXY_BASE_URL}/suppliers/${supplierId}/v2/products`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PROXY_SECRET}`,
      'X-Trendyol-Auth': `Basic ${trendyolAuth}`,
      'Content-Type': 'application/json'
    }
  })
  
  return response.json()
}
```

### Aras Kargo SOAP Calls:
```typescript
// services/aras-cargo-api.ts
const PROXY_BASE_URL = process.env.PROXY_BASE_URL!
const PROXY_SECRET = process.env.PROXY_SECRET!

export async function trackArasPackage(trackingNumber: string) {
  const soapEnvelope = `
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
      <!-- SOAP content for tracking -->
    </soap:Envelope>
  `
  
  const response = await fetch(`${PROXY_BASE_URL}/cargo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PROXY_SECRET}`,
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': 'http://tempuri.org/IShippingOrderIntegrationService/QueryByReferenceNumber'
    },
    body: soapEnvelope
  })
  
  return response.text()
}
```

## 🔄 Çalışma Mantığı

### Trendyol API Flow:
```bash
Vercel App → Plesk PHP Proxy (Unified Auth) → Trendyol Test API

1. Next.js uygulaması PROXY_SECRET ile request atar
2. Nginx /suppliers/ location'ı trendyol-proxy.php'ye yönlendirir
3. PHP proxy tek secret ile Authorization header'ı kontrol eder
4. Authorization geçerse, X-Trendyol-Auth header'ı ile Trendyol API'sine istek atar
5. Statik IP avantajı + unified authorization security
```

### Aras Kargo SOAP Flow:
```bash
Vercel App → Plesk PHP Proxy (Unified Auth) → Aras Kargo SOAP Service

1. Next.js uygulaması aynı PROXY_SECRET ile request atar
2. Nginx /cargo/ location'ı cargo-proxy.php'ye yönlendirir
3. PHP proxy aynı secret ile Authorization header'ı kontrol eder
4. Authorization geçerse, SOAP isteğini Aras Kargo'ya iletir
5. Statik IP avantajı + unified authorization security
```

## 🛡️ Güvenlik

### Rate Limiting (Opsiyonel)
```nginx
# Rate limiting ekleyin
limit_req_zone $binary_remote_addr zone=trendyol:10m rate=10r/m;

location /suppliers/ {
    limit_req zone=trendyol burst=5 nodelay;
    # ... diğer konfigürasyon
}
```

### IP Whitelist (Opsiyonel)
```nginx
# Sadece Vercel IP'lerinden erişim
location /suppliers/ {
    # Vercel IP ranges (güncellenmeli)
    allow 76.76.19.0/24;
    allow 76.76.21.0/24;
    deny all;
    
    # ... diğer konfigürasyon
}
```

## 📊 Monitoring

### Log Dosyaları
```bash
# Nginx access logs
/var/www/vhosts/yourdomain.com/logs/access_log

# Nginx error logs  
/var/www/vhosts/yourdomain.com/logs/error_log
```

### Health Check
```bash
# Proxy sağlığını kontrol edin
curl https://trendyol-proxy.yourdomain.com/health

# Response: OK
```

## 🚨 Troubleshooting

### Sık Karşılaşılan Sorunlar

#### 1. 502 Bad Gateway
```bash
Neden: Trendyol API'sine ulaşamıyor
Çözüm: 
- Nginx konfigürasyonunu kontrol edin
- DNS ayarlarını kontrol edin
- Firewall kurallarını kontrol edin
```

#### 2. SSL Handshake Failed
```bash
Neden: SSL sertifika sorunu
Çözüm:
- Let's Encrypt sertifikasını yenileyin
- proxy_ssl_verify off; ayarını kontrol edin
```

#### 3. CORS Errors
```bash
Neden: CORS headers eksik
Çözüm:
- Access-Control headers'ı kontrol edin
- OPTIONS method handling'i kontrol edin
```

## ✅ Test Checklist

### Genel Setup:
- [ ] Subdomain oluşturuldu
- [ ] SSL sertifikası aktif
- [ ] Nginx konfigürasyonu uygulandı
- [ ] Environment variables set edildi
- [ ] Health check çalışıyor
- [ ] Vercel deployment güncelleştirildi

### Trendyol:
- [ ] PHP proxy dosyası yerleştirildi
- [ ] Tek güvenlik anahtarı ayarlandı (unified secret)
- [ ] Plesk IP'si Trendyol'a bildirildi (opsiyonel)
- [ ] Trendyol API test başarılı
- [ ] /suppliers/ endpoint çalışıyor

### Aras Kargo:
- [ ] PHP proxy dosyası yerleştirildi
- [ ] Tek güvenlik anahtarı ayarlandı (unified secret)
- [ ] Plesk IP'si Aras Kargo'ya bildirildi (opsiyonel)
- [ ] SOAP servis test başarılı
- [ ] /cargo/ endpoint çalışıyor

## 🎯 Sonuç

Bu multi-service proxy kurulumdan sonra:

### Trendyol:
- ✅ Vercel uygulamanız statik IP üzerinden Trendyol test API'sine erişebilir
- ✅ IP yetkilendirmesi sorunu çözülür
- ✅ Test ortamında güvenli API testleri yapabilirsiniz

### Aras Kargo:
- ✅ SOAP servisine güvenli proxy erişimi sağlanır
- ✅ Authorization kontrolü ile güvenlik sağlanır
- ✅ Statik IP ile kargo entegrasyonu çalışır

### Genel Avantajlar:
- ✅ **Tek environment variable**: PROXY_BASE_URL + PROXY_SECRET
- ✅ **IP whitelist gerekmiyor**: Authorization header ile güvenlik
- ✅ **Vercel IP sorunu çözüldü**: Dinamik IP problemi ortadan kalktı
- ✅ **Tek proxy sunucusu**: Multiple servis desteği
- ✅ **Unified authorization**: Her iki servis aynı secret kullanır
- ✅ **Çift güvenlik katmanı**: Authorization + opsiyonel IP whitelist
- ✅ **Maliyet etkin**: Tek sunucu, multiple servis
- ✅ **Merkezi log yönetimi**: Tüm API çağrıları tek yerden
- ✅ **Production ortamında proxy kullanılmaz**: Direkt API erişimi 