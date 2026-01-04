import React from 'react';
import { Search, Menu, BookOpen, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from './Button';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-2 lg:px-6">
        {/* Left: Branding */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden">
            <Menu className="w-6 h-6 text-gray-500" />
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#1a73e8] p-1.5 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-normal text-gray-600 hidden sm:block google-font">
              <span className="font-medium text-gray-800">G-Comics</span>
            </span>
          </div>
        </div>

        {/* Middle: Search Bar (Google Style) */}
        <div className="flex-1 max-w-2xl mx-4 lg:mx-12">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#1a73e8]" />
            </div>
            <input
              type="text"
              className="block w-full p-3 pl-10 text-sm text-gray-900 bg-[#f1f3f4] rounded-lg focus:bg-white focus:ring-1 focus:ring-transparent focus:shadow-[0_1px_6px_rgba(32,33,36,0.28)] focus:outline-none transition-shadow"
              placeholder="Search comics, authors..."
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
           {user ? (
             <div className="flex items-center gap-3">
                <Button variant="text" onClick={() => navigate('/admin')} className={location.pathname === '/admin' ? 'bg-blue-50 text-blue-700 hidden sm:inline-flex' : 'hidden sm:inline-flex'}>
                  Dashboard
                </Button>
                
                <div className="relative flex items-center gap-3 pl-2 sm:border-l sm:border-gray-200">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-gray-700">{user.name}</div>
                        <div className="text-xs text-gray-500">Admin</div>
                    </div>
                    
                    <button 
                        onClick={onLogout}
                        className="group relative rounded-full ring-2 ring-transparent hover:ring-gray-200 transition-all focus:outline-none"
                        title="Sign out"
                    >
                         {user.imageUrl ? (
                             <img 
                                src={user.imageUrl} 
                                alt={user.name} 
                                className="w-9 h-9 rounded-full object-cover"
                                onError={(e) => {
                                    // Fallback if image fails
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1a73e8&color=fff`;
                                }}
                             />
                         ) : (
                             <div className="w-9 h-9 rounded-full bg-[#1a73e8] flex items-center justify-center text-white font-medium">
                                 {user.name.charAt(0)}
                             </div>
                         )}
                         
                         {/* Logout overlay icon on hover */}
                         <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                             <LogOut size={14} className="text-white" />
                         </div>
                    </button>
                </div>
             </div>
           ) : (
            <div className="flex items-center gap-2">
                <Button variant="primary" onClick={() => navigate('/admin')}>
                   Sign In
                </Button>
                <div className="p-1">
                     <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                         <UserIcon size={20} />
                     </div>
                </div>
            </div>
           )}
        </div>
      </div>
    </header>
  );
};