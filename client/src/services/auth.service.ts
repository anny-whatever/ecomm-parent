import apiClient from "./api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export class AuthService {
  /**
   * Log in a user with email and password
   */
  async login(credentials: LoginCredentials) {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData) {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  }

  /**
   * Log out the current user
   */
  async logout() {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  }

  /**
   * Get the current logged in user
   */
  async getCurrentUser() {
    const response = await apiClient.get("/auth/me");
    return response.data;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const response = await apiClient.post("/auth/password-reset-request", {
      email,
    });
    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const response = await apiClient.post("/auth/password-reset", {
      token,
      newPassword,
    });
    return response.data;
  }

  /**
   * Change password for logged in user
   */
  async changePassword(oldPassword: string, newPassword: string) {
    const response = await apiClient.post("/auth/change-password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    const response = await apiClient.post("/auth/verify-email", { token });
    return response.data;
  }
}

// Create a singleton instance
const authService = new AuthService();
export default authService;
