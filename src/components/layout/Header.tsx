import { ShoppingCart, User, LogOut } from 'lucide-react'
import { blink } from '../../blink/client'
import { Button } from '../ui/button'

interface User {
  id: string
  email: string
  displayName?: string
}

interface HeaderProps {
  user: User
  cartItemCount: number
  onNavigate: (page: 'home' | 'products' | 'cart' | 'checkout' | 'product-detail') => void
  currentPage: string
}

export function Header({ user, cartItemCount, onNavigate, currentPage }: HeaderProps) {
  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="text-xl font-bold text-blue-600 hover:text-blue-700"
            >
              ShopEasy
            </button>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onNavigate('home')}
              className={`text-sm font-medium transition-colors ${
                currentPage === 'home'
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('products')}
              className={`text-sm font-medium transition-colors ${
                currentPage === 'products'
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Products
            </button>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}