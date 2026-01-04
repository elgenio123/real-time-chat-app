'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';
import { Chat, User } from '@/lib/types';
import { api } from '@/lib/api';
import { initializeSocket, disconnectSocket, getSocket, markChatAsRead, markPublicChatAsRead } from '@/lib/socket';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(410); // default width
  const [publicChatUnreadCount, setPublicChatUnreadCount] = useState(0);
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

    initializeSocket();

    fetchChats(parsedUser);
    // console.log('Fetching chats for user:', parsedUser.id);

    return () => {
      disconnectSocket();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Socket.IO event listeners for real-time unread count updates
  useEffect(() => {
    if (!user) return;

    const socket = getSocket();
    if (!socket) return;

    // Handle new public messages (for users in public room)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNewPublicMessage = (data: any) => {
      console.log('📬 New public message received in chat page:', data);
      // This handler is for users who are in the public room
      // Only increment unread count if not currently viewing public chat
      if (!selectedChat || selectedChat.type !== 'public') {
        setPublicChatUnreadCount(prev => prev + 1);
        
        // Show toast notification
        const senderUsername = data.username || data.sender_username;
        const content = data.content;
        if (senderUsername && content) {
          toast(`💬 ${senderUsername}: ${content.substring(0, 50)}`, {
            icon: '📨',
            duration: 4000,
          });
        }
      }
    };

    // Handle public message notification (for users not in public room)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePublicMessageNotification = (data: any) => {
      console.log('📬 Public message notification:', data);
      const senderUsername = data.sender_username;
      const content = data.content;
      
      // Only show toast and increment if not viewing public chat
      if (!selectedChat || selectedChat.type !== 'public') {
        toast(`💬 ${senderUsername}: ${content}`, {
          icon: '📨',
          duration: 4000,
        });
        setPublicChatUnreadCount(prev => prev + 1);
      }
    };

    // Handle new private messages - use backend unread count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUnreadCountUpdate = (data: any) => {
      console.log('📬 Unread count update received:', data);
      const chatId = data.chat_id?.toString();
      const newUnreadCount = data.unread_count;
      const senderUsername = data.other_username;
      
      // Find the chat to get other user info for toast
      const targetChat = chats.find(c => c.id === chatId);
      const isCurrentChat = selectedChat?.id === chatId;
      
      // Show toast if not currently viewing this chat
      if (targetChat && !isCurrentChat) {
        const otherUser = targetChat.participants.find(p => String(p.id) !== String(user.id));
        if (otherUser) {
          toast(`💬 ${senderUsername || otherUser.username} sent you a message`, {
            icon: '📨',
            duration: 4000,
          });
        }
      }
      
      // Update unread count
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          // Don't update if currently viewing this chat
          if (isCurrentChat) {
            return chat;
          }
          
          console.log(`📬 Updating chat ${chatId} unread count to ${newUnreadCount}`);
          return { ...chat, unreadCount: newUnreadCount };
        }
        return chat;
      }));
    };

    // Handle read receipts (when someone reads your message)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMessageReadReceipt = (data: any) => {
      console.log('✅ Message read receipt:', data);
      const readerUsername = data.reader_username;
      const chatId = data.chat_id?.toString();
      
      // Find the chat to get the other user's info
      const targetChat = chats.find(c => c.id === chatId);
      if (targetChat) {
        toast(`✅ ${readerUsername} read your message`, {
          icon: '👁️',
          duration: 3000,
        });
      }
    };

    socket.on('new_public_message', handleNewPublicMessage);
    socket.on('public_message_notification', handlePublicMessageNotification);
    socket.on('unread_count_update', handleUnreadCountUpdate);
    socket.on('message_read_receipt', handleMessageReadReceipt);

    return () => {
      socket.off('new_public_message', handleNewPublicMessage);
      socket.off('public_message_notification', handlePublicMessageNotification);
      socket.off('unread_count_update', handleUnreadCountUpdate);
      socket.off('message_read_receipt', handleMessageReadReceipt);
    };
  }, [user, selectedChat, chats]);

  const fetchChats = async (user: User) => {
    if (!user) {
      // console.log("No user found, cannot fetch chats.", user);
      return;
    }
      
    setLoadingChats(true);
    try {
      // console.log("In try")
      const response = await api.get('/chats');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      
      // Fetch public chat unread count
      await fetchPublicChatUnreadCount();
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchPublicChatUnreadCount = async () => {
    try {
      const response = await api.get('/messages');
      const messages = response.data.messages;
      
      if (messages.length === 0) {
        setPublicChatUnreadCount(0);
        return;
      }
      const lastReadTimestamp = localStorage.getItem('publicChatLastRead');
      
      if (!lastReadTimestamp) {
        setPublicChatUnreadCount(messages.length);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unreadCount = messages.filter((msg: any) => 
          new Date(msg.timestamp) > new Date(lastReadTimestamp)
        ).length;
        setPublicChatUnreadCount(unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch public chat unread count:', error);
    }
  };

  const handleSelectChat = async (chat: Chat) => {
    console.log('Selected chat:', chat);
    
    // Check if this is a temporary chat (ID starts with 'temp-')
    const isTempChat = chat.id.startsWith('temp-');
    
    if (isTempChat && chat.type === 'private') {
      // Check if a real chat already exists with this user
      const otherUser = chat.participants.find(p => p.id !== user?.id);
      if (otherUser) {
        const existingChat = chats.find(c => 
          c.type === 'private' && 
          c.participants.some(p => p.id === otherUser.id)
        );
        
        if (existingChat) {
          // Use the existing chat instead
          setSelectedChat(existingChat);
          
          // Reset unread count locally immediately
          setChats(prev => prev.map(c => c.id === existingChat.id ? { ...c, unreadCount: 0 } : c));
          
          // Mark as read via REST API
          if (existingChat.unreadCount > 0) {
            try {
              await api.post(`/chats/${existingChat.id}/read`);
            } catch (error) {
              console.error('Failed to mark chat as read via API:', error);
            }
          }
          
          // Mark as read via Socket.IO
          markChatAsRead(existingChat.id);
          return;
        }
      }
    }
    
    setSelectedChat(chat);
    
    if (chat.type === 'public') {
      // Mark public chat as read by storing current timestamp
      localStorage.setItem('publicChatLastRead', new Date().toISOString());
      setPublicChatUnreadCount(0);
      
      // Notify backend that user opened public chat
      markPublicChatAsRead();
    } else if (!isTempChat) {
      // Only mark real chats as read
      // Reset unread count locally immediately
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
      
      // Mark as read via REST API
      if (chat.unreadCount > 0) {
        try {
          await api.post(`/chats/${chat.id}/read`);
        } catch (error) {
          console.error('Failed to mark chat as read via API:', error);
        }
      }
      
      // Mark as read via Socket.IO (updates backend unread count in real-time and sends read receipt)
      markChatAsRead(chat.id);
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
          publicChatUnreadCount={publicChatUnreadCount}
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
          publicChatUnreadCount={publicChatUnreadCount}
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