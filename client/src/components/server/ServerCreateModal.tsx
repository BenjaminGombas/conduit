import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { serverApi } from '@/services/api';

interface ServerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServerData {
  name: string;
  imageFile: File | null;
  imagePreview: string | null;
}

// Changed to named export
export const ServerCreateModal = ({ isOpen, onClose }: ServerCreateModalProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [serverData, setServerData] = useState<ServerData>({
    name: '',
    imageFile: null,
    imagePreview: null
  });
  
  const handleClose = () => {
    setStep(1);
    setServerData({
      name: '',
      imageFile: null,
      imagePreview: null
    });
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setServerData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: '/api/placeholder/80/80'
      }));
    }
  };

  const handleRemoveImage = () => {
    setServerData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await serverApi.create({
        name: serverData.name,
        // TODO: Handle image upload
      });
      console.log('Server created:', response);
      handleClose();
    } catch (error) {
      console.error('Failed to create server:', error);
      // TODO: Add error handling
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Create your server</DialogTitle>
              <DialogDescription className="text-center">
                Your server is where you and your friends hang out. Make yours and start talking.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-navy-light flex items-center justify-center overflow-hidden">
                    {serverData.imagePreview ? (
                      <>
                        <img 
                          src={serverData.imagePreview} 
                          alt="Server icon" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute top-0 right-0 p-1 bg-rose rounded-full"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer p-4 hover:bg-navy">
                        <Upload className="w-8 h-8 text-text-secondary" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <Label htmlFor="server-name">SERVER NAME</Label>
                  <Input
                    id="server-name"
                    value={serverData.name}
                    onChange={(e) => setServerData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter server name"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                className="w-full"
                disabled={!serverData.name.trim() || loading}
                onClick={handleSubmit}
              >
                {loading ? 'Creating...' : 'Create Server'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};