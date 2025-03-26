import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { cartService, authService } from '../../services';
import toast from 'react-hot-toast';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      console.log('Fetching cart');
      
      // Simulate API call
      setTimeout(() => {
        // Simulate cart data
        const mockCartItems = [
          {
            _id: 'item1',
            product: {
              _id: 'product1',
              name: 'Wireless Headphones',
              price: 149.99,
              image: 'https://via.placeholder.com/150?text=Headphones'
            },
            quantity: 1,
            price: 149.99
          },
          {
            _id: 'item2',
            product: {
              _id: 'product2',
              name: 'Smartphone Case',
              price: 24.99,
              image: 'https://via.placeholder.com/150?text=Case'
            },
            quantity: 2,
            price: 49.98
          }
        ];
        
        setCartItems(mockCartItems);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await cartService.getCart();
      // setCartItems(response.data.items);
      // setAppliedCoupon(response.data.coupon);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setLoading(false);
      toast.error('Failed to load cart');
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      // Update locally first for better UX
      const updatedItems = cartItems.map(item => 
        item._id === itemId 
          ? { 
              ...item, 
              quantity: newQuantity,
              price: (item.product.price * newQuantity)
            } 
          : item
      );
      
      setCartItems(updatedItems);
      
      // In a real app, this would call the API
      console.log('Updating quantity:', { itemId, quantity: newQuantity });
      
      // In a real implementation:
      // await cartService.updateCartItem(itemId, { quantity: newQuantity });
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
      // Revert back to previous state
      fetchCart();
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      // Update locally first for better UX
      const updatedItems = cartItems.filter(item => item._id !== itemId);
      setCartItems(updatedItems);
      
      // In a real app, this would call the API
      console.log('Removing item:', itemId);
      
      toast.success('Item removed from cart');
      
      // In a real implementation:
      // await cartService.removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
      // Revert back to previous state
      fetchCart();
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    setApplyingCoupon(true);
    
    try {
      // In a real app, this would call the API
      console.log('Applying coupon:', couponCode);
      
      // Simulate API call
      setTimeout(() => {
        // Simulate coupon application
        if (couponCode.toUpperCase() === 'DISCOUNT10') {
          setAppliedCoupon({
            code: 'DISCOUNT10',
            discount: 10,
            type: 'percentage'
          });
          toast.success('Coupon applied successfully!');
        } else {
          toast.error('Invalid coupon code');
        }
        
        setApplyingCoupon(false);
        setCouponCode('');
      }, 1000);
      
      // In a real implementation:
      // const response = await cartService.applyCoupon(couponCode);
      // setAppliedCoupon(response.data.coupon);
      // toast.success('Coupon applied successfully!');
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error(error.message || 'Failed to apply coupon');
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      // Update locally first for better UX
      setAppliedCoupon(null);
      
      // In a real app, this would call the API
      console.log('Removing coupon');
      
      toast.success('Coupon removed');
      
      // In a real implementation:
      // await cartService.removeCoupon();
    } catch (error) {
      console.error('Error removing coupon:', error);
      toast.error('Failed to remove coupon');
      // Revert back to previous state
      fetchCart();
    }
  };

  const proceedToCheckout = () => {
    // Check if user is logged in
    if (!authService.isAuthenticated()) {
      // Save redirect URL
      localStorage.setItem('redirectUrl', '/checkout');
      // Redirect to login
      navigate('/login');
      toast.error('Please login to continue to checkout');
      return;
    }
    
    navigate('/checkout');
  };

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + item.price, 0);
  
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount = subtotal * (appliedCoupon.discount / 100);
    } else {
      discount = appliedCoupon.discount;
    }
  }
  
  const shipping = subtotal > 0 ? 10 : 0;
  const total = subtotal - discount + shipping;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>
      
      {loading ? (
        <div className="animate-pulse space-y-6">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="bg-white rounded-md shadow-sm p-4 flex gap-4">
              <div className="w-20 h-20 bg-gray-300 rounded-md"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/5"></div>
              </div>
              <div className="w-24 h-8 bg-gray-300 rounded"></div>
            </div>
          ))}
          
          <div className="bg-white rounded-md shadow-sm p-4 max-w-md ml-auto">
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              <div className="h-8 bg-gray-300 rounded w-full mt-4"></div>
            </div>
          </div>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <FiShoppingCart className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-sm font-medium text-gray-700">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item._id} className="px-6 py-4 sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center">
                    {/* Product */}
                    <div className="sm:col-span-6 flex items-center">
                      <div className="flex-shrink-0 h-20 w-20 rounded-md overflow-hidden">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1 flex flex-col">
                        <Link 
                          to={`/products/${item.product._id}`}
                          className="text-base font-medium text-gray-900 hover:text-primary"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item._id)}
                          className="mt-1 sm:hidden text-sm text-gray-500 flex items-center"
                        >
                          <FiTrash2 className="h-4 w-4 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div className="mt-2 sm:mt-0 sm:col-span-2 flex justify-between sm:block">
                      <div className="sm:hidden text-sm text-gray-500">Price:</div>
                      <div className="text-sm font-medium text-gray-900 text-center">
                        ${item.product.price.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Quantity */}
                    <div className="mt-2 sm:mt-0 sm:col-span-2 flex justify-between sm:block text-center">
                      <div className="sm:hidden text-sm text-gray-500">Quantity:</div>
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-700 focus:outline-none"
                          onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item._id, parseInt(e.target.value))}
                          className="mx-2 w-12 text-center border-gray-300 rounded-md"
                        />
                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-700 focus:outline-none"
                          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    {/* Total */}
                    <div className="mt-2 sm:mt-0 sm:col-span-2 flex justify-between sm:block">
                      <div className="sm:hidden text-sm text-gray-500">Total:</div>
                      <div className="flex items-center justify-end">
                        <span className="text-sm font-medium text-gray-900">
                          ${item.price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item._id)}
                          className="ml-4 hidden sm:block text-gray-400 hover:text-gray-500"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-600">Discount</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="ml-2 text-xs text-red-500 hover:text-red-700"
                      >
                        (Remove)
                      </button>
                    </div>
                    <span className="font-medium text-green-600">-${discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">${shipping.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-base font-medium text-gray-900">${total.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Coupon Form */}
              <div className="mt-6">
                <form onSubmit={handleApplyCoupon} className="flex">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 border-gray-300 rounded-l-md focus:ring-primary focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={applyingCoupon}
                    className="px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50"
                  >
                    {applyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </form>
                {appliedCoupon && (
                  <p className="mt-2 text-xs text-green-600">
                    Coupon <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.discount}% off)
                  </p>
                )}
              </div>
              
              {/* Checkout Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={proceedToCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50"
                >
                  Proceed to Checkout
                  <FiArrowRight className="ml-2" />
                </button>
                
                <div className="mt-4 text-center">
                  <Link 
                    to="/products" 
                    className="text-sm text-primary hover:text-primary-dark"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage; 