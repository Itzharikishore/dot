import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to perform this action.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

export const childrenAPI = {
  getChildren: () => api.get('/children'),
  getChild: (id) => api.get(`/children/${id}`),
  createChild: (childData) => api.post('/children', childData),
  updateChild: (id, childData) => api.put(`/children/${id}`, childData),
  deleteChild: (id) => api.delete(`/children/${id}`),
};

export const activitiesAPI = {
  getActivities: (params = {}) => api.get('/activities', { params }),
  getActivity: (id) => api.get(`/activities/${id}`),
  createActivity: (activityData) => api.post('/activities', activityData),
  updateActivity: (id, activityData) => api.put(`/activities/${id}`, activityData),
  getByCategory: (category) => api.get(`/activities/category/${category}`),
  uploadCompletion: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/activities/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const progressAPI = {
  createProgress: (progressData) => api.post('/progress', progressData),
  getUserProgress: (userId, params = {}) => api.get(`/progress/${userId}`, { params }),
  getProgramProgress: (userId, programId, params = {}) => 
    api.get(`/progress/${userId}/${programId}`, { params }),
  getProgressById: (progressId) => api.get(`/progress/entry/${progressId}`),
  updateProgress: (progressId, progressData) => api.put(`/progress/${progressId}`, progressData),
  deleteProgress: (progressId) => api.delete(`/progress/${progressId}`),
  reviewProgress: (progressId, reviewData) => api.post(`/progress/${progressId}/review`, reviewData),
  getActivityCompletionStats: (userId, params = {}) => 
    api.get(`/progress/${userId}/activity-completion`, { params }),
  getChildrenCompletionSummary: (params = {}) => 
    api.get('/progress/children/completion-summary', { params }),
  getChildActivityDetails: (userId, params = {}) => 
    api.get(`/progress/${userId}/activity-details`, { params }),
};

export const assignmentsAPI = {
  createAssignment: (assignmentData) => api.post('/activity-assignments', assignmentData),
  getAssignments: (params = {}) => api.get('/activity-assignments', { params }),
  updateAssignment: (id, assignmentData) => api.put(`/activity-assignments/${id}`, assignmentData),
  submitAssignment: (id, submissionData) => api.post(`/activity-assignments/${id}/submit`, submissionData),
};

export const homeProgramsAPI = {
  getByChild: (childId) => api.get(`/home-programs/${childId}`),
  createProgram: (programData) => api.post('/home-programs', programData),
  updateProgram: (id, programData) => api.put(`/home-programs/${id}`, programData),
  completeItem: (id, completionData) => api.post(`/home-programs/${id}/complete`, completionData),
};

export const patientDetailsAPI = {
  getById: (id) => api.get(`/patient-details/${id}`),
  lookup: (params = {}) => api.get('/patient-details', { params }),
  upsert: (patientData) => api.post('/patient-details/upsert', patientData),
  addDocument: (id, file, name) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    return api.post(`/patient-details/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const notificationsAPI = {
  registerToken: (token, userId) => api.post('/notifications/register-token', { token, userId }),
  sendTest: (notificationData) => api.post('/notifications/test', notificationData),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
