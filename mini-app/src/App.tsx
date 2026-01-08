import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import Wishlist from './components/Wishlist';

type Tab = 'search' | 'wishlist';

function App() {
  const { fetchWishlist } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('search');

  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = (window as any).Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Set theme
    document.body.style.backgroundColor = tg.backgroundColor || '#ffffff';

    // Fetch initial wishlist
    fetchWishlist();
  }, [fetchWishlist]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🔍 Search
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'wishlist'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Wishlist
          </button>
        </div>

        {activeTab === 'search' ? (
          <>
            <SearchBar />
            <SearchResults />
          </>
        ) : (
          <Wishlist />
        )}
      </div>
    </div>
  );
}

export default App;
