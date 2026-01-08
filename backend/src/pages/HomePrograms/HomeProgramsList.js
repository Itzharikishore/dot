import React from 'react';
import { Plus } from 'lucide-react';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

const HomeProgramsList = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Programs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage structured therapy programs for children
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Program
          </Button>
        </div>
      </div>

      {/* Content Placeholder */}
      <Card>
        <Card.Body>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Home Programs Management Coming Soon
            </h3>
            <p className="text-gray-500">
              This page will allow therapists to create and manage structured therapy programs for children.
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default HomeProgramsList;

