import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft, Clock, Users, Star, Play } from 'lucide-react';
import { activitiesAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDuration, getCategoryLabel, getDifficultyLabel, getDifficultyColor } from '../../utils/helpers';

const ActivityDetail = () => {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery(
    ['activity', id],
    () => activitiesAPI.getActivity(id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading activity..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading activity</h3>
        <p className="text-gray-500">{error.message}</p>
      </div>
    );
  }

  const activity = data?.data?.activity;

  if (!activity) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Activity not found</h3>
        <p className="text-gray-500">The activity you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {getCategoryLabel(activity.category)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Image */}
          {activity.thumbnailImage && (
            <Card>
              <img
                src={activity.thumbnailImage}
                alt={activity.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </Card>
          )}

          {/* Description */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Description</h3>
            </Card.Header>
            <Card.Body>
              <p className="text-gray-700 whitespace-pre-wrap">{activity.description}</p>
            </Card.Body>
          </Card>

          {/* Instructions */}
          {activity.instructions && activity.instructions.length > 0 && (
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Instructions</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  {activity.instructions.map((instruction, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {instruction.step}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700">{instruction.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Materials */}
          {activity.materials && activity.materials.length > 0 && (
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Required Materials</h3>
              </Card.Header>
              <Card.Body>
                <ul className="list-disc list-inside space-y-1">
                  {activity.materials.map((material, index) => (
                    <li key={index} className="text-gray-700">{material}</li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activity Info */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium text-gray-900">Activity Details</h3>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Difficulty</span>
                <Badge className={getDifficultyColor(activity.difficultyLevel)}>
                  {getDifficultyLabel(activity.difficultyLevel)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Duration</span>
                <div className="flex items-center text-sm text-gray-900">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDuration(activity.estimatedDuration)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Age Range</span>
                <div className="flex items-center text-sm text-gray-900">
                  <Users className="h-4 w-4 mr-1" />
                  {activity.ageRange?.min}-{activity.ageRange?.max} years
                </div>
              </div>

              {activity.stats?.averageScore && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Average Score</span>
                  <div className="flex items-center text-sm text-gray-900">
                    <Star className="h-4 w-4 mr-1 text-yellow-400" />
                    {activity.stats.averageScore.toFixed(1)}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Actions */}
          <Card>
            <Card.Body>
              <Button variant="primary" className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Activity
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;

