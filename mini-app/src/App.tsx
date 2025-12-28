import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Brands } from './pages/Brands';
import { Profile } from './pages/Profile';
import { WishlistPage } from './components/wishlist/WishlistPage';
import { BottomNav } from './components/navigation/BottomNav';
import { MainButtonProvider } from './contexts/MainButtonContext';
import { useEffect } from 'react';

// Page transition wrapper
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return <div className="page-transition">{children}</div>;
};

// Main App component with Router
function App() {
  return (
    <MainButtonProvider>
      <Router>
        <div className="min-h-screen bg-tg-bg pb-20">
          <Routes>
            <Route
              path="/"
              element={
                <PageTransition>
                  <Home />
                </PageTransition>
              }
            />
            <Route
              path="/search"
              element={
                <PageTransition>
                  <Search />
                </PageTransition>
              }
            />
            <Route
              path="/brands"
              element={
                <PageTransition>
                  <Brands />
                </PageTransition>
              }
            />
            <Route
              path="/profile"
              element={
                <PageTransition>
                  <Profile />
                </PageTransition>
              }
            />
            <Route
              path="/wishlist"
              element={
                <PageTransition>
                  <WishlistPage />
                </PageTransition>
              }
            />
          </Routes>
          <BottomNav />
        </div>
      </Router>
    </MainButtonProvider>
  );
}

export default App;
