import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiClock, FiTruck, FiAlertCircle, FiShoppingBag } from 'react-icons/fi';
import { orderService, authService } from '../../services';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: `/orders/${orderId}` } });
      return;
    }
    
    fetchOrder();
  }, [orderId, navigate]);
  
  const fetchOrder = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      console.log('Fetching order details for:', orderId);
      
      // Simulate API call
      setTimeout(() => {
        // Simulate order data
        const mockOrder = {
          _id: orderId,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          status: 'delivered',
          paymentMethod: 'Credit Card',
          paymentStatus: 'paid',
          shippingMethod: 'Standard',
          shippingAddress: {
            fullName: 'John Doe',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US'
          },
          billingAddress: {
            fullName: 'John Doe',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US'
          },
          items: [
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
          ],
          subtotal: 199.97,
          shipping: 10.00,
          discount: 0,
          total: 209.97,
          trackingNumber: 'TRK12345678',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
        };
        
        setOrder(mockOrder);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await orderService.getOrderById(orderId);
      // setOrder(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      setLoading(false);
      // Navigate to orders page if order not found
      if (error.status === 404) {
        navigate('/orders');
      }
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="h-6 w-6 text-yellow-500" />;
      case 'processing':
        return <FiShoppingBag className="h-6 w-6 text-blue-500" />;
      case 'shipped':
        return <FiTruck className="h-6 w-6 text-purple-500" />;
      case 'delivered':
        return <FiCheckCircle className="h-6 w-6 text-green-500" />;
      case 'cancelled':
        return <FiAlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <FiClock className="h-6 w-6 text-gray-500" />;
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-20 bg-gray-300 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-gray-300 rounded"></div>
            <div className="h-40 bg-gray-300 rounded"></div>
          </div>
          <div className="h-60 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link to="/orders" className="text-primary hover:text-primary-dark flex items-center justify-center">
          <FiArrowLeft className="mr-2" /> Back to Orders
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/orders" className="text-primary hover:text-primary-dark flex items-center">
          <FiArrowLeft className="mr-2" /> Back to Orders
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Order #{order._id}</h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center">
              {getStatusIcon(order.status)}
              <span className={`ml-2 text-sm px-3 py-1 rounded-full ${getStatusClass(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Order Progress (for non-cancelled orders) */}
        {order.status !== 'cancelled' && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Progress</h2>
            
            <div className="relative">
              <div className="absolute left-0 top-5 w-full border-t border-gray-200"></div>
              
              <div className="relative flex justify-between">
                <div className="text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                    ['processing', 'shipped', 'delivered'].includes(order.status) 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <FiShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-900">Processing</div>
                </div>
                
                <div className="text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                    ['shipped', 'delivered'].includes(order.status) 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <FiTruck className="h-5 w-5" />
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-900">Shipped</div>
                </div>
                
                <div className="text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                    order.status === 'delivered' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <FiCheckCircle className="h-5 w-5" />
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-900">Delivered</div>
                </div>
              </div>
            </div>
            
            {order.status === 'shipped' && order.trackingNumber && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  Your order is on its way! Tracking number: <span className="font-medium">{order.trackingNumber}</span>
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Order Items */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
          
          <div className="divide-y divide-gray-200">
            {order.items.map((item) => (
              <div key={item._id} className="py-4 flex">
                <div className="flex-shrink-0 h-24 w-24 rounded-md overflow-hidden border border-gray-200">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-base font-medium text-gray-900">
                    <Link to={`/products/${item.product._id}`} className="hover:text-primary">
                      {item.product.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.quantity} x ${item.product.price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-medium text-gray-900">${item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-gray-200">
          {/* Shipping Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
            
            <div className="bg-gray-50 rounded-md p-4">
              <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
              <p className="text-gray-700">{order.shippingAddress.address}</p>
              <p className="text-gray-700">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p className="text-gray-700">{order.shippingAddress.country}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900">Shipping Method</p>
                <p className="text-sm text-gray-700">{order.shippingMethod}</p>
              </div>
            </div>
          </div>
          
          {/* Payment Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>
            
            <div className="bg-gray-50 rounded-md p-4">
              <p className="font-medium text-gray-900">Payment Method</p>
              <p className="text-gray-700">{order.paymentMethod}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className={`text-sm font-medium ${
                  order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900">Billing Address</p>
                <p className="text-sm text-gray-700">{order.billingAddress.fullName}</p>
                <p className="text-sm text-gray-700">{order.billingAddress.address}</p>
                <p className="text-sm text-gray-700">
                  {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}
                </p>
                <p className="text-sm text-gray-700">{order.billingAddress.country}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <p className="text-gray-700">Subtotal</p>
              <p className="text-gray-900 font-medium">${order.subtotal.toFixed(2)}</p>
            </div>
            
            <div className="flex justify-between">
              <p className="text-gray-700">Shipping</p>
              <p className="text-gray-900 font-medium">${order.shipping.toFixed(2)}</p>
            </div>
            
            {order.discount > 0 && (
              <div className="flex justify-between">
                <p className="text-gray-700">Discount</p>
                <p className="text-green-600 font-medium">-${order.discount.toFixed(2)}</p>
              </div>
            )}
            
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <p className="text-gray-900 font-medium">Total</p>
              <p className="text-gray-900 font-medium">${order.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <button
          type="button"
          className="text-gray-700 hover:text-gray-500 font-medium flex items-center"
          onClick={() => window.print()}
        >
          Download Invoice
        </button>
        
        {order.status === 'delivered' && (
          <Link
            to={`/products/${order.items[0].product._id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
          >
            Buy Again
          </Link>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage; 