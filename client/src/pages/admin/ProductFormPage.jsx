import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX, FiArrowLeft, FiImage, FiTrash2 } from 'react-icons/fi';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    description: '',
    price: '',
    discount: '0',
    stock: '',
    category: '',
    featuredImage: null,
    additionalImages: [],
    isActive: true,
    metaTitle: '',
    metaDescription: ''
  });
  
  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: `/admin/products/${isEditMode ? 'edit/' + id : 'add'}` } });
      return;
    }
    
    // In a real app, check if user is admin
    // if (!authService.isAdmin()) {
    //   navigate('/');
    //   return;
    // }
    
    fetchCategories();
    
    if (isEditMode) {
      fetchProduct();
    } else {
      setLoading(false);
    }
  }, [navigate, id, isEditMode]);
  
  const fetchCategories = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        const mockCategories = [
          { _id: 'cat1', name: 'Electronics' },
          { _id: 'cat2', name: 'Clothing' },
          { _id: 'cat3', name: 'Home & Kitchen' },
          { _id: 'cat4', name: 'Books' }
        ];
        
        setCategories(mockCategories);
      }, 500);
      
      // In a real implementation:
      // const response = await adminService.getCategories();
      // setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };
  
  const fetchProduct = async () => {
    setLoading(true);
    try {
      // Simulate API call
      console.log('Fetching product:', id);
      
      setTimeout(() => {
        // Mock product data
        const mockProduct = {
          _id: 'prod1',
          name: 'Wireless Bluetooth Headphones',
          slug: 'wireless-bluetooth-headphones',
          sku: 'SKU-001',
          description: 'High-quality wireless headphones with noise cancellation and long battery life.',
          price: 99.99,
          discount: 0,
          stock: 45,
          category: 'cat1',
          featuredImage: '/images/products/headphones.jpg',
          additionalImages: [
            '/images/products/headphones-2.jpg',
            '/images/products/headphones-3.jpg'
          ],
          isActive: true,
          metaTitle: 'Wireless Bluetooth Headphones | Shop',
          metaDescription: 'Buy high-quality wireless headphones with noise cancellation and long battery life.'
        };
        
        setFormData(mockProduct);
        setImagePreview(mockProduct.featuredImage);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await adminService.getProduct(id);
      // setFormData(response.data);
      // setImagePreview(response.data.featuredImage);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      navigate('/admin/products');
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      if (name === 'featuredImage') {
        if (files[0]) {
          setFormData(prev => ({ ...prev, [name]: files[0] }));
          setImagePreview(URL.createObjectURL(files[0]));
        }
      } else if (name === 'additionalImages') {
        // Handle multiple files
        const newFiles = Array.from(files);
        setFormData(prev => ({ 
          ...prev, 
          additionalImages: [...prev.additionalImages, ...newFiles]
        }));
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Auto-generate slug from name
      if (name === 'name') {
        const slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        setFormData(prev => ({ ...prev, slug }));
      }
    }
  };
  
  const handleRemoveAdditionalImage = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setSaving(true);
    
    try {
      // Simulate API call
      console.log('Saving product:', formData);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Product ${isEditMode ? 'updated' : 'created'} successfully`);
      
      // In a real implementation:
      // if (isEditMode) {
      //   await adminService.updateProduct(id, formData);
      // } else {
      //   await adminService.createProduct(formData);
      // }
      
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} product`);
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link 
            to="/admin/products" 
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiX className="mr-2 -ml-1 h-5 w-5" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
          >
            <FiSave className="mr-2 -ml-1 h-5 w-5" />
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    required
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Used in the URL. Auto-generated from the product name.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="5"
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Pricing and Inventory */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing and Inventory</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    id="discount"
                    name="discount"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Product is active and visible on the site
                  </label>
                </div>
              </div>
            </div>
            
            {/* Images */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Images</h2>
              
              {/* Featured Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image <span className="text-red-500">*</span>
                </label>
                
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0 h-32 w-32 bg-gray-100 rounded-md overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Featured"
                        className="h-full w-full object-center object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <FiImage className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="featuredImage" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <FiImage className="mr-2 -ml-1 h-5 w-5" />
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </label>
                    <input
                      type="file"
                      id="featuredImage"
                      name="featuredImage"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Recommended size: 800x800px, max 2MB
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Additional Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Images
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {/* Current Additional Images */}
                  {formData.additionalImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="h-24 w-full bg-gray-100 rounded-md overflow-hidden">
                        {typeof image === 'string' ? (
                          <img
                            src={image}
                            alt={`Additional ${index + 1}`}
                            className="h-full w-full object-center object-cover"
                          />
                        ) : (
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Additional ${index + 1}`}
                            className="h-full w-full object-center object-cover"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdditionalImage(index)}
                        className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <FiTrash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Upload More Images */}
                  <div className="h-24 w-full bg-gray-100 rounded-md flex items-center justify-center">
                    <label htmlFor="additionalImages" className="cursor-pointer text-center p-2">
                      <FiPlus className="h-8 w-8 text-gray-400 mx-auto" />
                      <span className="text-sm text-gray-500">Add More</span>
                    </label>
                    <input
                      type="file"
                      id="additionalImages"
                      name="additionalImages"
                      accept="image/*"
                      multiple
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* SEO */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">SEO Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    id="metaTitle"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    name="metaDescription"
                    rows="3"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 text-right">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
            >
              {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormPage; 