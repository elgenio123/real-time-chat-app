/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Send, Phone, Video, MoreVertical } from 'lucide-react';
import { Message, ChatWindowProps } from '@/lib/types';
import MessageBubble from '@/components/MessageBubble';
import MessageInput from '@/components/MessageInput';
import Avatar from '@/components/Avatar';
import { api } from '@/lib/api';
import { formatDateLabel, isDifferentDay } from '@/lib/utils';
import { 
  initializeSocket, 
  getSocket, 
  joinPublicChat, 
  leavePublicChat,
  joinPrivateChat,
  leavePrivateChat,
  sendPublicMessage,
  sendPrivateMessage,
} from '@/lib/socket';
import toast from 'react-hot-toast';

export default function ChatWindow({ chat, user }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef(getSocket());

  // Initialize socket connection
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = initializeSocket();
    }

    return () => {
      // Cleanup on unmount
      if (chat?.type === 'public') {
        leavePublicChat();
      } else if (chat?.type === 'private') {
        const otherUser = chat.participants.find(p => p.id !== user.id);
        if (otherUser) {
          leavePrivateChat(otherUser.id);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chat) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);
      try {
        if (chat.type === 'public') {
          // Fetch public messages
          const response = await api.get('/messages');
          const fetchedMessages: Message[] = response.data.messages.map((msg: any) => ({
            id: msg.id.toString(),
            content: msg.content,
            senderId: msg.user.id.toString(),
            sender: {
              id: msg.user.id.toString(),
              username: msg.user.username,
              email: '',
              avatar: msg.user.avatar_url,
            },
            timestamp: new Date(msg.timestamp),
            type: 'text' as const,
          }));
          setMessages(fetchedMessages);
          
          try {
            const usersResponse = await api.get('/users/');
            setTotalUsers(usersResponse.data.users.length);
          } catch (error) {
            console.error('Failed to fetch users count:', error);
            setTotalUsers(1);
          }
        } else {
          // Fetch private messages
          const otherUser = chat.participants.find(p => p.id !== user.id);
          if (otherUser) {
            const response = await api.get(`/messages/private/${otherUser.id}`);
            const fetchedMessages: Message[] = response.data.messages.map((msg: any) => ({
              id: msg.id.toString(),
              content: msg.content,
              senderId: msg.sender.id.toString(),
              sender: {
                id: msg.sender.id.toString(),
                username: msg.sender.username,
                email: '',
                avatar: msg.sender.avatar_url,
              },
              timestamp: new Date(msg.timestamp),
              type: 'text' as const,
            }));
            setMessages(fetchedMessages);
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [chat, user]);

  // Socket.IO event handlers for real-time messaging
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !chat) {
      console.log('⚠️ Skipping socket setup - socket or chat is null');
      return;
    }

    console.log('🔵 Setting up socket listeners for chat:', chat.name, 'Connected:', socket.connected);

    // Join appropriate chat room
    if (chat.type === 'public') {
      console.log('🔵 Joining public chat');
      joinPublicChat();
    } else {
      const otherUser = chat.participants.find(p => p.id !== user.id);
      if (otherUser) {
        console.log('🔵 Joining private chat with user:', otherUser.id);
        joinPrivateChat(otherUser.id);
      }
    }

    // Handle incoming public messages
    const handleNewPublicMessage = (data: any) => {
      console.log('📨 Received new public message:', data);
      console.log('📨 Current user ID:', user.id);
      console.log('📨 Message sender ID:', data.user?.id);
      
      const senderId = data.user?.id?.toString() || data.user_id?.toString();
      const newMessage: Message = {
        id: data.id?.toString() || `msg-${Date.now()}`,
        content: data.content,
        senderId: senderId,
        sender: {
          id: senderId,
          username: data.user?.username || data.username || 'Unknown',
          email: '',
          avatar: data.user?.avatar_url || undefined,
        },
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        type: 'text',
      };
      
      console.log('📨 isOwn check:', String(senderId) === String(user.id));

      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    };

    // Handle incoming private messages
    const handleNewPrivateMessage = (data: any) => {
      console.log('📨 Received new private message:', data);
      console.log('📨 Current user ID:', user.id);
      console.log('📨 Message sender ID:', data.sender?.id);
      
      const senderId = data.sender?.id?.toString() || data.sender_id?.toString();
      const newMessage: Message = {
        id: data.id?.toString() || `msg-${Date.now()}`,
        content: data.content,
        senderId: senderId,
        sender: {
          id: senderId,
          username: data.sender?.username || data.username || 'Unknown',
          email: '',
          avatar: data.sender?.avatar_url || undefined,
        },
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        type: 'text',
      };
      
      console.log('📨 isOwn check:', String(senderId) === String(user.id));

      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    };

    // Handle user joined/left notifications
    const handleUserJoined = (data: any) => {
      toast.success(data.message || `${data.username} joined the chat`);
    };

    const handleUserLeft = (data: any) => {
      toast(`${data.username} left the chat`, { icon: '👋' });
    };

    // Handle connection events
    const handleConnected = (data: any) => {
      console.log('Connected to chat:', data);
    };

    const handleJoinedPrivate = (data: any) => {
      console.log('Joined private chat:', data);
    };

    // Handle errors
    const handleError = (data: any) => {
      console.error('Socket error:', data);
      toast.error(data.message || 'An error occurred');
    };

    // Register event listeners
    socket.on('connected', handleConnected);
    socket.on('new_public_message', handleNewPublicMessage);
    socket.on('new_private_message', handleNewPrivateMessage);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('joined_private', handleJoinedPrivate);
    socket.on('error', handleError);

    // Cleanup listeners on chat change or unmount
    return () => {
      socket.off('connected', handleConnected);
      socket.off('new_public_message', handleNewPublicMessage);
      socket.off('new_private_message', handleNewPrivateMessage);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('joined_private', handleJoinedPrivate);
      socket.off('error', handleError);

      // Leave current room
      if (chat.type === 'public') {
        leavePublicChat();
      } else {
        const otherUser = chat.participants.find(p => p.id !== user.id);
        if (otherUser) {
          leavePrivateChat(otherUser.id);
        }
      }
    };
  }, [chat, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Scroll to bottom when chat changes (opening a new chat)
  useEffect(() => {
    if (chat) {
      // Small delay to ensure messages are loaded
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [chat]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-600 h-full">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Welcome to RealTime Chat
          </h2>
          <p className="text-gray-500">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }
  // console.log("Rendering ChatWindow for chat:", chat);

  return (
    <div className="flex-1 flex flex-col bg-gray-500 h-full overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-white border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {chat.type === 'public' ? (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold">#</span>
            </div>
          ) : (
            <Avatar user={chat.participants.find(p => p.id !== user.id) || chat.participants[0]} size="md" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{chat.name}</h3>
            <p className="text-sm text-gray-500">
              {chat.type === 'public'
                ? `${totalUsers} members`
                : 'Private chat'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 chat-scrollbar">
        <div className="max-w-4xl mx-auto space-y-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message, index) => {
                const showDateSeparator =
                  index === 0 ||
                  isDifferentDay(
                    new Date(messages[index - 1].timestamp),
                    new Date(message.timestamp)
                  );

                return (
                  <div key={message.id}>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                          {formatDateLabel(new Date(message.timestamp))}
                        </div>
                      </div>
                    )}
                    <MessageBubble
                      message={message}
                      isOwn={String(message.senderId) === String(user.id)}
                      isPrivate={chat.type === 'private'}
                    />
                  </div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput
          chat={chat}
          onSendMessage={(content, processedFiles) => {
            // Send message via Socket.IO
            if (content.trim()) {
              if (chat.type === 'public') {
                console.log('📤 Sending public message');
                sendPublicMessage(content);
              } else {
                const otherUser = chat.participants.find(p => p.id !== user.id);
                if (otherUser) {
                  console.log('📤 Sending private message to:', otherUser.id);
                  sendPrivateMessage(otherUser.id, content);
                }
              }
            }

            // Handle file messages (kept for local preview)
            if (processedFiles && processedFiles.length > 0) {
              const fileMessages: Message[] = processedFiles.map((fileData, index) => ({
                id: `msg-${Date.now()}-file-${index}`,
                content: '',
                senderId: user.id,
                sender: user,
                timestamp: new Date(),
                type: 'file',
                file: {
                  id: `file-${Date.now()}-${index}`,
                  name: fileData.name,
                  size: fileData.size,
                  type: fileData.type,
                  url: fileData.url,
                  thumbnail: fileData.thumbnail,
                },
              }));

              setMessages(prev => [...prev, ...fileMessages]);
            }
          }}
        />
      </div>
    </div>
  );
}