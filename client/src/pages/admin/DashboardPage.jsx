import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiShoppingBag,
  FiDollarSign,
  FiTruck,
  FiBarChart2,
  FiPieChart,
  FiShoppingCart,
  FiAlertCircle
} from 'react-icons/fi';
import { authService } from '../../services';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    recentOrders: [],
    salesByCategory: [],
    salesByMonth: []
  });

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: '/admin/dashboard' } });
      return;
    }
    
    // In a real app, check if user is admin
    // if (!authService.isAdmin()) {
    //   navigate('/');
    //   return;
    // }
    
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      console.log('Fetching dashboard data');
      
      // Simulate API call
      setTimeout(() => {
        // Simulate dashboard data
        const mockStats = {
          totalSales: 15749.99,
          totalOrders: 124,
          totalCustomers: 89,
          pendingOrders: 18,
          lowStockProducts: 7,
          recentOrders: [
            {
              _id: 'ord123',
              orderNumber: 'ORD-2023-001',
              customer: 'John Doe',
              date: '2023-04-28T10:22:31Z',
              amount: 129.99,
              status: 'Delivered'
            },
            {
              _id: 'ord124',
              orderNumber: 'ORD-2023-002',
              customer: 'Jane Smith',
              date: '2023-04-28T09:15:22Z',
              amount: 89.95,
              status: 'Processing'
            },
            {
              _id: 'ord125',
              orderNumber: 'ORD-2023-003',
              customer: 'Robert Johnson',
              date: '2023-04-27T16:44:10Z',
              amount: 259.99,
              status: 'Shipped'
            },
            {
              _id: 'ord126',
              orderNumber: 'ORD-2023-004',
              customer: 'Emily Wilson',
              date: '2023-04-27T14:32:45Z',
              amount: 45.50,
              status: 'Processing'
            },
            {
              _id: 'ord127',
              orderNumber: 'ORD-2023-005',
              customer: 'Michael Brown',
              date: '2023-04-26T21:18:33Z',
              amount: 175.25,
              status: 'Delivered'
            }
          ],
          salesByCategory: [
            { name: 'Electronics', value: 5842.99 },
            { name: 'Clothing', value: 3945.50 },
            { name: 'Home & Kitchen', value: 2987.25 },
            { name: 'Books', value: 1254.75 },
            { name: 'Other', value: 1719.50 }
          ],
          salesByMonth: [
            { name: 'Jan', value: 1245.99 },
            { name: 'Feb', value: 1645.50 },
            { name: 'Mar', value: 1352.25 },
            { name: 'Apr', value: 2157.75 },
            { name: 'May', value: 1864.50 },
            { name: 'Jun', value: 2456.25 }
          ]
        };
        
        setStats(mockStats);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await adminService.getDashboardStats();
      // setStats(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-md shadow-sm p-4 h-24"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="bg-white rounded-md shadow-sm p-4 h-80"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-primary bg-opacity-10">
              <FiDollarSign className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.totalSales)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-indigo-50">
              <FiShoppingCart className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{stats.totalOrders}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-green-50">
              <FiUsers className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{stats.totalCustomers}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-red-50">
              <FiAlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Products</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{stats.lowStockProducts}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          </div>
          <div className="p-6">
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {stats.recentOrders.map((order) => (
                  <li key={order._id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 p-2 rounded-full bg-gray-100">
                        <FiShoppingBag className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.customer} · {formatDate(order.date)}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.amount)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <Link
                to="/admin/orders"
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View all orders
              </Link>
            </div>
          </div>
        </div>
        
        {/* Sales by Category */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Sales by Category</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.salesByCategory.map((category) => (
                <div key={category.name}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(category.value)}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{
                        width: `${(category.value / stats.totalSales) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* More Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-yellow-50">
              <FiTruck className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{stats.pendingOrders}</div>
                </dd>
              </dl>
            </div>
            <div>
              <Link
                to="/admin/orders?status=pending"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View
              </Link>
            </div>
          </div>
        </div>
        
        {/* Low Stock Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-red-50">
              <FiAlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Products</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900">{stats.lowStockProducts}</div>
                </dd>
              </dl>
            </div>
            <div>
              <Link
                to="/admin/products?filter=low-stock"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 