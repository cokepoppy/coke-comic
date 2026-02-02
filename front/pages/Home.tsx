import React from 'react';
import { Comic } from '../types';
import { useNavigate } from 'react-router-dom';
import { Clock, User } from 'lucide-react';

interface HomeProps {
  comics: Comic[];
  searchQuery: string;
}

const ASSET_BASE_URL = (() => {
  const api = import.meta.env.VITE_API_URL;
  // If api is relative (e.g. "/api"), assets are same-origin.
  if (!api) return import.meta.env.DEV ? 'http://localhost:5001' : '';
  if (api.startsWith('/')) return '';
  // If api is absolute (e.g. "http://localhost:5001/api"), strip the "/api" suffix.
  return api.replace(/\/api\/?$/, '');
})();

export const Home: React.FC<HomeProps> = ({ comics, searchQuery }) => {
  const navigate = useNavigate();

  const filteredComics = comics.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl text-gray-800 google-font">Recent Comics</h2>
        <div className="text-sm text-gray-500">Showing {filteredComics.length} results</div>
      </div>

      {filteredComics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
                <Clock className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600">No comics found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredComics.map((comic) => (
            <div 
                key={comic.id}
                onClick={() => navigate(`/read/${comic.id}`)}
                className="group cursor-pointer flex flex-col gap-2"
            >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-200 border border-gray-200 transition-shadow group-hover:shadow-md">
                    <img
                        src={`${ASSET_BASE_URL}${comic.coverUrl}`}
                        alt={comic.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                <div className="space-y-0.5">
                    <h3 className="text-sm font-medium text-gray-900 truncate pr-2" title={comic.title}>
                        {comic.title}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500">
                         <User className="w-3 h-3 mr-1" />
                         <span className="truncate">{comic.author}</span>
                    </div>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};
