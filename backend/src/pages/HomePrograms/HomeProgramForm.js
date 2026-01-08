import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

const HomeProgramForm = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Home Program</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a structured therapy program for a child
          </p>
        </div>
      </div>

      {/* Form Placeholder */}
      <Card>
        <Card.Body>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Home Program Form Coming Soon
            </h3>
            <p className="text-gray-500">
              This form will allow therapists to create structured therapy programs with multiple activities.
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default HomeProgramForm;

