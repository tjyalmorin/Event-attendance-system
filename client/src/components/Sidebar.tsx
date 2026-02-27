import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';

// ── Icons ──
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const LogOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/>
    <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24"/>
    <path d="m1 12h6m6 0h6"/>
    <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24"/>
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

interface SidebarProps {
  userRole?: 'admin' | 'staff';
}

const Sidebar: React.FC<SidebarProps> = ({ userRole = 'admin' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const menuItems = [
    {
      label: 'Event Management',
      icon: <CalendarIcon />,
      path: '/admin/events',
      show: true,
    },
    {
      label: 'Account Management',
      icon: <UsersIcon />,
      path: '/admin/accounts',
      show: userRole === 'admin',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/events') {
      return location.pathname === '/admin/events' || location.pathname === '/admin/events/create';
    }
    return location.pathname === path;
  };

  return (
    <div
      className={`${
        isCollapsed ? 'w-[80px]' : 'w-[260px]'
      } h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 flex-shrink-0`}
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${isCollapsed ? 'hidden' : ''}`}>
          <div className="text-xl font-bold text-gray-900 dark:text-white">PrimeLog</div>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-900 dark:text-white"
        >
          <MenuIcon />
        </button>
      </div>

      {/* Main Menu */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) =>
          item.show ? (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                isActive(item.path)
                  ? 'bg-[#DC143C] text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className={isActive(item.path) ? 'text-white' : 'text-gray-400 dark:text-gray-500'}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          ) : null
        )}
      </div>

      {/* Bottom Menu */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-gray-400 dark:text-gray-500">
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </span>
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-gray-400 dark:text-gray-500">
            <LogOutIcon />
          </span>
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/admin/settings')}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
            isActive('/admin/settings')
              ? 'bg-[#DC143C] text-white'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <span className={isActive('/admin/settings') ? 'text-white' : 'text-gray-400 dark:text-gray-500'}>
            <SettingsIcon />
          </span>
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;