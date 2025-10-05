'use client'

import { useState } from 'react'
import { useCart } from '@/context/cart-context'
import { useWishlist } from '@/context/wishlist-context'
import { useUser } from '@/context/user-context'
import { useCurrency } from '@/context/currency-context'
import type { Product } from '@/data/mock-products'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

// Test product with proper number ID
const testProduct: Product = {
  id: 999,  // number ID
  name: 'Test Product - Context Integration',
  price: 199.99,
  original_price: 249.99,
  description: 'Bu ürün context integration testini yapmak için oluşturulmuştur.',
  image_url: '/placeholder-product.svg',
  rating: 4.5,
  review_count: 42,
  category: 'Test',
  stock: 10,
  is_featured: false,
  brand: 'Test Brand',
  features: {
    'Type Safety': 'Full TypeScript support',
    'Context Integration': 'Cross-context compatibility',
    'Number IDs': 'Product ID as number type'
  },
  shipping_info: {
    free_shipping: true,
    estimated_days: '1-3'
  },
  images: ['/placeholder-product.svg']
}

export default function ContextIntegrationTest() {
  const [testResults, setTestResults] = useState<string[]>([])

  // All contexts with proper types
  const {
    cart,
    addToCart,
    isInCart,
    getTotalItems,
    getTotalPrice,
    isLoading: cartLoading
  } = useCart()

  const {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    moveToCart,
    getTotalWishlistItems,
    isLoading: wishlistLoading
  } = useWishlist()

  const {
    user,
    isLoggedIn,
    updateProfile,
    getTotalSpent,
    getLoyaltyLevel,
    isLoading: userLoading
  } = useUser()

  const {
    currentCurrency,
    formatPrice,
    formatPriceWithCode,
    convertPrice,
    setCurrency,
    isLoading: currencyLoading
  } = useCurrency()

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `✅ ${result}`])
  }

  const addTestError = (error: string) => {
    setTestResults(prev => [...prev, `❌ ${error}`])
  }

  // Test 1: Product ID Type Safety
  const testProductIdTypes = () => {
    try {
      // Test number ID in cart context
      const productInCart = isInCart(testProduct.id) // testProduct.id is number
      addTestResult(`Product ID type test - Cart context accepts number ID: ${typeof testProduct.id}`)
      
      // Test number ID in wishlist context
      const productInWishlist = isInWishlist(testProduct.id) // testProduct.id is number
      addTestResult(`Product ID type test - Wishlist context accepts number ID: ${typeof testProduct.id}`)
      
    } catch (error) {
      addTestError(`Product ID type test failed: ${error}`)
    }
  }

  // Test 2: Cart Operations with ActionResponse
  const testCartOperations = async () => {
    try {
      // Test adding product to cart
      await addToCart(testProduct, 2)
      addTestResult(`Cart operation - Added product with number ID ${testProduct.id}`)
      
      // Test cart state
      const totalItems = getTotalItems()
      const totalPrice = getTotalPrice()
      addTestResult(`Cart state - Total items: ${totalItems}, Total price: ${formatPrice(totalPrice)}`)
      
    } catch (error) {
      addTestError(`Cart operations test failed: ${error}`)
    }
  }

  // Test 3: Wishlist Operations with ActionResponse
  const testWishlistOperations = async () => {
    try {
      // Test adding to wishlist
      const addResult = await addToWishlist(testProduct)
      if (addResult.success) {
        addTestResult(`Wishlist operation - Added product: ${addResult.message}`)
      } else {
        addTestError(`Wishlist add failed: ${addResult.error}`)
      }
      
      // Test wishlist state
      const totalWishlistItems = getTotalWishlistItems()
      addTestResult(`Wishlist state - Total items: ${totalWishlistItems}`)
      
    } catch (error) {
      addTestError(`Wishlist operations test failed: ${error}`)
    }
  }

  // Test 4: Cross-Context Integration (Wishlist to Cart)
  const testCrossContextIntegration = async () => {
    try {
      // Add to wishlist first if not already there
      if (!isInWishlist(testProduct.id)) {
        await addToWishlist(testProduct)
      }
      
      // Move from wishlist to cart
      const moveResult = await moveToCart(testProduct.id, 1)
      if (moveResult.success) {
        addTestResult(`Cross-context integration - Moved product from wishlist to cart: ${moveResult.message}`)
      } else {
        addTestError(`Cross-context move failed: ${moveResult.error}`)
      }
      
    } catch (error) {
      addTestError(`Cross-context integration test failed: ${error}`)
    }
  }

  // Test 5: Currency Context Integration
  const testCurrencyIntegration = async () => {
    try {
      // Test price formatting
      const formattedPrice = formatPrice(testProduct.price)
      const formattedPriceWithCode = formatPriceWithCode(testProduct.price, true)
      addTestResult(`Currency formatting - Price: ${formattedPrice}, With code: ${formattedPriceWithCode}`)
      
      // Test currency conversion
      const convertedPrice = convertPrice(testProduct.price, 'TRY', 'USD')
      addTestResult(`Currency conversion - ${formatPrice(testProduct.price)} TRY = $${convertedPrice.toFixed(2)} USD`)
      
      // Test currency change
      const setCurrencyResult = await setCurrency('USD')
      if (setCurrencyResult.success) {
        addTestResult(`Currency change - Changed to ${setCurrencyResult.data?.name}`)
        
        // Change back to TRY
        await setCurrency('TRY')
        addTestResult(`Currency change - Changed back to TRY`)
      }
      
    } catch (error) {
      addTestError(`Currency integration test failed: ${error}`)
    }
  }

  // Test 6: User Context Integration
  const testUserIntegration = async () => {
    try {
      if (user) {
        // Test user stats
        const totalSpent = getTotalSpent()
        const loyaltyLevel = getLoyaltyLevel()
        addTestResult(`User integration - Total spent: ${formatPrice(totalSpent)}, Loyalty: ${loyaltyLevel}`)
        
        // Test profile update
        const updateResult = await updateProfile({ 
          firstName: user.firstName + ' (Updated)'
        })
        if (updateResult.success) {
          addTestResult(`User profile update - Updated name: ${updateResult.data?.firstName}`)
          
          // Revert change
          await updateProfile({ firstName: user.firstName.replace(' (Updated)', '') })
        }
      } else {
        addTestResult(`User integration - No user logged in (testing guest scenario)`)
      }
      
    } catch (error) {
      addTestError(`User integration test failed: ${error}`)
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setTestResults([])
    addTestResult('Starting Context Integration Tests...')
    
    testProductIdTypes()
    await testCartOperations()
    await testWishlistOperations()
    await testCrossContextIntegration()
    await testCurrencyIntegration()
    await testUserIntegration()
    
    addTestResult('All Context Integration Tests Completed!')
    toast.success('Context integration tests completed')
  }

  const clearTests = () => {
    setTestResults([])
  }

  const isAnyLoading = cartLoading || wishlistLoading || userLoading || currencyLoading

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Context Integration Test</h1>
        <p className="text-gray-600 mb-6">
          Bu test, Cart, Wishlist, User ve Currency context'lerinin type safety ve 
          cross-context integration özelliklerini test eder.
        </p>
        
        <div className="flex gap-4 mb-6">
          <Button 
            onClick={runAllTests} 
            disabled={isAnyLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isAnyLoading ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          <Button 
            onClick={clearTests} 
            variant="outline"
          >
            Clear Results
          </Button>
        </div>

        {/* Test Product Display */}
        <Card className="p-4 mb-6 bg-gray-50">
          <h3 className="font-semibold mb-2">Test Product:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>ID: {testProduct.id} (type: {typeof testProduct.id})</div>
            <div>Name: {testProduct.name}</div>
            <div>Price: {formatPrice(testProduct.price)}</div>
            <div>Stock: {testProduct.stock}</div>
          </div>
        </Card>

        {/* Current Context States */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-2">Current Context States:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Cart Items: {getTotalItems()}</div>
            <div>Cart Total: {formatPrice(getTotalPrice())}</div>
            <div>Wishlist Items: {getTotalWishlistItems()}</div>
            <div>Currency: {currentCurrency.name} ({currentCurrency.symbol})</div>
            <div>User: {user ? `${user.firstName} ${user.lastName}` : 'Not logged in'}</div>
            <div>Product in Cart: {isInCart(testProduct.id) ? 'Yes' : 'No'}</div>
            <div>Product in Wishlist: {isInWishlist(testProduct.id) ? 'Yes' : 'No'}</div>
          </div>
        </Card>

        {/* Test Results */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 italic">No test results yet. Click "Run All Tests" to start.</p>
            ) : (
              testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded text-sm font-mono ${
                    result.includes('❌') ? 'bg-red-50 text-red-700' : 
                    result.includes('✅') ? 'bg-green-50 text-green-700' : 
                    'bg-blue-50 text-blue-700'
                  }`}
                >
                  {result}
                </div>
              ))
            )}
          </div>
        </Card>
      </Card>
    </div>
  )
} 