import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { ArrowRight, Smartphone, Shirt, Home, Dumbbell } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
  stockQuantity: number
}

interface HomePageProps {
  onNavigate: (page: 'home' | 'products' | 'cart' | 'checkout' | 'product-detail', productId?: string, category?: string) => void
}

const categoryIcons = {
  'Electronics': Smartphone,
  'Clothing': Shirt,
  'Home & Garden': Home,
  'Sports': Dumbbell
}

const categoryColors = {
  'Electronics': 'bg-blue-100 text-blue-600',
  'Clothing': 'bg-purple-100 text-purple-600',
  'Home & Garden': 'bg-green-100 text-green-600',
  'Sports': 'bg-orange-100 text-orange-600'
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const loadFeaturedProducts = async () => {
    try {
      const products = await blink.db.products.list({
        limit: 4,
        orderBy: { createdAt: 'desc' }
      })
      setFeaturedProducts(products)
    } catch (error) {
      console.error('Failed to load featured products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeaturedProducts()
  }, [])

  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports']

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to ShopEasy
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Discover amazing products across 4 categories
          </p>
          <Button
            size="lg"
            onClick={() => onNavigate('products')}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
          >
            Shop Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600">
              Find exactly what you're looking for
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons]
              const colorClass = categoryColors[category as keyof typeof categoryColors]
              
              return (
                <Card
                  key={category}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
                  onClick={() => onNavigate('products', undefined, category)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full ${colorClass} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {category}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Explore our {category.toLowerCase()} collection
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600">
              Check out our latest and greatest items
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-300 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
                  onClick={() => onNavigate('product-detail', product.id)}
                >
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {product.category}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              onClick={() => onNavigate('products')}
              variant="outline"
              size="lg"
            >
              View All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}