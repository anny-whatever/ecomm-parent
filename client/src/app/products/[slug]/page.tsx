"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Layout from "../../../components/layout/Layout";
import Button from "../../../components/ui/Button";
import { useCart } from "../../../contexts/CartContext";
import productService, { Product } from "../../../services/products.service";

// Mock product data for development
const mockProducts: Record<string, Product> = {
  "wireless-bluetooth-headphones": {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    slug: "wireless-bluetooth-headphones",
    description:
      "High-quality wireless headphones with noise cancellation. Experience crystal-clear audio with deep bass and 20 hours of battery life. Perfect for travel, work, or everyday use. The ergonomic design ensures comfort during extended listening sessions.",
    price: 79.99,
    salePrice: 59.99,
    images: [
      "/images/products/headphones.jpg",
      "/images/products/headphones-2.jpg",
      "/images/products/headphones-3.jpg",
    ],
    categories: ["electronics"],
    variants: [
      {
        id: "1a",
        name: "Black",
        price: 79.99,
        salePrice: 59.99,
        attributes: { color: "Black" },
        inStock: true,
        quantity: 15,
        image: "/images/products/headphones.jpg",
      },
      {
        id: "1b",
        name: "White",
        price: 79.99,
        salePrice: 59.99,
        attributes: { color: "White" },
        inStock: true,
        quantity: 10,
        image: "/images/products/headphones-2.jpg",
      },
    ],
    inStock: true,
    quantity: 25,
    ratings: { average: 4.5, count: 128 },
    createdAt: "2023-01-15T10:00:00Z",
    updatedAt: "2023-01-15T10:00:00Z",
    featured: true,
  },
  "premium-cotton-tshirt": {
    id: "2",
    name: "Premium Cotton T-Shirt",
    slug: "premium-cotton-tshirt",
    description:
      "Soft and comfortable cotton t-shirt for everyday wear. Made from 100% organic cotton, this t-shirt is breathable and long-lasting. Available in multiple colors and sizes. Machine washable and easy to care for.",
    price: 29.99,
    images: ["/images/products/tshirt.jpg"],
    categories: ["clothing"],
    variants: [
      {
        id: "2a",
        name: "Small - Blue",
        price: 29.99,
        attributes: { size: "S", color: "Blue" },
        inStock: true,
        quantity: 20,
        image: "/images/products/tshirt.jpg",
      },
      {
        id: "2b",
        name: "Medium - Blue",
        price: 29.99,
        attributes: { size: "M", color: "Blue" },
        inStock: true,
        quantity: 15,
        image: "/images/products/tshirt.jpg",
      },
      {
        id: "2c",
        name: "Large - Blue",
        price: 29.99,
        attributes: { size: "L", color: "Blue" },
        inStock: true,
        quantity: 10,
        image: "/images/products/tshirt.jpg",
      },
    ],
    inStock: true,
    quantity: 100,
    ratings: { average: 4.2, count: 75 },
    createdAt: "2023-01-20T10:00:00Z",
    updatedAt: "2023-01-20T10:00:00Z",
    featured: true,
  },
};

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // In a real app, we would use the API service
        // const product = await productService.getProductBySlug(slug);

        // For development, use mock data
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay

        const product = mockProducts[slug];
        if (!product) {
          notFound();
        }

        setProduct(product);

        // Set the first variant as selected by default if variants exist
        if (product.variants && product.variants.length > 0) {
          setSelectedVariant(product.variants[0].id);
        }
      } catch (error) {
        console.error("Failed to load product:", error);
        setError("Failed to load product. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setIsAddingToCart(true);
      await addToCart(product.id, quantity, selectedVariant || undefined);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const getSelectedVariantDetails = () => {
    if (!product || !selectedVariant || !product.variants) return null;
    return product.variants.find((variant) => variant.id === selectedVariant);
  };

  const getCurrentPrice = () => {
    const variant = getSelectedVariantDetails();
    if (variant) {
      return variant.salePrice || variant.price;
    }
    return product?.salePrice || product?.price || 0;
  };

  const getOriginalPrice = () => {
    const variant = getSelectedVariantDetails();
    if (variant) {
      return variant.salePrice ? variant.price : null;
    }
    return product?.salePrice ? product.price : null;
  };

  const getDiscountPercentage = () => {
    const currentPrice = getCurrentPrice();
    const originalPrice = getOriginalPrice();

    if (originalPrice && currentPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }

    return 0;
  };

  const isProductInStock = () => {
    if (selectedVariant && product?.variants) {
      const variant = product.variants.find((v) => v.id === selectedVariant);
      return variant ? variant.inStock : false;
    }
    return product?.inStock || false;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="bg-gray-200 aspect-square w-full rounded-lg mb-4"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-200 aspect-square w-full rounded-lg"
                    ></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-6 w-2/3"></div>

                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 max-w-2xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error || "Product not found"}
                </p>
              </div>
            </div>
          </div>
          <Button href="/products" className="mt-6">
            Browse Products
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
              <Image
                src={
                  product.images[selectedImage] || "/placeholder-product.jpg"
                }
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {getDiscountPercentage() > 0 && (
                <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {getDiscountPercentage()}% OFF
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square overflow-hidden rounded-lg bg-gray-100 ${
                      selectedImage === index ? "ring-2 ring-indigo-500" : ""
                    }`}
                  >
                    <Image
                      src={image || "/placeholder-product.jpg"}
                      alt={`${product.name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 20vw, 10vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            {/* Product Title and Price */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>

            <div className="flex items-center mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.ratings.average)
                        ? "text-yellow-400"
                        : i < product.ratings.average
                        ? "text-yellow-300"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  ({product.ratings.count} reviews)
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900">
                  ${getCurrentPrice().toFixed(2)}
                </span>
                {getOriginalPrice() && (
                  <span className="ml-2 text-lg text-gray-500 line-through">
                    ${getOriginalPrice()?.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {isProductInStock() ? "In Stock" : "Out of Stock"}
              </p>
            </div>

            {/* Product Description */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Description
              </h2>
              <p className="text-gray-700">{product.description}</p>
            </div>

            {/* Variants Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Variants
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`border rounded-md py-2 px-3 flex items-center justify-between ${
                        selectedVariant === variant.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-300"
                      } ${
                        !variant.inStock ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={!variant.inStock}
                    >
                      <span className="text-sm font-medium">
                        {Object.entries(variant.attributes)
                          .map(([key, value]) => `${value}`)
                          .join(" - ")}
                      </span>
                      <span className="text-sm font-medium">
                        $
                        {variant.salePrice
                          ? variant.salePrice.toFixed(2)
                          : variant.price.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Quantity
              </h2>
              <div className="flex items-center">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="text-gray-500 focus:outline-none focus:text-gray-600 p-1 disabled:opacity-50"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <span className="mx-2 text-gray-700 w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="text-gray-500 focus:outline-none focus:text-gray-600 p-1"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="mb-6">
              <Button
                onClick={handleAddToCart}
                disabled={!isProductInStock() || isAddingToCart}
                isLoading={isAddingToCart}
                fullWidth
                size="lg"
              >
                {isProductInStock() ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>

            {/* Additional Information */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">
                    Free shipping on orders over $50
                  </span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">
                    30-day money-back guarantee
                  </span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">
                    Secure payment processing
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
