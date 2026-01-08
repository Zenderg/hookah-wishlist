import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import TobaccoCard from './TobaccoCard';

function Wishlist() {
  const { wishlist, fetchWishlist, isLoading, error } = useStore();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  if (isLoading && !wishlist) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-2">Your wishlist is empty</p>
        <p className="text-sm">Search for tobaccos and add them to your wishlist</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Your Wishlist ({wishlist.items.length})
        </h2>
      </div>
      <div className="space-y-4">
        {wishlist.items.map((item) => (
          item.tobacco && (
            <TobaccoCard key={item.tobaccoId} tobacco={item.tobacco} />
          )
        ))}
      </div>
    </div>
  );
}

export default Wishlist;
