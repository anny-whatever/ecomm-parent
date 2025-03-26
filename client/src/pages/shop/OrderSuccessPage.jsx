import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiShoppingBag, FiClock, FiHome } from 'react-icons/fi';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState({
    orderId: '',
    orderTotal: 0
  });

  useEffect(() => {
    // Get order details from location state
    if (location.state?.orderId) {
      setOrderDetails({
        orderId: location.state.orderId,
        orderTotal: location.state.orderTotal || 0
      });
    } else {
      // If no order details, redirect to home
      navigate('/');
    }
    
    // Clear cart from local storage
    try {
      localStorage.removeItem('cart');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  }, [location, navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-5">
            <FiCheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You For Your Order!</h1>
          <p className="text-lg text-gray-600">Your order has been placed successfully.</p>
        </div>
        
        <div className="border-t border-b border-gray-200 py-4 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-lg font-medium text-gray-900">{orderDetails.orderId}</p>
            </div>
            
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="text-lg font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-lg font-medium text-gray-900">${orderDetails.orderTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">What Happens Next?</h2>
          
          <div className="space-y-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-light text-primary">
                  <FiClock className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Order Processing</h3>
                <p className="text-gray-600">
                  We're preparing your order for shipment. You'll receive an email once your order has been shipped.
                </p>
              </div>
            </div>
            
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-light text-primary">
                  <FiShoppingBag className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Track Your Order</h3>
                <p className="text-gray-600">
                  You can track your order status in your account dashboard under the orders section.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Link 
            to="/orders"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none"
          >
            <FiShoppingBag className="mr-2" /> View Orders
          </Link>
          
          <Link 
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <FiHome className="mr-2" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage; 