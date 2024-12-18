import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchServerMembers } from '@/store/servers/serverMemberSlice';
import { UserStatusBadge } from '@/components/user/UserStatusBadge';
import { UserStatus } from '@/store/presence/presenceSlice';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServerMember {
  user_id: string;
  username: string;
  nickname?: string;
  avatar_url?: string;
  status: UserStatus;
}

export const ServerMemberList = () => {
  const { serverId } = useParams();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  
  const members = useAppSelector(state => state.serverMembers.members[serverId || ''] || []);
  const presenceState = useAppSelector(state => state.presence.users);

  useEffect(() => {
    console.log('Current members:', members);
    console.log('Current presence state:', presenceState);
  }, [members, presenceState]); 

  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (serverId) {
      dispatch(fetchServerMembers(serverId))
        .finally(() => setLoading(false));
    }
  }, [serverId, dispatch]);


  // use member's status from DB, falling back to presence updates
  // Create grouped members whenever presence or members change
  const groupedMembers = useMemo(() => {
    console.log('Regrouping members with presence:', presenceState);
    return members.reduce((acc: Record<UserStatus, ServerMember[]>, member) => {
      const currentStatus = presenceState[member.user_id]?.status || member.status || 'offline';
      console.log(`Member ${member.username} status:`, currentStatus);
      if (!acc[currentStatus]) {
        acc[currentStatus] = [];
      }
      acc[currentStatus].push(member);
      return acc;
    }, { online: [], idle: [], dnd: [], offline: [] });
  }, [members, presenceState]);

  useEffect(() => {
    // Force re-render whenever presence changes
    forceUpdate({});
  }, [presenceState]);

  const statusOrder: UserStatus[] = ['online', 'idle', 'dnd', 'offline'];

  if (loading) {
    return (
      <div className="w-60 bg-navy-light flex-shrink-0 p-3">
        <div className="text-text-secondary text-sm text-center">
          Loading members...
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 bg-navy-light flex-shrink-0 p-3 overflow-y-auto custom-scrollbar">
      {statusOrder.map(status => {
        const statusMembers = groupedMembers[status] || [];
        if (statusMembers.length === 0) return null;

        return (
          <div key={status} className="mb-6">
            <h3 className="text-text-secondary uppercase text-xs font-semibold mb-2">
              {status} — {statusMembers.length}
            </h3>
            <div className="space-y-1">
              {statusMembers.map((member: ServerMember) => (
                <div
                  key={member.user_id}
                  className="flex items-center px-2 py-1 rounded hover:bg-navy-dark group cursor-pointer"
                >
                  <div className="relative flex-shrink-0">
                    <div 
                      className="w-8 h-8 rounded-full bg-navy"
                      style={member.avatar_url ? {
                        backgroundImage: `url(${member.avatar_url})`,
                        backgroundSize: 'cover'
                      } : undefined}
                    />
                    <UserStatusBadge 
                      status={presenceState[member.user_id]?.status || member.status || 'offline'}
                      className="absolute -bottom-1 -right-1"
                    />
                  </div>
                  <span className="ml-2 text-text-secondary group-hover:text-white truncate">
                    {member.nickname || member.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto opacity-0 group-hover:opacity-100 text-text-secondary hover:text-white"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {members.length === 0 && (
        <div className="text-text-secondary text-sm text-center py-4">
          No members found
        </div>
      )}
    </div>
  );
};