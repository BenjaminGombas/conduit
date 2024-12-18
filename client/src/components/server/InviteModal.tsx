import { useState } from 'react';
import { Copy, RefreshCcw } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';

interface InviteModalProps {
    serverId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const InviteModal = ({ serverId, isOpen, onClose }: InviteModalProps) => {
    const [inviteLink, setInviteLink] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateInvite = async () => {
        try {
            setLoading(true);
            const response = await api.post(`/servers/${serverId}/invites`);
            const baseUrl = window.location.origin;
            setInviteLink(`${baseUrl}/invite/${response.data.code}`);
        } catch (error) {
            console.error('Failed to generate invite:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-navy border-none">
                <DialogHeader className="text-left pt-6 px-6">
                    <DialogTitle className="text-2xl font-bold text-white">
                        Invite Friends
                    </DialogTitle>
                    <p className="text-text-secondary mt-2">
                        Share this link with others to grant access to this server
                    </p>
                </DialogHeader>

                <div className="p-6">
                    {inviteLink ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    readOnly
                                    value={inviteLink}
                                    className="w-full px-3 py-2 bg-navy-dark border border-navy-light rounded-md 
                                             text-white focus:outline-none focus:ring-1 focus:ring-rose
                                             pr-24" // Extra padding for the button
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyToClipboard}
                                    className={`absolute right-1 top-1 h-8 
                                              ${copied ? 'text-green-500' : 'text-text-secondary hover:text-white'}`}
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-text-secondary">
                                    No expiration date
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={generateInvite}
                                    disabled={loading}
                                    className="text-text-secondary hover:text-white"
                                >
                                    <RefreshCcw className="w-4 h-4 mr-2" />
                                    Generate New Link
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            onClick={generateInvite}
                            disabled={loading}
                            className="w-full h-10 bg-rose hover:bg-rose/90"
                        >
                            {loading ? 'Generating...' : 'Generate Invite Link'}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};