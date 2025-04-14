"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Layout from "../components/layout/Layout";
import ProductCard from "../components/features/ProductCard";
import Button from "../components/ui/Button";
import { Product } from "../services/products.service";
import productService from "../services/products.service";

// Mock categories until we implement the real API
const categories = [
  {
    id: "1",
    name: "Electronics",
    image: "/images/categories/electronics.jpg",
    slug: "electronics",
  },
  {
    id: "2",
    name: "Clothing",
    image: "/images/categories/clothing.jpg",
    slug: "clothing",
  },
  {
    id: "3",
    name: "Home & Kitchen",
    image: "/images/categories/home.jpg",
    slug: "home-kitchen",
  },
  {
    id: "4",
    name: "Beauty",
    image: "/images/categories/beauty.jpg",
    slug: "beauty",
  },
];

// Mock products until we implement the real API
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    slug: "wireless-bluetooth-headphones",
    description: "High-quality wireless headphones with noise cancellation.",
    price: 79.99,
    salePrice: 59.99,
    images: ["/images/products/headphones.jpg"],
    categories: ["electronics"],
    variants: [],
    inStock: true,
    quantity: 25,
    ratings: { average: 4.5, count: 128 },
    createdAt: "2023-01-15T10:00:00Z",
    updatedAt: "2023-01-15T10:00:00Z",
    featured: true,
  },
  {
    id: "2",
    name: "Premium Cotton T-Shirt",
    slug: "premium-cotton-tshirt",
    description: "Soft and comfortable cotton t-shirt for everyday wear.",
    price: 29.99,
    images: ["/images/products/tshirt.jpg"],
    categories: ["clothing"],
    variants: [],
    inStock: true,
    quantity: 100,
    ratings: { average: 4.2, count: 75 },
    createdAt: "2023-01-20T10:00:00Z",
    updatedAt: "2023-01-20T10:00:00Z",
    featured: true,
  },
  {
    id: "3",
    name: "Smart Home Assistant",
    slug: "smart-home-assistant",
    description:
      "Voice-controlled smart home assistant with built-in speakers.",
    price: 99.99,
    salePrice: 79.99,
    images: ["/images/products/smart-assistant.jpg"],
    categories: ["electronics", "home-kitchen"],
    variants: [],
    inStock: true,
    quantity: 50,
    ratings: { average: 4.7, count: 210 },
    createdAt: "2023-02-05T10:00:00Z",
    updatedAt: "2023-02-05T10:00:00Z",
    featured: true,
  },
  {
    id: "4",
    name: "Stainless Steel Water Bottle",
    slug: "stainless-steel-water-bottle",
    description:
      "Double-wall insulated water bottle to keep drinks hot or cold.",
    price: 24.99,
    images: ["/images/products/water-bottle.jpg"],
    categories: ["home-kitchen"],
    variants: [],
    inStock: true,
    quantity: 75,
    ratings: { average: 4.0, count: 45 },
    createdAt: "2023-02-12T10:00:00Z",
    updatedAt: "2023-02-12T10:00:00Z",
    featured: false,
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch this data from the API
    // For now, we'll use our mock data
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        // Normally we would use productService.getFeaturedProducts() and productService.getNewArrivals()
        // But for now, we'll use mock data

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        setFeaturedProducts(mockProducts.filter((product) => product.featured));
        setNewArrivals(
          mockProducts
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 4)
        );
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-indigo-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-900 opacity-90" />
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Shop the Latest Trends
            </h1>
            <p className="text-lg mb-8">
              Discover amazing products at unbeatable prices. Free shipping on
              orders over $50.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button href="/products" size="lg">
                Shop Now
              </Button>
              <Button
                href="/categories"
                variant="outline"
                size="lg"
                className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-900"
              >
                Browse Categories
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
            <p className="text-gray-600">Explore our wide range of products</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="relative aspect-square bg-gray-200">
                  {/* Placeholder for category image */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button href="/categories">View All Categories</Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
            <p className="text-gray-600">Handpicked by our experts</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm p-4 animate-pulse"
                >
                  <div className="aspect-square bg-gray-200 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-8 bg-gray-200 rounded mt-4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Button href="/products">View All Products</Button>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">New Arrivals</h2>
            <p className="text-gray-600">Just landed in our store</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm p-4 animate-pulse"
                >
                  <div className="aspect-square bg-gray-200 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-8 bg-gray-200 rounded mt-4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Button href="/products/new-arrivals">View All New Arrivals</Button>
          </div>
        </div>
      </section>

      {/* Promotion Banner */}
      <section className="py-16 bg-indigo-50">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-md">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 bg-indigo-600 text-white p-8 md:p-12 flex items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Summer Sale</h2>
                  <p className="text-lg mb-6">
                    Get up to 50% off on selected items. Limited time offer.
                  </p>
                  <Button
                    href="/deals"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-indigo-600"
                  >
                    Shop the Sale
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 p-8 md:p-12 flex items-center">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Why Shop With Us?
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Free shipping on orders over $50
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      30-day money-back guarantee
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      24/7 customer support
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Secure payment processing
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
