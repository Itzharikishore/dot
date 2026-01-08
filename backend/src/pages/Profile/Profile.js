import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Full Name</h4>
                  <p className="text-gray-900">{user?.firstName} {user?.lastName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Email</h4>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Role</h4>
                  <p className="text-gray-900 capitalize">{user?.role}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Phone</h4>
                  <p className="text-gray-900">{user?.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Profile Picture */}
        <div>
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div className="mx-auto h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-16 w-16 text-gray-400" />
                </div>
                <div className="mt-4">
                  <Button variant="secondary" size="sm">
                    Change Photo
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <Card>
        <Card.Body>
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Profile Management Coming Soon
            </h3>
            <p className="text-gray-500">
              Full profile editing capabilities will be available soon.
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Profile;

