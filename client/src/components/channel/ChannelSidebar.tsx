import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Hash, Users, UserPlus, Settings } from 'lucide-react';
import { authService } from '@/services/auth';
import { useLocation, useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { getCurrentUser, selectUser } from '@/store/auth/authSlice';
import { fetchServer } from '@/store/servers/serverSlice';
import { UserStatusBadge } from '@/components/user/UserStatusBadge';
import { InviteModal } from '@/components/server/InviteModal';
import { useState } from 'react';
import { ServerSettings } from '../server/ServerSettings';

export const ChannelSidebar = () => {
  const location = useLocation();
  const { serverId } = useParams();
  const dispatch = useAppDispatch();
  const isAtFriends = location.pathname === '/channels/@me';
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const currentServer = useAppSelector(state => 
    serverId ? state.servers.servers[serverId] : null
  );
  const user = useAppSelector(selectUser);
  const userPresence = useAppSelector(state => 
    user ? state.presence.users[user.id] : null
  );

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (serverId && !currentServer) {
      dispatch(fetchServer(serverId));
    }
  }, [serverId, currentServer, dispatch]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="w-60 min-w-60 bg-navy-light flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between shadow-md">
  <h2 className="font-semibold text-white truncate">
    {isAtFriends ? 'Direct Messages' : currentServer?.name || 'Loading...'}
  </h2>
  {!isAtFriends && (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowInviteModal(true)}
        className="text-text-secondary hover:text-white"
      >
        <UserPlus className="w-5 h-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowSettings(true)}
        className="text-text-secondary hover:text-white"
      >
        <Settings className="w-5 h-5" />
      </Button>
    </div>
  )}
</div>

      {/* Content */}
      <div className="flex-1 p-2 space-y-2">
        {isAtFriends ? (
          // Friends list view
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start px-2 text-text-secondary hover:text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Friends
            </Button>
            <div className="px-2">
              <h3 className="text-text-secondary font-semibold text-xs uppercase tracking-wide mb-1">
                Direct Messages
              </h3>
              <div className="text-text-secondary text-sm py-4 text-center">
                No direct messages yet
              </div>
            </div>
          </div>
        ) : (
          // Server channels view
          <div className="px-2">
            <h3 className="text-text-secondary font-semibold text-xs uppercase tracking-wide mb-1">
              Text Channels
            </h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start px-2 text-text-secondary hover:text-white"
              >
                <Hash className="w-4 h-4 mr-2" />
                general
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User area */}
      <div className="h-14 px-2 flex items-center bg-navy-dark/50 justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-navy" />
            <UserStatusBadge 
              status={userPresence?.status || 'offline'} 
              className="absolute -bottom-1 -right-1"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {user?.username || 'Loading...'}
            </p>
            <p className="text-xs text-text-secondary capitalize">
              {userPresence?.status || 'offline'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="ml-auto text-text-secondary hover:text-white"
        >
          Logout
        </Button>
      </div>

      {/* Invite Modal */}
      {serverId && (
        <InviteModal
          serverId={serverId}
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
        />
      )}
      {/* ServerSettings modal */}
{!isAtFriends && serverId && (
  <ServerSettings 
    isOpen={showSettings} 
    onClose={() => setShowSettings(false)} 
  />
)}
    </div>
  );
};