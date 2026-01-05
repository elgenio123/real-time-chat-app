'use client';

import { useState, ChangeEvent } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');

  // Profile form state
  const [profile, setProfile] = useState({
    avatar: '/default-avatar.png',
    name: '',
    phone: '',
    about: '',
  });

  const handleProfileChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    console.log('Saved profile:', profile);
  };

  // Account actions
  const handleAccountAction = (action: string) => {
    console.log(`${action} clicked`);
    // Add modal or page navigation logic here
  };

  return (
    <div className="flex h-screen w-screen bg-blue-50">
      {/* Sidebar */}
      <div className="w-56 bg-blue-600 text-white p-4 space-y-2 shadow-lg">
        <button
          className={`w-full text-left p-3 rounded transition font-medium ${
            activeTab === 'profile' ? 'bg-blue-800' : 'hover:bg-blue-500'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`w-full text-left p-3 rounded transition font-medium ${
            activeTab === 'account' ? 'bg-blue-800' : 'hover:bg-blue-500'
          }`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto bg-white p-6 rounded shadow space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Profile Settings</h2>

            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <img
                src={profile.avatar}
                alt="Profile Avatar"
                className="w-24 h-24 rounded-full object-cover border"
              />
              <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Change
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>

            {/* Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                placeholder="Your name"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                placeholder="Phone number"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* About */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">About</label>
              <textarea
                name="about"
                value={profile.about}
                onChange={handleProfileChange}
                placeholder="A short bio..."
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>

            <button
              onClick={handleSaveProfile}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition font-medium"
            >
              Save
            </button>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="max-w-xl mx-auto p-6 rounded shadow space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Account Settings</h2>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => handleAccountAction('Change Email')}
                className="text-left px-4 py-3 w-full border border-gray-300 rounded hover:bg-gray-100 text-black font-medium"
              >
                Change Email Address
              </button>

              <button
                onClick={() => handleAccountAction('Change Phone')}
                className="text-left px-4 py-3 w-full border border-gray-300 rounded hover:bg-gray-100 text-black font-medium"
              >
                Change Phone Number
              </button>

              <button
                onClick={() => handleAccountAction('Change Password')}
                className="text-left px-4 py-3 w-full border border-gray-300 rounded hover:bg-gray-100 text-black font-medium"
              >
                Change Password
              </button>

              <button
                onClick={() => handleAccountAction('Delete Account')}
                className="text-left px-4 py-3 w-full border border-red-400 rounded hover:bg-red-100 text-red-600 font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
