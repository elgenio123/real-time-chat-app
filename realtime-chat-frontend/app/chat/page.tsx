'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';
import { Chat, User, Message } from '@/lib/types';

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(410); // default width
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Mock data for demonstration
    const mockChats: Chat[] = [
      {
        id: 'private-1',
        name: 'Alice Johnson',
        type: 'private',
        participants: [
          parsedUser,
          { id: '2', username: 'alice', email: 'alice@example.com' }
        ],
        lastMessage: {
          id: 'msg-1',
          content: 'Hey, how are you doing?',
          senderId: '2',
          sender: { id: '2', username: 'alice', email: 'alice@example.com' },
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          type: 'text',
        },
        unreadCount: 2,
      },
      {
        id: 'private-2',
        name: 'Bob Smith',
        type: 'private',
        participants: [
          parsedUser,
          { id: '3', username: 'bob', email: 'bob@example.com' }
        ],
        lastMessage: {
          id: 'msg-2',
          content: 'Thanks for the help!',
          senderId: parsedUser.id,
          sender: parsedUser,
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          type: 'text',
        },
        unreadCount: 0,
      },
    ];

    setChats(mockChats);
  }, [router]);

  // Handle window resize to show/hide sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-chat-bg relative">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarOpen ? sidebarWidth : 0,
          x: sidebarOpen ? 0 : -sidebarWidth,
        }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="hidden md:block relative"
        style={{ width: sidebarWidth }}
      >
        <ChatSidebar
          user={user}
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          onClose={() => setSidebarOpen(false)}
        />
        {/* Resize handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 cursor-col-resize hover:bg-blue-400 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = sidebarWidth;

            const handleMouseMove = (e: MouseEvent) => {
              const newWidth = Math.max(250, Math.min(500, startWidth + e.clientX - startX));
              setSidebarWidth(newWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      </motion.div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <motion.div
        initial={{ x: -410 }}
        animate={{ x: sidebarOpen ? 0 : -410 }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="md:hidden fixed left-0 top-0 bottom-0 w-80 bg-white z-50"
      >
        <ChatSidebar
          user={user}
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={(chat) => {
            setSelectedChat(chat);
            setSidebarOpen(false);
          }}
          onClose={() => setSidebarOpen(false)}
        />
      </motion.div>

      {/* Chat Window */}
      <div className="flex-1">
        <ChatWindow
          chat={selectedChat}
          user={user}
        />
      </div>
    </div>
  );
}