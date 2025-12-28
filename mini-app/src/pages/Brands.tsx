import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Tag } from 'lucide-react';

export const Brands: React.FC = () => {
  // Placeholder implementation - full functionality will be in later tasks
  const brands = [
    { id: 1, name: 'Adalya', slug: 'adalya' },
    { id: 2, name: 'Musthave', slug: 'musthave' },
    { id: 3, name: 'Darkside', slug: 'darkside' },
    { id: 4, name: 'Tangiers', slug: 'tangiers' },
    { id: 5, name: 'Starbuzz', slug: 'starbuzz' },
    { id: 6, name: 'Fumari', slug: 'fumari' },
  ];

  return (
    <div className="min-h-screen bg-tg-bg p-4 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-tg-text mb-6">Brands</h1>

        <div className="grid grid-cols-2 gap-3">
          {brands.map((brand) => (
            <Card
              key={brand.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 text-center">
                <Tag className="w-8 h-8 mx-auto mb-2 text-tg-hint" />
                <h3 className="font-semibold text-tg-text">{brand.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            This is a placeholder. Full brands page functionality will be implemented in later tasks.
          </p>
        </div>
      </div>
    </div>
  );
};
