
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageCircle, Users, LogOut, Plus } from 'lucide-react';
import { Chat, ChatSidebarProps, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import Avatar from '@/components/Avatar';
import { disconnectSocket } from '@/lib/socket';
import Image from 'next/image';
export default function ChatSidebar({
  user,
  chats,
  selectedChat,
  onSelectChat,
  onClose,
  loadingChats = false,
  publicChatUnreadCount = 0,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); //li
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const router = useRouter();
  

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/users/');
      console.log(response);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAllUsers(response.data.users.map((u: any) => ({ ...u, avatar: u.avatar })).filter((u: User) => u.id !== user.id)); // Exclude current user
      setShowUsersModal(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publicChat: Chat = {
    id: 'public',
    name: 'Public Chat',
    type: 'public',
    participants: [user],
    unreadCount: publicChatUnreadCount,
  };

  const allChats = [publicChat, ...filteredChats];

  return (
    <div className="w-full bg-white border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div
  className="cursor-pointer"
  onClick={() => setShowProfileModal(true)} //li
>
  <Avatar user={user} size="md" />
</div> 

          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{user.username}</h2>
            <p className="text-sm text-gray-500">Online</p>
          </div>
          <div className="flex space-x-2">
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        <div className="px-2">
          {loadingChats ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : allChats.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No chats yet</p>
              <p className="text-sm text-gray-400">Start a conversation to see your chats here</p>
            </div>
          ) : (
            allChats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectChat(chat)}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors mb-1",
                  selectedChat?.id === chat.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {chat.type === 'public' ? (
                    <Users className="w-6 h-6 text-gray-600" />
                  ) : chat.participants.find(p => p.id !== user.id)?.avatar ? (
                    <Image
                      src={chat.participants.find(p => p.id !== user.id)?.avatar || ''}
                      alt={chat.name}
                      className="w-full h-full object-cover"
                      width={48}
                      height={48}
                    />
                  ) : (
                    <span className="text-white font-semibold text-lg bg-gradient-to-br from-blue-400 to-blue-600 w-full h-full flex items-center justify-center">
                      {(chat.participants.find(p => p.id !== user.id)?.username || chat.name)
                        .split(' ')
                        .map(word => word.charAt(0)?.toUpperCase())
                        .filter(Boolean)
                        .slice(0, 2)
                        .join('')}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">
                      {chat.name}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-600 truncate">
                      {chat.lastMessage.content}
                    </p>
                  )}
                </div>
                {chat.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white font-medium">
                      {chat.unreadCount}
                    </span>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

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
                onClick={async () => {
                  try {
                    await api.post('/auth/logout');
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  } catch (error) {
                    toast.error('Logout failed on server');
                  }
                  // Disconnect socket before clearing storage
                  disconnectSocket();
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  toast.success('Logged out successfully!');
                  router.push('/login');
                }}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
cd              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Start New Conversation
                </h3>
                <button
                  onClick={() => setShowUsersModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Select a user to start chatting
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {allUsers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No users available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allUsers.map((chatUser) => (
                    <motion.div
                      key={chatUser.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Create a temporary/virtual chat for this user
                        const newChat: Chat = {
                          id: `temp-${chatUser.id}`, // Temporary ID
                          name: chatUser.username,
                          type: 'private',
                          participants: [user, chatUser],
                          unreadCount: 0,
                        };
                        
                        onSelectChat(newChat);
                        setShowUsersModal(false);
                        toast.success(`Starting conversation with ${chatUser.username}`);
                      }}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <Avatar user={chatUser} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {chatUser.username}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {chatUser.email}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
        {showProfileModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-80 text-center relative">
      {/* Close Button */}
      <button
        onClick={() => setShowProfileModal(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>

      {/* Profile Image */}
      {user.avatar ? (
        <Image
          src={user.avatar}  // <-- Use avatar_url
          alt="Profile Picture"
          width={160}
          height={160}
          className="object-cover w-full"
        />
      ) : (
        <div className="w-36 h-36 rounded-full bg-blue-500 text-white flex items-center justify-center text-4xl font-semibold mx-auto">
          {user.username
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
      )}

    </div>
  </div>
)}



      {/* Floating Action Button */}
      <div className="absolute bottom-6 right-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          onClick={fetchUsers}
          disabled={loadingUsers}
        >
          {loadingUsers ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </motion.button>
      </div>
    </div>
  );
}