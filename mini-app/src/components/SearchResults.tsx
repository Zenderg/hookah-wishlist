import { useStore } from '../store/useStore';
import TobaccoCard from './TobaccoCard';

function SearchResults() {
  const { searchResults, isLoading, error, searchQuery } = useStore();

  if (isLoading) {
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

  if (!searchQuery) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Enter a search term to find tobaccos</p>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No tobaccos found for "{searchQuery}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchResults.map((tobacco) => (
        <TobaccoCard key={tobacco.id} tobacco={tobacco} />
      ))}
    </div>
  );
}

export default SearchResults;
