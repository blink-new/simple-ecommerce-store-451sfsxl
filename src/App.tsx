import { useState, useEffect, useCallback } from 'react'
import { blink } from './blink/client'
import { Toaster } from './components/ui/toaster'
import { Header } from './components/layout/Header'
import { HomePage } from './pages/HomePage'
import { ProductsPage } from './pages/ProductsPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { ProductDetailPage } from './pages/ProductDetailPage'

type Page = 'home' | 'products' | 'cart' | 'checkout' | 'product-detail'

interface User {
  id: string
  email: string
  displayName?: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cartItemCount, setCartItemCount] = useState(0)

  const loadCartItemCount = useCallback(async () => {
    if (!user) return
    try {
      const cartItems = await blink.db.cartItems.list({
        where: { userId: user.id }
      })
      const totalCount = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0)
      setCartItemCount(totalCount)
    } catch (error) {
      console.error('Failed to load cart count:', error)
    }
  }, [user])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      loadCartItemCount()
    }
  }, [user, loadCartItemCount])

  const navigateTo = (page: Page, productId?: string, category?: string) => {
    setCurrentPage(page)
    if (productId) setSelectedProductId(productId)
    if (category) setSelectedCategory(category)
  }

  const updateCartCount = () => {
    loadCartItemCount()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Our Store</h1>
          <p className="text-gray-600 mb-6">Please sign in to start shopping</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />
      case 'products':
        return <ProductsPage onNavigate={navigateTo} category={selectedCategory} />
      case 'cart':
        return <CartPage onNavigate={navigateTo} onCartUpdate={updateCartCount} />
      case 'checkout':
        return <CheckoutPage onNavigate={navigateTo} />
      case 'product-detail':
        return (
          <ProductDetailPage
            productId={selectedProductId}
            onNavigate={navigateTo}
            onCartUpdate={updateCartCount}
          />
        )
      default:
        return <HomePage onNavigate={navigateTo} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        cartItemCount={cartItemCount}
        onNavigate={navigateTo}
        currentPage={currentPage}
      />
      <main className="pt-16">
        {renderCurrentPage()}
      </main>
      <Toaster />
    </div>
  )
}

export default App