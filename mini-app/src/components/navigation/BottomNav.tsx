import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Search, Layout, User } from 'lucide-react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 ${
        isActive
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="text-xs mt-1 font-medium">{label}</span>
    </Link>
  );
};

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const isWishlistPage = location.pathname === '/wishlist';

  // Don't show navigation on wishlist page
  if (isWishlistPage) {
    return null;
  }

  const navItems = [
    { to: '/', icon: <Home className="w-6 h-6" />, label: 'Home' },
    { to: '/search', icon: <Search className="w-6 h-6" />, label: 'Search' },
    { to: '/brands', icon: <Layout className="w-6 h-6" />, label: 'Brands' },
    { to: '/profile', icon: <User className="w-6 h-6" />, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.to}
          />
        ))}
      </div>
    </nav>
  );
};
