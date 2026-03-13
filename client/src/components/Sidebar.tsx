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
  const dropupRef = useRef<HTMLDivElement>(null);

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = storedUser?.full_name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

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
    { label: 'Event Management',   icon: <CalendarIcon />,   path: '/admin/events',             show: true },
    { label: 'Account Management', icon: <UsersIcon />,      path: '/admin/settings/accounts',  show: userRole === 'admin' },
    { label: 'Branch Management',  icon: <GitBranchIcon />,  path: '/admin/settings/branches',  show: userRole === 'admin' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/events') return location.pathname.startsWith('/admin/events') || location.pathname.startsWith('/staff/events');
    return location.pathname === path;
  };

  const avatarBg = userRole === 'admin' ? 'bg-[#DC143C]' : 'bg-blue-600';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
        .sb-root  { font-family: 'DM Sans', sans-serif; }
        .sb-brand { font-family: 'Outfit', sans-serif; }

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
        @keyframes sb-dropup-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sb-dropup { animation: sb-dropup-in .15s ease both; }
      `}</style>

      {/* ── Sticky outer shell — sets sidebar width + provides bg gap ── */}
      <div className={`sb-root flex-shrink-0 sticky top-0 h-screen flex flex-col transition-all duration-300 ease-in-out p-3 bg-gray-50 dark:bg-[#111] ${isCollapsed ? 'w-[76px]' : 'w-[264px]'}`}>

        {/* ── Floating card ── */}
        <div className="flex flex-col h-full bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-lg shadow-gray-200/60 dark:shadow-[0_8px_32px_rgba(0,0,0,.4)] overflow-hidden">

          {/* Brand + collapse toggle */}
          <div className={`flex-shrink-0 flex items-center py-4 border-b border-gray-200 dark:border-[#2a2a2a] ${isCollapsed ? 'justify-center px-3' : 'justify-between px-4'}`}>
            {!isCollapsed && (
              <span className="sb-brand text-lg font-bold text-gray-900 dark:text-white tracking-tight select-none">
                Prime<span className="text-[#DC143C]">Log</span>
              </span>
            )}
            <button
              onClick={toggleCollapsed}
              title={isCollapsed ? 'Expand' : 'Collapse'}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-all"
            >
              {isCollapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 pt-1 pb-2 select-none">
                Menu
              </p>
            )}
            {mainItems.filter(i => i.show).map(item => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={isCollapsed ? item.label : undefined}
                  className={`group w-full flex items-center rounded-xl transition-all duration-150
                    ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
                    ${active
                      ? 'bg-[#DC143C] text-white shadow-md shadow-red-200 dark:shadow-red-900/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 dark:text-gray-500 sidebar-icon-bounce'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="text-sm font-medium leading-none">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="flex-shrink-0 p-2.5 border-t border-gray-200 dark:border-[#2a2a2a] space-y-0.5">

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              title={isCollapsed ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : undefined}
              className={`w-full flex items-center rounded-xl transition-all duration-150 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-gray-900 dark:hover:text-gray-200
                ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}`}
            >
              <span className="flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-300"
                style={{ transform: isDarkMode ? 'rotate(0deg)' : 'rotate(-20deg)' }}>
                {isDarkMode ? <SunIcon /> : <MoonIcon />}
              </span>
              {!isCollapsed && (
                <>
                  <span className="text-sm font-medium flex-1 text-left leading-none">
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                  <span className={`relative flex-shrink-0 inline-flex items-center h-[20px] w-[36px] rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-[#DC143C]' : 'bg-gray-300 dark:bg-[#444]'}`}>
                    <span className={`inline-block h-[14px] w-[14px] rounded-full bg-white shadow transition-transform duration-300 ${isDarkMode ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                  </span>
                </>
              )}
            </button>

            {/* User card + dropup */}
            <div className="relative" ref={dropupRef}>
              {dropupOpen && (
                <div className="sb-dropup absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl dark:shadow-[0_16px_40px_rgba(0,0,0,.6)] overflow-hidden z-50">
                  <button
                    onClick={() => { setDropupOpen(false); navigate('/admin/settings/profile'); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333] transition-colors"
                  >
                    <GearIcon /> Profile Settings
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-[#2a2a2a]" />
                  <button
                    onClick={() => { setDropupOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#DC143C] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOutIcon /> Logout
                  </button>
                </div>
              )}

              {isCollapsed ? (
                <button onClick={() => setDropupOpen(p => !p)} className="w-full flex justify-center p-1" title={userName}>
                  <div className={`w-9 h-9 rounded-xl ${avatarBg} flex items-center justify-center text-white text-sm font-bold hover:opacity-80 transition-opacity`}>
                    {userInitial}
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setDropupOpen(p => !p)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
                    ${dropupOpen
                      ? 'border-gray-300 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#252525]'
                      : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] hover:bg-gray-50 dark:hover:bg-[#252525]'
                    }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${avatarBg} flex items-center justify-center text-white text-sm font-bold`}>
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{userName}</p>
                    <p className={`text-xs font-medium mt-0.5 leading-none ${userRole === 'admin' ? 'text-[#DC143C]' : 'text-blue-500'}`}>
                      {userRole === 'admin' ? 'Admin' : 'Staff'}
                    </p>
                  </div>
                  <ChevronUpIcon />
                </button>
              )}
            </div>
          </div>

        </div>{/* end floating card */}
      </div>{/* end sticky shell */}
    </>
  );
};

export default Sidebar;