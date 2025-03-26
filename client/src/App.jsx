import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import router from './routes';
import { useEffect } from 'react';
import { authService } from './services';

function App() {
  useEffect(() => {
    // Check and refresh the authentication status when the app loads
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          await authService.getCurrentUser();
        }
      } catch (error) {
        // Token might be invalid, remove it
        if (error.status === 401) {
          authService.logout();
        }
      }
    };

    checkAuth();
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#0078ff',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ff5722',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;
