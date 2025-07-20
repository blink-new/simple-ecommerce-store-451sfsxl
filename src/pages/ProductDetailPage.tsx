import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
  stockQuantity: number
}

interface ProductDetailPageProps {
  productId: string | null
  onNavigate: (page: 'home' | 'products' | 'cart' | 'checkout' | 'product-detail') => void
  onCartUpdate: () => void
}

export function ProductDetailPage({ productId, onNavigate, onCartUpdate }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const { toast } = useToast()

  const loadProduct = useCallback(async () => {
    if (!productId) {
      onNavigate('products')
      return
    }

    setLoading(true)
    try {
      const products = await blink.db.products.list({
        where: { id: productId }
      })
      
      if (products.length > 0) {
        setProduct(products[0])
      } else {
        toast({
          title: "Product not found",
          description: "The product you're looking for doesn't exist.",
          variant: "destructive"
        })
        onNavigate('products')
      }
    } catch (error) {
      console.error('Failed to load product:', error)
      toast({
        title: "Error",
        description: "Failed to load product details.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [productId, onNavigate, toast])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change
    if (newQuantity >= 1 && newQuantity <= (product?.stockQuantity || 0)) {
      setQuantity(newQuantity)
    }
  }

  const addToCart = async () => {
    if (!product) return

    setAddingToCart(true)
    try {
      const user = await blink.auth.me()
      
      // Check if item already exists in cart
      const existingCartItems = await blink.db.cartItems.list({
        where: { 
          userId: user.id,
          productId: product.id
        }
      })

      if (existingCartItems.length > 0) {
        // Update existing cart item
        const existingItem = existingCartItems[0]
        const newQuantity = Number(existingItem.quantity) + quantity
        
        await blink.db.cartItems.update(existingItem.id, {
          quantity: newQuantity
        })
      } else {
        // Create new cart item
        await blink.db.cartItems.create({
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          productId: product.id,
          quantity: quantity
        })
      }

      toast({
        title: "Added to cart",
        description: `${quantity} ${product.name}${quantity > 1 ? 's' : ''} added to your cart.`
      })

      onCartUpdate()
      setQuantity(1)
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive"
      })
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-300 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Button onClick={() => onNavigate('products')}>
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => onNavigate('products')}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-white shadow-sm">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mb-2">
                {product.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-2xl font-bold text-blue-600">
                ${product.price.toFixed(2)}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Availability</h3>
              <p className="text-gray-600">
                {product.stockQuantity > 0 ? (
                  <span className="text-green-600">
                    {product.stockQuantity} in stock
                  </span>
                ) : (
                  <span className="text-red-600">Out of stock</span>
                )}
              </p>
            </div>

            {product.stockQuantity > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Quantity Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-lg font-semibold w-12 text-center">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= product.stockQuantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      onClick={addToCart}
                      disabled={addingToCart}
                      className="w-full"
                      size="lg"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {addingToCart ? 'Adding...' : `Add to Cart - $${(product.price * quantity).toFixed(2)}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}