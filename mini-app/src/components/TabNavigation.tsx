import { useState } from 'react';

type Tab = 'search' | 'wishlist';

function TabNavigation() {
  const [activeTab, setActiveTab] = useState<Tab>('search');

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex border-b border-gray-200 mb-4">
      <button
        onClick={() => handleTabChange('search')}
        className={`flex-1 py-3 text-center font-medium transition-colors ${
          activeTab === 'search'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        🔍 Search
      </button>
      <button
        onClick={() => handleTabChange('wishlist')}
        className={`flex-1 py-3 text-center font-medium transition-colors ${
          activeTab === 'wishlist'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        📋 Wishlist
      </button>
    </div>
  );
}

export default TabNavigation;
