import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiSearch, FiMail, FiPhone, FiCalendar, FiFilter, FiDownload } from 'react-icons/fi';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const CustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name_asc, name_desc

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: '/admin/customers' } });
      return;
    }
    
    // In a real app, check if user is admin
    // if (!authService.isAdmin()) {
    //   navigate('/');
    //   return;
    // }
    
    fetchCustomers();
  }, [navigate, filter, sortBy]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      console.log('Fetching customers with filter:', filter, 'and sort:', sortBy);
      
      // Simulate API call
      setTimeout(() => {
        // Simulate customers data
        const mockCustomers = [
          {
            _id: 'cust1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '(555) 123-4567',
            createdAt: '2023-02-15T10:22:31Z',
            lastLogin: '2023-04-25T14:33:21Z',
            status: 'active',
            ordersCount: 5,
            totalSpent: 499.95
          },
          {
            _id: 'cust2',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            phone: '(555) 987-6543',
            createdAt: '2023-03-10T15:18:42Z',
            lastLogin: '2023-04-26T09:15:10Z',
            status: 'active',
            ordersCount: 3,
            totalSpent: 259.97
          },
          {
            _id: 'cust3',
            name: 'Robert Johnson',
            email: 'robert.johnson@example.com',
            phone: '(555) 456-7890',
            createdAt: '2023-01-22T08:45:19Z',
            lastLogin: '2023-03-15T11:22:33Z',
            status: 'inactive',
            ordersCount: 1,
            totalSpent: 89.99
          },
          {
            _id: 'cust4',
            name: 'Emily Wilson',
            email: 'emily.wilson@example.com',
            phone: '(555) 234-5678',
            createdAt: '2023-04-05T16:30:27Z',
            lastLogin: '2023-04-27T18:45:12Z',
            status: 'active',
            ordersCount: 2,
            totalSpent: 179.98
          },
          {
            _id: 'cust5',
            name: 'Michael Brown',
            email: 'michael.brown@example.com',
            phone: '(555) 876-5432',
            createdAt: '2023-02-28T12:10:05Z',
            lastLogin: null,
            status: 'inactive',
            ordersCount: 0,
            totalSpent: 0
          }
        ];
        
        // Apply filters
        let filteredCustomers = [...mockCustomers];
        
        if (filter !== 'all') {
          filteredCustomers = filteredCustomers.filter(customer => customer.status === filter);
        }
        
        // Apply search
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredCustomers = filteredCustomers.filter(customer => 
            customer.name.toLowerCase().includes(term) || 
            customer.email.toLowerCase().includes(term) ||
            customer.phone.includes(term)
          );
        }
        
        // Apply sorting
        switch (sortBy) {
          case 'newest':
            filteredCustomers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
          case 'oldest':
            filteredCustomers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
          case 'name_asc':
            filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'name_desc':
            filteredCustomers.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case 'orders_high':
            filteredCustomers.sort((a, b) => b.ordersCount - a.ordersCount);
            break;
          case 'orders_low':
            filteredCustomers.sort((a, b) => a.ordersCount - b.ordersCount);
            break;
          case 'spent_high':
            filteredCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
            break;
          case 'spent_low':
            filteredCustomers.sort((a, b) => a.totalSpent - b.totalSpent);
            break;
          default:
            break;
        }
        
        setCustomers(filteredCustomers);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await adminService.getCustomers({ filter, sortBy, search: searchTerm });
      // setCustomers(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleExport = () => {
    toast.success('Customers list exported successfully');
    // In a real implementation, this would trigger a download
    // window.location.href = '/api/admin/customers/export';
  };

  const handleToggleStatus = async (customerId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      // In a real app, this would call the API
      console.log('Toggling customer status:', customerId, 'to', newStatus);
      
      // Update state optimistically
      setCustomers(customers.map(customer => 
        customer._id === customerId 
          ? { ...customer, status: newStatus } 
          : customer
      ));
      
      toast.success(`Customer status updated to ${newStatus}`);
      
      // In a real implementation:
      // await adminService.updateCustomerStatus(customerId, { status: newStatus });
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast.error('Failed to update customer status');
      fetchCustomers(); // Revert to original state by refetching
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        </div>
        <div className="animate-pulse space-y-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-white rounded-md shadow-sm p-4 h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <FiDownload className="mr-2" /> Export Customers
        </button>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-500">Filter by:</span>
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  filter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange('all')}
              >
                All
              </button>
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  filter === 'active'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange('active')}
              >
                Active
              </button>
              <button
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  filter === 'inactive'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange('inactive')}
              >
                Inactive
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-full sm:w-auto">
              <form onSubmit={handleSearchSubmit} className="flex">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search customers..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <button
                  type="submit"
                  className="ml-3 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  Search
                </button>
              </form>
            </div>
            
            <div className="w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <FiFilter className="text-gray-400" />
                <label htmlFor="sort" className="text-sm font-medium text-gray-500">
                  Sort by:
                </label>
                <select
                  id="sort"
                  name="sort"
                  value={sortBy}
                  onChange={handleSortChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="newest">Newest Customers</option>
                  <option value="oldest">Oldest Customers</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="orders_high">Most Orders</option>
                  <option value="orders_low">Least Orders</option>
                  <option value="spent_high">Highest Spend</option>
                  <option value="spent_low">Lowest Spend</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Customers List */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <FiUser className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No customers found</h3>
          {searchTerm ? (
            <p className="mt-1 text-sm text-gray-500">
              No results match your search criteria. Try adjusting your search terms.
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              No customers available in the selected filter.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <Link to={`/admin/customers/${customer._id}`} className="hover:text-primary">
                              {customer.name}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">ID: {customer._id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiMail className="mr-1 text-gray-500" /> {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <FiPhone className="mr-1 text-gray-500" /> {customer.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiCalendar className="mr-1 text-gray-500" /> {formatDate(customer.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(customer.lastLogin)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.ordersCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(customer.totalSpent)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(customer._id, customer.status)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {customer.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/admin/customers/${customer._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage; 