import apiClient from "./api";

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  name: string;
  price: number;
  image: string;
  attributes?: Record<string, any>;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  summary: CartSummary;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export class CartService {
  /**
   * Get the current user's cart
   */
  async getCart(): Promise<Cart> {
    const response = await apiClient.get("/cart");
    return response.data;
  }

  /**
   * Add an item to the cart
   */
  async addToCart(
    productId: string,
    quantity: number = 1,
    variantId?: string
  ): Promise<Cart> {
    const response = await apiClient.post("/cart/items", {
      productId,
      quantity,
      variantId,
    });
    return response.data;
  }

  /**
   * Update item quantity in the cart
   */
  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    const response = await apiClient.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  }

  /**
   * Remove an item from the cart
   */
  async removeFromCart(itemId: string): Promise<Cart> {
    const response = await apiClient.delete(`/cart/items/${itemId}`);
    return response.data;
  }

  /**
   * Clear the entire cart
   */
  async clearCart(): Promise<{ success: boolean }> {
    const response = await apiClient.delete("/cart");
    return response.data;
  }

  /**
   * Apply a coupon code to the cart
   */
  async applyCoupon(couponCode: string): Promise<Cart> {
    const response = await apiClient.post("/cart/coupon", { couponCode });
    return response.data;
  }

  /**
   * Remove a coupon from the cart
   */
  async removeCoupon(): Promise<Cart> {
    const response = await apiClient.delete("/cart/coupon");
    return response.data;
  }

  /**
   * Save cart for later (for guest users converting to registered users)
   */
  async saveCartForLater(items: CartItem[]): Promise<Cart> {
    const response = await apiClient.post("/cart/save", { items });
    return response.data;
  }

  /**
   * Get shipping options for the current cart
   */
  async getShippingOptions(): Promise<any[]> {
    const response = await apiClient.get("/cart/shipping-options");
    return response.data;
  }

  /**
   * Set shipping method for the cart
   */
  async setShippingMethod(shippingMethodId: string): Promise<Cart> {
    const response = await apiClient.post("/cart/shipping-method", {
      shippingMethodId,
    });
    return response.data;
  }
}

// Create a singleton instance
const cartService = new CartService();
export default cartService;
