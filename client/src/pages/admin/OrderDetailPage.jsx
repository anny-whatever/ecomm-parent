import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPackage,
  FiCreditCard,
  FiUser,
  FiTruck,
  FiMapPin,
  FiPrinter,
  FiDownload,
  FiMail
} from 'react-icons/fi';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const OrderDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: `/admin/orders/${id}` } });
      return;
    }
    
    // In a real app, check if user is admin
    // if (!authService.isAdmin()) {
    //   navigate('/');
    //   return;
    // }
    
    fetchOrder();
  }, [navigate, id]);
  
  const fetchOrder = async () => {
    setLoading(true);
    try {
      // Simulate API call
      console.log('Fetching order:', id);
      
      setTimeout(() => {
        // Simulate order data
        const mockOrder = {
          _id: 'ord123',
          orderNumber: 'ORD-2023-001',
          customer: {
            _id: 'cust1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '555-123-4567'
          },
          items: [
            { 
              _id: 'item1', 
              product: {
                _id: 'prod1',
                name: 'Wireless Bluetooth Headphones',
                sku: 'SKU-001',
                image: '/images/products/headphones.jpg'
              },
              quantity: 1, 
              price: 99.99,
              total: 99.99
            },
            { 
              _id: 'item2', 
              product: {
                _id: 'prod2',
                name: 'Smartphone Gimbal Stabilizer',
                sku: 'SKU-002',
                image: '/images/products/gimbal.jpg'
              },
              quantity: 1, 
              price: 79.99,
              total: 79.99
            }
          ],
          subtotal: 179.98,
          shippingCost: 5.99,
          discount: 0,
          tax: 10.80,
          total: 196.77,
          status: 'Delivered',
          statusHistory: [
            { status: 'Processing', timestamp: '2023-04-28T10:22:31Z', note: 'Order received' },
            { status: 'Shipped', timestamp: '2023-04-29T15:45:22Z', note: 'Order shipped via UPS' },
            { status: 'Delivered', timestamp: '2023-05-02T14:30:15Z', note: 'Order delivered' }
          ],
          shippingAddress: {
            fullName: 'John Doe',
            address: '123 Main St',
            apartment: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
            phone: '555-123-4567'
          },
          billingAddress: {
            fullName: 'John Doe',
            address: '123 Main St',
            apartment: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
            phone: '555-123-4567'
          },
          paymentStatus: 'Paid',
          paymentMethod: 'Credit Card',
          notes: 'Please leave the package at the door',
          createdAt: '2023-04-28T10:22:31Z',
          updatedAt: '2023-05-02T14:30:15Z',
          trackingNumber: '1Z999AA10123456784',
          carrier: 'UPS'
        };
        
        setOrder(mockOrder);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await adminService.getOrder(id);
      // setOrder(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
      navigate('/admin/orders');
    }
  };
  
  const handleStatusUpdate = async (newStatus) => {
    if (updatingStatus) return;
    
    setUpdatingStatus(true);
    try {
      // Simulate API call
      console.log('Updating order status:', id, newStatus);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update state optimistically
      const now = new Date().toISOString();
      setOrder(prevOrder => ({
        ...prevOrder,
        status: newStatus,
        statusHistory: [
          { status: newStatus, timestamp: now, note: `Status updated to ${newStatus}` },
          ...prevOrder.statusHistory
        ],
        updatedAt: now
      }));
      
      toast.success(`Order status updated to ${newStatus}`);
      
      // In a real implementation:
      // await adminService.updateOrderStatus(id, { status: newStatus });
      
      setUpdatingStatus(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      setUpdatingStatus(false);
      fetchOrder(); // Revert to original state by refetching
    }
  };
  
  const handleSendInvoice = async () => {
    try {
      // Simulate API call
      console.log('Sending invoice for order:', id);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Invoice sent to customer');
      
      // In a real implementation:
      // await adminService.sendInvoice(id);
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice');
    }
  };
  
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPaymentStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };
  
  const formatDateTime = (dateString) => {
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link 
            to="/admin/orders" 
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link 
            to="/admin/orders" 
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiPrinter className="mr-2 -ml-1 h-5 w-5" />
            Print
          </button>
          
          <button
            onClick={handleSendInvoice}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiMail className="mr-2 -ml-1 h-5 w-5" />
            Send Invoice
          </button>
          
          <button
            onClick={() => {}} // In a real app, download invoice
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiDownload className="mr-2 -ml-1 h-5 w-5" />
            Download
          </button>
        </div>
      </div>
      
      {/* Order Summary */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-500">Status</div>
              <div className="flex flex-col">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
                <span className="text-sm text-gray-500 mt-2">
                  Last Updated: {formatDateTime(order.updatedAt)}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-500">Payment</div>
              <div className="flex flex-col">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusClass(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus}
                </span>
                <span className="text-sm text-gray-500 mt-2">
                  {order.paymentMethod}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-500">Customer</div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {order.customer.name}
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  {order.customer.email}
                </span>
                {order.customer.phone && (
                  <span className="text-sm text-gray-500 mt-1">
                    {order.customer.phone}
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-500">Date Placed</div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(order.createdAt)}
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  {formatTime(order.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Order Items */}
        <div className="md:col-span-2">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item._id} className="p-6 flex items-center">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={item.product.image || 'https://via.placeholder.com/150'}
                      alt={item.product.name}
                      className="w-full h-full object-center object-cover"
                    />
                  </div>
                  <div className="ml-6 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          <Link
                            to={`/admin/products/edit/${item.product._id}`}
                            className="hover:text-primary"
                          >
                            {item.product.name}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">SKU: {item.product.sku}</p>
                        <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-600">
                <p>Subtotal</p>
                <p>{formatCurrency(order.subtotal)}</p>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <p>Shipping</p>
                <p>{formatCurrency(order.shippingCost)}</p>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <p>Discount</p>
                  <p>-{formatCurrency(order.discount)}</p>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <p>Tax</p>
                <p>{formatCurrency(order.tax)}</p>
              </div>
              <div className="flex justify-between font-medium text-gray-900 mt-4 pt-4 border-t border-gray-200">
                <p>Total</p>
                <p>{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>
          
          {/* Tracking & Status */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Status & Tracking</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {['Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={updatingStatus || order.status === status}
                      className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md 
                        ${order.status === status
                          ? 'border-primary bg-primary-light text-primary cursor-default'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                
                {order.trackingNumber && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700">Tracking Information</h3>
                    <div className="mt-2 flex items-center">
                      <FiTruck className="mr-2 h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {order.carrier}: {order.trackingNumber}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Status History</h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {order.statusHistory.map((history, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== order.statusHistory.length - 1 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            ></span>
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span
                                className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  index === 0 ? 'bg-primary' : 'bg-gray-300'
                                }`}
                              >
                                <FiPackage
                                  className={`h-5 w-5 ${
                                    index === 0 ? 'text-white' : 'text-gray-500'
                                  }`}
                                  aria-hidden="true"
                                />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  {history.status} {history.note && `- ${history.note}`}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDateTime(history.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Customer & Shipping Information */}
        <div className="space-y-8">
          {/* Customer Info */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Customer</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <FiUser className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">{order.customer.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{order.customer.email}</p>
                  {order.customer.phone && (
                    <p className="text-sm text-gray-500 mt-1">{order.customer.phone}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <Link
                  to={`/admin/customers/${order.customer._id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Customer
                </Link>
              </div>
            </div>
          </div>
          
          {/* Shipping Address */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiMapPin className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">{order.shippingAddress.fullName}</h3>
                  <p className="text-sm text-gray-500 mt-1">{order.shippingAddress.address}</p>
                  {order.shippingAddress.apartment && (
                    <p className="text-sm text-gray-500">{order.shippingAddress.apartment}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-sm text-gray-500">{order.shippingAddress.country}</p>
                  <p className="text-sm text-gray-500 mt-1">{order.shippingAddress.phone}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Billing Address */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Billing Address</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <FiCreditCard className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">{order.billingAddress.fullName}</h3>
                  <p className="text-sm text-gray-500 mt-1">{order.billingAddress.address}</p>
                  {order.billingAddress.apartment && (
                    <p className="text-sm text-gray-500">{order.billingAddress.apartment}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}
                  </p>
                  <p className="text-sm text-gray-500">{order.billingAddress.country}</p>
                  <p className="text-sm text-gray-500 mt-1">{order.billingAddress.phone}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Order Notes</h2>
              </div>
              
              <div className="p-6">
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage; 