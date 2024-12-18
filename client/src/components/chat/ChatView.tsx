import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchMessages } from '@/store/messages/messageSlice';
import { selectMessagesError, selectMessagesLoading } from '@/store/messages/messageSelectors';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { fetchServerChannels } from '@/store/channels/channelSlice';
import { fetchServerMembers } from '@/store/servers/serverMemberSlice';
import { ServerMemberList } from '../server/ServerMemberList';

export const ChatView = () => {
  const { serverId } = useParams();
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectMessagesError);
  const loading = useAppSelector(selectMessagesLoading);

  useEffect(() => {
    if (serverId) {
      dispatch(fetchServerChannels(serverId));
      dispatch(fetchServerMembers(serverId));
    }
  }, [serverId, dispatch]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-navy">
        <div className="text-rose text-center p-4">
          <p>Failed to load messages</p>
          <button 
            onClick={() => serverId && dispatch(fetchMessages(serverId))}
            className="mt-2 text-sm text-rose hover:text-rose-light"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full">
      <div className="flex-1 flex flex-col min-w-0"> {/* min-w-0 to prevent flex item from expanding */}
        <ChatHeader loading={loading} />
        <MessageList />
        <MessageInput />
      </div>
      <ServerMemberList />
    </div>
  );
};