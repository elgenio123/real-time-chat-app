import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem('token');
    console.log('🔌 Initializing socket with URL:', SOCKET_URL);
    
    socket = io(SOCKET_URL, {
      query: { token }, // Backend expects token in query params
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Global connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected with ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('🔴 Socket error event:', error);
    });
  } else {
    console.log('⚠️ Socket already initialized, returning existing instance');
  }
  
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Socket event emitters with connection checking
export const joinPublicChat = () => {
  if (!socket?.connected) {
    console.error('❌ Socket not connected. Cannot join public chat');
    return;
  }
  console.log('📤 Emitting join_public');
  socket.emit('join_public');
};

export const leavePublicChat = () => {
  if (!socket?.connected) {
    console.warn('⚠️ Socket not connected. Skipping leave_public');
    return;
  }
  console.log('📤 Emitting leave_public');
  socket.emit('leave_public');
};

export const joinPrivateChat = (otherUserId: string | number) => {
  if (!socket?.connected) {
    console.error('❌ Socket not connected. Cannot join private chat');
    return;
  }
  console.log('📤 Emitting join_private with user:', otherUserId);
  socket.emit('join_private', { other_user_id: otherUserId });
};

export const leavePrivateChat = (otherUserId: string | number) => {
  if (!socket?.connected) {
    console.warn('⚠️ Socket not connected. Skipping leave_private');
    return;
  }
  console.log('📤 Emitting leave_private with user:', otherUserId);
  socket.emit('leave_private', { other_user_id: otherUserId });
};

export const sendPublicMessage = (content: string) => {
  if (!socket?.connected) {
    console.error('❌ Socket not connected. Cannot send public message');
    return;
  }
  console.log('📤 Sending public message:', content);
  socket.emit('send_public_message', { content });
};

export const sendPrivateMessage = (otherUserId: string | number, content: string) => {
  if (!socket?.connected) {
    console.error('❌ Socket not connected. Cannot send private message');
    return;
  }
  console.log('📤 Sending private message to user:', otherUserId, 'Content:', content);
  socket.emit('send_private_message', { 
    other_user_id: otherUserId, 
    content 
  });
};

export const getOnlineUsers = () => {
  if (!socket?.connected) {
    console.error('❌ Socket not connected. Cannot get online users');
    return;
  }
  console.log('📤 Requesting online users');
  socket.emit('get_online_users');
};

export const markChatAsRead = (chatId: string | number) => {
  if (!socket?.connected) {
    console.error('❌ Socket not connected. Cannot mark chat as read');
    return;
  }
  console.log('📤 Marking chat as read:', chatId);
  socket.emit('mark_chat_read', { chat_id: chatId });
};