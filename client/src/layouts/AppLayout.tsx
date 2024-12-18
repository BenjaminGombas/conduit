import { Outlet } from 'react-router-dom';
import { ServerList } from '@/components/server/ServerList';
import { ChannelSidebar } from '@/components/channel/ChannelSidebar';

export const AppLayout = () => {
  return (
    <div className="flex h-screen bg-navy-dark">
      <ServerList />
      <ChannelSidebar />
      <main className="flex-1 flex flex-col min-w-0"> {/* Added min-w-0 */}
        <Outlet />
      </main>
    </div>
  );
};