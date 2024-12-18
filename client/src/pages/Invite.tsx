import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';

interface InviteInfo {
    server_name: string;
    server_icon?: string;
    creator_name: string;
}

export const InvitePage = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isAuthenticated = useAppSelector(state => !!state.auth.user);

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
        if (!isAuthenticated) {
            // Store invite code in localStorage to use after login
            localStorage.setItem('pendingInvite', code!);
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            await api.post(`/invites/${code}/join`);
            navigate('/channels/@me');
        } catch (error) {
            setError('Failed to join server');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-navy-dark">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (error || !inviteInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-navy-dark">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Invalid Invite
                    </h2>
                    <p className="text-text-secondary mb-4">{error}</p>
                    <Button onClick={() => navigate('/channels/@me')}>
                        Return Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-navy-dark">
            <div className="bg-navy p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="text-center">
                    {inviteInfo.server_icon ? (
                        <img
                            src={inviteInfo.server_icon}
                            alt={inviteInfo.server_name}
                            className="w-24 h-24 rounded-full mx-auto mb-4"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-navy-light mx-auto mb-4 flex items-center justify-center">
                            <span className="text-2xl text-white">
                                {inviteInfo.server_name.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {inviteInfo.server_name}
                    </h2>
                    <p className="text-text-secondary mb-6">
                        Invited by {inviteInfo.creator_name}
                    </p>
                    <Button
                        onClick={handleJoin}
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Joining...' : (isAuthenticated ? 'Join Server' : 'Login to Join')}
                    </Button>
                </div>
            </div>
        </div>
    );
};