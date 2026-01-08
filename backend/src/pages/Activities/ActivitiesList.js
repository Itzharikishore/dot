import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Search, 
  Filter, 
  Eye,
  Clock,
  Users,
  Star,
  Plus
} from 'lucide-react';
import { activitiesAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { 
  formatDuration, 
  getCategoryLabel, 
  getDifficultyLabel, 
  getDifficultyColor,
  cn 
} from '../../utils/helpers';

const ActivitiesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedAge, setSelectedAge] = useState('');

  // Fetch activities
  const { data, isLoading, error } = useQuery(
    ['activities', { searchTerm, selectedCategory, selectedDifficulty, selectedAge }],
    () => activitiesAPI.getActivities({
      q: searchTerm,
      category: selectedCategory,
      difficultyLevel: selectedDifficulty,
      minAge: selectedAge,
      status: 'published'
    })
  );

  const activities = data?.data?.activities || [];

  // Category options
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'speech-articulation', label: 'Speech - Articulation' },
    { value: 'speech-language', label: 'Speech - Language' },
    { value: 'speech-fluency', label: 'Speech - Fluency' },
    { value: 'cognitive-memory', label: 'Cognitive - Memory' },
    { value: 'cognitive-attention', label: 'Cognitive - Attention' },
    { value: 'cognitive-problem-solving', label: 'Cognitive - Problem Solving' },
    { value: 'motor-fine', label: 'Motor - Fine' },
    { value: 'motor-gross', label: 'Motor - Gross' },
    { value: 'social-communication', label: 'Social - Communication' },
    { value: 'social-interaction', label: 'Social - Interaction' },
    { value: 'behavioral-regulation', label: 'Behavioral - Regulation' },
    { value: 'sensory-processing', label: 'Sensory - Processing' },
  ];

  const difficultyOptions = [
    { value: '', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const ageOptions = [
    { value: '', label: 'All Ages' },
    { value: '3', label: '3+ years' },
    { value: '5', label: '5+ years' },
    { value: '8', label: '8+ years' },
    { value: '12', label: '12+ years' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading activities..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Search className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading activities</h3>
        <p className="text-gray-500">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and explore therapy activities
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input"
            >
              {difficultyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </Card.Body>
      </Card>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <Card>
          <Card.Body>
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <Card key={activity._id} className="hover:shadow-md transition-shadow">
              <div className="relative">
                {activity.thumbnailImage && (
                  <img
                    src={activity.thumbnailImage}
                    alt={activity.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <div className="absolute top-3 right-3">
                  <Badge 
                    variant="secondary" 
                    className={cn(getDifficultyColor(activity.difficultyLevel))}
                  >
                    {getDifficultyLabel(activity.difficultyLevel)}
                  </Badge>
                </div>
              </div>
              
              <Card.Body>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {getCategoryLabel(activity.category)}
                    </p>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-3">
                    {activity.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDuration(activity.estimatedDuration)}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {activity.ageRange?.min}-{activity.ageRange?.max} years
                    </div>
                  </div>

                  {activity.tags && activity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {activity.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" size="sm">
                          {tag}
                        </Badge>
                      ))}
                      {activity.tags.length > 3 && (
                        <Badge variant="secondary" size="sm">
                          +{activity.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="h-4 w-4 mr-1 text-yellow-400" />
                      {activity.stats?.averageScore?.toFixed(1) || 'N/A'}
                    </div>
                    <Link to={`/activities/${activity._id}`}>
                      <Button variant="primary" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {activities.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {activities.length} activities
        </div>
      )}
    </div>
  );
};

export default ActivitiesList;
