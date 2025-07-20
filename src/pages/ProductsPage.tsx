import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Search, Filter } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
  stockQuantity: number
}

interface ProductsPageProps {
  onNavigate: (page: 'home' | 'products' | 'cart' | 'checkout' | 'product-detail', productId?: string, category?: string) => void
  category?: string | null
}

export function ProductsPage({ onNavigate, category }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(category || 'all')
  const [sortBy, setSortBy] = useState('name')

  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports']

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const whereClause: any = {}
      
      if (selectedCategory !== 'all') {
        whereClause.category = selectedCategory
      }

      const allProducts = await blink.db.products.list({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        orderBy: { [sortBy]: 'asc' }
      })

      // Filter by search term if provided
      let filteredProducts = allProducts
      if (searchTerm) {
        filteredProducts = allProducts.filter(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setProducts(filteredProducts)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, sortBy, searchTerm])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [loadProducts])

  useEffect(() => {
    if (category) {
      setSelectedCategory(category)
    }
  }, [category])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {selectedCategory === 'all' ? 'All Products' : selectedCategory}
          </h1>
          <p className="text-gray-600">
            Discover our amazing collection of products
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="w-full md:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
            <Button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
              }}
              variant="outline"
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
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
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                      {product.name}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">
                      {product.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.stockQuantity} in stock
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && products.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}