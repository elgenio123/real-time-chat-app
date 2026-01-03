'use client';

import { FileText, File } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FileData, MessageBubbleProps } from '@/lib/types';
import { cn, formatTime } from '@/lib/utils';
import Avatar from '@/components/Avatar';

export default function MessageBubble({ message, isOwn, isPrivate }: MessageBubbleProps) {

  const avatar = (
    <div className={cn(
      "flex-shrink-0",
      isOwn ? "order-2 ml-2" : "mr-2"
    )}>
      <Avatar user={message.sender} size="sm" />
    </div>
  );

  if (message.type === 'file') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex mb-4 items-end",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        {!isOwn && avatar}
        <div className={cn(
          "px-4 py-2 rounded-lg shadow-sm",
          message.type === 'file' && message.file?.type.startsWith('image/') ? "max-w-md" : "max-w-xs lg:max-w-md",
          isOwn
            ? "bg-message-sent text-white rounded-br-sm"
            : "bg-message-received text-white rounded-bl-sm"
        )}>
          {!isOwn && !isPrivate && (
            <div className="text-xs font-semibold mb-1 text-gray-100">
              {message.sender.username}
            </div>
          )}
          <FileAttachment file={message.file!} />
          <div className={cn(
            "text-xs mt-1",
            isOwn ? "text-blue-100" : "text-gray-200"
          )}>
            {formatTime(message.timestamp)}
          </div>
        </div>
        {isOwn && avatar}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex mb-4 items-end",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {!isOwn && avatar}
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm",
        isOwn
          ? "bg-message-sent text-white rounded-br-sm"
          : "bg-message-received text-white rounded-bl-sm"
      )}>
        {!isOwn && !isPrivate && (
          <div className="text-xs font-semibold mb-1 text-gray-100">
            {message.sender.username}
          </div>
        )}
        <p className="text-sm leading-relaxed break-words">
          {message.content}
        </p>
        <div className={cn(
          "text-xs mt-1",
          isOwn ? "text-blue-100" : "text-gray-200"
        )}>
          {formatTime(message.timestamp)}
        </div>
      </div>
      {isOwn && avatar}
    </motion.div>
  );
}

function FileAttachment({ file }: { file: FileData }) {
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    return (
      <div className="space-y-2">
        <Image
          src={file.url}
          alt={file.name}
          width={300}
          height={300}
          className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(file.url, '_blank')}
        />
      </div>
    );
  }

  // Document file
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes('doc') || type.includes('word')) return <FileText className="w-8 h-8 text-blue-500" />;
    if (type.includes('xls') || type.includes('excel')) return <FileText className="w-8 h-8 text-green-500" />;
    if (type.includes('ppt') || type.includes('powerpoint')) return <FileText className="w-8 h-8 text-orange-500" />;
    if (type.includes('zip') || type.includes('rar')) return <File className="w-8 h-8 text-gray-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border max-w-sm">
      <div>
        {getFileIcon(file.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {file.name}
        </p>
        <p className="text-xs text-gray-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
      <a
        href={file.url}
        download={file.name}
        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
      >
        Download
      </a>
    </div>
  );
}