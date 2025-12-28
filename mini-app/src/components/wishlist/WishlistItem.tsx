import React from 'react';
import { Card, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Check, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { useTelegram } from '../../hooks/useTelegram';

export interface WishlistItemProps {
  id: number;
  name: string;
  brand: string;
  imageUrl?: string;
  isPurchased?: boolean;
  onTogglePurchased?: () => void;
  onRemove?: () => void;
  isRemoving?: boolean;
}

export const WishlistItem: React.FC<WishlistItemProps> = ({
  name,
  brand,
  imageUrl,
  isPurchased = false,
  onTogglePurchased,
  onRemove,
  isRemoving = false,
}) => {
  const { hapticImpact } = useTelegram();

  const handleTogglePurchased = () => {
    hapticImpact('light');
    if (onTogglePurchased) {
      onTogglePurchased();
    }
  };

  const handleRemove = () => {
    hapticImpact('medium');
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <Card
      className={`transition-opacity ${isPurchased ? 'opacity-60' : ''} ${
        isRemoving ? 'opacity-50' : ''
      }`}
    >
      <CardContent className="flex items-start gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-tg-secondary-bg flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-8 h-8 text-tg-hint" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-tg-text ${isPurchased ? 'line-through' : ''}`}>
            {name}
          </h3>
          <p className="text-sm text-tg-hint">{brand}</p>
          {isPurchased && (
            <span className="inline-flex items-center text-xs text-green-600 mt-1">
              <Check className="w-3 h-3 mr-1" />
              Purchased
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-end">
        {onTogglePurchased && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTogglePurchased}
            disabled={isRemoving}
          >
            {isPurchased ? 'Mark Unpurchased' : 'Mark Purchased'}
          </Button>
        )}
        {onRemove && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
