import React from 'react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, ShoppingBag } from 'lucide-react';

export interface TobaccoCardProps {
  id: number;
  name: string;
  brand: string;
  description?: string;
  imageUrl?: string;
  onAddToWishlist?: () => void;
}

export const TobaccoCard: React.FC<TobaccoCardProps> = ({
  name,
  brand,
  description,
  imageUrl,
  onAddToWishlist,
}) => {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600">{brand}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        {onAddToWishlist && (
          <Button variant="primary" size="sm" onClick={onAddToWishlist}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
