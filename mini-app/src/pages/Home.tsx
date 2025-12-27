import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Heart, Search, Tag, User } from 'lucide-react';

export const Home: React.FC = () => {
  // Placeholder implementation - full functionality will be in later tasks
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Hookah Wishlist</h1>
          <p className="text-gray-600 mt-1">Manage your hookah tobacco wishlist</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <h3 className="font-semibold text-gray-900">My Wishlist</h3>
              <p className="text-sm text-gray-600 mt-1">View your items</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Search className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Search</h3>
              <p className="text-sm text-gray-600 mt-1">Find tobaccos</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Tag className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold text-gray-900">Brands</h3>
              <p className="text-sm text-gray-600 mt-1">Browse brands</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <User className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold text-gray-900">Profile</h3>
              <p className="text-sm text-gray-600 mt-1">Account settings</p>
            </CardContent>
          </Card>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            This is a placeholder. Full home page functionality will be implemented in later tasks.
          </p>
        </div>
      </div>
    </div>
  );
};
