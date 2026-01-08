import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Activity, 
  BarChart3, 
  ClipboardList, 
  Calendar,
  FileText,
  Bell,
  User,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/helpers';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['superuser', 'hospital', 'therapist', 'child'] },
    { name: 'Children', href: '/children', icon: Users, roles: ['superuser', 'hospital', 'therapist'] },
    { name: 'Activities', href: '/activities', icon: Activity, roles: ['superuser', 'hospital', 'therapist', 'child'] },
    { name: 'Progress', href: '/progress', icon: BarChart3, roles: ['superuser', 'hospital', 'therapist', 'child'] },
    { name: 'Assignments', href: '/assignments', icon: ClipboardList, roles: ['superuser', 'hospital', 'therapist'] },
    { name: 'Home Programs', href: '/home-programs', icon: Calendar, roles: ['superuser', 'hospital', 'therapist'] },
    { name: 'Patient Details', href: '/patient-details', icon: FileText, roles: ['superuser', 'hospital', 'therapist'] },
    { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['superuser', 'hospital', 'therapist', 'child'] },
    { name: 'Profile', href: '/profile', icon: User, roles: ['superuser', 'hospital', 'therapist', 'child'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DT</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">DOT Therapy</span>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
                onClick={onClose}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    'text-gray-400 group-hover:text-gray-500'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200">
          {/* Header */}
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DT</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">DOT Therapy</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-4 py-6">
            <ul role="list" className="flex flex-1 flex-col gap-y-1">
              {filteredNavigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      )
                    }
                  >
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0',
                        'text-gray-400 group-hover:text-gray-500'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
