import React from 'react';
import { FileText } from 'lucide-react';
import Card from '../../components/UI/Card';

const PatientDetails = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage patient medical records and documents
        </p>
      </div>

      {/* Content Placeholder */}
      <Card>
        <Card.Body>
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 mb-2">
              Patient Details Coming Soon
            </h3>
            <p className="text-gray-500">
              This page will allow management of patient medical records and document uploads.
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PatientDetails;

