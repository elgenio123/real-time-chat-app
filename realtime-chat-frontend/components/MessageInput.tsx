'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Chat } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  chat: Chat;
  onSendMessage: (content: string, files?: { name: string; size: number; type: string; url: string; thumbnail?: string }[]) => void;
}

export default function MessageInput({ chat, onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    },
    noClick: true,
    noKeyboard: true,
  });

  const handleSend = async () => {
    if (!message.trim() && files.length === 0) return;

    setIsUploading(true);
    try {
      // Process files
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          const url = URL.createObjectURL(file);
          let thumbnail: string | undefined;
          if (file.type.startsWith('image/')) {
            // For images, use the same URL as thumbnail
            thumbnail = url;
          }
          return {
            name: file.name,
            size: file.size,
            type: file.type,
            url,
            thumbnail,
          };
        })
      );

      await onSendMessage(message, processedFiles);
      setMessage('');
      setFiles([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border-t border-border p-4">
      {/* File Previews */}
      {files.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative bg-gray-100 rounded-lg p-2 flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <Paperclip className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div
        {...getRootProps()}
        className={cn(
          "flex items-end space-x-3 p-3 rounded-lg border transition-colors",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50"
        )}
      >
        <input {...getInputProps()} />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
          disabled={isUploading}
        >
          <Paperclip className="w-5 h-5 text-gray-600" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const selectedFiles = Array.from(e.target.files || []);
            setFiles(prev => [...prev, ...selectedFiles]);
          }}
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Message ${chat.name}...`}
          className="flex-1 bg-transparent border-none outline-none resize-none min-h-[20px] max-h-32 py-1 text-gray-900 placeholder-gray-500 scrollbar-hide"
          rows={1}
          disabled={isUploading}
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={(!message.trim() && files.length === 0) || isUploading}
          className={cn(
            "p-2 rounded-full transition-colors flex-shrink-0",
            message.trim() || files.length > 0
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {isDragActive && (
        <p className="text-sm text-blue-600 mt-2 text-center">
          Drop files here to attach them
        </p>
      )}
    </div>
  );
}