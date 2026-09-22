import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/apiClient.ts';
import { UserAvatar } from './UserAvatar.tsx';
import { 
  User as UserIcon, 
  Mail, 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  Camera, 
  Check, 
  AlertCircle, 
  Save, 
  Upload,
  Clock,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  Trash2
} from 'lucide-react';

interface ProfileViewProps {
  onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onShowToast }) => {
  const { user, role, permissions, updateUserProfile, changePassword } = useAuth();

  // Profile Details Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <UserIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Not Signed In</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please sign in to view and edit your profile details.</p>
      </div>
    );
  }

  // Handle Avatar file upload
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setProfileErrorMsg('');
    try {
      const result = await api.uploadImage(file);
      setAvatar(result.imageUrl);
      if (onShowToast) onShowToast('Avatar uploaded! Click "Save Changes" to apply.', 'success');
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to upload avatar image');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle Profile Details submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    if (!name.trim()) {
      setProfileErrorMsg('Full name cannot be empty.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setProfileErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        department: department.trim(),
        avatar: avatar.trim()
      });
      setProfileSuccessMsg('Profile details successfully updated!');
      if (onShowToast) onShowToast('Profile details updated successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile details');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password change submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (!currentPassword) {
      setPasswordErrorMsg('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setPasswordErrorMsg('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New passwords do not match. Please verify.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccessMsg('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onShowToast) onShowToast('Password updated successfully!');
      setTimeout(() => setPasswordSuccessMsg(''), 4000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const roleBadgeColors = {
    admin: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900',
    manager: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900',
    technician: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900',
    viewer: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Account & Profile Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your personal identity, contact details, profile photo, and password credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold uppercase tracking-wider ${roleBadgeColors[role]}`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            {role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Summary Card & Permissions */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <UserAvatar
                  src={avatar || user.avatar}
                  name={user.name}
                  size="2xl"
                  className="border-4 border-white shadow-md dark:border-slate-800"
                />
                <label 
                  htmlFor="profile-avatar-upload"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-transform hover:scale-105"
                  title="Upload profile picture"
                >
                  <Camera className="h-4 w-4" />
                  <input
                    id="profile-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <h2 className="mt-3.5 text-base font-bold text-slate-900 dark:text-white">
                {name || user.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {email || user.email}
              </p>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{department || user.department || 'Operations'}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 w-full text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>User ID:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 text-[11px]">{user.id}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Member Since:</span>
                  <span className="text-slate-800 dark:text-slate-200 text-[11px]">
                    {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Role Privileges Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-3">
              <Shield className="h-3.5 w-3.5 text-indigo-500" />
              Role & Permissions
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Manage Users</span>
                <span className={`font-semibold ${permissions.canManageUsers ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {permissions.canManageUsers ? 'Granted' : 'Restricted'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Edit / Add Items</span>
                <span className={`font-semibold ${permissions.canEditPart ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {permissions.canEditPart ? 'Granted' : 'Restricted'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Stock In / Out</span>
                <span className={`font-semibold ${permissions.canConsume ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {permissions.canConsume ? 'Granted' : 'Restricted'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Reorder Orders</span>
                <span className={`font-semibold ${permissions.canReorder ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {permissions.canReorder ? 'Granted' : 'Restricted'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">System Audit Logs</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Accessible
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Edit Details & Change Password Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Profile Details Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <UserIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Personal Information
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your contact details and display profile avatar
                </p>
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Check className="h-4 w-4 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="profile-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="profile-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. alex@toprun.com"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Department / Division
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="profile-dept-input"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Robotics Engineering, Maintenance"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Assigned Role
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      disabled
                      value={role.toUpperCase()}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2 px-3 text-slate-500 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Avatar Photo Management */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Profile Avatar Photo
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <UserAvatar
                    src={avatar}
                    name={name || user.name}
                    size="xl"
                    className="border-2 border-slate-300/60 dark:border-slate-600 shadow-2xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      {avatar && !avatar.includes('unsplash') ? 'Current Profile Photo Active' : 'No Photo (Default Empty DP)'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {avatar && !avatar.includes('unsplash')
                        ? 'Your custom photo is active. No 3rd-party image services are used.'
                        : 'Showing clean WhatsApp / Instagram style profile silhouette.'}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="profile-avatar-custom"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{avatar ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          id="profile-avatar-custom"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileUpload}
                          className="hidden"
                        />
                      </label>
                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar('')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove Photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="save-profile-btn"
                  type="submit"
                  disabled={isSavingProfile || isUploadingAvatar}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50 min-h-[38px] transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Change Password Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Change Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your authentication password for secure access
                </p>
              </div>
            </div>

            {passwordSuccessMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Check className="h-4 w-4 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="current-password-input"
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-10 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="new-password-input"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 4 characters"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-10 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirm-password-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-10 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {newPassword && confirmPassword && (
                <div className="text-[11px] flex items-center gap-1.5 pt-1">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <Check className="h-3.5 w-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                      <AlertCircle className="h-3.5 w-3.5" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  id="change-password-btn"
                  type="submit"
                  disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700 disabled:opacity-50 min-h-[38px] transition-colors"
                >
                  <Lock className="h-4 w-4" />
                  <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
