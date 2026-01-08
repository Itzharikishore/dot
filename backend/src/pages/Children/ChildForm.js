import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X,
  User,
  Calendar,
  Phone,
  FileText
} from 'lucide-react';
import { childrenAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Textarea from '../../components/UI/Textarea';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ChildForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      notes: '',
      tags: [],
      medical: {
        diagnosis: '',
        medications: [],
        allergies: [],
      },
      isActive: true,
    },
  });

  // Fetch child data if editing
  const { data: childData, isLoading: childLoading } = useQuery(
    ['child', id],
    () => childrenAPI.getChild(id),
    {
      enabled: isEditing,
    }
  );

  // Create/Update mutations
  const createMutation = useMutation(childrenAPI.createChild, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('children');
      toast.success('Child created successfully');
      navigate('/children');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create child');
    },
  });

  const updateMutation = useMutation(
    (data) => childrenAPI.updateChild(id, data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('children');
        queryClient.invalidateQueries(['child', id]);
        toast.success('Child updated successfully');
        navigate('/children');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update child');
      },
    }
  );

  // Load child data when editing
  useEffect(() => {
    if (childData?.data?.child) {
      const child = childData.data.child;
      reset({
        firstName: child.firstName || '',
        lastName: child.lastName || '',
        dateOfBirth: child.dateOfBirth ? formatDate(child.dateOfBirth, 'yyyy-MM-dd') : '',
        gender: child.gender || '',
        notes: child.notes || '',
        tags: child.tags || [],
        medical: {
          diagnosis: child.medical?.diagnosis || '',
          medications: child.medical?.medications || [],
          allergies: child.medical?.allergies || [],
        },
        isActive: child.isActive !== undefined ? child.isActive : true,
      });
      
      if (child.profilePicture) {
        setProfilePicturePreview(child.profilePicture);
      }
    }
  }, [childData, reset]);

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePicturePreview('');
  };

  const onSubmit = async (data) => {
    try {
      // Prepare form data
      const formData = new FormData();
      
      // Add text fields
      Object.keys(data).forEach(key => {
        if (key === 'medical') {
          formData.append(key, JSON.stringify(data[key]));
        } else if (key === 'tags') {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      });

      // Add profile picture if selected
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      if (isEditing) {
        updateMutation.mutate(formData);
      } else {
        createMutation.mutate(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An error occurred while saving');
    }
  };

  const isLoading = childLoading || createMutation.isLoading || updateMutation.isLoading;

  if (isLoading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading child data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/children')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Child' : 'Add New Child'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update child information' : 'Create a new child profile'}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
        >
          <Save className="h-4 w-4 mr-2" />
          {isEditing ? 'Update' : 'Create'}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    required
                    error={errors.firstName?.message}
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters',
                      },
                    })}
                  />
                  <Input
                    label="Last Name"
                    required
                    error={errors.lastName?.message}
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters',
                      },
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    required
                    error={errors.dateOfBirth?.message}
                    {...register('dateOfBirth', {
                      required: 'Date of birth is required',
                      validate: (value) => {
                        if (value && new Date(value) > new Date()) {
                          return 'Date of birth cannot be in the future';
                        }
                        return true;
                      },
                    })}
                  />
                  <Select
                    label="Gender"
                    options={genderOptions}
                    error={errors.gender?.message}
                    {...register('gender')}
                  />
                </div>

                <Textarea
                  label="Notes"
                  rows={3}
                  placeholder="Additional notes about the child..."
                  error={errors.notes?.message}
                  {...register('notes', {
                    maxLength: {
                      value: 1000,
                      message: 'Notes cannot exceed 1000 characters',
                    },
                  })}
                />
              </Card.Body>
            </Card>

            {/* Medical Information */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Medical Information</h3>
              </Card.Header>
              <Card.Body className="space-y-4">
                <Input
                  label="Diagnosis"
                  placeholder="e.g., Autism Spectrum Disorder"
                  error={errors.medical?.diagnosis?.message}
                  {...register('medical.diagnosis', {
                    maxLength: {
                      value: 200,
                      message: 'Diagnosis cannot exceed 200 characters',
                    },
                  })}
                />

                <div>
                  <label className="label">Medications</label>
                  <Textarea
                    rows={2}
                    placeholder="List current medications (one per line)"
                    {...register('medical.medications')}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter each medication on a new line
                  </p>
                </div>

                <div>
                  <label className="label">Allergies</label>
                  <Textarea
                    rows={2}
                    placeholder="List known allergies (one per line)"
                    {...register('medical.allergies')}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter each allergy on a new line
                  </p>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
              </Card.Header>
              <Card.Body>
                <div className="text-center">
                  {profilePicturePreview ? (
                    <div className="relative">
                      <img
                        src={profilePicturePreview}
                        alt="Profile preview"
                        className="mx-auto h-32 w-32 rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeProfilePicture}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mx-auto h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-16 w-16 text-gray-400" />
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                      <Button variant="secondary" size="sm" type="button">
                        <Upload className="h-4 w-4 mr-2" />
                        {profilePicturePreview ? 'Change' : 'Upload'} Photo
                      </Button>
                    </label>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Status */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900">Status</h3>
              </Card.Header>
              <Card.Body>
                <div className="flex items-center">
                  <input
                    id="isActive"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register('isActive')}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Inactive children won't appear in most lists
                </p>
              </Card.Body>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChildForm;
