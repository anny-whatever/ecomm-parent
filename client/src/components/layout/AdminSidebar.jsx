import { NavLink, useLocation } from 'react-router-dom';
import { 
  FiHome, FiBox, FiShoppingBag, FiUsers, FiTag, 
  FiImage, FiBarChart2, FiSettings, FiX, FiLayers
} from 'react-icons/fi';

const AdminSidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  
  const navItems = [
    { to: '/admin', icon: <FiHome size={20} />, label: 'Dashboard', exact: true },
    { to: '/admin/products', icon: <FiBox size={20} />, label: 'Products' },
    { to: '/admin/categories', icon: <FiLayers size={20} />, label: 'Categories' },
    { to: '/admin/orders', icon: <FiShoppingBag size={20} />, label: 'Orders' },
    { to: '/admin/customers', icon: <FiUsers size={20} />, label: 'Customers' },
    { to: '/admin/coupons', icon: <FiTag size={20} />, label: 'Coupons' },
    { to: '/admin/banners', icon: <FiImage size={20} />, label: 'Banners' },
    { to: '/admin/analytics', icon: <FiBarChart2 size={20} />, label: 'Analytics' },
    { to: '/admin/settings', icon: <FiSettings size={20} />, label: 'Settings' }
  ];

  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/admin';
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-white shadow-md z-30 transition-all duration-300 transform
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-primary">Admin Panel</h2>
            <button 
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-primary focus:outline-none md:hidden"
              aria-label="Close sidebar"
            >
              <FiX size={24} />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) => `
                      flex items-center px-3 py-2 rounded-md text-sm font-medium
                      ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-200 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Your Store
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar; 