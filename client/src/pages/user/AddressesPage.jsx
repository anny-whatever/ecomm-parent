import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiMapPin } from 'react-icons/fi';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const AddressesPage = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    isDefault: false,
    type: 'shipping' // 'shipping' or 'billing'
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: '/addresses' } });
      return;
    }
    
    fetchAddresses();
  }, [navigate]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      console.log('Fetching addresses');
      
      // Simulate API call
      setTimeout(() => {
        // Simulate addresses data
        const mockAddresses = [
          {
            _id: 'addr1',
            fullName: 'John Doe',
            addressLine1: '123 Main St',
            addressLine2: 'Apt 4B',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'United States',
            phone: '(555) 123-4567',
            isDefault: true,
            type: 'shipping'
          },
          {
            _id: 'addr2',
            fullName: 'John Doe',
            addressLine1: '456 Business Ave',
            addressLine2: 'Suite 200',
            city: 'New York',
            state: 'NY',
            postalCode: '10002',
            country: 'United States',
            phone: '(555) 123-4567',
            isDefault: false,
            type: 'billing'
          }
        ];
        
        setAddresses(mockAddresses);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await userService.getAddresses();
      // setAddresses(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: '',
      isDefault: false,
      type: 'shipping'
    });
    setEditingAddressId(null);
    setFormOpen(false);
  };

  const handleAddNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEdit = (address) => {
    setFormData({ ...address });
    setEditingAddressId(address._id);
    setFormOpen(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }
    
    try {
      // In a real app, this would call the API
      console.log('Deleting address:', addressId);
      
      // Update state optimistically
      setAddresses(addresses.filter(address => address._id !== addressId));
      
      toast.success('Address deleted successfully');
      
      // In a real implementation:
      // await userService.deleteAddress(addressId);
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
      // Revert to original state by refetching
      fetchAddresses();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.fullName || !formData.addressLine1 || !formData.city || !formData.state || 
        !formData.postalCode || !formData.country) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      if (editingAddressId) {
        // Update existing address
        console.log('Updating address:', editingAddressId, formData);
        
        // Handle setting as default
        let updatedAddresses = [...addresses];
        if (formData.isDefault) {
          // If this address is set as default, remove default from other addresses
          updatedAddresses = updatedAddresses.map(addr => ({
            ...addr,
            isDefault: addr._id === editingAddressId ? true : false
          }));
        } else {
          // Just update the edited address
          updatedAddresses = updatedAddresses.map(addr => 
            addr._id === editingAddressId ? { ...formData, _id: editingAddressId } : addr
          );
        }
        
        setAddresses(updatedAddresses);
        toast.success('Address updated successfully');
        
        // In a real implementation:
        // await userService.updateAddress(editingAddressId, formData);
      } else {
        // Add new address
        console.log('Adding new address:', formData);
        
        // Create a mock ID
        const newId = 'addr' + (addresses.length + 1);
        
        // Handle setting as default
        let updatedAddresses = [...addresses];
        if (formData.isDefault) {
          // If this address is set as default, remove default from other addresses
          updatedAddresses = updatedAddresses.map(addr => ({
            ...addr,
            isDefault: false
          }));
        }
        
        // Add the new address
        updatedAddresses.push({
          ...formData,
          _id: newId
        });
        
        setAddresses(updatedAddresses);
        toast.success('Address added successfully');
        
        // In a real implementation:
        // const response = await userService.addAddress(formData);
        // setAddresses([...addresses, response.data]);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleSetDefault = async (addressId) => {
    try {
      // In a real app, this would call the API
      console.log('Setting default address:', addressId);
      
      // Update state optimistically
      const updatedAddresses = addresses.map(address => ({
        ...address,
        isDefault: address._id === addressId
      }));
      
      setAddresses(updatedAddresses);
      toast.success('Default address updated');
      
      // In a real implementation:
      // await userService.setDefaultAddress(addressId);
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to set default address');
      // Revert to original state by refetching
      fetchAddresses();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Addresses</h1>
        <div className="animate-pulse space-y-6">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="bg-white rounded-md shadow-sm p-4 h-36"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
        >
          <FiPlus className="mr-2" /> Add New Address
        </button>
      </div>

      {formOpen && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingAddressId ? 'Edit Address' : 'Add New Address'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                >
                  <option value="shipping">Shipping Address</option>
                  <option value="billing">Billing Address</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  required
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  id="addressLine2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State / Province <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal / Zip Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="isDefault"
                  name="isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                  Set as default {formData.type} address
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                {editingAddressId ? 'Update Address' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      {addresses.length === 0 && !formOpen ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <FiMapPin className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">No addresses saved</h2>
          <p className="text-gray-500 mb-6">Add an address to make checkout faster.</p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
          >
            <FiPlus className="mr-2" /> Add New Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div key={address._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
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
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit address"
                  >
                    <FiEdit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(address._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete address"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <p className="font-medium text-gray-900">{address.fullName}</p>
                <p className="text-gray-700 mt-1">{address.addressLine1}</p>
                {address.addressLine2 && <p className="text-gray-700">{address.addressLine2}</p>}
                <p className="text-gray-700">
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="text-gray-700">{address.country}</p>
                {address.phone && <p className="text-gray-700 mt-1">{address.phone}</p>}
                
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id)}
                    className="mt-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FiCheck className="mr-1" /> Set as Default
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

export default AddressesPage; 