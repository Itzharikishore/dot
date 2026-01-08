import React from 'react';
import { useQuery } from 'react-query';
import { 
  Users, 
  Activity, 
  BarChart3, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { childrenAPI, activitiesAPI, progressAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatNumber, formatPercentage, formatDate } from '../../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch dashboard data based on user role
  const { data: childrenData, isLoading: childrenLoading } = useQuery(
    'children',
    childrenAPI.getChildren,
    {
      enabled: ['superuser', 'hospital', 'therapist'].includes(user?.role),
    }
  );

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery(
    'activities',
    () => activitiesAPI.getActivities({ status: 'published' }),
    {
      enabled: true,
    }
  );

  const { data: progressData, isLoading: progressLoading } = useQuery(
    'user-progress',
    () => progressAPI.getUserProgress(user?.id),
    {
      enabled: !!user?.id,
    }
  );

  const isLoading = childrenLoading || activitiesLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    totalChildren: childrenData?.data?.count || 0,
    totalActivities: activitiesData?.data?.count || 0,
    completedActivities: progressData?.data?.summary?.completedMilestones || 0,
    averageProgress: progressData?.data?.summary?.averageProgress || 0,
  };

  // Recent activities for children
  const recentActivities = progressData?.data?.progress?.slice(0, 5) || [];

  // Quick actions based on role
  const quickActions = [
    {
      title: 'View Activities',
      description: 'Browse available therapy activities',
      href: '/activities',
      icon: Activity,
      color: 'bg-blue-500',
    },
    {
      title: 'Track Progress',
      description: 'View your progress and achievements',
      href: '/progress',
      icon: BarChart3,
      color: 'bg-green-500',
    },
  ];

  if (['superuser', 'hospital', 'therapist'].includes(user?.role)) {
    quickActions.unshift(
      {
        title: 'Manage Children',
        description: 'Add and manage child profiles',
        href: '/children',
        icon: Users,
        color: 'bg-purple-500',
      },
      {
        title: 'Create Assignment',
        description: 'Assign activities to children',
        href: '/assignments/new',
        icon: Calendar,
        color: 'bg-orange-500',
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="mt-2 text-primary-100">
          Here's what's happening with your therapy program today.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Children</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(stats.totalChildren)}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Activities</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(stats.totalActivities)}
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
                <p className="text-sm font-medium text-gray-500">Completed Activities</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(stats.completedActivities)}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Progress</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPercentage(stats.averageProgress)}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className="group relative rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                        {action.title}
                      </p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Recent Activity */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </Card.Header>
          <Card.Body>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Progress updated
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(activity.updatedAt)} • {formatPercentage(activity.progressPercentage)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by completing some activities to see your progress here.
                </p>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Role-specific content */}
      {user?.role === 'child' && (
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Your Therapy Journey</h3>
          </Card.Header>
          <Card.Body>
            <div className="text-center py-6">
              <Activity className="mx-auto h-12 w-12 text-primary-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Ready to start?</h3>
              <p className="mt-1 text-sm text-gray-500">
                Browse available activities and start your therapy journey today.
              </p>
              <div className="mt-4">
                <a
                  href="/activities"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  View Activities
                </a>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
