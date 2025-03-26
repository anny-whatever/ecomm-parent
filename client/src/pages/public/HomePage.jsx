import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // In a real app, these would be actual API calls
        // For now, we'll use placeholder data
        
        // Simulate API calls with setTimeout
        setTimeout(() => {
          setFeaturedProducts([
            { _id: '1', name: 'Wireless Earbuds', price: 99.99, image: 'https://via.placeholder.com/300' },
            { _id: '2', name: 'Smart Watch', price: 199.99, image: 'https://via.placeholder.com/300' },
            { _id: '3', name: 'Bluetooth Speaker', price: 79.99, image: 'https://via.placeholder.com/300' },
            { _id: '4', name: 'Laptop Stand', price: 49.99, image: 'https://via.placeholder.com/300' },
          ]);
          
          setTopProducts([
            { _id: '5', name: 'Smartphone Case', price: 24.99, image: 'https://via.placeholder.com/300' },
            { _id: '6', name: 'USB-C Hub', price: 39.99, image: 'https://via.placeholder.com/300' },
            { _id: '7', name: 'Wireless Charger', price: 29.99, image: 'https://via.placeholder.com/300' },
            { _id: '8', name: 'Noise-Canceling Headphones', price: 149.99, image: 'https://via.placeholder.com/300' },
          ]);
          
          setLoading(false);
        }, 1000);
        
        // In a real implementation, use the actual API calls:
        // const featuredResponse = await productService.getFeaturedProducts();
        // const topResponse = await productService.getTopProducts();
        // setFeaturedProducts(featuredResponse.data.products);
        // setTopProducts(topResponse.data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="mt-6">
      {/* Hero Banner */}
      <div className="bg-gray-100 py-16 px-4 sm:px-6 lg:px-8 rounded-lg relative overflow-hidden">
        <div className="container mx-auto">
          <div className="max-w-xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Find Amazing Products
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Discover our curated collection of high-quality items at unbeatable prices.
            </p>
            <div className="mt-8">
              <Link
                to="/products"
                className="btn-primary text-base font-medium py-3 px-6"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="mt-16 mb-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Products</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-md p-4 h-60 animate-pulse">
                  <div className="w-full h-36 bg-gray-300 rounded-md mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Link key={product._id} to={`/products/${product._id}`} className="group">
                  <div className="card group-hover:shadow-card-hover">
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-48 w-full object-cover object-center"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                      <p className="mt-1 text-lg font-medium text-gray-900">${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Rated Products */}
      <div className="mb-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Rated Products</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-md p-4 h-60 animate-pulse">
                  <div className="w-full h-36 bg-gray-300 rounded-md mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {topProducts.map((product) => (
                <Link key={product._id} to={`/products/${product._id}`} className="group">
                  <div className="card group-hover:shadow-card-hover">
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-48 w-full object-cover object-center"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                      <p className="mt-1 text-lg font-medium text-gray-900">${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-primary py-12 px-4 sm:px-6 lg:px-8 rounded-lg">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Join Our Newsletter
          </h2>
          <p className="mt-4 text-lg leading-6 text-white">
            Sign up to receive updates on new products and special promotions.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-md shadow">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-64 px-5 py-3 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                className="bg-accent hover:bg-accent-dark text-white px-5 py-3 rounded-r-md"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 