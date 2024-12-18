import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';

interface Invite {
    id: string;
    code: string;
    uses: number;
    max_uses: number | null;
    expires_at: string | null;
    creator_name: string;
    created_at: string;
}

interface InviteListProps {
    serverId: string;
}

export const InviteList = ({ serverId }: InviteListProps) => {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvites = async () => {
        try {
            const response = await api.get(`/servers/${serverId}/invites`);
            setInvites(response.data);
        } catch (error) {
            console.error('Failed to fetch invites:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, [serverId]);

    const handleRevoke = async (code: string) => {
        try {
            await api.delete(`/servers/${serverId}/invites/${code}`);
            setInvites(invites.filter(invite => invite.code !== code));
        } catch (error) {
            console.error('Failed to revoke invite:', error);
        }
    };

    if (loading) {
        return <div className="text-text-secondary">Loading invites...</div>;
    }

    return (
        <div className="space-y-4">
            {invites.length === 0 ? (
                <div className="text-text-secondary text-center py-4">
                    No active invites
                </div>
            ) : (
                invites.map(invite => (
                    <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 bg-navy-dark rounded-lg"
                    >
                        <div>
                            <p className="text-white font-medium">
                                {window.location.origin}/invite/{invite.code}
                            </p>
                            <div className="text-sm text-text-secondary">
                                <p>Created by {invite.creator_name}</p>
                                <p>{invite.uses} uses{invite.max_uses ? ` / ${invite.max_uses}` : ''}</p>
                                {invite.expires_at && (
                                    <p>Expires {new Date(invite.expires_at).toLocaleDateString()}</p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevoke(invite.code)}
                            className="text-text-secondary hover:text-rose"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))
            )}
        </div>
    );
};