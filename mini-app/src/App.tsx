import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Brands } from './pages/Brands';
import { Profile } from './pages/Profile';
import { WishlistPage } from './components/wishlist/WishlistPage';
import { BottomNav } from './components/navigation/BottomNav';
import { MainButtonProvider } from './contexts/MainButtonContext';
import { useEffect, useState } from 'react';

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
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle initialization errors
  useEffect(() => {
    const handleInitializationError = (event: ErrorEvent) => {
      console.error('[App] Initialization error:', event.error);
      setHasError(true);
      setErrorMessage(event.error?.message || 'Unknown initialization error');
    };

    window.addEventListener('error', handleInitializationError);

    return () => {
      window.removeEventListener('error', handleInitializationError);
    };
  }, []);

  // Show error state if initialization failed
  if (hasError) {
    return (
      <div className="error-container">
        <h1 className="error-title">Initialization Error</h1>
        <div className="error-message">
          <p className="error-label">Error:</p>
          <p className="error-text">{errorMessage}</p>
          <p className="error-text">
            The app failed to initialize. This could be due to a network issue or a problem with the
            Telegram SDK. Please try again.
          </p>
        </div>
        <button
          className="error-retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

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
