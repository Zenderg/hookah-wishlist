import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Brands } from './pages/Brands';
import { Profile } from './pages/Profile';
import { WishlistPage } from './components/wishlist/WishlistPage';
import { Home as HomeIcon, Search as SearchIcon, Tag, User } from 'lucide-react';

// Navigation component
const Navigation = () => {
  const location = useLocation();
  const isWishlistPage = location.pathname === '/wishlist';

  // Don't show navigation on wishlist page
  if (isWishlistPage) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto flex justify-around py-2">
        <NavItem to="/" icon={<HomeIcon className="w-6 h-6" />} label="Home" />
        <NavItem to="/search" icon={<SearchIcon className="w-6 h-6" />} label="Search" />
        <NavItem to="/brands" icon={<Tag className="w-6 h-6" />} label="Brands" />
        <NavItem to="/profile" icon={<User className="w-6 h-6" />} label="Profile" />
      </div>
    </nav>
  );
};

// Navigation item component
const NavItem = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <a
      href={to}
      className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors ${
        isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </a>
  );
};

// Main App component
function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wishlist" element={<WishlistPage />} />
      </Routes>
      <Navigation />
    </div>
  );
}

// App component with Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
