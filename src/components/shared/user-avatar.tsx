'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { avatarGradient, cn, initials } from '@/lib/format';

interface UserAvatarProps {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profile?: { avatarUrl?: string | null } | null;
  } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  online?: boolean;
}

const SIZES = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
} as const;

export function UserAvatar({ user, size = 'md', className, online }: UserAvatarProps) {
  const grad = avatarGradient(user?.id ?? 'default');
  const name = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <Avatar className={cn(SIZES[size], 'border border-border/60')}>
        {user?.profile?.avatarUrl ? (
          <AvatarImage src={user.profile.avatarUrl} alt={name} />
        ) : null}
        <AvatarFallback className={cn('bg-gradient-to-br font-semibold text-white', grad)}>
          {user ? initials(user.firstName, user.lastName) : '?'}
        </AvatarFallback>
      </Avatar>
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
            size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
            online ? 'bg-emerald-500' : 'bg-zinc-400'
          )}
          aria-label={online ? 'online' : 'offline'}
        />
      )}
    </span>
  );
}
