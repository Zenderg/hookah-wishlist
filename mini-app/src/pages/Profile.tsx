import React from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, LogOut, Settings } from 'lucide-react';

export const Profile: React.FC = () => {
  // Placeholder implementation - full functionality will be in later tasks
  return (
    <div className="min-h-screen bg-tg-bg p-4 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-tg-text mb-6">Profile</h1>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-tg-secondary-bg flex items-center justify-center">
                <User className="w-8 h-8 text-tg-hint" />
              </div>
              <div>
                <h2 className="font-semibold text-tg-text">User Name</h2>
                <p className="text-sm text-tg-hint">@username</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold text-tg-text">Settings</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-tg-secondary-bg rounded-lg">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-tg-hint" />
                <span className="text-tg-text">Notifications</span>
              </div>
              <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="danger"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            This is a placeholder. Full profile page functionality will be implemented in later
            tasks.
          </p>
        </div>
      </div>
    </div>
  );
};
