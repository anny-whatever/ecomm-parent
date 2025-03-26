import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Layouts
const MainLayout = lazy(() => import('./components/layout/MainLayout'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const AuthLayout = lazy(() => import('./components/layout/AuthLayout'));

// Public Pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));

// Shop Pages
const ProductsPage = lazy(() => import('./pages/shop/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/shop/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/shop/CartPage'));
const CheckoutPage = lazy(() => import('./pages/shop/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/shop/OrderSuccessPage'));

// User Pages
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/user/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/user/OrderDetailPage'));
const AddressesPage = lazy(() => import('./pages/user/AddressesPage'));
const WishlistPage = lazy(() => import('./pages/user/WishlistPage'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const AdminProductFormPage = lazy(() => import('./pages/admin/ProductFormPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/OrdersPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/OrderDetailPage'));
const AdminCustomersPage = lazy(() => import('./pages/admin/CustomersPage'));
const AdminCustomerDetailPage = lazy(() => import('./pages/admin/CustomerDetailPage'));
const AdminCouponsPage = lazy(() => import('./pages/admin/CouponsPage'));
const AdminBannersPage = lazy(() => import('./pages/admin/BannersPage'));

// Error Pages
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));

// Loading Component
const LoadingPage = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Route Guards
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user && user.role === 'admin';
  return isAdmin ? children : <Navigate to="/" />;
};

// Router Configuration
const router = createBrowserRouter([
  // Main Layout - Public & User Routes
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingPage />}>
        <MainLayout />
      </Suspense>
    ),
    children: [
      // Public Routes
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:productId', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      
      // Protected User Routes
      { 
        path: 'checkout', 
        element: <PrivateRoute><CheckoutPage /></PrivateRoute>
      },
      { 
        path: 'order-success', 
        element: <PrivateRoute><OrderSuccessPage /></PrivateRoute>
      },
      { 
        path: 'profile', 
        element: <PrivateRoute><ProfilePage /></PrivateRoute>
      },
      { 
        path: 'orders', 
        element: <PrivateRoute><OrdersPage /></PrivateRoute>
      },
      { 
        path: 'orders/:orderId', 
        element: <PrivateRoute><OrderDetailPage /></PrivateRoute>
      },
      { 
        path: 'addresses', 
        element: <PrivateRoute><AddressesPage /></PrivateRoute>
      },
      { 
        path: 'wishlist', 
        element: <PrivateRoute><WishlistPage /></PrivateRoute>
      },
      { path: '*', element: <NotFoundPage /> }
    ]
  },
  
  // Auth Layout - Authentication Routes
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingPage />}>
        <AuthLayout />
      </Suspense>
    ),
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'verify-email/:token', element: <VerifyEmailPage /> }
    ]
  },
  
  // Admin Layout - Admin Routes
  {
    path: '/admin',
    element: (
      <Suspense fallback={<LoadingPage />}>
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      </Suspense>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'products/new', element: <AdminProductFormPage /> },
      { path: 'products/:productId/edit', element: <AdminProductFormPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'orders/:orderId', element: <AdminOrderDetailPage /> },
      { path: 'customers', element: <AdminCustomersPage /> },
      { path: 'customers/:customerId', element: <AdminCustomerDetailPage /> },
      { path: 'coupons', element: <AdminCouponsPage /> },
      { path: 'banners', element: <AdminBannersPage /> }
    ]
  }
]);

export default router; 