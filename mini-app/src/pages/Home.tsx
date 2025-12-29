import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Heart, Search, Tag, User } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-tg-bg p-4 pb-20">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-tg-text">Hookah Wishlist</h1>
          <p className="text-tg-hint mt-1">Manage your hookah tobacco wishlist</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('/wishlist')}
          >
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <h3 className="font-semibold text-tg-text">My Wishlist</h3>
              <p className="text-sm text-tg-hint mt-1">View your items</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('/search')}
          >
            <CardContent className="p-4 text-center">
              <Search className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold text-tg-text">Search</h3>
              <p className="text-sm text-tg-hint mt-1">Find tobaccos</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('/brands')}
          >
            <CardContent className="p-4 text-center">
              <Tag className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold text-tg-text">Brands</h3>
              <p className="text-sm text-tg-hint mt-1">Browse brands</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('/profile')}
          >
            <CardContent className="p-4 text-center">
              <User className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold text-tg-text">Profile</h3>
              <p className="text-sm text-tg-hint mt-1">Account settings</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
