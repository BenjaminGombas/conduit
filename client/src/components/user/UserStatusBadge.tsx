import { UserStatus } from '@/store/presence/presenceSlice';

interface StatusBadgeProps {
  status: UserStatus;
  className?: string;
}

export const UserStatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'dnd':
        return 'bg-rose';
      case 'offline':
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(status)} rounded-full
                   border-2 border-navy-dark`}
      />
    </div>
  );
};