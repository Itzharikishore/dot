import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Edit, 
  ArrowLeft, 
  Calendar, 
  User, 
  Phone,
  FileText,
  Activity,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { childrenAPI, progressAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDate, calculateAge, getStatusColor, getStatusLabel } from '../../utils/helpers';

const ChildDetail = () => {
  const { id } = useParams();

  // Fetch child data
  const { data: childData, isLoading: childLoading, error: childError } = useQuery(
    ['child', id],
    () => childrenAPI.getChild(id)
  );

  // Fetch child's progress data
  const { data: progressData, isLoading: progressLoading } = useQuery(
    ['child-progress', id],
    () => progressAPI.getUserProgress(id),
    {
      enabled: !!id,
    }
  );

  if (childLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading child details..." />
      </div>
    );
  }

  if (childError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <User className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading child</h3>
        <p className="text-gray-500">{childError.message}</p>
        <div className="mt-4">
          <Link to="/children">
            <Button variant="primary">Back to Children</Button>
          </Link>
        </div>
      </div>
    );
  }

  const child = childData?.data?.child;
  if (!child) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Child not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The child you're looking for doesn't exist or has been deleted.
        </p>
        <div className="mt-6">
          <Link to="/children">
            <Button variant="primary">Back to Children</Button>
          </Link>
        </div>
      </div>
    );
  }

  const progress = progressData?.data;
  const recentProgress = progress?.progress?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/children">
            <Button variant="ghost" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{child.fullName}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Child Profile • {child.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
        <Link to={`/children/${child._id}/edit`}>
          <Button variant="primary">
            <Edit className="h-4 w-4 mr-2" />
            Edit Child
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Full Name</h4>
                  <p className="text-gray-900">{child.fullName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Age</h4>
                  <p className="text-gray-900">
                    {calculateAge(child.dateOfBirth) ? `${calculateAge(child.dateOfBirth)} years old` : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Date of Birth</h4>
                  <p className="text-gray-900">{formatDate(child.dateOfBirth)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Gender</h4>
                  <p className="text-gray-900 capitalize">{child.gender || 'Not specified'}</p>
                </div>
              </div>

              {child.notes && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                  <p className="text-gray-900 whitespace-pre-wrap">{child.notes}</p>
                </div>
              )}

              {child.tags && child.tags.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {child.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Medical Information */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Medical Information</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {child.medical?.diagnosis && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Diagnosis</h4>
                    <p className="text-gray-900">{child.medical.diagnosis}</p>
                  </div>
                )}

                {child.medical?.medications && child.medical.medications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Medications</h4>
                    <ul className="list-disc list-inside text-gray-900 space-y-1">
                      {child.medical.medications.map((medication, index) => (
                        <li key={index}>{medication}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {child.medical?.allergies && child.medical.allergies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Allergies</h4>
                    <ul className="list-disc list-inside text-gray-900 space-y-1">
                      {child.medical.allergies.map((allergy, index) => (
                        <li key={index}>{allergy}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!child.medical?.diagnosis && 
                 (!child.medical?.medications || child.medical.medications.length === 0) && 
                 (!child.medical?.allergies || child.medical.allergies.length === 0) && (
                  <p className="text-gray-500 italic">No medical information available</p>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Recent Progress */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Progress</h3>
                <Link to={`/progress?childId=${child._id}`}>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </Card.Header>
            <Card.Body>
              {progressLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" text="Loading progress..." />
                </div>
              ) : recentProgress.length > 0 ? (
                <div className="space-y-4">
                  {recentProgress.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Progress Entry
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(entry.updatedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="success">
                          {entry.progressPercentage}%
                        </Badge>
                        {entry.milestone && (
                          <p className="text-xs text-gray-500 mt-1">
                            {entry.milestone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No progress yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Progress entries will appear here once activities are completed.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Picture */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Profile</h3>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                {child.profilePicture ? (
                  <img
                    src={child.profilePicture}
                    alt={child.fullName}
                    className="mx-auto h-32 w-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="mt-4">
                  <Badge variant={child.isActive ? 'success' : 'secondary'}>
                    {child.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Actions */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <Link to={`/assignments/new?childId=${child._id}`} className="block">
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Assign Activity
                  </Button>
                </Link>
                <Link to={`/home-programs/new?childId=${child._id}`} className="block">
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Create Program
                  </Button>
                </Link>
                <Link to={`/progress/new?childId=${child._id}`} className="block">
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Add Progress
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>

          {/* Statistics */}
          {progress && (
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Progress Entries</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {progress.summary?.totalEntries || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average Progress</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {progress.summary?.averageProgress?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed Milestones</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {progress.summary?.completedMilestones || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Time Spent</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {progress.summary?.totalTimeSpent || 0} min
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildDetail;
