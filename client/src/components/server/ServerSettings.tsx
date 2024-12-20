import React, { useState } from 'react';
import { Settings, Users, Shield, Trash2, Upload } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateServer, deleteServer } from '@/store/servers/serverSlice';
import { kickMember } from '@/store/servers/serverMemberSlice';
import {api, uploadFile} from "@/services/api.ts";

interface ServerSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

enum SettingsTab {
    Overview = 'Overview',
    Roles = 'Roles',
    Members = 'Members',
    Delete = 'Delete'
}

export const ServerSettings = ({ isOpen, onClose }: ServerSettingsProps) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>(SettingsTab.Overview);
    const { serverId = '' } = useParams();
    const server = useAppSelector(state => state.servers.servers[serverId]);
    const currentUser = useAppSelector(state => state.auth.user);
    const isOwner = server?.owner_id === currentUser?.id;

    const tabs = [
        { id: SettingsTab.Overview, label: 'Overview', icon: Settings },
        { id: SettingsTab.Members, label: 'Members', icon: Users },
        { id: SettingsTab.Roles, label: 'Roles', icon: Shield },
        ...(isOwner ? [{ id: SettingsTab.Delete, label: 'Delete Server', icon: Trash2 }] : [])
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case SettingsTab.Overview:
                return <ServerOverview server={server} />;
            case SettingsTab.Members:
                return <MemberManagement serverId={serverId} />;
            case SettingsTab.Roles:
                return <RoleManagement serverId={serverId} />;
            case SettingsTab.Delete:
                return <DeleteServer serverId={serverId} onClose={onClose} />;
            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-navy border-none p-0 h-[80vh]">
                <div className="flex h-full">
                    <div className="w-60 bg-navy-dark p-4 border-r border-navy-light">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Server Settings
                        </h3>
                        <nav className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm
                                              ${activeTab === tab.id
                                        ? 'bg-rose text-white'
                                        : 'text-text-secondary hover:bg-navy-light hover:text-white'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4 mr-2" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white">
                                {activeTab}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="mt-6">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

interface ServerOverviewProps {
    server: any;
}

const ServerOverview = ({ server }: ServerOverviewProps) => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState(server?.name || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(server?.icon_url || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!server) return;

        setIsLoading(true);
        setError(null);

        try {
            // Handle image upload if there's a new image
            let finalIconUrl = server.icon_url;
            if (imageFile) {
                try {
                    const uploadResult = await uploadFile(imageFile);
                    finalIconUrl = uploadResult.url;
                } catch (error) {
                    console.error('Failed to upload image:', error);
                    setError('Failed to upload image');
                    setIsLoading(false);
                    return;
                }
            }

            await dispatch(updateServer({
                serverId: server.id,
                name,
                icon_url: finalIconUrl
            })).unwrap();

            setIsLoading(false);
        } catch (error: any) {
            console.error('Failed to update server:', error);
            setError(error.response?.data?.error || 'Failed to update server');
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-rose/10 border border-rose/20 rounded-md p-3 text-rose text-sm">
                    {error}
                </div>
            )}

            <div>
                <Label htmlFor="server-image" className="text-text-secondary">
                    Server Image
                </Label>
                <div className="mt-2">
                    <div className="w-32 h-32 relative">
                        <div className="w-full h-full rounded-full bg-navy-light overflow-hidden">
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Server icon"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-secondary">
                                    <Settings className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <input
                            id="server-image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            className="absolute bottom-0 right-0"
                            onClick={() => document.getElementById('server-image')?.click()}
                        >
                            <Upload className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div>
                <Label htmlFor="server-name" className="text-text-secondary">
                    Server Name
                </Label>
                <Input
                    id="server-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2"
                />
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
        </form>
    );
};

interface MemberManagementProps {
    serverId: string;
}

const MemberManagement = ({ serverId }: MemberManagementProps) => {
    const dispatch = useAppDispatch();
    const members = useAppSelector(state => state.serverMembers.members[serverId] || []);
    const server = useAppSelector(state => state.servers.servers[serverId]);
    const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
    const [error, setError] = useState<string | null>(null);

    const handleKickMember = async (memberId: string) => {
        setLoadingStates(prev => ({ ...prev, [memberId]: true }));
        setError(null);

        try {
            await dispatch(kickMember({ serverId, memberId })).unwrap();
        } catch (error) {
            console.error('Failed to kick member:', error);
            setError('Failed to kick member');
        } finally {
            setLoadingStates(prev => ({ ...prev, [memberId]: false }));
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-rose/10 border border-rose/20 rounded-md p-3 text-rose text-sm">
                    {error}
                </div>
            )}
            <div className="bg-navy-dark rounded-lg">
                {members.map(member => (
                    <div
                        key={member.user_id}
                        className="flex items-center p-4 border-b border-navy-light last:border-none"
                    >
                        <div className="relative flex-shrink-0">
                            <div
                                className="w-10 h-10 rounded-full bg-navy"
                                style={member.avatar_url ? {
                                    backgroundImage: `url(${member.avatar_url})`,
                                    backgroundSize: 'cover'
                                } : undefined}
                            />
                        </div>
                        <div className="ml-3 flex-1">
                            <h4 className="text-white font-medium">
                                {member.username}
                            </h4>
                            <p className="text-text-secondary text-sm">
                                {member.nickname || 'No nickname'}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleKickMember(member.user_id)}
                                disabled={loadingStates[member.user_id] || member.user_id === server?.owner_id}
                            >
                                {loadingStates[member.user_id] ? 'Kicking...' : 'Kick'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RoleManagement = ({ serverId }: { serverId: string }) => {
    // TODO: implement custom role system
    const [roles] = useState([
        { id: '1', name: 'Admin', color: '#ff3366' },
        { id: '2', name: 'Moderator', color: '#33ff66' },
        { id: '3', name: 'Member', color: '#6633ff' }
    ]);

    return (
        <div className="space-y-4">
            <Button>Create Role</Button>

            <div className="bg-navy-dark rounded-lg">
                {roles.map(role => (
                    <div
                        key={role.id}
                        className="flex items-center p-4 border-b border-navy-light last:border-none"
                    >
                        <div
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: role.color }}
                        />
                        <div className="flex-1">
                            <h4 className="text-white font-medium">{role.name}</h4>
                        </div>
                        <Button variant="ghost" size="sm">
                            Edit
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface DeleteServerProps {
    serverId: string;
    onClose: () => void;
}

const DeleteServer = ({ serverId, onClose }: DeleteServerProps) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [serverName, setServerName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const server = useAppSelector(state => state.servers.servers[serverId]);

    const handleDelete = async () => {
        if (serverName !== server?.name) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await dispatch(deleteServer(serverId)).unwrap();
            navigate('/channels/@me');
            onClose();
        } catch (error) {
            console.error('Failed to delete server:', error);
            setError('Failed to delete server');
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-rose/10 border border-rose/20 rounded-lg p-4 text-rose">
                    <h4 className="font-medium mb-2">Error</h4>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div className="bg-rose/10 border border-rose/20 rounded-lg p-4 text-rose">
                <h4 className="font-medium mb-2">Warning</h4>
                <p className="text-sm">
                    This action is permanent and cannot be undone. All channels and messages will be deleted.
                </p>
            </div>

            <div>
                <Label
                    htmlFor="server-name"
                    className="text-text-secondary block mb-2"
                >
                    Enter server name to confirm deletion
                </Label>
                <Input
                    id="server-name"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    placeholder={server?.name}
                    className="mb-4"
                />
                <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={serverName !== server?.name || isLoading}
                    className="w-full bg-rose/10 border-rose text-rose hover:bg-rose/20"
                >
                    {isLoading ? 'Deleting...' : 'Delete Server'}
                </Button>
            </div>
        </div>
    );
};