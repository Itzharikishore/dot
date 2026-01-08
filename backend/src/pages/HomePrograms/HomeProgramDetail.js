import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

const HomeProgramDetail = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Program Details</h1>
          <p className="mt-1 text-sm text-gray-500">
            View program details and progress
          </p>
        </div>
      </div>

      {/* Content Placeholder */}
      <Card>
        <Card.Body>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Program Details Coming Soon
            </h3>
            <p className="text-gray-500">
              This page will show detailed information about home program ID: {id}
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default HomeProgramDetail;

