import Link from 'next/link'

export default function TrendyolAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Trendyol Integration - Admin Panel
          </h1>
          <p className="text-xl text-gray-600">
            RDHN Commerce Trendyol entegrasyonu yönetim paneli
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              🎛️ Dashboard
            </h2>
            <p className="text-gray-600 mb-4">
              Trendyol entegrasyonunu yönetin, ayarları yapılandırın ve senkronizasyon işlemlerini kontrol edin.
            </p>
            <Link 
              href="/admin/trendyol/dashboard"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard'a Git
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              📚 Dokümantasyon
            </h2>
            <p className="text-gray-600 mb-4">
              API endpoints, konfigürasyon rehberleri ve entegrasyon dökümanları.
            </p>
            <div className="space-y-2">
              <a href="/admin/trendyol/docs" className="block text-blue-600 hover:underline">
                📖 Entegrasyon Rehberi
              </a>
              <a href="/admin/trendyol/api" className="block text-blue-600 hover:underline">
                🔗 API Endpoints
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">🚀 Hızlı Başlangıç</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Ortam değişkenlerini (.env.local) yapılandırın</li>
            <li>Supabase migration'larını çalıştırın</li>
            <li>Trendyol API anahtarlarınızı admin panelinden girin</li>
            <li>Kategori eşleştirmelerini yapın</li>
            <li>Ürün senkronizasyonunu başlatın</li>
          </ol>
        </div>
      </div>
    </div>
  )
}