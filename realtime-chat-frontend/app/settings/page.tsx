'use client';

import React, { useEffect, useRef, useState, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, LogOut, Upload, User, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getAuthUser, updateAuthUser, changePassword, api } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { disconnectSocket } from '@/lib/socket';

type Tab = 'profile' | 'account';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    avatar: '',
    username: '',
    email: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getAuthUser();
        setProfile({
          avatar: user.avatar_url || user.avatar || '/default-avatar.png',
          username: user.username || '',
          email: user.email || '',
        });
      } catch (error) {
        console.error(error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setProfile(prev => ({ ...prev, avatar: url }));
      toast.success('Avatar updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAuthUser({
        username: profile.username,
        email: profile.email,
        avatar_url: profile.avatar,
      });
      toast.success('Profile saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as Record<string, any>;
      if (error.response?.status === 401) {
        toast.error('Current password is incorrect');
      } else {
        console.error(err);
        toast.error('Failed to change password');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      toast.error('Logout failed on server');
    }
    disconnectSocket();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully!');
    router.push('/login');
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </button>

        <div className="grid lg:grid-cols-[280px,1fr] gap-6">
        {/* Sidebar */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-xl h-fit">
          <h2 className="text-lg font-semibold mb-4 text-white">Settings</h2>
          <div className="space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-3 rounded-xl transition border border-transparent',
                  activeTab === tab.key
                    ? 'bg-blue-500/90 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/10'
                )}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-2 px-3 py-3 rounded-xl bg-white/5 text-red-200 hover:bg-red-500/10 hover:text-red-100 transition border border-transparent">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <div className="-mt-16 px-6 pb-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative inline-block">
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="group w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center cursor-pointer hover:shadow-2xl transition-all"
                >
                  {profile.avatar && !profile.avatar.includes('/default-avatar') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="text-3xl font-bold text-white group-hover:scale-105 transition-transform">
                      {getInitials(profile.username)}
                    </div>
                  )}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-white text-slate-900 rounded-full p-2 shadow-lg hover:shadow-xl transition flex items-center gap-1 text-xs font-semibold"
                  disabled={avatarUploading}
                >
                  {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Change</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="flex-1 grid sm:grid-cols-2 gap-4 bg-white/70 backdrop-blur rounded-2xl p-4 shadow-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Username</p>
                  <p className="text-xl font-semibold text-slate-900">{profile.username || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                  <p className="text-xl font-semibold text-slate-900 break-all">{profile.email || '—'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-600">Username</label>
                    <input
                      name="username"
                      value={profile.username}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Your username"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Account & Security</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white/70">
                    <div>
                      <p className="font-medium text-slate-900">Password</p>
                      <p className="text-sm text-slate-500">Change your password</p>
                    </div>
                    <button 
                      onClick={() => setShowPasswordModal(true)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition">
                      Change
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setActiveTab('profile')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading || avatarUploading}
                className={cn(
                  'px-5 py-2 rounded-xl text-white font-semibold flex items-center gap-2 shadow-lg transition',
                  saving || avatarUploading
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                )}
              >
                {(saving || avatarUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                <Check className="w-4 h-4" />
                Save changes
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Overlay loader */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-sm w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Password
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-gray-600">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                disabled={changingPassword}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2',
                  changingPassword
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                Change Password
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Avatar Modal */}
      {showAvatarModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAvatarModal(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full"
          >
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {profile.avatar && !profile.avatar.includes('/default-avatar') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt="Avatar"
                className="w-full rounded-lg shadow-2xl object-cover"
              />
            ) : (
              <div className="w-full aspect-square rounded-lg shadow-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <div className="text-9xl font-bold text-white/80">
                  {getInitials(profile.username)}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
