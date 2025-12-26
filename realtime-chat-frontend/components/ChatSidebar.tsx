'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageCircle, Users, LogOut } from 'lucide-react';
import { Chat, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface ChatSidebarProps {
  user: User;
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onClose?: () => void;
}

export default function ChatSidebar({
  user,
  chats,
  selectedChat,
  onSelectChat,
  onClose,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publicChat: Chat = {
    id: 'public',
    name: 'Public Chat',
    type: 'public',
    participants: [],
    unreadCount: 0,
  };

  const allChats = [publicChat, ...filteredChats];

  return (
    <div className="w-full bg-white border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {user.username.charAt(0).toUpperCase()}
            </span>
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
          {allChats.map((chat) => (
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
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                {chat.type === 'public' ? (
                  <Users className="w-6 h-6 text-gray-600" />
                ) : (
                  <MessageCircle className="w-6 h-6 text-gray-600" />
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
          ))}
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
                  } catch (error) {
                    // Ignore error, proceed to clear localStorage
                  }
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}