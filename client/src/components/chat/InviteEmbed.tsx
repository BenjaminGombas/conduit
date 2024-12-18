import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { api } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

interface InviteInfo {
  server_name: string;
  server_icon?: string;
  creator_name: string;
}

interface InviteEmbedProps {
  code: string;
}

export const InviteEmbed = ({ code }: InviteEmbedProps) => {
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();
  const currentUser = useAppSelector(state => state.auth.user);

  useEffect(() => {
    const fetchInviteInfo = async () => {
      try {
        const response = await api.get(`/invites/${code}`);
        setInviteInfo(response.data);
      } catch (error) {
        setError('Invalid or expired invite');
      } finally {
        setLoading(false);
      }
    };

    fetchInviteInfo();
  }, [code]);

  const handleJoin = async () => {
    try {
      setJoining(true);
      await api.post(`/invites/${code}/join`);
      // Navigate to the new server
      window.location.href = '/channels/@me'; // Force reload to update server list
    } catch (error) {
      setError('Failed to join server');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-sm bg-navy-dark rounded-md p-4 mt-2 animate-pulse">
        <div className="h-4 bg-navy-light rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-navy-light rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !inviteInfo) {
    return (
      <div className="max-w-sm bg-navy-dark rounded-md p-4 mt-2 border border-navy-light">
        <p className="text-text-secondary text-sm">
          Invalid or expired invite
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm bg-navy-dark rounded-md p-4 mt-2 border border-navy-light">
      <div className="flex items-center gap-4">
        {inviteInfo.server_icon ? (
          <img
            src={inviteInfo.server_icon}
            alt={inviteInfo.server_name}
            className="w-12 h-12 rounded-xl object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center">
            <Users className="w-6 h-6 text-text-secondary" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-white">
            {inviteInfo.server_name}
          </h3>
          <p className="text-sm text-text-secondary">
            Invited by {inviteInfo.creator_name}
          </p>
        </div>
        <Button
          onClick={handleJoin}
          disabled={joining}
          className="bg-rose hover:bg-rose-light"
        >
          {joining ? 'Joining...' : 'Join'}
        </Button>
      </div>
    </div>
  );
};

// Add invite link detection regex
export const INVITE_REGEX = /(?:https?:\/\/)?(?:[\w-]+\.)*?\/invite\/([a-zA-Z0-9]+)/g;