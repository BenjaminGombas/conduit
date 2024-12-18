import { Hash } from 'lucide-react';

interface ChatHeaderProps {
  loading?: boolean;
}

export const ChatHeader = ({ loading }: ChatHeaderProps) => {
  return (
    <div className="h-12 px-4 border-b border-navy-light flex items-center bg-navy">
      <Hash className={`w-5 h-5 mr-2 ${loading ? 'text-text-disabled' : 'text-text-secondary'}`} />
      <h3 className={`font-semibold ${loading ? 'text-text-disabled' : 'text-white'}`}>
        {loading ? 'Loading...' : 'general'}
      </h3>
      <div className="ml-4 text-text-secondary">
        {!loading && "Test channel for development"}
      </div>
    </div>
  );
};