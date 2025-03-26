import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiHeart, FiSearch, FiMenu, FiX } from 'react-icons/fi';
import { authService, productService } from '../../services';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await productService.getCategories();
        if (response.success) {
          setCategories(response.data.categories.slice(0, 5)); // Show top 5 categories
        }
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };

    const checkAuth = () => {
      const loggedIn = authService.isAuthenticated();
      setIsAuthenticated(loggedIn);
      if (loggedIn) {
        setUser(authService.getUser());
      }
    };

    loadCategories();
    checkAuth();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm">
      {/* Top Bar */}
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-primary">
          Your Store
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-600 hover:text-primary">Home</Link>
          <Link to="/products" className="text-gray-600 hover:text-primary">Shop</Link>
          {categories.map(category => (
            <Link 
              key={category._id} 
              to={`/products?category=${category._id}`}
              className="text-gray-600 hover:text-primary"
            >
              {category.name}
            </Link>
          ))}
          <Link to="/about" className="text-gray-600 hover:text-primary">About</Link>
          <Link to="/contact" className="text-gray-600 hover:text-primary">Contact</Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {/* Search Button */}
          <button 
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-gray-600 hover:text-primary p-1 focus:outline-none"
            aria-label="Search"
          >
            <FiSearch size={20} />
          </button>

          {/* Wishlist */}
          <Link to="/wishlist" className="text-gray-600 hover:text-primary p-1 hidden sm:inline-block">
            <FiHeart size={20} />
          </Link>

          {/* Cart */}
          <Link to="/cart" className="text-gray-600 hover:text-primary p-1 relative">
            <FiShoppingCart size={20} />
            {/* Cart items count would go here */}
          </Link>

          {/* User Account */}
          {isAuthenticated ? (
            <div className="relative group">
              <button className="text-gray-600 hover:text-primary p-1 focus:outline-none">
                <FiUser size={20} />
              </button>
              <div className="absolute right-0 w-48 mt-2 bg-white shadow-lg rounded-md invisible group-hover:visible z-10">
                <div className="py-2 px-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || ''}
                  </p>
                </div>
                <div className="py-1">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Orders
                  </Link>
                  <Link to="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:hidden">
                    Wishlist
                  </Link>
                  <Link to="/addresses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Addresses
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Admin Panel
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="text-gray-600 hover:text-primary p-1">
              <FiUser size={20} />
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-600 hover:text-primary focus:outline-none md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="absolute top-0 left-0 right-0 bg-white p-4 shadow-md z-10">
          <div className="container mx-auto flex items-center">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button 
                type="submit"
                className="bg-primary text-white p-2 rounded-r-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <FiSearch size={20} />
              </button>
            </form>
            <button 
              onClick={() => setSearchOpen(false)}
              className="ml-4 text-gray-600 hover:text-primary focus:outline-none"
              aria-label="Close"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden shadow-t-sm">
          <div className="container mx-auto px-4 py-2">
            <nav className="flex flex-col space-y-2">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:text-primary py-2"
              >
                Home
              </Link>
              <Link 
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:text-primary py-2"
              >
                Shop
              </Link>
              {categories.map(category => (
                <Link 
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-600 hover:text-primary py-2"
                >
                  {category.name}
                </Link>
              ))}
              <Link 
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:text-primary py-2"
              >
                About
              </Link>
              <Link 
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-600 hover:text-primary py-2"
              >
                Contact
              </Link>
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-primary py-2"
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-600 hover:text-primary py-2"
                  >
                    Orders
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-600 hover:text-primary py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-600 hover:text-primary py-2"
                >
                  Login / Register
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 