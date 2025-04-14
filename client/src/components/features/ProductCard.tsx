import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "../../services/products.service";
import { useCart } from "../../contexts/CartContext";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const { id, name, slug, price, salePrice, images, ratings, inStock } =
    product;

  const handleAddToCart = async () => {
    try {
      setIsLoading(true);
      await addToCart(id, 1);
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const discount = salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-lg shadow-sm overflow-hidden transition duration-300 hover:shadow-md">
      {/* Discount tag */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
          {discount}% OFF
        </div>
      )}

      {/* Product image */}
      <Link
        href={`/products/${slug}`}
        className="block relative aspect-square overflow-hidden"
      >
        <Image
          src={images[0] || "/placeholder-product.jpg"}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </Link>

      {/* Product details */}
      <div className="p-4">
        <Link href={`/products/${slug}`} className="block">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">
            {name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center">
          {/* Rating stars */}
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(ratings.average)
                    ? "text-yellow-400"
                    : i < ratings.average
                    ? "text-yellow-300"
                    : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-1 text-xs text-gray-500">
              ({ratings.count})
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          {/* Price */}
          <div>
            {salePrice ? (
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-900">
                  ${salePrice.toFixed(2)}
                </span>
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ${price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock status */}
          {!inStock && (
            <span className="text-xs font-medium text-red-600">
              Out of Stock
            </span>
          )}
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock || isLoading}
          className={`mt-4 w-full py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 
            ${
              !inStock
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
            }
            ${isLoading ? "opacity-75 cursor-wait" : ""}
          `}
        >
          {isLoading ? "Adding..." : inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
