import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useSidebar } from '../contexts/SidebarContext';

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

const LogOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
  const { isCollapsed, toggleCollapsed } = useSidebar();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const mainItems = [
    {
      label: 'Event Management',
      icon: <CalendarIcon />,
      path: '/admin/events',
      show: true,
    },
  ];

  // Settings sub-items — shown below a divider
  const settingsItems = [
    {
      label: 'Profile Settings',
      icon: <UserIcon />,
      path: '/admin/settings/profile',
      show: true,
    },
    {
      label: 'Account Management',
      icon: <UsersIcon />,
      path: '/admin/settings/accounts',
      show: userRole === 'admin',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/events') return location.pathname.startsWith('/admin/events');
    return location.pathname === path;
  };

  const btnBase = (active: boolean) =>
    `w-full flex items-center rounded-xl transition-all ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'} ${
      active
        ? 'bg-[#DC143C] text-white shadow-lg'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333333]'
    }`;

  const iconColor = (active: boolean) =>
    active ? 'text-white' : 'text-gray-400 dark:text-gray-500';

  return (
    <div className={`${isCollapsed ? 'w-[80px]' : 'w-[260px]'} sticky top-0 h-screen bg-white dark:bg-[#1c1c1c] border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col transition-all duration-300 flex-shrink-0`}>

      {/* Header */}
      <div className={`h-[77px] border-b border-gray-200 dark:border-[#2a2a2a] flex items-center ${isCollapsed ? 'justify-center p-4' : 'justify-between p-5'}`}>
        {!isCollapsed && (
          <div className="text-xl font-bold text-gray-900 dark:text-white">PrimeLog</div>
        )}
        <button onClick={toggleCollapsed}
          className="p-2 hover:bg-gray-100 dark:hover:bg-[#333333] rounded-lg transition-colors text-gray-900 dark:text-white">
          <MenuIcon />
        </button>
      </div>

      {/* Main Menu */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainItems.filter(i => i.show).map(item => (
          <button key={item.path} onClick={() => navigate(item.path)} className={btnBase(isActive(item.path))}>
            <span className={iconColor(isActive(item.path))}>{item.icon}</span>
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}

        {/* Settings Section */}
        <div className={`${isCollapsed ? 'my-2' : 'mt-6 mb-2'}`}>
          {!isCollapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[1.5px] text-gray-400 dark:text-gray-600">
              Settings
            </div>
          )}
          {isCollapsed && <div className="h-px bg-gray-100 dark:bg-[#2a2a2a] mx-2 my-2" />}
        </div>

        {settingsItems.filter(i => i.show).map(item => (
          <button key={item.path} onClick={() => navigate(item.path)} className={btnBase(isActive(item.path))}>
            <span className={iconColor(isActive(item.path))}>{item.icon}</span>
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-200 dark:border-[#2a2a2a] space-y-1">
        {/* Dark Mode */}
        <button onClick={toggleDarkMode}
          className={`w-full flex items-center rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'}`}>
          <span className="text-gray-400 dark:text-gray-500">{isDarkMode ? <SunIcon /> : <MoonIcon />}</span>
          {!isCollapsed && <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Logout */}
        <button onClick={handleLogout}
          className={`w-full flex items-center rounded-xl text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-[#DC143C] dark:hover:text-[#DC143C] transition-colors ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'}`}>
          <span className="text-gray-400 dark:text-gray-500"><LogOutIcon /></span>
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;