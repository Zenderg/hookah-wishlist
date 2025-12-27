import React from 'react';
import { SearchPage } from '../components/search/SearchPage';

export const Search: React.FC = () => {
  // Placeholder implementation - full functionality will be in later tasks
  return (
    <SearchPage
      isLoading={false}
      onAddToWishlist={(tobaccoId) => {
        console.log('Add to wishlist:', tobaccoId);
      }}
    />
  );
};
