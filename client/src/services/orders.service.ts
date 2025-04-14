import apiClient from "./api";

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  attributes?: Record<string, any>;
  subtotal: number;
}

export interface OrderAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface PaymentInfo {
  method: string;
  status: string;
  transactionId?: string;
  paymentDate?: string;
}

export interface ShippingInfo {
  method: string;
  cost: number;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  summary: OrderSummary;
  status: OrderStatus;
  paymentInfo: PaymentInfo;
  shippingInfo: ShippingInfo;
  notes?: string;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class OrderService {
  /**
   * Create a new order
   */
  async createOrder(orderData: {
    shippingAddress: OrderAddress;
    billingAddress: OrderAddress;
    paymentMethod: string;
    shippingMethod: string;
    notes?: string;
  }): Promise<Order> {
    const response = await apiClient.post("/orders", orderData);
    return response.data;
  }

  /**
   * Get orders for the current user with pagination
   */
  async getOrders(
    page: number = 1,
    limit: number = 10
  ): Promise<OrdersResponse> {
    const response = await apiClient.get("/orders", {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * Get a single order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  }

  /**
   * Get a single order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const response = await apiClient.get(`/orders/number/${orderNumber}`);
    return response.data;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const response = await apiClient.post(`/orders/${orderId}/cancel`, {
      reason,
    });
    return response.data;
  }

  /**
   * Request a return/refund for an order
   */
  async requestReturn(
    orderId: string,
    reason: string,
    items: { itemId: string; quantity: number }[]
  ): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/return-request`, {
      reason,
      items,
    });
    return response.data;
  }

  /**
   * Track an order's shipping status
   */
  async trackOrder(orderId: string): Promise<any> {
    const response = await apiClient.get(`/orders/${orderId}/tracking`);
    return response.data;
  }

  /**
   * Add a review for an ordered product
   */
  async addProductReview(
    orderId: string,
    productId: string,
    reviewData: {
      rating: number;
      title: string;
      comment: string;
      images?: string[];
    }
  ): Promise<any> {
    const response = await apiClient.post(
      `/orders/${orderId}/products/${productId}/review`,
      reviewData
    );
    return response.data;
  }
}

// Create a singleton instance
const orderService = new OrderService();
export default orderService;
