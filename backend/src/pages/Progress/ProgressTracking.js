import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { progressAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDate, formatPercentage, formatDuration } from '../../utils/helpers';

const ProgressTracking = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMilestone, setFilterMilestone] = useState('');

  // Fetch user's progress
  const { data, isLoading, error } = useQuery(
    ['user-progress', user?.id, { searchTerm, filterStatus, filterMilestone }],
    () => progressAPI.getUserProgress(user?.id, {
      status: filterStatus,
      milestone: filterMilestone,
    }),
    {
      enabled: !!user?.id,
    }
  );

  const progressEntries = data?.data?.progress || [];
  const summary = data?.data?.summary || {};

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'approved', label: 'Approved' },
  ];

  const milestoneOptions = [
    { value: '', label: 'All Milestones' },
    { value: 'started', label: 'Started' },
    { value: 'quarter', label: '25% Complete' },
    { value: 'half', label: '50% Complete' },
    { value: 'three-quarters', label: '75% Complete' },
    { value: 'completed', label: 'Completed' },
    { value: 'custom', label: 'Custom' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading progress..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <TrendingUp className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading progress</h3>
        <p className="text-gray-500">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your therapy progress and achievements
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/progress/new">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Progress
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Entries</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summary.totalEntries || 0}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPercentage(summary.averageProgress || 0)}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Milestones</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {summary.completedMilestones || 0}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Time</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatDuration(summary.totalTimeSpent || 0)}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search progress entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filterMilestone}
              onChange={(e) => setFilterMilestone(e.target.value)}
              className="input"
            >
              {milestoneOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </Card.Body>
      </Card>

      {/* Progress Entries */}
      {progressEntries.length === 0 ? (
        <Card>
          <Card.Body>
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No progress entries</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start tracking your progress by adding your first entry.
              </p>
              <div className="mt-6">
                <Link to="/progress/new">
                  <Button variant="primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Progress Entry
                  </Button>
                </Link>
              </div>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="space-y-4">
          {progressEntries.map((entry) => (
            <Card key={entry._id} className="hover:shadow-md transition-shadow">
              <Card.Body>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        Progress Entry
                      </h3>
                      <Badge variant="success">
                        {formatPercentage(entry.progressPercentage)}
                      </Badge>
                      {entry.milestone && (
                        <Badge variant="secondary">
                          {entry.milestone}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(entry.updatedAt)}
                      </div>
                      {entry.timeSpent && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatDuration(entry.timeSpent)}
                        </div>
                      )}
                      {entry.score && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Score: {entry.score}
                        </div>
                      )}
                    </div>

                    {entry.notes && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {entry.notes}
                      </p>
                    )}

                    {entry.completedTasks && entry.completedTasks.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Completed Tasks:</p>
                        <div className="flex flex-wrap gap-1">
                          {entry.completedTasks.slice(0, 3).map((task, index) => (
                            <Badge key={index} variant="success" size="sm">
                              {task}
                            </Badge>
                          ))}
                          {entry.completedTasks.length > 3 && (
                            <Badge variant="secondary" size="sm">
                              +{entry.completedTasks.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <Link to={`/progress/${entry._id}`}>
                      <Button variant="secondary" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
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
      {progressEntries.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {progressEntries.length} progress entries
        </div>
      )}
    </div>
  );
};

export default ProgressTracking;

