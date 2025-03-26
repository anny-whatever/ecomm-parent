import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiClock, FiCheckCircle, FiTruck, FiAlertCircle } from 'react-icons/fi';
import { orderService, authService } from '../../services';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: '/orders' } });
      return;
    }
    
    fetchOrders();
  }, [navigate]);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      console.log('Fetching orders');
      
      // Simulate API call
      setTimeout(() => {
        // Simulate orders data
        const mockOrders = [
          {
            _id: 'ORD123456',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            status: 'delivered',
            total: 199.98,
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
            ]
          },
          {
            _id: 'ORD123457',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            status: 'processing',
            total: 89.99,
            items: [
              {
                _id: 'item3',
                product: {
                  _id: 'product3',
                  name: 'Bluetooth Speaker',
                  price: 89.99,
                  image: 'https://via.placeholder.com/150?text=Speaker'
                },
                quantity: 1,
                price: 89.99
              }
            ]
          },
          {
            _id: 'ORD123458',
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            status: 'cancelled',
            total: 59.97,
            items: [
              {
                _id: 'item4',
                product: {
                  _id: 'product4',
                  name: 'Screen Protector',
                  price: 19.99,
                  image: 'https://via.placeholder.com/150?text=Protector'
                },
                quantity: 3,
                price: 59.97
              }
            ]
          }
        ];
        
        setOrders(mockOrders);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await orderService.getOrders();
      // setOrders(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <FiShoppingBag className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <FiTruck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <FiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <FiAlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FiClock className="h-5 w-5 text-gray-500" />;
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
        <div className="animate-pulse space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-md shadow-sm p-4">
              <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-16 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <FiShoppingBag className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">When you place an order, it will appear here.</p>
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <h2 className="text-lg font-medium text-gray-900">Order #{order._id}</h2>
                  <p className="text-sm text-gray-500">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                    {getStatusIcon(order.status)}
                    <span className={`ml-2 text-sm px-2 py-1 rounded-full ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <Link
                    to={`/orders/${order._id}`}
                    className="text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Items</h3>
                
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">
                          {item.quantity} x ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                <div className="text-sm font-medium text-gray-900">
                  Total: ${order.total.toFixed(2)}
                </div>
                
                {order.status !== 'cancelled' && (
                  <button
                    type="button"
                    className="text-sm font-medium text-gray-700 hover:text-gray-500"
                    onClick={() => window.print()}
                  >
                    Download Invoice
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage; 