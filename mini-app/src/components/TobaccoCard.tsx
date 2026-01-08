import { Tobacco } from '../types';
import { useStore } from '../store/useStore';

interface TobaccoCardProps {
  tobacco: Tobacco;
}

function TobaccoCard({ tobacco }: TobaccoCardProps) {
  const { addToWishlist, removeFromWishlist, wishlist, isLoading } = useStore();
  
  const isInWishlist = wishlist?.items.some(
    (item) => item.tobaccoId === tobacco.id
  );

  const handleToggleWishlist = async () => {
    if (isInWishlist) {
      await removeFromWishlist(tobacco.id);
    } else {
      await addToWishlist(tobacco.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">
            {tobacco.brand} - {tobacco.name}
          </h3>
          {tobacco.flavor && (
            <p className="text-sm text-gray-600 mt-1">🍃 {tobacco.flavor}</p>
          )}
          {tobacco.strength && (
            <p className="text-sm text-gray-600 mt-1">
              💪 Strength: {tobacco.strength}
            </p>
          )}
          {tobacco.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              {tobacco.description}
            </p>
          )}
        </div>
        <button
          onClick={handleToggleWishlist}
          disabled={isLoading}
          className={`ml-4 px-4 py-2 rounded-lg transition-colors ${
            isInWishlist
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          } disabled:bg-gray-400 disabled:cursor-not-allowed`}
        >
          {isInWishlist ? '− Remove' : '+ Add'}
        </button>
      </div>
    </div>
  );
}

export default TobaccoCard;
