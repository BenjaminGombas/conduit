import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ServerCreateModal } from './ServerCreateModal';
import { serverApi } from '@/services/api';

interface Server {
  id: string;
  name: string;
  icon_url?: string | null;
}

export const ServerList = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isAtHome = location.pathname === '/channels/@me';

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const serverList = await serverApi.getServers();
      setServers(serverList);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServerClick = (serverId: string) => {
    navigate(`/channels/${serverId}`);
  };

  const getServerInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-[72px] min-w-[72px] bg-navy-dark flex flex-col items-center p-3 space-y-2"> {/* Added min-w-[72px] */}
      {/* Home button with Conduit logo */}
      <Button
        variant="ghost"
        className={cn(
          "h-12 w-12 p-0 rounded-[24px] bg-navy hover:bg-rose hover:rounded-[16px] transition-all duration-200",
          isAtHome && "bg-rose rounded-[16px]"
        )}
        onClick={() => navigate('/channels/@me')}
      >
        <img
          src="../conduit-high-resolution-logo-transparent (2).svg"
          alt="Home"
          className="w-7 h-7"
        />
      </Button>

      {/* Servers/DMs separator */}
      <div className="w-8 h-[2px] bg-navy-light rounded mx-auto my-2" />

      {/* Server list section */}
      <div className="flex-1 w-full space-y-2">
        {servers.map(server => (
          <Button
            key={server.id}
            variant="ghost"
            className={cn(
              "h-12 w-12 p-0 rounded-[24px] bg-navy hover:bg-rose hover:rounded-[16px] transition-all duration-200",
              location.pathname === `/channels/${server.id}` && "bg-rose rounded-[16px]"
            )}
            onClick={() => handleServerClick(server.id)}
          >
            {server.icon_url ? (
              <img
                src={server.icon_url}
                alt={server.name}
                className="w-full h-full rounded-[inherit] object-cover"
              />
            ) : (
              <span className="text-white text-sm font-semibold">
                {getServerInitials(server.name)}
              </span>
            )}
          </Button>
        ))}

        {/* Add server button */}
        <Button
          variant="ghost"
          className="h-12 w-12 rounded-[24px] bg-navy hover:bg-rose hover:rounded-[16px] transition-all duration-200"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-7 h-7" />
        </Button>
      </div>

      <ServerCreateModal 
        isOpen={showCreateModal} 
        onClose={() => {
          setShowCreateModal(false);
          fetchServers(); // Refresh the server list after creation
        }} 
      />
    </div>
  );
};