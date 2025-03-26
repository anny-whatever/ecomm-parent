import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2, FiX } from 'react-icons/fi';
import { authService } from '../../services';
import toast from 'react-hot-toast';

const WishlistPage = () => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { redirectUrl: '/wishlist' } });
      return;
    }
    
    fetchWishlist();
  }, [navigate]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      console.log('Fetching wishlist');
      
      // Simulate API call
      setTimeout(() => {
        // Simulate wishlist data
        const mockWishlist = [
          {
            _id: 'prod1',
            name: 'Wireless Bluetooth Headphones',
            slug: 'wireless-bluetooth-headphones',
            image: '/images/products/headphones.jpg',
            price: 99.99,
            discount: 0,
            inStock: true,
            addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
          },
          {
            _id: 'prod2',
            name: 'Smartphone Gimbal Stabilizer',
            slug: 'smartphone-gimbal-stabilizer',
            image: '/images/products/gimbal.jpg',
            price: 79.99,
            discount: 15,
            inStock: true,
            addedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
          },
          {
            _id: 'prod3',
            name: '4K Action Camera',
            slug: '4k-action-camera',
            image: '/images/products/camera.jpg',
            price: 149.99,
            discount: 0,
            inStock: false,
            addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
          }
        ];
        
        setWishlistItems(mockWishlist);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await userService.getWishlist();
      // setWishlistItems(response.data);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      // In a real app, this would call the API
      console.log('Removing item from wishlist:', productId);
      
      // Update state optimistically
      setWishlistItems(wishlistItems.filter(item => item._id !== productId));
      
      toast.success('Item removed from wishlist');
      
      // In a real implementation:
      // await userService.removeFromWishlist(productId);
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      toast.error('Failed to remove item from wishlist');
      // Revert back to previous state
      fetchWishlist();
    }
  };

  const handleAddToCart = async (product) => {
    try {
      // In a real app, this would call the API
      console.log('Adding to cart:', product._id);
      
      toast.success(`${product.name} added to cart`);
      
      // In a real implementation:
      // await cartService.addToCart({ productId: product._id, quantity: 1 });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const handleClearWishlist = async () => {
    if (!window.confirm('Are you sure you want to clear your wishlist?')) {
      return;
    }
    
    try {
      // In a real app, this would call the API
      console.log('Clearing wishlist');
      
      // Update state optimistically
      setWishlistItems([]);
      
      toast.success('Wishlist cleared');
      
      // In a real implementation:
      // await userService.clearWishlist();
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
      // Revert back to previous state
      fetchWishlist();
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateDiscountedPrice = (price, discount) => {
    return price - (price * discount / 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h1>
        <div className="animate-pulse space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-md shadow-sm p-4 h-36"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        {wishlistItems.length > 0 && (
          <button
            onClick={handleClearWishlist}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiX className="mr-2" /> Clear Wishlist
          </button>
        )}
      </div>
      
      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <FiHeart className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">Start adding items to your wishlist as you shop.</p>
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {wishlistItems.map((item) => (
              <li key={item._id} className="flex py-6 px-4 sm:px-6">
                <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={item.image || 'https://via.placeholder.com/150'}
                    alt={item.name}
                    className="w-full h-full object-center object-cover"
                  />
                </div>

                <div className="ml-6 flex-1 flex flex-col">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">
                        <Link to={`/products/${item.slug}`} className="hover:text-primary">
                          {item.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Added on {formatDate(item.addedAt)}
                      </p>
                    </div>
                    <div className="ml-4">
                      {item.discount > 0 ? (
                        <div>
                          <p className="text-sm text-gray-500 line-through">
                            ${item.price.toFixed(2)}
                          </p>
                          <p className="text-base font-medium text-red-600">
                            ${calculateDiscountedPrice(item.price, item.discount).toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-base font-medium text-gray-900">
                          ${item.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex items-end justify-between mt-4">
                    <p className={`text-sm ${item.inStock ? 'text-green-600' : 'text-red-600'}`}>
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </p>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="text-sm font-medium text-gray-700 hover:text-red-600 flex items-center"
                      >
                        <FiTrash2 className="mr-1" />
                        Remove
                      </button>
                      
                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.inStock}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white ${
                          item.inStock
                            ? 'bg-primary hover:bg-primary-dark' 
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <FiShoppingCart className="mr-1" />
                        {item.inStock ? 'Add to Cart' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WishlistPage; 