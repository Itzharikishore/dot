import React from 'react';
import { Bell } from 'lucide-react';
import Card from '../../components/UI/Card';

const Notifications = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your notification preferences and view notification history
        </p>
      </div>

      {/* Content Placeholder */}
      <Card>
        <Card.Body>
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 mb-2">
              Notifications Coming Soon
            </h3>
            <p className="text-gray-500">
              This page will allow you to manage push notifications and view notification history.
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Notifications;

