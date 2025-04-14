"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../../contexts/CartContext";
import Layout from "../../components/layout/Layout";
import Button from "../../components/ui/Button";

export default function CartPage() {
  const {
    cart,
    isLoading,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Handler for updating item quantity
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  // Handler for removing an item
  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  // Handler for applying a coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      setCouponLoading(true);
      setCouponError("");
      await applyCoupon(couponCode);
      setCouponCode("");
    } catch (error: any) {
      setCouponError(error.message || "Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  // Handler for removing a coupon
  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
    } catch (error) {
      console.error("Failed to remove coupon:", error);
    }
  };

  // Empty cart state
  if (!isLoading && (!cart || cart.items.length === 0)) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
            <div className="bg-white p-8 rounded-lg shadow-sm max-w-lg mx-auto">
              <svg
                className="w-20 h-20 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Looks like you haven't added any products to your cart yet.
              </p>
              <Button href="/products">Start Shopping</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Loading state
  if (isLoading || !cart) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
          <div className="animate-pulse">
            <div className="bg-gray-200 h-10 w-full mb-4 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-gray-200 h-40 w-full mb-4 rounded"></div>
                <div className="bg-gray-200 h-40 w-full mb-4 rounded"></div>
              </div>
              <div>
                <div className="bg-gray-200 h-64 w-full rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <li key={item.productId} className="p-6">
                    <div className="flex flex-col sm:flex-row items-center">
                      {/* Product Image */}
                      <div className="sm:w-24 w-full h-24 flex-shrink-0 mb-4 sm:mb-0">
                        <div className="aspect-square relative rounded overflow-hidden">
                          <Image
                            src={item.image || "/placeholder-product.jpg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 sm:ml-6 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              <Link href={`/products/${item.productId}`}>
                                {item.name}
                              </Link>
                            </h3>
                            {item.attributes &&
                              Object.keys(item.attributes).length > 0 && (
                                <div className="mt-1 text-sm text-gray-500">
                                  {Object.entries(item.attributes).map(
                                    ([key, value]) => (
                                      <span key={key} className="mr-3">
                                        {key}: {value}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                          <div className="mt-2 sm:mt-0 text-lg font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4">
                          {/* Quantity Selector */}
                          <div className="flex items-center">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId,
                                  item.quantity - 1
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="text-gray-500 focus:outline-none focus:text-gray-600 disabled:opacity-50"
                            >
                              <svg
                                className="h-5 w-5"
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
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                              className="text-gray-500 focus:outline-none focus:text-gray-600"
                            >
                              <svg
                                className="h-5 w-5"
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

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            className="mt-4 sm:mt-0 text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <Button
                    href="/products"
                    variant="outline"
                    className="text-sm"
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    onClick={() => clearCart()}
                    variant="ghost"
                    className="text-sm text-gray-600"
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="flow-root">
                <dl className="-my-4 text-sm divide-y divide-gray-200">
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-gray-600">Subtotal</dt>
                    <dd className="font-medium text-gray-900">
                      ${cart.summary.subtotal.toFixed(2)}
                    </dd>
                  </div>
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-gray-600">Shipping</dt>
                    <dd className="font-medium text-gray-900">
                      ${cart.summary.shipping.toFixed(2)}
                    </dd>
                  </div>
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-gray-600">Tax</dt>
                    <dd className="font-medium text-gray-900">
                      ${cart.summary.tax.toFixed(2)}
                    </dd>
                  </div>
                  {cart.summary.discount > 0 && (
                    <div className="py-4 flex items-center justify-between">
                      <dt className="text-gray-600">Discount</dt>
                      <dd className="font-medium text-green-600">
                        -${cart.summary.discount.toFixed(2)}
                      </dd>
                    </div>
                  )}
                  <div className="py-4 flex items-center justify-between">
                    <dt className="text-base font-medium text-gray-900">
                      Total
                    </dt>
                    <dd className="text-base font-medium text-gray-900">
                      ${cart.summary.total.toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Coupon Code */}
              <div className="mt-6">
                {cart.couponCode ? (
                  <div className="bg-green-50 p-3 rounded flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-green-800">
                        Coupon applied: {cart.couponCode}
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-sm text-green-800 hover:text-green-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-3">
                    <label
                      htmlFor="coupon"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Coupon Code
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id="coupon"
                        name="coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        placeholder="Enter coupon code"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        className="rounded-l-none"
                        isLoading={couponLoading}
                      >
                        Apply
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-600 mt-1">{couponError}</p>
                    )}
                  </form>
                )}
              </div>

              {/* Checkout Button */}
              <div className="mt-6">
                <Button href="/checkout" fullWidth size="lg">
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
