import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ServerCreateModal } from './ServerCreateModal';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserServers, selectUserServers } from '@/store/servers/serverSlice';

export const ServerList = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isAtHome = location.pathname === '/channels/@me';
    const servers = useAppSelector(selectUserServers);
    const loading = useAppSelector(state => state.servers.loading);

    useEffect(() => {
        dispatch(fetchUserServers());
    }, [dispatch]);

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
        <div className="w-[72px] min-w-[72px] bg-navy-dark flex flex-col items-center p-3 space-y-2">
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
                    src="../../../conduit-high-resolution-logo-transparent.svg"
                    alt="Home"
                    className="w-7 h-7"
                />
            </Button>

            {/* Servers/DMs separator */}
            <div className="w-8 h-[2px] bg-navy-light rounded mx-auto my-2" />

            {/* Server list section */}
            <div className="flex-1 w-full space-y-2">
                {loading ? (
                    // Loading state placeholders
                    [...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-12 w-12 rounded-[24px] bg-navy-light animate-pulse"
                        />
                    ))
                ) : (
                    // Actual server list
                    servers.map(server => (
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
                                    onError={(e) => {
                                        // If image fails to load, show initials instead
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />

                            ) : (
                                <span className="text-white text-sm font-semibold">
                                    {getServerInitials(server.name)}
                                </span>
                            )}
                        </Button>
                    ))
                )}

                {/* Add server button */}
                <Button
                    variant="ghost"
                    className="h-12 w-12 rounded-[24px] bg-navy hover:bg-rose hover:rounded-[16px] transition-all duration-200"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus className="w-7 h-7" />
                </Button>
            </div>

            {/* Server creation modal */}
            <ServerCreateModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    dispatch(fetchUserServers()); // Refresh the server list after creation
                }}
            />
        </div>
    );
};