import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiFilter,
  FiSearch,
  FiAlertCircle,
  FiEye,
  FiTag
} from 'react-icons/fi';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filter, setFilter] = useState(searchParams.get('filter') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: '/admin/products' } });
      return;
    }
    
    // In a real app, check if user is admin
    // if (!authService.isAdmin()) {
    //   navigate('/');
    //   return;
    // }
    
    fetchCategories();
    fetchProducts();
  }, [navigate, filter, category, sortBy, searchParams]);
  
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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API with query params
      console.log('Fetching products with filters:', { filter, category, sortBy, search: searchTerm });
      
      // Simulate API call
      setTimeout(() => {
        // Simulate products data
        let mockProducts = [
          {
            _id: 'prod1',
            name: 'Wireless Bluetooth Headphones',
            sku: 'SKU-001',
            slug: 'wireless-bluetooth-headphones',
            image: '/images/products/headphones.jpg',
            price: 99.99,
            discount: 0,
            stock: 45,
            category: { _id: 'cat1', name: 'Electronics' },
            isActive: true,
            createdAt: '2023-03-15T10:22:31Z'
          },
          {
            _id: 'prod2',
            name: 'Smartphone Gimbal Stabilizer',
            sku: 'SKU-002',
            slug: 'smartphone-gimbal-stabilizer',
            image: '/images/products/gimbal.jpg',
            price: 79.99,
            discount: 15,
            stock: 3,
            category: { _id: 'cat1', name: 'Electronics' },
            isActive: true,
            createdAt: '2023-03-20T09:15:22Z'
          },
          {
            _id: 'prod3',
            name: '4K Action Camera',
            sku: 'SKU-003',
            slug: '4k-action-camera',
            image: '/images/products/camera.jpg',
            price: 149.99,
            discount: 0,
            stock: 0,
            category: { _id: 'cat1', name: 'Electronics' },
            isActive: false,
            createdAt: '2023-02-27T16:44:10Z'
          },
          {
            _id: 'prod4',
            name: 'Cotton T-Shirt',
            sku: 'SKU-004',
            slug: 'cotton-t-shirt',
            image: '/images/products/t-shirt.jpg',
            price: 24.99,
            discount: 0,
            stock: 100,
            category: { _id: 'cat2', name: 'Clothing' },
            isActive: true,
            createdAt: '2023-03-10T14:32:45Z'
          },
          {
            _id: 'prod5',
            name: 'Kitchen Knife Set',
            sku: 'SKU-005',
            slug: 'kitchen-knife-set',
            image: '/images/products/knife-set.jpg',
            price: 89.99,
            discount: 10,
            stock: 15,
            category: { _id: 'cat3', name: 'Home & Kitchen' },
            isActive: true,
            createdAt: '2023-02-15T21:18:33Z'
          }
        ];
        
        // Apply filters
        if (filter === 'low-stock') {
          mockProducts = mockProducts.filter(product => product.stock > 0 && product.stock <= 5);
        } else if (filter === 'out-of-stock') {
          mockProducts = mockProducts.filter(product => product.stock === 0);
        } else if (filter === 'active') {
          mockProducts = mockProducts.filter(product => product.isActive);
        } else if (filter === 'inactive') {
          mockProducts = mockProducts.filter(product => !product.isActive);
        }
        
        // Apply category filter
        if (category) {
          mockProducts = mockProducts.filter(product => product.category._id === category);
        }
        
        // Apply search
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          mockProducts = mockProducts.filter(product => 
            product.name.toLowerCase().includes(search) || 
            product.sku.toLowerCase().includes(search)
          );
        }
        
        // Apply sorting
        if (sortBy === 'newest') {
          mockProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'oldest') {
          mockProducts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortBy === 'price-high') {
          mockProducts.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'price-low') {
          mockProducts.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'name-asc') {
          mockProducts.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'name-desc') {
          mockProducts.sort((a, b) => b.name.localeCompare(a.name));
        }
        
        setProducts(mockProducts);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const queryParams = new URLSearchParams();
      // if (filter) queryParams.append('filter', filter);
      // if (category) queryParams.append('category', category);
      // if (sortBy) queryParams.append('sort', sortBy);
      // if (searchTerm) queryParams.append('search', searchTerm);
      // 
      // const response = await adminService.getProducts(queryParams);
      // setProducts(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
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
  
  const handleFilterChange = (newFilter) => {
    const params = new URLSearchParams(searchParams);
    if (newFilter) {
      params.set('filter', newFilter);
    } else {
      params.delete('filter');
    }
    
    setFilter(newFilter);
    setSearchParams(params);
  };
  
  const handleCategoryChange = (newCategory) => {
    const params = new URLSearchParams(searchParams);
    if (newCategory) {
      params.set('category', newCategory);
    } else {
      params.delete('category');
    }
    
    setCategory(newCategory);
    setSearchParams(params);
  };
  
  const handleSortChange = (newSortBy) => {
    const params = new URLSearchParams(searchParams);
    if (newSortBy) {
      params.set('sort', newSortBy);
    } else {
      params.delete('sort');
    }
    
    setSortBy(newSortBy);
    setSearchParams(params);
  };
  
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      // Simulate API call
      console.log('Deleting product:', productId);
      
      // Update state optimistically
      setProducts(products.filter(product => product._id !== productId));
      
      toast.success('Product deleted successfully');
      
      // In a real implementation:
      // await adminService.deleteProduct(productId);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      fetchProducts(); // Revert to original state by refetching
    }
  };
  
  const handleToggleProductStatus = async (productId, currentStatus) => {
    try {
      // Simulate API call
      console.log('Toggling product status:', productId, !currentStatus);
      
      // Update state optimistically
      setProducts(products.map(product => 
        product._id === productId 
          ? { ...product, isActive: !currentStatus } 
          : product
      ));
      
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      
      // In a real implementation:
      // await adminService.updateProductStatus(productId, { isActive: !currentStatus });
    } catch (error) {
      console.error('Error updating product status:', error);
      toast.error('Failed to update product status');
      fetchProducts(); // Revert to original state by refetching
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getStockStatusClass = (stock) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };
  
  const getStockStatusText = (stock) => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 5) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          to="/admin/products/add"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
        >
          <FiPlus className="mr-2" /> Add New Product
        </Link>
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
                    placeholder="Search products..."
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
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="">All Products</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFilter className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div className="relative inline-block w-full sm:w-auto">
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTag className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div className="relative inline-block w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiBarChart2 className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {products.length === 0 ? (
          <div className="p-8 text-center">
            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No products found</h3>
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
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md overflow-hidden">
                          <img
                            src={product.image || 'https://via.placeholder.com/150'}
                            alt={product.name}
                            className="h-full w-full object-center object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.discount > 0 ? (
                        <div>
                          <div className="text-sm text-gray-500 line-through">
                            ${product.price.toFixed(2)}
                          </div>
                          <div className="text-sm font-medium text-red-600">
                            ${(product.price - (product.price * product.discount / 100)).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900">${product.price.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.stock}</div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusClass(
                          product.stock
                        )}`}
                      >
                        {getStockStatusText(product.stock)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleProductStatus(product._id, product.isActive)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(product.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/products/${product.slug}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-900"
                          title="View on site"
                        >
                          <FiEye className="h-5 w-5" />
                        </Link>
                        <Link
                          to={`/admin/products/edit/${product._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit product"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete product"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
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

export default ProductsPage; 