import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiMapPin, 
  FiShoppingBag, 
  FiDollarSign, 
  FiEdit2,
  FiArrowLeft
} from 'react-icons/fi';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const CustomerDetailPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, addresses, notes

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: `/admin/customers/${customerId}` } });
      return;
    }
    
    // In a real app, check if user is admin
    // if (!authService.isAdmin()) {
    //   navigate('/');
    //   return;
    // }
    
    fetchCustomerDetails();
  }, [customerId, navigate]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      console.log('Fetching customer details for:', customerId);
      
      // Simulate API call
      setTimeout(() => {
        // Simulate customer data
        const mockCustomer = {
          _id: customerId,
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '(555) 123-4567',
          createdAt: '2023-02-15T10:22:31Z',
          lastLogin: '2023-04-25T14:33:21Z',
          status: 'active',
          ordersCount: 5,
          totalSpent: 499.95,
          addresses: [
            {
              _id: 'addr1',
              type: 'shipping',
              isDefault: true,
              fullName: 'John Doe',
              addressLine1: '123 Main St',
              addressLine2: 'Apt 4B',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'United States',
              phone: '(555) 123-4567'
            },
            {
              _id: 'addr2',
              type: 'billing',
              isDefault: true,
              fullName: 'John Doe',
              addressLine1: '456 Business Ave',
              addressLine2: 'Suite 200',
              city: 'New York',
              state: 'NY',
              postalCode: '10002',
              country: 'United States',
              phone: '(555) 123-4567'
            }
          ],
          notes: [
            {
              _id: 'note1',
              text: 'Customer requested a refund for order ORD123456',
              createdAt: '2023-04-10T09:22:31Z',
              createdBy: 'Admin User'
            },
            {
              _id: 'note2',
              text: 'Called customer about delayed shipping for order ORD123457',
              createdAt: '2023-04-15T14:45:12Z',
              createdBy: 'Admin User'
            }
          ]
        };
        
        // Simulate orders data
        const mockOrders = [
          {
            _id: 'ord123',
            orderNumber: 'ORD-2023-001',
            date: '2023-04-15T10:22:31Z',
            status: 'delivered',
            paymentStatus: 'paid',
            items: 3,
            total: 149.97
          },
          {
            _id: 'ord124',
            orderNumber: 'ORD-2023-002',
            date: '2023-03-28T09:15:22Z',
            status: 'processing',
            paymentStatus: 'paid',
            items: 2,
            total: 89.98
          },
          {
            _id: 'ord125',
            orderNumber: 'ORD-2023-003',
            date: '2023-03-10T16:44:10Z',
            status: 'delivered',
            paymentStatus: 'paid',
            items: 1,
            total: 59.99
          },
          {
            _id: 'ord126',
            orderNumber: 'ORD-2023-004',
            date: '2023-02-22T14:32:45Z',
            status: 'delivered',
            paymentStatus: 'paid',
            items: 4,
            total: 129.96
          },
          {
            _id: 'ord127',
            orderNumber: 'ORD-2023-005',
            date: '2023-02-05T21:18:33Z',
            status: 'cancelled',
            paymentStatus: 'refunded',
            items: 2,
            total: 69.98
          }
        ];
        
        setCustomer(mockCustomer);
        setOrders(mockOrders);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const customerResponse = await adminService.getCustomerById(customerId);
      // setCustomer(customerResponse.data);
      // const ordersResponse = await adminService.getCustomerOrders(customerId);
      // setOrders(ordersResponse.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error('Failed to load customer details');
      setLoading(false);
      // Navigate back if customer not found
      if (error.status === 404) {
        navigate('/admin/customers');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!customer) return;
    
    const newStatus = customer.status === 'active' ? 'inactive' : 'active';
    
    try {
      // In a real app, this would call the API
      console.log('Toggling customer status to:', newStatus);
      
      // Update state optimistically
      setCustomer({
        ...customer,
        status: newStatus
      });
      
      toast.success(`Customer status updated to ${newStatus}`);
      
      // In a real implementation:
      // await adminService.updateCustomerStatus(customerId, { status: newStatus });
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast.error('Failed to update customer status');
      // Revert state
      setCustomer({
        ...customer,
        status: customer.status
      });
    }
  };

  const handleAddNote = async () => {
    const noteText = prompt('Enter a note about this customer:');
    if (!noteText) return;
    
    try {
      // In a real app, this would call the API
      console.log('Adding note:', noteText);
      
      // Update state optimistically
      const newNote = {
        _id: 'note' + (customer.notes.length + 1),
        text: noteText,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin User'
      };
      
      setCustomer({
        ...customer,
        notes: [newNote, ...customer.notes]
      });
      
      toast.success('Note added successfully');
      
      // In a real implementation:
      // const response = await adminService.addCustomerNote(customerId, { text: noteText });
      // setCustomer({
      //   ...customer,
      //   notes: [response.data, ...customer.notes]
      // });
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusClass = (status) => {
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

  const getPaymentStatusClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link to="/admin/customers" className="text-primary hover:text-primary-dark mr-4">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-md shadow-sm p-4 h-40"></div>
          <div className="bg-white rounded-md shadow-sm p-4 h-80"></div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link to="/admin/customers" className="text-primary hover:text-primary-dark mr-4">
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Customer Not Found</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <FiUser className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Customer not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The customer you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/admin/customers"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/admin/customers" className="text-primary hover:text-primary-dark mr-4">
          <FiArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
      </div>
      
      {/* Customer Profile Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FiUser className="h-8 w-8 text-gray-500" />
            </div>
            <div className="ml-5">
              <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                  {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  Customer since {formatDate(customer.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleToggleStatus}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {customer.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            <Link
              to={`/admin/customers/${customer._id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
            >
              <FiEdit2 className="mr-2 -ml-0.5 h-4 w-4" /> Edit
            </Link>
          </div>
        </div>
        
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500">Email</div>
            <div className="mt-1 text-sm text-gray-900 flex items-center">
              <FiMail className="mr-1.5 text-gray-400" /> {customer.email}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">Phone</div>
            <div className="mt-1 text-sm text-gray-900 flex items-center">
              <FiPhone className="mr-1.5 text-gray-400" /> {customer.phone || 'Not provided'}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">Last Login</div>
            <div className="mt-1 text-sm text-gray-900 flex items-center">
              <FiCalendar className="mr-1.5 text-gray-400" /> {formatDate(customer.lastLogin)}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">Customer ID</div>
            <div className="mt-1 text-sm text-gray-900">{customer._id}</div>
          </div>
        </div>
        
        <div className="px-6 py-5 bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200">
          <div className="flex items-center">
            <FiShoppingBag className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-500">Total Orders</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{customer.ordersCount}</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <FiDollarSign className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-500">Total Spent</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <FiMapPin className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-500">Addresses</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{customer.addresses.length}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'addresses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('addresses')}
            >
              Addresses
            </button>
            <button
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </button>
          </nav>
        </div>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
              <button
                className="text-sm font-medium text-primary hover:text-primary-dark"
                onClick={() => setActiveTab('orders')}
              >
                View all
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
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
                  {orders.slice(0, 3).map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.items} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusClass(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusClass(order.paymentStatus)}`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(order.total)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Addresses Preview */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Addresses</h3>
              <button
                className="text-sm font-medium text-primary hover:text-primary-dark"
                onClick={() => setActiveTab('addresses')}
              >
                View all
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {customer.addresses.map((address) => (
                <div key={address._id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 mr-2">
                        {address.type === 'shipping' ? 'Shipping' : 'Billing'} Address
                      </span>
                      {address.isDefault && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">{address.fullName}</p>
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p>{address.city}, {address.state} {address.postalCode}</p>
                    <p>{address.country}</p>
                    {address.phone && <p className="mt-1">{address.phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Notes */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Notes</h3>
              <div className="flex space-x-3">
                <button
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  onClick={handleAddNote}
                >
                  Add Note
                </button>
                <button
                  className="text-sm font-medium text-primary hover:text-primary-dark"
                  onClick={() => setActiveTab('notes')}
                >
                  View all
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {customer.notes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notes yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {customer.notes.slice(0, 2).map((note) => (
                    <li key={note._id} className="py-4">
                      <div className="flex space-x-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">{note.createdBy}</h3>
                            <p className="text-sm text-gray-500">{formatDateTime(note.createdAt)}</p>
                          </div>
                          <p className="text-sm text-gray-500">{note.text}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Order History</h3>
          </div>
          
          {orders.length === 0 ? (
            <div className="p-6 text-center">
              <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No orders yet</h3>
              <p className="mt-1 text-sm text-gray-500">This customer hasn't placed any orders yet.</p>
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
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusClass(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusClass(order.paymentStatus)}`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.items}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(order.total)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Saved Addresses</h3>
          </div>
          
          {customer.addresses.length === 0 ? (
            <div className="p-6 text-center">
              <FiMapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No addresses saved</h3>
              <p className="mt-1 text-sm text-gray-500">This customer hasn't saved any addresses yet.</p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {customer.addresses.map((address) => (
                <div key={address._id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 mr-2">
                        {address.type === 'shipping' ? 'Shipping' : 'Billing'} Address
                      </span>
                      {address.isDefault && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">{address.fullName}</p>
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p>{address.city}, {address.state} {address.postalCode}</p>
                    <p>{address.country}</p>
                    {address.phone && <p className="mt-1">{address.phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Customer Notes</h3>
            <button
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              onClick={handleAddNote}
            >
              Add Note
            </button>
          </div>
          
          {customer.notes.length === 0 ? (
            <div className="p-6 text-center">
              <FiUser className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No notes yet</h3>
              <p className="mt-1 text-sm text-gray-500">Add notes about this customer to keep track of important information.</p>
            </div>
          ) : (
            <div className="p-6">
              <ul className="divide-y divide-gray-200">
                {customer.notes.map((note) => (
                  <li key={note._id} className="py-4">
                    <div className="flex space-x-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">{note.createdBy}</h3>
                          <p className="text-sm text-gray-500">{formatDateTime(note.createdAt)}</p>
                        </div>
                        <p className="text-sm text-gray-500">{note.text}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerDetailPage; 