import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectChannelMessages, selectMessagesLoading } from '@/store/messages/messageSelectors';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash } from 'lucide-react';
import { fetchMessages, Message } from '@/store/messages/messageSlice';
import { InviteEmbed } from './InviteEmbed';

const MAX_MESSAGE_GROUP_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
const INVITE_REGEX = /(?:https?:\/\/)?(?:[\w-]+\.)*?\/invite\/([a-zA-Z0-9]+)/g;

export const MessageList = () => {
  const { serverId = '' } = useParams();
  const dispatch = useAppDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const channels = useAppSelector(state => state.channels.channels[serverId] || []);
  const generalChannel = channels.find(channel => channel.name === 'general');
  
  const messages = useAppSelector(selectChannelMessages(generalChannel?.id || ''));
  const loading = useAppSelector(selectMessagesLoading);
  const presenceState = useAppSelector((state) => state.presence.users);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  useEffect(() => {
    if (generalChannel?.id) {
      dispatch(fetchMessages({ channelId: generalChannel.id }));
    }
  }, [generalChannel?.id, dispatch]);

  const scrollToBottom = () => {
    if (shouldScrollToBottom) {
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    
    // Determine if auto-scroll to bottom
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    setShouldScrollToBottom(isNearBottom);

    // Load more messages when near top
    // TODO: currently bugged, scroll position stays stuck if end of message history
    if (element.scrollTop <= 100 && !loadingMore && messages.length >= 75) {
      setLoadingMore(true);
      const oldScrollHeight = element.scrollHeight;

      try {
        const oldestMessage = sortedMessages[0];
        await dispatch(fetchMessages({
          channelId: generalChannel?.id || '',
          before: oldestMessage.id
        })).unwrap();

        // Preserve scroll position after loading more messages
        requestAnimationFrame(() => {
          const newScrollHeight = element.scrollHeight;
          element.scrollTop = newScrollHeight - oldScrollHeight;
        });
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const shouldShowMessageHeader = (index: number, messages: Message[]) => {
    if (index === 0) return true;

    const currentMessage = messages[index];
    const previousMessage = messages[index - 1];
    
    const currentTime = new Date(currentMessage.created_at).getTime();
    const previousTime = new Date(previousMessage.created_at).getTime();
    
    const timeDiff = currentTime - previousTime;
    const sameUser = previousMessage.user_id === currentMessage.user_id;

    return !sameUser || timeDiff > MAX_MESSAGE_GROUP_TIME;
  };

  if (loading && !loadingMore) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-secondary">Loading messages...</div>
      </div>
    );
  }

  if (!generalChannel) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text-secondary">Loading channel...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-navy px-4">
        <div className="flex flex-col items-center max-w-lg text-center">
          <div className="w-16 h-16 rounded-full bg-navy-light flex items-center justify-center mb-4">
            <Hash className="w-8 h-8 text-text-secondary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome to #{generalChannel.name}!
          </h2>
          <p className="text-text-secondary">
            This is the beginning of the #{generalChannel.name} channel.
          </p>
        </div>
      </div>
    );
  }

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const renderMessageContent = (content: string) => {
    const inviteCodes = Array.from(content.matchAll(INVITE_REGEX))
      .map(match => match[1]);

    return (
      <>
        <div className="text-text-primary whitespace-pre-wrap break-words">
          {content}
        </div>
        {inviteCodes.map((code, index) => (
          <InviteEmbed key={`${code}-${index}`} code={code} />
        ))}
      </>
    );
  };

  return (
    <div 
      className="flex-1 overflow-y-auto min-h-0 custom-scrollbar"
      onScroll={handleScroll}
    >
      <div className="px-4 flex flex-col gap-2">
        <AnimatePresence>
          {sortedMessages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={`flex ${shouldShowMessageHeader(index, sortedMessages) ? 'mt-6' : 'mt-0.5'}`}
            >
              {shouldShowMessageHeader(index, sortedMessages) ? (
                // Message with header
                <div className="flex w-full">
                  <div className="w-14 flex-shrink-0">
                    <div 
                      className="w-10 h-10 rounded-full bg-navy-light"
                      style={message.user.avatar_url ? {
                        backgroundImage: `url(${message.user.avatar_url})`,
                        backgroundSize: 'cover'
                      } : undefined}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline mb-1">
                      <span className="font-medium text-white">
                        {message.user.username}
                      </span>
                      <span className="text-xs text-text-secondary ml-2">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {renderMessageContent(message.content)}
                  </div>
                </div>
              ) : (
                // Continuation message
                <div className="flex w-full">
                  <div className="w-14 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {renderMessageContent(message.content)}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={lastMessageRef} />
      </div>
    </div>
  );
};