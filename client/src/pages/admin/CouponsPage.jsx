import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiCopy, FiTag, FiFilter, FiSearch } from 'react-icons/fi';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const CouponsPage = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, expired
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage', // percentage or fixed
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    isActive: true,
    usageLimit: '',
    usageCount: 0,
    description: ''
  });

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: '/admin/coupons' } });
      return;
    }
    
    // In a real app, check if user is admin
    // if (!authService.isAdmin()) {
    //   navigate('/');
    //   return;
    // }
    
    fetchCoupons();
  }, [navigate, filter]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      console.log('Fetching coupons with filter:', filter);
      
      // Simulate API call
      setTimeout(() => {
        // Simulate coupons data
        const mockCoupons = [
          {
            _id: 'coup1',
            code: 'WELCOME20',
            type: 'percentage',
            value: 20,
            minOrderAmount: 100,
            maxDiscount: 50,
            startDate: '2023-01-01T00:00:00Z',
            endDate: '2023-12-31T23:59:59Z',
            isActive: true,
            usageLimit: 1000,
            usageCount: 348,
            description: 'Welcome discount for new customers',
            createdAt: '2023-01-01T00:00:00Z'
          },
          {
            _id: 'coup2',
            code: 'SUMMER30',
            type: 'percentage',
            value: 30,
            minOrderAmount: 150,
            maxDiscount: 75,
            startDate: '2023-06-01T00:00:00Z',
            endDate: '2023-08-31T23:59:59Z',
            isActive: true,
            usageLimit: 500,
            usageCount: 125,
            description: 'Summer sale discount',
            createdAt: '2023-05-15T00:00:00Z'
          },
          {
            _id: 'coup3',
            code: 'FLAT50',
            type: 'fixed',
            value: 50,
            minOrderAmount: 200,
            maxDiscount: null,
            startDate: '2023-03-01T00:00:00Z',
            endDate: '2023-03-31T23:59:59Z',
            isActive: false,
            usageLimit: 300,
            usageCount: 298,
            description: 'Flat $50 off on orders above $200',
            createdAt: '2023-02-25T00:00:00Z'
          },
          {
            _id: 'coup4',
            code: 'FREESHIP',
            type: 'fixed',
            value: 15,
            minOrderAmount: 75,
            maxDiscount: null,
            startDate: '2023-01-01T00:00:00Z',
            endDate: '2023-12-31T23:59:59Z',
            isActive: true,
            usageLimit: null,
            usageCount: 567,
            description: 'Free shipping on orders above $75',
            createdAt: '2023-01-10T00:00:00Z'
          }
        ];
        
        // Apply filters
        let filteredCoupons = [...mockCoupons];
        
        if (filter === 'active') {
          const now = new Date();
          filteredCoupons = filteredCoupons.filter(coupon => {
            return coupon.isActive && 
              new Date(coupon.startDate) <= now && 
              new Date(coupon.endDate) >= now;
          });
        } else if (filter === 'expired') {
          const now = new Date();
          filteredCoupons = filteredCoupons.filter(coupon => {
            return !coupon.isActive || new Date(coupon.endDate) < now;
          });
        }
        
        // Apply search
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredCoupons = filteredCoupons.filter(coupon => 
            coupon.code.toLowerCase().includes(term) || 
            (coupon.description && coupon.description.toLowerCase().includes(term))
          );
        }
        
        setCoupons(filteredCoupons);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await adminService.getCoupons({ filter });
      // setCoupons(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
      setLoading(false);
    }
  };

  const generateCouponCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'value' || name === 'minOrderAmount' || name === 'maxDiscount' || name === 'usageLimit') {
      // Handle numeric inputs
      const numValue = value === '' ? '' : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddCoupon = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      minOrderAmount: '',
      maxDiscount: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      isActive: true,
      usageLimit: '',
      usageCount: 0,
      description: ''
    });
    setFormOpen(true);
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon._id);
    
    // Format dates for input elements
    const startDate = new Date(coupon.startDate).toISOString().split('T')[0];
    const endDate = new Date(coupon.endDate).toISOString().split('T')[0];
    
    setFormData({
      ...coupon,
      startDate,
      endDate
    });
    
    setFormOpen(true);
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) {
      return;
    }
    
    try {
      // In a real app, this would call the API
      console.log('Deleting coupon:', couponId);
      
      // Update state optimistically
      setCoupons(coupons.filter(coupon => coupon._id !== couponId));
      
      toast.success('Coupon deleted successfully');
      
      // In a real implementation:
      // await adminService.deleteCoupon(couponId);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
      // Revert to original state by refetching
      fetchCoupons();
    }
  };

  const handleToggleCouponStatus = async (couponId, currentStatus) => {
    try {
      // In a real app, this would call the API
      console.log('Toggling coupon status:', couponId, !currentStatus);
      
      // Update state optimistically
      setCoupons(coupons.map(coupon => 
        coupon._id === couponId 
          ? { ...coupon, isActive: !currentStatus } 
          : coupon
      ));
      
      toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      
      // In a real implementation:
      // await adminService.updateCouponStatus(couponId, { isActive: !currentStatus });
    } catch (error) {
      console.error('Error updating coupon status:', error);
      toast.error('Failed to update coupon status');
      // Revert to original state by refetching
      fetchCoupons();
    }
  };

  const handleCopyCouponCode = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        toast.success(`Coupon code ${code} copied to clipboard`);
      })
      .catch(() => {
        toast.error('Failed to copy coupon code');
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.code) {
      toast.error('Coupon code is required');
      return;
    }
    
    if (!formData.value || formData.value <= 0) {
      toast.error('Coupon value must be greater than 0');
      return;
    }
    
    if (formData.type === 'percentage' && formData.value > 100) {
      toast.error('Percentage discount cannot be greater than 100%');
      return;
    }
    
    try {
      // Format for API submission (convert date strings to ISO format)
      const submissionData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };
      
      if (editingCoupon) {
        // Update existing coupon
        console.log('Updating coupon:', editingCoupon, submissionData);
        
        // Update state optimistically
        setCoupons(coupons.map(coupon => 
          coupon._id === editingCoupon 
            ? { ...submissionData, _id: editingCoupon } 
            : coupon
        ));
        
        toast.success('Coupon updated successfully');
        
        // In a real implementation:
        // await adminService.updateCoupon(editingCoupon, submissionData);
      } else {
        // Add new coupon
        console.log('Adding new coupon:', submissionData);
        
        // Create a mock ID
        const newId = 'coup' + (coupons.length + 1);
        const newCoupon = {
          ...submissionData,
          _id: newId,
          createdAt: new Date().toISOString(),
          usageCount: 0
        };
        
        setCoupons([...coupons, newCoupon]);
        
        toast.success('Coupon added successfully');
        
        // In a real implementation:
        // const response = await adminService.createCoupon(submissionData);
        // setCoupons([...coupons, response.data]);
      }
      
      // Close form and reset state
      setFormOpen(false);
      setEditingCoupon(null);
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Failed to save coupon');
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCoupons();
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isCouponActive = (coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);
    
    return coupon.isActive && startDate <= now && endDate >= now;
  };

  const isCouponExpired = (coupon) => {
    const now = new Date();
    const endDate = new Date(coupon.endDate);
    
    return endDate < now;
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.isActive) {
      return { text: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    } else if (isCouponExpired(coupon)) {
      return { text: 'Expired', color: 'bg-red-100 text-red-800' };
    } else {
      const now = new Date();
      const startDate = new Date(coupon.startDate);
      
      if (startDate > now) {
        return { text: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
      } else {
        return { text: 'Active', color: 'bg-green-100 text-green-800' };
      }
    }
  };

  const getUsageLimitText = (coupon) => {
    if (coupon.usageLimit === null || coupon.usageLimit === '') {
      return 'Unlimited';
    }
    
    return `${coupon.usageCount} / ${coupon.usageLimit}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        </div>
        <div className="animate-pulse space-y-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-md shadow-sm p-4 h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <button
          onClick={handleAddCoupon}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
        >
          <FiPlus className="mr-2" /> Add New Coupon
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
                  filter === 'expired'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterChange('expired')}
              >
                Expired/Inactive
              </button>
            </div>
          </div>
          
          <div className="w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="flex">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search coupons..."
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
        </div>
      </div>
      
      {formOpen && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex items-center space-x-4">
                <div className="flex-grow">
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="code"
                      name="code"
                      required
                      value={formData.code}
                      onChange={handleInputChange}
                      className="flex-grow border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={generateCouponCode}
                      className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                >
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed">Fixed Amount Discount</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                  Value <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-md shadow-sm">
                  {formData.type === 'percentage' ? (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  ) : (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                  )}
                  <input
                    type="number"
                    id="value"
                    name="value"
                    required
                    min="0"
                    max={formData.type === 'percentage' ? '100' : ''}
                    step="any"
                    value={formData.value}
                    onChange={handleInputChange}
                    className={`w-full ${formData.type === 'percentage' ? '' : 'pl-7'} border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary`}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="minOrderAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Amount
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="minOrderAmount"
                    name="minOrderAmount"
                    min="0"
                    step="any"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    className="w-full pl-7 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="maxDiscount" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Discount Amount
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="maxDiscount"
                    name="maxDiscount"
                    min="0"
                    step="any"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    className="w-full pl-7 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for no maximum limit
                </p>
              </div>
              
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  id="usageLimit"
                  name="usageLimit"
                  min="0"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for unlimited usage
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                ></textarea>
              </div>
              
              <div className="md:col-span-2 flex items-center">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Coupon is active and can be used
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 text-right">
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setEditingCoupon(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                {editingCoupon ? 'Update Coupon' : 'Add Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {coupons.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <FiTag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No coupons found</h3>
          {searchTerm ? (
            <p className="mt-1 text-sm text-gray-500">
              No results match your search criteria. Try adjusting your search terms.
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new coupon.
            </p>
          )}
          <button
            onClick={handleAddCoupon}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
          >
            <FiPlus className="mr-2" /> Add New Coupon
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Range
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limits
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                
                return (
                  <tr key={coupon._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                        <button 
                          onClick={() => handleCopyCouponCode(coupon.code)}
                          className="ml-2 text-gray-400 hover:text-gray-500"
                          title="Copy code"
                        >
                          <FiCopy className="h-4 w-4" />
                        </button>
                      </div>
                      {coupon.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{coupon.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.type === 'percentage' 
                          ? `${coupon.value}%` 
                          : `$${coupon.value.toFixed(2)}`
                        }
                      </div>
                      {coupon.minOrderAmount > 0 && (
                        <div className="text-sm text-gray-500">
                          Min. order: ${coupon.minOrderAmount.toFixed(2)}
                        </div>
                      )}
                      {coupon.maxDiscount > 0 && (
                        <div className="text-sm text-gray-500">
                          Max. discount: ${coupon.maxDiscount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(coupon.startDate)}</div>
                      <div className="text-sm text-gray-500">to {formatDate(coupon.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.usageLimit ? `${coupon.usageLimit} uses` : 'Unlimited'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getUsageLimitText(coupon)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleToggleCouponStatus(coupon._id, coupon.isActive)}
                          className={`text-sm font-medium ${coupon.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          title={coupon.isActive ? 'Deactivate coupon' : 'Activate coupon'}
                        >
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEditCoupon(coupon)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit coupon"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete coupon"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CouponsPage; 