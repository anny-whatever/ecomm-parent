import apiClient from "./api";
import { OrderAddress } from "./orders.service";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  defaultShippingAddress?: OrderAddress;
  defaultBillingAddress?: OrderAddress;
  addresses: OrderAddress[];
  preferences: {
    marketingEmails: boolean;
    orderNotifications: boolean;
    productRecommendations: boolean;
    newsletter: boolean;
  };
  loyaltyPoints?: number;
  loyaltyTier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: {
    marketingEmails?: boolean;
    orderNotifications?: boolean;
    productRecommendations?: boolean;
    newsletter?: boolean;
  };
}

export class UserService {
  /**
   * Get the current user's profile
   */
  async getUserProfile(): Promise<UserProfile> {
    const response = await apiClient.get("/users/profile");
    return response.data;
  }

  /**
   * Update the user profile
   */
  async updateUserProfile(
    profileData: UpdateProfileData
  ): Promise<UserProfile> {
    const response = await apiClient.put("/users/profile", profileData);
    return response.data;
  }

  /**
   * Get user addresses
   */
  async getUserAddresses(): Promise<OrderAddress[]> {
    const response = await apiClient.get("/users/addresses");
    return response.data;
  }

  /**
   * Add a new address
   */
  async addAddress(address: Omit<OrderAddress, "id">): Promise<OrderAddress> {
    const response = await apiClient.post("/users/addresses", address);
    return response.data;
  }

  /**
   * Update an existing address
   */
  async updateAddress(
    addressId: string,
    address: Omit<OrderAddress, "id">
  ): Promise<OrderAddress> {
    const response = await apiClient.put(
      `/users/addresses/${addressId}`,
      address
    );
    return response.data;
  }

  /**
   * Delete an address
   */
  async deleteAddress(addressId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/users/addresses/${addressId}`);
    return response.data;
  }

  /**
   * Set default shipping address
   */
  async setDefaultShippingAddress(addressId: string): Promise<UserProfile> {
    const response = await apiClient.put(
      `/users/addresses/${addressId}/default-shipping`
    );
    return response.data;
  }

  /**
   * Set default billing address
   */
  async setDefaultBillingAddress(addressId: string): Promise<UserProfile> {
    const response = await apiClient.put(
      `/users/addresses/${addressId}/default-billing`
    );
    return response.data;
  }

  /**
   * Get user's wishlist
   */
  async getWishlist(): Promise<any[]> {
    const response = await apiClient.get("/users/wishlist");
    return response.data;
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(productId: string): Promise<any> {
    const response = await apiClient.post("/users/wishlist", { productId });
    return response.data;
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(productId: string): Promise<any> {
    const response = await apiClient.delete(`/users/wishlist/${productId}`);
    return response.data;
  }

  /**
   * Get user's loyalty points
   */
  async getLoyaltyPoints(): Promise<{ points: number; tier: string }> {
    const response = await apiClient.get("/loyalty/points");
    return response.data;
  }

  /**
   * Get loyalty history
   */
  async getLoyaltyHistory(): Promise<any[]> {
    const response = await apiClient.get("/loyalty/history");
    return response.data;
  }

  /**
   * Get available loyalty rewards
   */
  async getLoyaltyRewards(): Promise<any[]> {
    const response = await apiClient.get("/loyalty/rewards");
    return response.data;
  }

  /**
   * Redeem a loyalty reward
   */
  async redeemLoyaltyReward(rewardId: string): Promise<any> {
    const response = await apiClient.post("/loyalty/redeem", { rewardId });
    return response.data;
  }
}

// Create a singleton instance
const userService = new UserService();
export default userService;
