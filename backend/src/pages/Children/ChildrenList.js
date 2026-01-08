import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { childrenAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Badge from '../../components/UI/Badge';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDate, calculateAge, cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ChildrenList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  // Fetch children data
  const { data, isLoading, error } = useQuery('children', childrenAPI.getChildren);

  // Delete child mutation
  const deleteChildMutation = useMutation(childrenAPI.deleteChild, {
    onSuccess: () => {
      queryClient.invalidateQueries('children');
      toast.success('Child deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete child');
    },
  });

  const handleDelete = async (childId, childName) => {
    if (window.confirm(`Are you sure you want to delete ${childName}? This action cannot be undone.`)) {
      deleteChildMutation.mutate(childId);
    }
  };

  // Filter and search children
  const filteredChildren = data?.data?.children?.filter((child) => {
    const matchesSearch = 
      child.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && child.isActive) ||
      (filterStatus === 'inactive' && !child.isActive);
    
    return matchesSearch && matchesFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading children..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <User className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading children</h3>
        <p className="text-gray-500">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Children</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage child profiles and their therapy information
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/children/new">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <Card.Body>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search children by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="all">All Children</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Children Grid */}
      {filteredChildren.length === 0 ? (
        <Card>
          <Card.Body>
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No children found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding a new child profile.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <div className="mt-6">
                  <Link to="/children/new">
                    <Button variant="primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Child
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChildren.map((child) => (
            <Card key={child._id} className="hover:shadow-md transition-shadow">
              <Card.Body>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                      {child.profilePicture ? (
                        <img
                          src={child.profilePicture}
                          alt={child.fullName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {child.fullName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Age: {calculateAge(child.dateOfBirth) || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={child.isActive ? 'success' : 'secondary'}>
                    {child.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Born: {formatDate(child.dateOfBirth)}
                  </div>
                  
                  {child.medical?.diagnosis && (
                    <div className="text-sm">
                      <span className="text-gray-500">Diagnosis:</span>{' '}
                      <span className="text-gray-900">{child.medical.diagnosis}</span>
                    </div>
                  )}

                  {child.tags && child.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {child.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" size="sm">
                          {tag}
                        </Badge>
                      ))}
                      {child.tags.length > 3 && (
                        <Badge variant="secondary" size="sm">
                          +{child.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex space-x-2">
                  <Link
                    to={`/children/${child._id}`}
                    className="flex-1"
                  >
                    <Button variant="secondary" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Link
                    to={`/children/${child._id}/edit`}
                    className="flex-1"
                  >
                    <Button variant="secondary" size="sm" className="w-full">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => handleDelete(child._id, child.fullName)}
                    disabled={deleteChildMutation.isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredChildren.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {filteredChildren.length} of {data?.data?.count || 0} children
        </div>
      )}
    </div>
  );
};

export default ChildrenList;
