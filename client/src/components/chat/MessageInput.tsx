import { useState, FormEvent, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { socketService } from '@/services/socket';
import { useAppSelector } from '@/store/hooks';

export const MessageInput = () => {
  const { serverId } = useParams();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get channels from store
  const channels = useAppSelector(state => state.channels.channels[serverId || ''] || []);
  const generalChannel = channels.find(channel => channel.name === 'general');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !generalChannel?.id || sending) return;

    setSending(true);
    try {
      await socketService.sendMessage(generalChannel.id, message.trim());
      setMessage('');
      // Schedule focus for next frame
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="px-4 py-4 bg-navy">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={generalChannel?.id ? "Send a message..." : "Loading channel..."}
          rows={1}
          className="flex-1 bg-navy-light text-white px-4 py-2 rounded-md 
                   focus:outline-none focus:ring-2 focus:ring-rose resize-none
                   min-h-[40px] max-h-[120px]"
          disabled={sending || !generalChannel?.id}
          style={{ overflowY: 'auto' }}
        />
        <Button 
          type="submit" 
          disabled={!message.trim() || sending || !generalChannel?.id}
          className="px-4 self-end"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};