'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Phone, Video, MoreVertical } from 'lucide-react';
import { Chat, User, Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import MessageBubble from '@/components/MessageBubble';
import MessageInput from '@/components/MessageInput';

interface ChatWindowProps {
  chat: Chat | null;
  user: User;
}

export default function ChatWindow({ chat, user }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      // Mock messages for demonstration
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          content: 'Hey there! How are you doing?',
          senderId: chat.participants.find(p => p.id !== user.id)?.id || 'other',
          sender: chat.participants.find(p => p.id !== user.id) || {
            id: 'other',
            username: 'Other User',
            email: 'other@example.com'
          },
          timestamp: new Date(Date.now() - 1000 * 60 * 10),
          type: 'text',
        },
        {
          id: 'msg-2',
          content: 'I\'m doing great! Just working on some new features.',
          senderId: user.id,
          sender: user,
          timestamp: new Date(Date.now() - 1000 * 60 * 8),
          type: 'text',
        },
        {
          id: 'msg-3',
          content: 'Check out this image!',
          senderId: chat.participants.find(p => p.id !== user.id)?.id || 'other',
          sender: chat.participants.find(p => p.id !== user.id) || {
            id: 'other',
            username: 'Other User',
            email: 'other@example.com'
          },
          timestamp: new Date(Date.now() - 1000 * 60 * 6),
          type: 'text',
        },
        {
          id: 'msg-4',
          content: '',
          senderId: chat.participants.find(p => p.id !== user.id)?.id || 'other',
          sender: chat.participants.find(p => p.id !== user.id) || {
            id: 'other',
            username: 'Other User',
            email: 'other@example.com'
          },
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          type: 'file',
          file: {
            id: 'file-1',
            name: 'sample-image.jpg',
            size: 1024 * 1024 * 2, // 2MB
            type: 'image/jpeg',
            url: 'https://via.placeholder.com/300x200', // Placeholder image
            thumbnail: 'https://via.placeholder.com/300x200',
          },
        },
        {
          id: 'msg-5',
          content: 'Here\'s a document for you.',
          senderId: user.id,
          sender: user,
          timestamp: new Date(Date.now() - 1000 * 60 * 3),
          type: 'text',
        },
        {
          id: 'msg-6',
          content: '',
          senderId: user.id,
          sender: user,
          timestamp: new Date(Date.now() - 1000 * 60 * 2),
          type: 'file',
          file: {
            id: 'file-2',
            name: 'document.pdf',
            size: 1024 * 1024 * 5, // 5MB
            type: 'application/pdf',
            url: '#', // Placeholder
          },
        },
      ];
      setMessages(mockMessages);
    } else {
      setMessages([]);
    }
  }, [chat, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  return (
    <div className="flex-1 flex flex-col bg-gray-500 h-full overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-white border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            {chat.type === 'public' ? (
              <span className="text-gray-600 font-semibold">#</span>
            ) : (
              <span className="text-gray-600 font-semibold">
                {chat.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{chat.name}</h3>
            <p className="text-sm text-gray-500">
              {chat.type === 'public'
                ? `${chat.participants.length} members`
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
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user.id}
              />
            ))}
          </AnimatePresence>
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput
          chat={chat}
          onSendMessage={(content, processedFiles) => {
            const newMessages: Message[] = [];

            // Add text message if content exists
            if (content.trim()) {
              newMessages.push({
                id: `msg-${Date.now()}-text`,
                content,
                senderId: user.id,
                sender: user,
                timestamp: new Date(),
                type: 'text',
              });
            }

            // Add file messages
            processedFiles?.forEach((fileData, index) => {
              newMessages.push({
                id: `msg-${Date.now()}-file-${index}`,
                content: '', // Files don't have content, but if text and image, we could combine
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
              });
            });

            setMessages(prev => [...prev, ...newMessages]);
          }}
        />
      </div>
    </div>
  );
}