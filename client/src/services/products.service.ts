import { axiosInstance } from "./api.service";

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  inStock?: boolean;
  featured?: boolean;
  brand?: string;
  attributes?: Record<string, string | string[]>;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  categories: string[];
  brand?: string;
  attributes?: Record<string, any>;
  variants?: ProductVariant[];
  inStock: boolean;
  quantity: number;
  ratings: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  attributes: Record<string, string>;
  inStock: boolean;
  quantity: number;
  image?: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
}

class ProductService {
  /**
   * Get products with filtering and pagination
   */
  async getProducts(
    params: ProductsQueryParams = {}
  ): Promise<ProductsResponse> {
    try {
      const response = await axiosInstance.get("/products", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<Product> {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get a single product by slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    try {
      const response = await axiosInstance.get(`/products/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product with slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    try {
      const response = await axiosInstance.get("/products", {
        params: { featured: true, limit },
      });
      return response.data.products;
    } catch (error) {
      console.error("Error fetching featured products:", error);
      throw error;
    }
  }

  /**
   * Get new arrivals
   */
  async getNewArrivals(limit: number = 10): Promise<Product[]> {
    const response = await axiosInstance.get("/products/new-arrivals", {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get bestsellers
   */
  async getBestsellers(limit: number = 10): Promise<Product[]> {
    const response = await axiosInstance.get("/products/bestsellers", {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get related products
   */
  async getRelatedProducts(
    productId: string,
    limit: number = 4
  ): Promise<Product[]> {
    try {
      const response = await axiosInstance.get(
        `/products/${productId}/related`,
        {
          params: { limit },
        }
      );
      return response.data.products;
    } catch (error) {
      console.error(
        `Error fetching related products for product ID ${productId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    params: ProductsQueryParams = {}
  ): Promise<ProductsResponse> {
    try {
      const response = await axiosInstance.get("/products", {
        params: { ...params, search: query },
      });
      return response.data;
    } catch (error) {
      console.error(`Error searching products with query "${query}":`, error);
      throw error;
    }
  }

  async getProductsByCategory(
    category: string,
    params: ProductsQueryParams = {}
  ): Promise<ProductsResponse> {
    try {
      const response = await axiosInstance.get("/products", {
        params: { ...params, category },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching products in category ${category}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const productService = new ProductService();
export default productService;
