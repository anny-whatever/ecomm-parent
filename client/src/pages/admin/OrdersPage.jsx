import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiEye,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiShoppingBag
} from 'react-icons/fi';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');
  
  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: '/admin/orders' } });
      return;
    }
    
    // In a real app, check if user is admin
    // if (!authService.isAdmin()) {
    //   navigate('/');
    //   return;
    // }
    
    fetchOrders();
  }, [navigate, statusFilter, dateFilter, searchParams]);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API with query params
      console.log('Fetching orders with filters:', { statusFilter, dateFilter, search: searchTerm });
      
      // Simulate API call
      setTimeout(() => {
        // Simulate orders data
        let mockOrders = [
          {
            _id: 'ord123',
            orderNumber: 'ORD-2023-001',
            customer: {
              _id: 'cust1',
              name: 'John Doe',
              email: 'john.doe@example.com'
            },
            items: [
              { product: 'Wireless Bluetooth Headphones', quantity: 1, price: 99.99 },
              { product: 'Smartphone Gimbal Stabilizer', quantity: 1, price: 79.99 }
            ],
            total: 179.98,
            status: 'Delivered',
            paymentStatus: 'Paid',
            paymentMethod: 'Credit Card',
            createdAt: '2023-04-28T10:22:31Z'
          },
          {
            _id: 'ord124',
            orderNumber: 'ORD-2023-002',
            customer: {
              _id: 'cust2',
              name: 'Jane Smith',
              email: 'jane.smith@example.com'
            },
            items: [
              { product: 'Cotton T-Shirt', quantity: 2, price: 24.99 },
              { product: 'Smartphone Gimbal Stabilizer', quantity: 1, price: 79.99 }
            ],
            total: 129.97,
            status: 'Processing',
            paymentStatus: 'Paid',
            paymentMethod: 'PayPal',
            createdAt: '2023-04-28T09:15:22Z'
          },
          {
            _id: 'ord125',
            orderNumber: 'ORD-2023-003',
            customer: {
              _id: 'cust3',
              name: 'Robert Johnson',
              email: 'robert.johnson@example.com'
            },
            items: [
              { product: '4K Action Camera', quantity: 1, price: 149.99 },
              { product: 'Camera Accessory Kit', quantity: 1, price: 35.99 }
            ],
            total: 185.98,
            status: 'Shipped',
            paymentStatus: 'Paid',
            paymentMethod: 'Credit Card',
            createdAt: '2023-04-27T16:44:10Z'
          },
          {
            _id: 'ord126',
            orderNumber: 'ORD-2023-004',
            customer: {
              _id: 'cust4',
              name: 'Emily Wilson',
              email: 'emily.wilson@example.com'
            },
            items: [
              { product: 'Kitchen Knife Set', quantity: 1, price: 89.99 }
            ],
            total: 89.99,
            status: 'Processing',
            paymentStatus: 'Pending',
            paymentMethod: 'Bank Transfer',
            createdAt: '2023-04-27T14:32:45Z'
          },
          {
            _id: 'ord127',
            orderNumber: 'ORD-2023-005',
            customer: {
              _id: 'cust5',
              name: 'Michael Brown',
              email: 'michael.brown@example.com'
            },
            items: [
              { product: 'Wireless Bluetooth Headphones', quantity: 1, price: 99.99 },
              { product: '4K Action Camera', quantity: 1, price: 149.99 },
              { product: 'Cotton T-Shirt', quantity: 1, price: 24.99 }
            ],
            total: 274.97,
            status: 'Delivered',
            paymentStatus: 'Paid',
            paymentMethod: 'Credit Card',
            createdAt: '2023-04-26T21:18:33Z'
          },
          {
            _id: 'ord128',
            orderNumber: 'ORD-2023-006',
            customer: {
              _id: 'cust6',
              name: 'Anna Davis',
              email: 'anna.davis@example.com'
            },
            items: [
              { product: 'Kitchen Knife Set', quantity: 1, price: 89.99 },
              { product: 'Cutting Board', quantity: 1, price: 29.99 }
            ],
            total: 119.98,
            status: 'Cancelled',
            paymentStatus: 'Refunded',
            paymentMethod: 'PayPal',
            createdAt: '2023-04-25T18:08:15Z'
          }
        ];
        
        // Apply status filter
        if (statusFilter) {
          mockOrders = mockOrders.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase());
        }
        
        // Apply date filter
        if (dateFilter) {
          const today = new Date();
          const orderDates = mockOrders.map(order => new Date(order.createdAt));
          
          if (dateFilter === 'today') {
            mockOrders = mockOrders.filter(order => {
              const orderDate = new Date(order.createdAt);
              return orderDate.toDateString() === today.toDateString();
            });
          } else if (dateFilter === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            mockOrders = mockOrders.filter(order => {
              const orderDate = new Date(order.createdAt);
              return orderDate.toDateString() === yesterday.toDateString();
            });
          } else if (dateFilter === 'this-week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            mockOrders = mockOrders.filter(order => {
              const orderDate = new Date(order.createdAt);
              return orderDate >= startOfWeek;
            });
          } else if (dateFilter === 'this-month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            mockOrders = mockOrders.filter(order => {
              const orderDate = new Date(order.createdAt);
              return orderDate >= startOfMonth;
            });
          }
        }
        
        // Apply search
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          mockOrders = mockOrders.filter(order => 
            order.orderNumber.toLowerCase().includes(search) || 
            order.customer.name.toLowerCase().includes(search) ||
            order.customer.email.toLowerCase().includes(search)
          );
        }
        
        // Sort by most recent first
        mockOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setOrders(mockOrders);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const queryParams = new URLSearchParams();
      // if (statusFilter) queryParams.append('status', statusFilter);
      // if (dateFilter) queryParams.append('date', dateFilter);
      // if (searchTerm) queryParams.append('search', searchTerm);
      // 
      // const response = await adminService.getOrders(queryParams);
      // setOrders(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setLoading(false);
    }
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    
    setSearchParams(params);
  };
  
  const handleStatusFilterChange = (newStatus) => {
    const params = new URLSearchParams(searchParams);
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    
    setStatusFilter(newStatus);
    setSearchParams(params);
  };
  
  const handleDateFilterChange = (newDate) => {
    const params = new URLSearchParams(searchParams);
    if (newDate) {
      params.set('date', newDate);
    } else {
      params.delete('date');
    }
    
    setDateFilter(newDate);
    setSearchParams(params);
  };
  
  const getOrderStatusClass = (status) => {
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
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>
        <div className="animate-pulse space-y-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white rounded-md shadow-sm p-4 h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="w-full md:w-1/3">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    type="submit"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
            
            {/* Filters */}
            <div className="w-full md:w-2/3 flex flex-wrap gap-2">
              <div className="relative inline-block w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="">All Statuses</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFilter className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div className="relative inline-block w-full sm:w-auto">
                <select
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="">All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">{order.items.length} item(s)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">{order.customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                      <div className="text-sm text-gray-500">{formatTime(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusClass(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                        <span className="text-sm text-gray-500 mt-1">{order.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className="text-primary hover:text-primary-dark"
                      >
                        <FiEye className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage; 