import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiLock } from 'react-icons/fi';
import { cartService, orderService, authService } from '../../services';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [billingAddress, setBillingAddress] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: '/checkout' } });
      return;
    }
    
    // Pre-fill user data
    const user = authService.getUser();
    if (user) {
      setBillingAddress(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || ''
      }));
    }
    
    fetchCart();
  }, [navigate]);
  
  const fetchCart = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      console.log('Fetching cart for checkout');
      
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
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setLoading(false);
      toast.error('Failed to load cart');
      navigate('/cart');
    }
  };
  
  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleToggleShippingAsBilling = () => {
    setUseShippingAsBilling(!useShippingAsBilling);
    
    if (!useShippingAsBilling) {
      // Copy billing address to shipping
      setShippingAddress({
        fullName: billingAddress.fullName,
        address: billingAddress.address,
        city: billingAddress.city,
        state: billingAddress.state,
        zipCode: billingAddress.zipCode,
        country: billingAddress.country
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    setProcessing(true);
    
    try {
      // In a real app, this would call the API
      console.log('Placing order with:', {
        billingAddress,
        shippingAddress: useShippingAsBilling ? billingAddress : shippingAddress,
        paymentMethod,
        items: cartItems
      });
      
      // Simulate API call
      setTimeout(() => {
        setProcessing(false);
        
        // Redirect to success page
        navigate('/order-success', { 
          state: { 
            orderId: 'ORD-' + Math.floor(Math.random() * 1000000),
            orderTotal: subtotal + shipping - discount
          }
        });
      }, 2000);
      
      // In a real implementation:
      // const response = await orderService.createOrder({
      //   billingAddress,
      //   shippingAddress: useShippingAsBilling ? billingAddress : shippingAddress,
      //   paymentMethod,
      //   items: cartItems.map(item => ({
      //     productId: item.product._id,
      //     quantity: item.quantity,
      //     price: item.product.price
      //   }))
      // });
      // navigate('/order-success', { state: { orderId: response.data.orderId } });
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
      setProcessing(false);
    }
  };
  
  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + item.price, 0);
  const discount = 0; // Would come from applied coupon if any
  const shipping = subtotal > 0 ? 10 : 0;
  const total = subtotal - discount + shipping;
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
          <div className="h-40 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
      
      <div className="mb-4">
        <Link to="/cart" className="text-primary hover:text-primary-dark flex items-center">
          <FiArrowLeft className="mr-2" /> Back to Cart
        </Link>
      </div>
      
      {cartItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add items to your cart before proceeding to checkout.</p>
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Billing Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      required
                      value={billingAddress.fullName}
                      onChange={handleBillingChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={billingAddress.email}
                      onChange={handleBillingChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={billingAddress.phone}
                      onChange={handleBillingChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      value={billingAddress.address}
                      onChange={handleBillingChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={billingAddress.city}
                      onChange={handleBillingChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      required
                      value={billingAddress.state}
                      onChange={handleBillingChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP / Postal Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      required
                      value={billingAddress.zipCode}
                      onChange={handleBillingChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      required
                      value={billingAddress.country}
                      onChange={handleBillingChange}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center">
                    <input
                      id="use-for-shipping"
                      name="use-for-shipping"
                      type="checkbox"
                      checked={useShippingAsBilling}
                      onChange={handleToggleShippingAsBilling}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="use-for-shipping" className="ml-2 block text-sm text-gray-700">
                      Use this address for shipping
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Shipping Information */}
              {!useShippingAsBilling && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="shipping-fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="shipping-fullName"
                        name="fullName"
                        required
                        value={shippingAddress.fullName}
                        onChange={handleShippingChange}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="shipping-address" className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        id="shipping-address"
                        name="address"
                        required
                        value={shippingAddress.address}
                        onChange={handleShippingChange}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="shipping-city" className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        id="shipping-city"
                        name="city"
                        required
                        value={shippingAddress.city}
                        onChange={handleShippingChange}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="shipping-state" className="block text-sm font-medium text-gray-700 mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        id="shipping-state"
                        name="state"
                        required
                        value={shippingAddress.state}
                        onChange={handleShippingChange}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="shipping-zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP / Postal Code
                      </label>
                      <input
                        type="text"
                        id="shipping-zipCode"
                        name="zipCode"
                        required
                        value={shippingAddress.zipCode}
                        onChange={handleShippingChange}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="shipping-country" className="block text-sm font-medium text-gray-700 mb-1">
                        Country
                      </label>
                      <select
                        id="shipping-country"
                        name="country"
                        required
                        value={shippingAddress.country}
                        onChange={handleShippingChange}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="credit-card"
                      name="payment-method"
                      type="radio"
                      value="credit_card"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => setPaymentMethod('credit_card')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="credit-card" className="ml-3 block text-sm font-medium text-gray-700">
                      Credit Card
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="paypal"
                      name="payment-method"
                      type="radio"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="paypal" className="ml-3 block text-sm font-medium text-gray-700">
                      PayPal
                    </label>
                  </div>
                </div>
                
                {paymentMethod === 'credit_card' && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        id="card-number"
                        placeholder="1234 5678 9012 3456"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="card-expiry" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        id="card-expiry"
                        placeholder="MM/YY"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="card-cvc" className="block text-sm font-medium text-gray-700 mb-1">
                        CVC / CVV
                      </label>
                      <input
                        type="text"
                        id="card-cvc"
                        placeholder="123"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Order Summary */}
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                
                <div className="max-h-60 overflow-y-auto mb-4">
                  {cartItems.map((item) => (
                    <div key={item._id} className="flex py-3 border-b border-gray-200">
                      <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">
                          {item.quantity} x ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">${item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-sm font-medium text-gray-900">${subtotal.toFixed(2)}</p>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-600">Discount</p>
                      <p className="text-sm font-medium text-green-600">-${discount.toFixed(2)}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Shipping</p>
                    <p className="text-sm font-medium text-gray-900">${shipping.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <p className="text-base font-medium text-gray-900">Total</p>
                    <p className="text-base font-medium text-gray-900">${total.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none disabled:opacity-50"
                  >
                    {processing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <FiLock className="mr-2" /> Place Order (${total.toFixed(2)})
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-4 text-center text-xs text-gray-500">
                  <p>Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CheckoutPage; 