import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import cartService, { Cart, CartItem } from "../services/cart.service";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  addToCart: (
    productId: string,
    quantity: number,
    variantId?: string
  ) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (couponCode: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Define initial empty cart state
const initialCart: Cart = {
  id: "",
  items: [],
  summary: {
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Calculate total number of items in cart
  const totalItems =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  useEffect(() => {
    // Load cart when authenticated status changes
    const loadCart = async () => {
      try {
        setIsLoading(true);
        const cartData = await cartService.getCart();
        setCart(cartData);
      } catch (error) {
        // If there's no cart yet, that's okay
        setCart(initialCart);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadCart();
    } else {
      // If not authenticated, check for cart in local storage
      const localCart = localStorage.getItem("cart");
      if (localCart) {
        setCart(JSON.parse(localCart));
      } else {
        setCart(initialCart);
      }
    }
  }, [isAuthenticated]);

  // Save cart to local storage when it changes, if not authenticated
  useEffect(() => {
    if (cart && !isAuthenticated) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, isAuthenticated]);

  const addToCart = async (
    productId: string,
    quantity: number,
    variantId?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      if (isAuthenticated) {
        // If authenticated, use the API
        const updatedCart = await cartService.addToCart(
          productId,
          quantity,
          variantId
        );
        setCart(updatedCart);
      } else {
        // If not authenticated, update local cart
        // This would require product details that we don't have here,
        // in a real implementation we'd need to fetch the product details
        // and then update the local cart
        // For simplicity, let's assume we'd implement this later
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to add to cart");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (isAuthenticated) {
        const updatedCart = await cartService.updateCartItem(itemId, quantity);
        setCart(updatedCart);
      } else {
        // Update local cart
        if (cart) {
          const updatedItems = cart.items.map((item) =>
            item.productId === itemId ? { ...item, quantity } : item
          );

          // Simplified calculation for demo - in a real app, would be more complex
          const subtotal = updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          setCart({
            ...cart,
            items: updatedItems,
            summary: {
              ...cart.summary,
              subtotal,
              total:
                subtotal -
                cart.summary.discount +
                cart.summary.tax +
                cart.summary.shipping,
            },
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to update cart");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (isAuthenticated) {
        const updatedCart = await cartService.removeFromCart(itemId);
        setCart(updatedCart);
      } else {
        // Remove from local cart
        if (cart) {
          const updatedItems = cart.items.filter(
            (item) => item.productId !== itemId
          );

          // Simplified calculation for demo
          const subtotal = updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          setCart({
            ...cart,
            items: updatedItems,
            summary: {
              ...cart.summary,
              subtotal,
              total:
                subtotal -
                cart.summary.discount +
                cart.summary.tax +
                cart.summary.shipping,
            },
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to remove from cart");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isAuthenticated) {
        await cartService.clearCart();
        setCart(initialCart);
      } else {
        // Clear local cart
        localStorage.removeItem("cart");
        setCart(initialCart);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to clear cart");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = async (couponCode: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (isAuthenticated) {
        const updatedCart = await cartService.applyCoupon(couponCode);
        setCart(updatedCart);
      } else {
        // In a real app, we'd validate the coupon on the server
        // For now, we'll just set it in the local cart
        if (cart) {
          setCart({
            ...cart,
            couponCode,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to apply coupon");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoupon = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isAuthenticated) {
        const updatedCart = await cartService.removeCoupon();
        setCart(updatedCart);
      } else {
        // Remove coupon from local cart
        if (cart) {
          const { couponCode, ...cartWithoutCoupon } = cart;
          setCart({
            ...cartWithoutCoupon,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to remove coupon");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    cart,
    isLoading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    totalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
