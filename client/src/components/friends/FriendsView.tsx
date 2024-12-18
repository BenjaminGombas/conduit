import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Video, MoreVertical, Search } from 'lucide-react';

export const FriendsView = () => {
  return (
    <div className="flex flex-col h-full bg-navy">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-navy-light">
        <h2 className="text-white font-semibold">Friends</h2>
        <div className="h-6 mx-4 border-l border-navy-light"></div>
        <Button variant="ghost" className="text-text-secondary hover:text-white">
          Online
        </Button>
        <Button variant="ghost" className="text-text-secondary hover:text-white">
          All
        </Button>
        <Button variant="ghost" className="text-text-secondary hover:text-white">
          Pending
        </Button>
        <Button variant="ghost" className="text-text-secondary hover:text-white">
          Blocked
        </Button>
        <Button className="ml-2 bg-rose hover:bg-rose/90">
          Add Friend
        </Button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
          <input
            type="text"
            placeholder="Search"
            className="w-full px-10 py-1 bg-navy-dark rounded-md text-text-secondary focus:outline-none focus:ring-1 focus:ring-rose"
          />
        </div>
      </div>

      {/* Online Friends Section */}
      <div className="flex-1 overflow-y-auto px-4">
        <h3 className="text-text-secondary uppercase text-xs font-semibold mt-4 mb-2">
          Online — 1
        </h3>
        <div className="space-y-1">
          <FriendItem />
        </div>

        {/* It's quiet for now... section */}
        <div className="mt-8 text-center py-8">
          <h3 className="text-white font-semibold mb-2">It's quiet for now...</h3>
          <p className="text-text-secondary text-sm">
            When a friend starts an activity—like playing a game or hanging out on voice—we'll show it here!
          </p>
        </div>
      </div>
    </div>
  );
};

const FriendItem = () => {
  return (
    <div className="flex items-center p-2 rounded hover:bg-navy-light group">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-navy-dark flex-shrink-0"></div>
      
      {/* User Info */}
      <div className="ml-3 flex-1">
        <h4 className="text-white font-medium">Username</h4>
        <p className="text-text-secondary text-sm">Online</p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white">
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white">
          <Phone className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white">
          <Video className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-text-secondary hover:text-white">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};