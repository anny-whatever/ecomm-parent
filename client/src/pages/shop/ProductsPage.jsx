import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiFilter, FiChevronDown, FiX, FiGrid, FiList } from 'react-icons/fi';
import { productService } from '../../services';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: [0, 1000],
    sortBy: 'newest',
    view: 'grid', // grid or list
  });
  const [showFilters, setShowFilters] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Parse URL query parameters for initial filters
    const searchParams = new URLSearchParams(location.search);
    
    const initialFilters = {
      ...filters,
      category: searchParams.get('category') || '',
      sortBy: searchParams.get('sort') || 'newest',
    };
    
    setFilters(initialFilters);
    
    fetchProducts(initialFilters);
    fetchCategories();
  }, [location.search]);

  const fetchProducts = async (currentFilters) => {
    setLoading(true);
    try {
      // In a real app, this would call the API with filter parameters
      console.log('Fetching products with filters:', currentFilters);
      
      // Simulate API call
      setTimeout(() => {
        // Simulate products data
        const mockProducts = Array(12).fill().map((_, index) => ({
          _id: `product${index + 1}`,
          name: `Product ${index + 1}`,
          description: 'This is a product description.',
          price: Math.floor(Math.random() * 200) + 20,
          image: `https://via.placeholder.com/300?text=Product+${index + 1}`,
          category: index % 3 === 0 ? 'Electronics' : index % 3 === 1 ? 'Clothing' : 'Home',
          rating: Math.floor(Math.random() * 5) + 1,
          inStock: Math.random() > 0.2,
        }));
        
        setProducts(mockProducts);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await productService.getProducts(currentFilters);
      // setProducts(response.data.products);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        // Simulate categories data
        setCategories([
          { _id: 'electronics', name: 'Electronics' },
          { _id: 'clothing', name: 'Clothing' },
          { _id: 'home', name: 'Home' },
          { _id: 'books', name: 'Books' },
          { _id: 'toys', name: 'Toys' },
        ]);
      }, 500);
      
      // In a real implementation:
      // const response = await productService.getCategories();
      // setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    
    // Update URL with new filters
    const searchParams = new URLSearchParams(location.search);
    
    if (name === 'category' && value) {
      searchParams.set('category', value);
    } else if (name === 'category') {
      searchParams.delete('category');
    }
    
    if (name === 'sortBy' && value) {
      searchParams.set('sort', value);
    }
    
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
    
    fetchProducts(newFilters);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      category: '',
      priceRange: [0, 1000],
      sortBy: 'newest',
      view: filters.view,
    };
    
    setFilters(defaultFilters);
    navigate('/products');
    fetchProducts(defaultFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>
      
      {/* Mobile filter dialog */}
      <div className="md:hidden mb-4">
        <button
          type="button"
          className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={toggleFilters}
        >
          <FiFilter className="mr-2 h-4 w-4" />
          Filters & Sorting
        </button>
        
        {showFilters && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-75" onClick={toggleFilters}>
            <div 
              className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-lg p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Filters</h3>
                <button onClick={toggleFilters}>
                  <FiX className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="block w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm text-primary hover:text-primary-dark font-medium"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={toggleFilters}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Desktop filter section */}
      <div className="hidden md:flex flex-col lg:flex-row gap-8 mb-8">
        {/* Left sidebar with filters */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-md shadow-sm p-4 sticky top-4">
            <h3 className="text-lg font-medium mb-4">Filters</h3>
            
            <div className="mb-6">
              <h4 className="font-medium mb-2">Category</h4>
              <div className="space-y-1">
                <div className="flex items-center">
                  <input
                    id="all-categories"
                    name="category"
                    type="radio"
                    checked={filters.category === ''}
                    onChange={() => handleFilterChange('category', '')}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <label htmlFor="all-categories" className="ml-2 text-sm text-gray-700">
                    All Categories
                  </label>
                </div>
                
                {categories.map((category) => (
                  <div key={category._id} className="flex items-center">
                    <input
                      id={`category-${category._id}`}
                      name="category"
                      type="radio"
                      checked={filters.category === category._id}
                      onChange={() => handleFilterChange('category', category._id)}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor={`category-${category._id}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium mb-2">Price Range</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={filters.priceRange[1]}
                  onChange={(e) => handleFilterChange('priceRange', [0, parseInt(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}</span>
              </div>
            </div>
            
            <button
              onClick={resetFilters}
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>
        
        {/* Right content area */}
        <div className="lg:w-3/4">
          {/* Sorting and view options */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <label htmlFor="sort-by" className="mr-2 text-sm text-gray-700">
                Sort by:
              </label>
              <select
                id="sort-by"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="text-sm border-gray-300 rounded-md"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange('view', 'grid')}
                className={`p-2 rounded-md ${
                  filters.view === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
              >
                <FiGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleFilterChange('view', 'list')}
                className={`p-2 rounded-md ${
                  filters.view === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'
                }`}
              >
                <FiList className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Products grid/list */}
          {loading ? (
            <div className={`grid ${
              filters.view === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
              } gap-6`}
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-md shadow-sm p-4 animate-pulse">
                  <div className="h-48 bg-gray-300 rounded-md mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No products found. Try different filters.</p>
                </div>
              ) : (
                <div className={`${
                  filters.view === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'space-y-4'
                  }`}
                >
                  {products.map((product) => (
                    <div 
                      key={product._id} 
                      className={`bg-white rounded-md shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${
                        filters.view === 'list' ? 'flex' : ''
                      }`}
                    >
                      <div className={`${filters.view === 'list' ? 'w-1/3' : 'w-full'}`}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-48 w-full object-cover"
                        />
                      </div>
                      
                      <div className={`p-4 ${filters.view === 'list' ? 'w-2/3' : ''}`}>
                        <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                        
                        {filters.view === 'list' && (
                          <p className="text-gray-600 my-2">{product.description}</p>
                        )}
                        
                        <div className="mt-2 flex justify-between items-center">
                          <p className="text-lg font-medium text-gray-900">${product.price.toFixed(2)}</p>
                          
                          <button
                            className="text-sm bg-primary text-white px-3 py-1 rounded-md hover:bg-primary-dark"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage; 