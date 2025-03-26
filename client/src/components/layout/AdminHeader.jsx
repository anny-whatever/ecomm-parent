import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiBell, FiLogOut, FiUser } from 'react-icons/fi';
import { authService } from '../../services';

const AdminHeader = ({ toggleSidebar }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = () => {
      const userData = authService.getUser();
      setUser(userData);
    };

    loadUser();
    // In a real app, you would fetch notifications here
    setNotifications([
      { id: 1, message: 'New order #12345', time: '10 min ago' },
      { id: 2, message: 'Low inventory alert: Product XYZ', time: '1 hour ago' },
      { id: 3, message: 'Customer support ticket #54321', time: '2 hours ago' }
    ]);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-primary focus:outline-none mr-4 md:hidden"
          aria-label="Toggle sidebar"
        >
          <FiMenu size={24} />
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-gray-900">Admin Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-gray-500 hover:text-primary focus:outline-none p-1 relative"
            aria-label="Notifications"
          >
            <FiBell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-accent text-white text-xs flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
              <div className="py-2 px-3 bg-gray-100 border-b border-gray-200">
                <h3 className="text-sm font-semibold">Notifications</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div key={notification.id} className="p-3 hover:bg-gray-50">
                      <p className="text-sm text-gray-800">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-gray-500">No new notifications</div>
                )}
              </div>
              <div className="py-2 px-3 bg-gray-100 border-t border-gray-200 text-center">
                <Link to="/admin/notifications" className="text-xs text-primary hover:underline">
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="text-gray-500 hover:text-primary focus:outline-none flex items-center space-x-1"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover" 
                />
              ) : (
                <FiUser size={18} />
              )}
            </div>
            <span className="hidden md:inline text-sm font-medium text-gray-700">
              {user?.name || 'Admin'}
            </span>
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20">
              <div className="py-2 px-4 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || ''}
                </p>
              </div>
              <div className="py-1">
                <Link 
                  to="/admin/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  My Profile
                </Link>
                <Link 
                  to="/" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  View Store
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <FiLogOut size={16} className="mr-2" />
                    <span>Sign out</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader; 