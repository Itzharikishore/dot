import { format, parseISO, isValid } from 'date-fns';
import clsx from 'clsx';

// Date formatting utilities
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsedDate) ? format(parsedDate, formatStr) : '';
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

export const formatDateTime = (date) => formatDate(date, 'MMM dd, yyyy HH:mm');
export const formatTime = (date) => formatDate(date, 'HH:mm');
export const formatDateShort = (date) => formatDate(date, 'MMM dd');

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  try {
    const birthDate = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
    if (!isValid(birthDate)) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Age calculation error:', error);
    return null;
  }
};

// Class name utility
export const cn = (...inputs) => clsx(inputs);

// Role-based utilities
export const ROLE_LABELS = {
  superuser: 'Super User',
  hospital: 'Hospital',
  therapist: 'Therapist',
  child: 'Child',
};

export const ROLE_COLORS = {
  superuser: 'bg-purple-100 text-purple-800',
  hospital: 'bg-blue-100 text-blue-800',
  therapist: 'bg-green-100 text-green-800',
  child: 'bg-yellow-100 text-yellow-800',
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || role;
export const getRoleColor = (role) => ROLE_COLORS[role] || 'bg-gray-100 text-gray-800';

// Activity category utilities
export const ACTIVITY_CATEGORIES = {
  'speech-articulation': 'Speech - Articulation',
  'speech-language': 'Speech - Language',
  'speech-fluency': 'Speech - Fluency',
  'cognitive-memory': 'Cognitive - Memory',
  'cognitive-attention': 'Cognitive - Attention',
  'cognitive-problem-solving': 'Cognitive - Problem Solving',
  'motor-fine': 'Motor - Fine',
  'motor-gross': 'Motor - Gross',
  'social-communication': 'Social - Communication',
  'social-interaction': 'Social - Interaction',
  'behavioral-regulation': 'Behavioral - Regulation',
  'sensory-processing': 'Sensory - Processing',
};

export const getCategoryLabel = (category) => ACTIVITY_CATEGORIES[category] || category;

// Difficulty level utilities
export const DIFFICULTY_LEVELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
};

export const getDifficultyLabel = (level) => DIFFICULTY_LEVELS[level] || level;
export const getDifficultyColor = (level) => DIFFICULTY_COLORS[level] || 'bg-gray-100 text-gray-800';

// Status utilities
export const STATUS_LABELS = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  assigned: 'Assigned',
  'in-progress': 'In Progress',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const getStatusLabel = (status) => STATUS_LABELS[status] || status;
export const getStatusColor = (status) => STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

// Progress milestone utilities
export const MILESTONE_LABELS = {
  started: 'Started',
  quarter: '25% Complete',
  half: '50% Complete',
  'three-quarters': '75% Complete',
  completed: 'Completed',
  custom: 'Custom Milestone',
};

export const getMilestoneLabel = (milestone) => MILESTONE_LABELS[milestone] || milestone;

// Mood utilities
export const MOOD_LABELS = {
  excellent: 'Excellent',
  good: 'Good',
  okay: 'Okay',
  difficult: 'Difficult',
  frustrated: 'Frustrated',
};

export const MOOD_COLORS = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  okay: 'bg-yellow-100 text-yellow-800',
  difficult: 'bg-orange-100 text-orange-800',
  frustrated: 'bg-red-100 text-red-800',
};

export const getMoodLabel = (mood) => MOOD_LABELS[mood] || mood;
export const getMoodColor = (mood) => MOOD_COLORS[mood] || 'bg-gray-100 text-gray-800';

// File utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  
  const types = {
    pdf: 'PDF Document',
    doc: 'Word Document',
    docx: 'Word Document',
    txt: 'Text File',
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    gif: 'Image',
    mp4: 'Video',
    avi: 'Video',
    mov: 'Video',
    mp3: 'Audio',
    wav: 'Audio',
    m4a: 'Audio',
  };
  
  return types[extension] || 'File';
};

// Validation utilities
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\+]?[1-9][\d]{0,15}$/;
  return re.test(phone);
};

// Array utilities
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });
};

// Number utilities
export const formatNumber = (num, decimals = 0) => {
  if (isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercentage = (num, decimals = 1) => {
  if (isNaN(num)) return '0%';
  return `${formatNumber(num, decimals)}%`;
};

// Time utilities
export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  
  return `${mins}m`;
};

// Local storage utilities
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
};
