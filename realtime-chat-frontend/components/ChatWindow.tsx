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

export default function ChatWindow({ chat, user }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          
          // Fetch total users count for public chat
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  console.log("Rendering ChatWindow for chat:", chat);

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