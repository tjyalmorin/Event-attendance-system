import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useSidebar } from '../contexts/SidebarContext';

const PanelLeftCloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
    <path d="M14 9l-3 3 3 3"/>
  </svg>
);

const PanelLeftOpenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
    <path d="M13 15l3-3-3-3"/>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const LogOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
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

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const GitBranchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
    <path d="M18 9a9 9 0 0 1-9 9"/>
  </svg>
);

const ChevronUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="18 15 12 9 6 15"/>
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
  const [dropupOpen, setDropupOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropupRef = useRef<HTMLDivElement>(null);

  // Get user info from localStorage
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = storedUser?.full_name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  // Close dropup when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropupRef.current && !dropupRef.current.contains(e.target as Node)) {
        setDropupOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const mainItems = [
    {
      label: 'Event Management',
      icon: <CalendarIcon />,
      path: '/admin/events',
      show: true,
    },
    {
      label: 'Account Management',
      icon: <UsersIcon />,
      path: '/admin/settings/accounts',
      show: userRole === 'admin',
    },
    {
      label: 'Branch Management',
      icon: <GitBranchIcon />,
      path: '/admin/settings/branches',
      show: userRole === 'admin',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/events') return location.pathname.startsWith('/admin/events') || location.pathname.startsWith('/staff/events');
    return location.pathname === path;
  };

  const btnBase = (active: boolean) =>
    `group w-full flex items-center rounded-lg transition-all ${isCollapsed ? 'justify-center px-1.5 py-2.5' : 'gap-3 px-3 py-2.5'} ${
      active
        ? 'bg-[#DC143C] text-white shadow-lg'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333333]'
    }`;

  const iconColor = (active: boolean) =>
    active ? 'text-white' : 'text-gray-400 dark:text-gray-500';

  const iconWrap = (active: boolean) =>
    active ? '' : 'sidebar-icon-bounce';

  // Avatar color: red for admin, blue for staff
  const avatarBg = userRole === 'admin' ? 'bg-[#DC143C]' : 'bg-blue-600';

  return (
    <>
    {/* ─── MOBILE BOTTOM NAV ─── */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1c1c1c] border-t border-gray-200 dark:border-[#2a2a2a] flex items-stretch h-16 safe-area-pb">
      {mainItems.filter(i => i.show).map(item => (
        <button
          key={item.path}
          onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
            isActive(item.path)
              ? 'text-[#DC143C]'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {item.icon}
          <span className="text-[10px] font-semibold leading-none truncate px-1">
            {item.label.split(' ')[0]}
          </span>
          {isActive(item.path) && (
            <span className="absolute bottom-0 w-10 h-0.5 bg-[#DC143C] rounded-t-full" />
          )}
        </button>
      ))}
      {/* More button for user/settings */}
      <button
        onClick={() => setMobileMenuOpen(p => !p)}
        className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
          mobileMenuOpen ? 'text-[#DC143C]' : 'text-gray-400 dark:text-gray-500'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
        </svg>
        <span className="text-[10px] font-semibold leading-none">More</span>
      </button>
    </div>

    {/* Mobile "More" sheet — slides up from bottom */}
    {mobileMenuOpen && (
      <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)}>
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="absolute bottom-16 left-0 right-0 bg-white dark:bg-[#1c1c1c] rounded-t-2xl border-t border-gray-200 dark:border-[#2a2a2a] shadow-2xl p-4 space-y-1"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div className={`w-10 h-10 rounded-xl ${avatarBg} flex items-center justify-center text-white font-bold`}>
              {userInitial}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{userName}</p>
              <p className={`text-xs font-medium ${userRole === 'admin' ? 'text-[#DC143C]' : 'text-blue-600'}`}>
                {userRole === 'admin' ? 'Admin' : 'Staff'}
              </p>
            </div>
          </div>
          <div className="h-px bg-gray-100 dark:bg-[#2a2a2a] mb-2" />
          <button onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
            <span className="text-gray-400 dark:text-gray-500">{isDarkMode ? <SunIcon /> : <MoonIcon />}</span>
            <span className="text-sm font-medium flex-1 text-left">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            <span className={`relative inline-flex items-center h-[22px] w-[40px] rounded-full transition-colors ${isDarkMode ? 'bg-[#DC143C]' : 'bg-gray-300'}`}>
              <span className={`inline-block h-[16px] w-[16px] rounded-full bg-white shadow transition-transform ${isDarkMode ? 'translate-x-[20px]' : 'translate-x-[3px]'}`} />
            </span>
          </button>
          <button onClick={() => { setMobileMenuOpen(false); navigate('/admin/settings/profile'); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
            <GearIcon />
            <span className="text-sm font-medium">Profile Settings</span>
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[#DC143C] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOutIcon />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    )}

    <style>{`
      @keyframes icon-tumble {
        0%   { transform: rotate(0deg)   scale(1);    }
        20%  { transform: rotate(-25deg) scale(1.25); }
        45%  { transform: rotate(18deg)  scale(1.2);  }
        65%  { transform: rotate(-10deg) scale(1.1);  }
        80%  { transform: rotate(5deg)   scale(1.05); }
        100% { transform: rotate(0deg)   scale(1);    }
      }
      button:hover .sidebar-icon-bounce {
        animation: icon-tumble 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
      }

    `}</style>
    <div className={`${isCollapsed ? 'w-[60px]' : 'w-[260px]'} hidden md:flex sticky top-0 h-screen bg-white dark:bg-[#1c1c1c] border-r border-gray-200 dark:border-[#2a2a2a] flex-col transition-all duration-300 flex-shrink-0`}>
      {/* Header */}
      <div className={`h-[77px] border-b border-gray-200 dark:border-[#2a2a2a] flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between p-5'}`}>
        {!isCollapsed && (
          <div className="text-xl font-bold text-gray-900 dark:text-white">PrimeLog</div>
        )}
        <button onClick={toggleCollapsed}
          className="p-2 hover:bg-gray-100 dark:hover:bg-[#333333] rounded-lg transition-colors text-gray-500 dark:text-gray-400">
          {isCollapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
        </button>
      </div>

      {/* Main Menu */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainItems.filter(i => i.show).map(item => (
          <button key={item.path} onClick={() => navigate(item.path)} className={btnBase(isActive(item.path))}>
            <span className={`${iconColor(isActive(item.path))} ${iconWrap(isActive(item.path))}`}>{item.icon}</span>
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Bottom: Dark Mode + User Card */}
      <div className="p-3 border-t border-gray-200 dark:border-[#2a2a2a] space-y-1">
        {/* Dark Mode */}
        <button onClick={toggleDarkMode}
          className={`w-full flex items-center rounded-lg text-gray-600 dark:text-gray-400 transition-colors ${isCollapsed ? 'justify-center px-1.5 py-2.5' : 'gap-3 px-3 py-2.5'}`}>
          <span className="text-gray-400 dark:text-gray-500 transition-transform duration-300 ease-in-out"
            style={{ transform: isDarkMode ? 'rotate(0deg)' : 'rotate(-20deg)' }}>
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </span>
          {!isCollapsed && (
            <>
              <span className="text-sm font-medium flex-1 text-left">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
              {/* Toggle switch */}
              <span
                className={`relative flex-shrink-0 inline-flex items-center h-[22px] w-[40px] rounded-full transition-colors duration-300 ease-in-out
                  ${isDarkMode ? 'bg-[#DC143C]' : 'bg-gray-300 dark:bg-[#444]'}`}
              >
                <span
                  className={`inline-block h-[16px] w-[16px] rounded-full bg-white shadow transition-transform duration-300 ease-in-out
                    ${isDarkMode ? 'translate-x-[20px]' : 'translate-x-[3px]'}`}
                />
              </span>
            </>
          )}
        </button>

        {/* User Card with Dropup */}
        <div className="relative" ref={dropupRef}>
          {/* Dropup Menu */}
          {dropupOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden z-50">
              <button
                onClick={() => { setDropupOpen(false); navigate('/admin/settings/profile'); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333333] transition-colors"
              >
                <GearIcon />
                Profile Settings
              </button>
              <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />
              <button
                onClick={() => { setDropupOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#DC143C] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOutIcon />
                Logout
              </button>
            </div>
          )}

          {/* Collapsed: avatar button only, no card */}
          {isCollapsed ? (
            <button
              onClick={() => setDropupOpen(p => !p)}
              className="w-full flex justify-center py-1"
            >
              <div className={`w-9 h-9 rounded-lg ${avatarBg} flex items-center justify-center text-white text-sm font-bold hover:opacity-80 transition-opacity`}>
                {userInitial}
              </div>
            </button>
          ) : (
            /* Expanded: full user card */
            <button
              onClick={() => setDropupOpen(p => !p)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all
                ${dropupOpen
                  ? 'border-gray-300 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#252525]'
                  : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] hover:border-gray-300 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#252525]'
                }`}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${avatarBg} flex items-center justify-center text-white text-sm font-bold`}>
                {userInitial}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{userName}</p>
                <p className={`text-xs font-medium mt-0.5 ${userRole === 'admin' ? 'text-[#DC143C]' : 'text-blue-600'}`}>
                  {userRole === 'admin' ? 'Admin' : 'Staff'}
                </p>
              </div>
              <ChevronUpIcon />
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;