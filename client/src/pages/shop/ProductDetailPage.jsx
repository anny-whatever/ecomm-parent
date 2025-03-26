import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiHeart, FiArrowLeft } from 'react-icons/fi';
import { productService, cartService } from '../../services';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      console.log('Fetching product with ID:', productId);
      
      // Simulate API call
      setTimeout(() => {
        // Simulate product data
        const mockProduct = {
          _id: productId,
          name: 'Premium Wireless Headphones',
          description: 'Experience crystal-clear sound with our premium wireless headphones. Featuring noise cancellation technology, Bluetooth 5.0 connectivity, and up to 30 hours of battery life. The ergonomic design ensures comfort during extended use, while the built-in microphone allows for hands-free calls.',
          price: 149.99,
          images: [
            'https://via.placeholder.com/600x600?text=Headphones+1',
            'https://via.placeholder.com/600x600?text=Headphones+2',
            'https://via.placeholder.com/600x600?text=Headphones+3',
          ],
          category: 'Electronics',
          rating: 4.5,
          reviews: 128,
          inStock: true,
          features: [
            'Noise cancellation technology',
            'Bluetooth 5.0 connectivity',
            'Up to 30 hours of battery life',
            'Built-in microphone',
            'Ergonomic design',
          ],
          specifications: {
            'Brand': 'YourStore Audio',
            'Model': 'WH-2023',
            'Color': 'Black',
            'Weight': '250g',
            'Connectivity': 'Bluetooth 5.0, 3.5mm jack',
            'Battery': '500mAh, 30 hours playback',
          }
        };
        
        // Simulate related products
        const mockRelatedProducts = [
          { _id: 'related1', name: 'Wireless Earbuds', price: 79.99, image: 'https://via.placeholder.com/300?text=Earbuds' },
          { _id: 'related2', name: 'Bluetooth Speaker', price: 99.99, image: 'https://via.placeholder.com/300?text=Speaker' },
          { _id: 'related3', name: 'Audio Amplifier', price: 129.99, image: 'https://via.placeholder.com/300?text=Amplifier' },
          { _id: 'related4', name: 'Headphone Stand', price: 29.99, image: 'https://via.placeholder.com/300?text=Stand' },
        ];
        
        setProduct(mockProduct);
        setRelatedProducts(mockRelatedProducts);
        setLoading(false);
      }, 1000);
      
      // In a real implementation:
      // const response = await productService.getProductById(productId);
      // setProduct(response.data.product);
      // 
      // const relatedResponse = await productService.getRelatedProducts(productId);
      // setRelatedProducts(relatedResponse.data.products);
      // setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
      // Handle 404 or other errors
      if (error.status === 404) {
        navigate('/products');
      }
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    
    try {
      // In a real app, this would call the API
      console.log('Adding to cart:', { productId, quantity });
      
      // Simulate API call
      setTimeout(() => {
        toast.success('Product added to cart!');
        setAddingToCart(false);
      }, 1000);
      
      // In a real implementation:
      // await cartService.addToCart({ productId, quantity });
      // toast.success('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart');
      setAddingToCart(false);
    }
  };

  const addToWishlist = () => {
    toast.success('Product added to wishlist!');
  };
  
  // Render loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="mb-6 h-6 bg-gray-300 rounded w-1/3"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-300 rounded-md"></div>
            
            <div className="space-y-4">
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-10 bg-gray-300 rounded w-1/3 mt-6"></div>
              <div className="h-12 bg-gray-300 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render 404 if product not found
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-6">The product you're looking for does not exist or has been removed.</p>
        <Link to="/products" className="text-primary hover:text-primary-dark flex items-center justify-center">
          <FiArrowLeft className="mr-2" /> Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb navigation */}
      <nav className="mb-6">
        <ol className="flex text-sm">
          <li className="flex items-center">
            <Link to="/" className="text-gray-500 hover:text-gray-900">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
          </li>
          <li className="flex items-center">
            <Link to="/products" className="text-gray-500 hover:text-gray-900">Products</Link>
            <span className="mx-2 text-gray-400">/</span>
          </li>
          <li className="flex items-center">
            <Link to={`/products?category=${product.category}`} className="text-gray-500 hover:text-gray-900">
              {product.category}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
          </li>
          <li className="text-gray-900">{product.name}</li>
        </ol>
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
            <img 
              src={product.images[selectedImage]} 
              alt={product.name} 
              className="w-full h-96 object-contain"
            />
          </div>
          
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={`border rounded-md overflow-hidden ${selectedImage === index ? 'border-primary' : 'border-gray-200'}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image} alt={`${product.name} - View ${index + 1}`} className="w-full h-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'} w-5 h-5`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">{product.reviews} reviews</span>
          </div>
          
          <p className="text-2xl font-bold text-gray-900 mb-4">${product.price.toFixed(2)}</p>
          
          <div className="mb-6">
            <p className="text-gray-700">{product.description}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Features</h3>
            <ul className="list-disc pl-5 space-y-1">
              {product.features.map((feature, index) => (
                <li key={index} className="text-gray-700">{feature}</li>
              ))}
            </ul>
          </div>
          
          {/* Quantity Selector */}
          <div className="mb-6">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <div className="flex">
              <button
                type="button"
                className="bg-gray-100 px-3 py-2 border border-gray-300 rounded-l-md"
                onClick={decrementQuantity}
              >
                -
              </button>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-16 text-center border-t border-b border-gray-300 py-2"
              />
              <button
                type="button"
                className="bg-gray-100 px-3 py-2 border border-gray-300 rounded-r-md"
                onClick={incrementQuantity}
              >
                +
              </button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              type="button"
              className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-md flex items-center justify-center"
              onClick={handleAddToCart}
              disabled={addingToCart || !product.inStock}
            >
              <FiShoppingCart className="mr-2" />
              {addingToCart ? 'Adding...' : product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            
            <button
              type="button"
              className="flex-1 sm:flex-none border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-6 rounded-md flex items-center justify-center"
              onClick={addToWishlist}
            >
              <FiHeart className="mr-2" />
              Wishlist
            </button>
          </div>
          
          {/* Product Specifications */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="col-span-2 md:col-span-1">
                  <div className="grid grid-cols-2">
                    <div className="font-medium text-gray-500">{key}</div>
                    <div className="text-gray-900">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Products */}
      <div className="border-t border-gray-200 pt-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {relatedProducts.map((product) => (
            <Link 
              key={product._id}
              to={`/products/${product._id}`}
              className="group"
            >
              <div className="bg-white rounded-md shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover object-center"
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
      </div>
    </div>
  );
};

export default ProductDetailPage; 