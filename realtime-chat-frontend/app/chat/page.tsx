'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';
import { Chat, User } from '@/lib/types';
import { api } from '@/lib/api';

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(410); // default width
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    // console.log(userData)

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser({ ...parsedUser, avatar: parsedUser.avatar_url });
    console.log('Logged in user:', parsedUser);

    // Fetch chats
    fetchChats(parsedUser);
    // console.log('Fetching chats for user:', parsedUser.id);
  }, [router]);

  const fetchChats = async (user: User) => {
    if (!user) {
      // console.log("No user found, cannot fetch chats.", user);
      return;
    }
      
    setLoadingChats(true);
    try {
      // console.log("In try")
      const response = await api.get('/chats');
      const fetchedChats: Chat[] = response.data.chats.map((chatData: any) => ({
        id: chatData.chat_id.toString(),
        name: chatData.other_user.username,
        type: 'private' as const,
        participants: [user, { ...chatData.other_user, avatar: chatData.other_user.avatar_url }],
        unreadCount: chatData.unread_count,
        lastMessage: chatData.last_message ? {
          id: chatData.last_message.id.toString(),
          content: chatData.last_message.content,
          senderId: chatData.last_message.sender.id.toString(),
          sender: chatData.last_message.sender,
          timestamp: new Date(chatData.last_message.timestamp),
          type: 'text' as const,
        } : undefined,
      }));
      console.log(response.data)
      setChats(fetchedChats);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    if (chat.unreadCount > 0) {
      try {
        await api.post(`/chats/${chat.id}/read`);
        // Update the chat's unread count locally
        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
      } catch (error) {
        console.error('Failed to mark chat as read:', error);
      }
    }
  };

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
          onSelectChat={handleSelectChat}
          onClose={() => setSidebarOpen(false)}
          loadingChats={loadingChats}
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
            handleSelectChat(chat);
            setSidebarOpen(false);
          }}
          onClose={() => setSidebarOpen(false)}
          loadingChats={loadingChats}
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