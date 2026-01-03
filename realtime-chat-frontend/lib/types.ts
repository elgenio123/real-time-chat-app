export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: User;
  timestamp: Date;
  type: 'text' | 'file';
  file?: FileData;
}

export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'public' | 'private';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface PrivateChat extends Chat {
  type: 'private';
  otherUser: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}


export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isPrivate: boolean;
}

export interface ChatSidebarProps {
  user: User;
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onClose?: () => void;
  loadingChats?: boolean;
  publicChatUnreadCount?: number;
}

export interface AuthFormProps {
    mode: 'login' | 'register';
}

export interface ChatWindowProps {
  chat: Chat | null;
  user: User;
}
export interface MessageInputProps {
  chat: Chat;
  onSendMessage: (content: string, files?: { name: string; size: number; type: string; url: string; thumbnail?: string }[]) => void;
}

export interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}