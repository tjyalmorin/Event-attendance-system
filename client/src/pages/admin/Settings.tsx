import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';

// ── Icons ──
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Settings Page ──
const Settings: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Account info state
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(user.email || '');
  const [name, setName] = useState(user.name || user.full_name || '');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Auto-dismiss success
  useEffect(() => {
    if (accountSuccess) {
      const t = setTimeout(() => setAccountSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [accountSuccess]);

  useEffect(() => {
    if (passwordSuccess) {
      const t = setTimeout(() => setPasswordSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [passwordSuccess]);

  const handleCancelEdit = () => {
    setEmail(user.email || '');
    setName(user.name || user.full_name || '');
    setAccountError('');
    setIsEditing(false);
  };

  const handleSaveAccount = async () => {
    setAccountError('');
    setAccountLoading(true);
    try {
      await api.put('/auth/profile', { email, name });
      const updatedUser = { ...user, email, name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAccountSuccess(true);
      setIsEditing(false);
    } catch (err: any) {
      setAccountError(err.response?.data?.error || 'Failed to update account.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] dark:bg-[#0f0f0f]">
      <Sidebar userRole={user.role === 'staff' ? 'staff' : 'admin'} />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="max-w-[1400px] mx-auto px-8 py-6">
            <h1 className="text-[32px] font-bold text-gray-900 dark:text-white tracking-tight">
              Account<span className="font-normal text-gray-400 dark:text-gray-600">.</span>Settings
            </h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-8 py-8 flex flex-col gap-6">

          {/* ── Account Info Card ── */}
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-[#2a2a2a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#0f0f0f] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <UserIcon />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">Account Information</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Manage your email and display name</p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-[#333333] text-sm font-medium transition-all"
                >
                  <EditIcon />
                  Edit Account
                </button>
              )}
            </div>

            {/* Card Body */}
            <div className="px-8 py-6 flex flex-col gap-5">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[1px] text-gray-500 dark:text-gray-500">
                  Full Name
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <UserIcon />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={!isEditing}
                    className={`h-[46px] w-full rounded-xl border-[1.5px] pl-11 pr-4 text-sm outline-none transition-all
                      ${isEditing
                        ? 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-gray-800 dark:text-white focus:border-[#DC143C] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]'
                        : 'border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0f0f0f] text-gray-400 dark:text-gray-600 cursor-not-allowed select-none'
                      }`}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[1px] text-gray-500 dark:text-gray-500">
                  Email Address
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={!isEditing}
                    className={`h-[46px] w-full rounded-xl border-[1.5px] pl-11 pr-4 text-sm outline-none transition-all
                      ${isEditing
                        ? 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-gray-800 dark:text-white focus:border-[#DC143C] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]'
                        : 'border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0f0f0f] text-gray-400 dark:text-gray-600 cursor-not-allowed select-none'
                      }`}
                  />
                </div>
              </div>

              {/* Role badge */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[1px] text-gray-500 dark:text-gray-500">
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${
                    user.role === 'admin'
                      ? 'bg-[#DC143C]/10 text-[#DC143C]'
                      : 'bg-gray-100 dark:bg-[#0f0f0f] text-gray-500 dark:text-gray-400'
                  }`}>
                    {user.role || 'Staff'}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-600">Role cannot be changed here</span>
                </div>
              </div>

              {accountError && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {accountError}
                </div>
              )}

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    onClick={handleCancelEdit}
                    className="px-5 py-2.5 rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#333333] text-sm font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAccount}
                    disabled={accountLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC143C] text-white text-sm font-semibold hover:bg-[#b01030] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accountLoading ? (
                      <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving...</>
                    ) : (
                      <><CheckIcon />Save Changes</>
                    )}
                  </button>
                </div>
              )}

              {accountSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-600 dark:text-green-400 font-medium">
                  <CheckIcon />
                  Account updated successfully.
                </div>
              )}
            </div>
          </div>

          {/* ── Password Card ── */}
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-100 dark:border-[#2a2a2a]">
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#0f0f0f] flex items-center justify-center text-gray-500 dark:text-gray-400">
                <LockIcon />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">Change Password</h2>
                <p className="text-xs text-gray-500 dark:text-gray-500">Update your account password</p>
              </div>
            </div>

            {/* Card Body */}
            <div className="px-8 py-6 flex flex-col gap-5">
              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[1px] text-gray-500 dark:text-gray-500">
                  Current Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <LockIcon />
                  </span>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-[46px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] pl-11 pr-11 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all focus:border-[#DC143C] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-gray-100 dark:bg-[#2a2a2a]" />

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[1px] text-gray-500 dark:text-gray-500">
                  New Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <LockIcon />
                  </span>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-[46px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] pl-11 pr-11 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all focus:border-[#DC143C] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    {showNew ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-[1px] text-gray-500 dark:text-gray-500">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <LockIcon />
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-[46px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] pl-11 pr-11 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all focus:border-[#DC143C] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`text-xs mt-0.5 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              {passwordError && (
                <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-600 dark:text-green-400 font-medium">
                  <CheckIcon />
                  Password changed successfully.
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DC143C] text-white text-sm font-semibold hover:bg-[#b01030] transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Updating...</>
                  ) : (
                    <><LockIcon />Update Password</>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;