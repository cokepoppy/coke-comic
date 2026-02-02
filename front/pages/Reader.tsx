import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Comic } from '../types';
import { getComics } from '../services/storageService';
import { Button } from '../components/Button';
import { ChevronLeft, Info, MessageSquare, ChevronRight } from 'lucide-react';

const ASSET_BASE_URL = (() => {
  const api = import.meta.env.VITE_API_URL;
  // If api is relative (e.g. "/api"), assets are same-origin.
  if (!api) return import.meta.env.DEV ? 'http://localhost:5001' : '';
  if (api.startsWith('/')) return '';
  // If api is absolute (e.g. "http://localhost:5001/api"), strip the "/api" suffix.
  return api.replace(/\/api\/?$/, '');
})();

export const Reader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [comic, setComic] = useState<Comic | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  // Navigation State
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadComic = async () => {
      const comics = await getComics();
      const found = comics.find(c => c.id === id);
      if (found) {
        setComic(found);
      } else {
        navigate('/');
      }
    };

    loadComic();
  }, [id, navigate]);

  // Keyboard Navigation
  useEffect(() => {
    if (!comic) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input (though uncommon in this view)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ': // Spacebar
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'Escape':
          navigate('/');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [comic, currentIndex]);

  if (!comic) return <div className="p-10 text-center text-white">Loading...</div>;

  const totalPages = comic.pages.length;
  const isEndScreen = currentIndex === totalPages;

  const handleNext = () => {
    if (currentIndex < totalPages) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#202124] flex flex-col h-screen overflow-hidden">
      {/* Reader Header */}
      <div className="bg-[#202124]/95 backdrop-blur-sm border-b border-gray-700 px-4 h-16 flex items-center justify-between text-gray-200 z-50 shrink-0">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Back to Library (Esc)"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm font-medium truncate max-w-[200px] sm:max-w-md text-gray-100">
                  {comic.title}
              </h1>
              <span className="text-xs text-gray-400">
                 {isEndScreen ? 'Completed' : `Page ${currentIndex + 1} of ${totalPages}`}
              </span>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
             <button 
                onClick={() => setShowInfo(!showInfo)}
                className={`p-2 rounded-full transition-colors ${showInfo ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-white/10'}`}
                title="Comic Info"
            >
                <Info className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-800 w-full shrink-0">
        <div 
          className="h-full bg-[#1a73e8] transition-all duration-300 ease-out"
          style={{ width: `${Math.min(((currentIndex + 1) / totalPages) * 100, 100)}%` }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Navigation Zones (Invisible Click Areas) */}
        {!isEndScreen && (
            <>
                {/* Previous Zone */}
                <div 
                    className="absolute inset-y-0 left-0 w-1/4 z-10 cursor-w-resize group flex items-center justify-start pl-4"
                    onClick={handlePrev}
                >
                    <div className={`p-2 rounded-full bg-black/50 text-white opacity-0 transition-opacity duration-200 ${currentIndex > 0 ? 'group-hover:opacity-100' : ''}`}>
                        <ChevronLeft size={32} />
                    </div>
                </div>

                {/* Next Zone */}
                <div 
                    className="absolute inset-y-0 right-0 w-1/4 z-10 cursor-e-resize group flex items-center justify-end pr-4"
                    onClick={handleNext}
                >
                     <div className="p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <ChevronRight size={32} />
                    </div>
                </div>
            </>
        )}

        {/* Comic Strip / Page */}
        <div className="flex-1 bg-[#202124] flex items-center justify-center p-4 relative overflow-y-auto no-scrollbar">
            {isEndScreen ? (
                 /* End Screen */
                 <div className="text-center text-gray-500 animate-fade-in max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-medium text-white mb-2">Chapter Complete</h2>
                    <p className="text-gray-400 mb-8">You've reached the end of {comic.title}.</p>
                    <div className="flex gap-4 justify-center">
                        <Button 
                            variant="secondary" 
                            className="bg-transparent border-gray-600 text-gray-300 hover:bg-white/5 hover:text-white"
                            onClick={() => setCurrentIndex(0)}
                        >
                            Read Again
                        </Button>
                        <Button 
                            onClick={() => navigate('/')}
                        >
                            Back to Library
                        </Button>
                    </div>
                </div>
            ) : (
                /* Single Page View */
                <div className="relative w-full h-full flex items-center justify-center">
                    <img
                        key={currentIndex} /* Force re-render for animation */
                        src={`${ASSET_BASE_URL}${comic.pages[currentIndex]}`}
                        alt={`Page ${currentIndex + 1}`}
                        className="max-w-full max-h-full object-contain shadow-2xl animate-fade-in select-none"
                    />
                </div>
            )}
        </div>

        {/* Info Sidebar (Collapsible) */}
        {showInfo && (
            <div className="w-full lg:w-80 bg-[#292a2d] border-l border-gray-700 p-6 overflow-y-auto text-gray-300 shadow-xl absolute lg:relative right-0 h-full z-40 animate-fade-in">
                <div className="flex items-start gap-4 mb-6">
                    <img src={`${ASSET_BASE_URL}${comic.coverUrl}`} className="w-24 rounded shadow-lg" alt="Cover" />
                    <div>
                        <h2 className="text-white font-medium text-lg leading-tight">{comic.title}</h2>
                        <p className="text-sm text-gray-400 mt-1">by {comic.author}</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Synopsis</h3>
                        <p className="text-sm leading-relaxed text-gray-300">
                            {comic.description}
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Details</h3>
                        <div className="text-sm space-y-2">
                             <div className="flex justify-between">
                                 <span>Pages</span>
                                 <span className="text-white">{comic.pages.length}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span>Released</span>
                                 <span className="text-white">{new Date(comic.createdAt).toLocaleDateString()}</span>
                             </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-700">
                         <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Controls</h4>
                            <ul className="text-xs space-y-1.5 text-gray-400">
                                <li className="flex justify-between">
                                    <span>Next Page</span>
                                    <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-200">Right Arrow</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Previous Page</span>
                                    <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-200">Left Arrow</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Exit</span>
                                    <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-200">Esc</span>
                                </li>
                            </ul>
                         </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
