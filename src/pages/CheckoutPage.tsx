import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { ArrowLeft, CreditCard } from 'lucide-react'
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

interface CheckoutPageProps {
  onNavigate: (page: 'home' | 'products' | 'cart' | 'checkout' | 'product-detail') => void
}

export function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('')
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
      
      if (validItems.length === 0) {
        toast({
          title: "Cart is empty",
          description: "Please add items to your cart before checkout.",
          variant: "destructive"
        })
        onNavigate('cart')
      }
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
  }, [toast, onNavigate])

  useEffect(() => {
    loadCartItems()
  }, [loadCartItems])

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * Number(item.quantity)
    }, 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + Number(item.quantity), 0)
  }

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a shipping address.",
        variant: "destructive"
      })
      return
    }

    setProcessing(true)
    try {
      const user = await blink.auth.me()
      const total = calculateTotal()
      
      console.log('Processing checkout:', {
        userId: user.id,
        totalAmount: total,
        itemCount: cartItems.length,
        shippingAddress: shippingAddress.trim()
      })
      
      // Create order
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const orderData = {
        id: orderId,
        userId: user.id,
        totalAmount: parseFloat(total.toFixed(2)), // Ensure proper number format
        status: 'pending',
        shippingAddress: shippingAddress.trim()
      }
      
      console.log('Creating order with data:', orderData)
      await blink.db.orders.create(orderData)

      // Create order items
      for (const item of cartItems) {
        await blink.db.orderItems.create({
          id: `orderitem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderId: orderId,
          productId: item.productId,
          quantity: Number(item.quantity),
          price: parseFloat((item.product?.price || 0).toFixed(2)) // Ensure proper number format
        })
      }

      // Clear cart
      for (const item of cartItems) {
        await blink.db.cartItems.delete(item.id)
      }

      toast({
        title: "Order placed successfully!",
        description: `Your order #${orderId} has been placed. Total: $${total.toFixed(2)}`
      })

      // Navigate to home
      onNavigate('home')
    } catch (error) {
      console.error('Failed to process checkout:', error)
      toast({
        title: "Checkout failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-64 bg-gray-300 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => onNavigate('cart')}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Information */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Shipping Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full shipping address..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Payment Information</h4>
                  <p className="text-blue-800 text-sm">
                    This is a demo checkout. In a real store, Stripe payment processing would be integrated here 
                    for secure credit card transactions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <img
                          src={item.product?.imageUrl}
                          alt={item.product?.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × ${item.product?.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          ${((item.product?.price || 0) * Number(item.quantity)).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">
                        Subtotal ({getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''})
                      </span>
                      <span className="text-sm font-medium">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Shipping</span>
                      <span className="text-sm font-medium text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-blue-600">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={processing || !shippingAddress.trim()}
                    className="w-full"
                    size="lg"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    {processing ? 'Processing...' : `Place Order - $${calculateTotal().toFixed(2)}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}