import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface CartItem {
  id: string
  userId: string
  productId: string
  quantity: number
  product?: Product
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
  stockQuantity: number
}

interface CartPageProps {
  onNavigate: (page: 'home' | 'products' | 'cart' | 'checkout' | 'product-detail') => void
  onCartUpdate: () => void
}

export function CartPage({ onNavigate, onCartUpdate }: CartPageProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const { toast } = useToast()

  const loadCartItems = useCallback(async () => {
    setLoading(true)
    try {
      const user = await blink.auth.me()
      
      // Get cart items
      const items = await blink.db.cartItems.list({
        where: { userId: user.id }
      })

      // Get product details for each cart item
      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          const products = await blink.db.products.list({
            where: { id: item.productId }
          })
          return {
            ...item,
            product: products[0] || null
          }
        })
      )

      // Filter out items where product no longer exists
      const validItems = itemsWithProducts.filter(item => item.product)
      setCartItems(validItems)
    } catch (error) {
      console.error('Failed to load cart items:', error)
      toast({
        title: "Error",
        description: "Failed to load cart items.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadCartItems()
  }, [loadCartItems])

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdating(itemId)
    try {
      await blink.db.cartItems.update(itemId, {
        quantity: newQuantity
      })
      
      // Update local state
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      )
      
      onCartUpdate()
    } catch (error) {
      console.error('Failed to update quantity:', error)
      toast({
        title: "Error",
        description: "Failed to update quantity.",
        variant: "destructive"
      })
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    try {
      await blink.db.cartItems.delete(itemId)
      
      // Update local state
      setCartItems(prev => prev.filter(item => item.id !== itemId))
      
      onCartUpdate()
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart."
      })
    } catch (error) {
      console.error('Failed to remove item:', error)
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive"
      })
    } finally {
      setUpdating(null)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * Number(item.quantity)
    }, 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + Number(item.quantity), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-300 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                      <div className="h-8 bg-gray-300 rounded w-24"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
          
          <div className="text-center py-12">
            <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Button onClick={() => onNavigate('products')} size="lg">
              Start Shopping
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Shopping Cart ({getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''})
        </h1>

        <div className="space-y-4 mb-8">
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 flex-shrink-0">
                    <img
                      src={item.product?.imageUrl}
                      alt={item.product?.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {item.product?.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {item.product?.category}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      ${item.product?.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, Number(item.quantity) - 1)}
                      disabled={updating === item.id || Number(item.quantity) <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold w-12 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                      disabled={updating === item.id || Number(item.quantity) >= (item.product?.stockQuantity || 0)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${((item.product?.price || 0) * Number(item.quantity)).toFixed(2)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    disabled={updating === item.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cart Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Subtotal ({getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''})</span>
                <span className="font-bold text-2xl text-blue-600">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => onNavigate('products')}
                    className="flex-1"
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    onClick={() => onNavigate('checkout')}
                    className="flex-1"
                    size="lg"
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}