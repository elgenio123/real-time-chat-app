'use client';

import { AvatarProps } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function Avatar({ user, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white',
        'bg-gradient-to-br from-blue-400 to-blue-600',
        sizeClasses[size],
        className
      )}
      title={user.username}
    >
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar}
          alt={user.username}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span>
          {user.username
            .split(' ')
            .map(word => word.charAt(0)?.toUpperCase())
            .filter(Boolean)
            .slice(0, 2)
            .join('')}
        </span>
      )}
    </div>
  );
}
