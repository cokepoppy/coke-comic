import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { FileUpload } from '../components/FileUpload';
import { loginUser, registerUser, saveComic, getComics, deleteComic } from '../services/storageService';
import { generateComicDescription } from '../services/geminiService';
import { Comic, User } from '../types';
import { Trash2, Sparkles, Plus, Image as ImageIcon } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

interface AdminProps {
  user: User | null;
  onLoginSuccess: (user: User) => void;
}

export const Admin: React.FC<AdminProps> = ({ user, onLoginSuccess }) => {
  // Auth State
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard State
  const [comics, setComics] = useState<Comic[]>([]);
  const [view, setView] = useState<'list' | 'create'>('list');

  // Load comics when user logs in
  React.useEffect(() => {
    if (user) {
      getComics().then(setComics);
    }
  }, [user]);

  // Create Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [pageFiles, setPageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');

    try {
      if (authMode === 'login') {
        const { user } = await loginUser(email, password);
        onLoginSuccess(user);
      } else {
        const { user } = await registerUser(name, email, password);
        onLoginSuccess(user);
      }
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed');
      console.error("Auth failed", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!title || !author) {
      alert("Please enter title and author first.");
      return;
    }
    setIsGenerating(true);
    const desc = await generateComicDescription(title, author);
    setDescription(desc);
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!coverFiles.length || !pageFiles.length) {
      alert("Please upload both cover image and comic pages.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      formData.append('description', description);

      // Append cover
      formData.append('cover', coverFiles[0]);

      // Append pages
      pageFiles.forEach(file => {
        formData.append('pages', file);
      });

      // Upload to backend
      await saveComic(formData);

      // Refresh comics list
      const updatedComics = await getComics();
      setComics(updatedComics);

      // Reset form
      setView('list');
      setTitle('');
      setAuthor('');
      setDescription('');
      setCoverFiles([]);
      setPageFiles([]);

      alert("Comic uploaded successfully!");
    } catch (err: any) {
      console.error("Error uploading comic", err);
      alert(err.message || "Failed to upload comic.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Are you sure you want to delete this comic?')) {
          try {
              await deleteComic(id);
              const updatedComics = await getComics();
              setComics(updatedComics);
          } catch (error: any) {
              alert(error.message || 'Failed to delete comic');
          }
      }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-white">
        <div className="w-full max-w-[400px] p-10 space-y-6 bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-medium text-gray-900 google-font">
              {authMode === 'login' ? 'Sign in' : 'Create Account'}
            </h2>
            <p className="text-base text-gray-600">to continue to G-Comics Admin</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <Input
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
              />
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {authError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full"
            >
              {isLoggingIn ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{authMode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                authMode === 'login' ? 'Sign in' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
              className="text-sm text-[#1a73e8] hover:underline"
            >
              {authMode === 'login'
                ? "Don't have an account? Register"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-normal text-gray-800 google-font">
          {view === 'list' ? 'Dashboard' : 'Upload Comic'}
        </h1>
        {view === 'list' ? (
          <Button onClick={() => setView('create')} icon={<Plus size={18} />}>
            New Comic
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setView('list')}>
            Cancel
          </Button>
        )}
      </div>

      {view === 'list' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-2 sm:col-span-1">Preview</div>
                <div className="col-span-5 sm:col-span-5">Title</div>
                <div className="col-span-3 sm:col-span-3">Author</div>
                <div className="col-span-2 sm:col-span-3 text-right">Actions</div>
            </div>
            <div className="divide-y divide-gray-100">
                {comics.map(comic => (
                    <div key={comic.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors group">
                        <div className="col-span-2 sm:col-span-1">
                            <div className="h-16 w-12 bg-gray-100 rounded overflow-hidden shadow-sm relative border border-gray-200">
                                {comic.coverUrl ? (
                                    <img
                                        src={`${API_BASE_URL}${comic.coverUrl}`}
                                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-110"
                                        alt={comic.title}
                                        onError={(e) => {
                                            // Fallback to icon if image fails
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <ImageIcon size={16} />
                                    </div>
                                )}
                                {/* Fallback icon container (hidden by default) */}
                                <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-300">
                                     <ImageIcon size={16} />
                                </div>
                            </div>
                        </div>
                        <div className="col-span-5 sm:col-span-5 font-medium text-gray-900 truncate" title={comic.title}>{comic.title}</div>
                        <div className="col-span-3 sm:col-span-3 text-gray-500 truncate">{comic.author}</div>
                        <div className="col-span-2 sm:col-span-3 text-right">
                            <button 
                                onClick={() => handleDelete(comic.id)} 
                                className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete comic"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {comics.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No comics uploaded yet.</div>
                )}
            </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-3xl mx-auto shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input label="Comic Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
                 <Input label="Author Name" required value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <div className="relative">
                    <textarea 
                        className="block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent min-h-[120px]"
                        placeholder="Enter description or generate with AI..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={isGenerating || !title}
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 text-[#1a73e8] text-xs font-medium rounded-md border border-blue-100 hover:shadow-sm disabled:opacity-50 transition-all"
                    >
                        {isGenerating ? (
                            <span className="animate-pulse">Thinking...</span>
                        ) : (
                            <>
                                <Sparkles size={14} />
                                <span>Generate with Gemini</span>
                            </>
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-500">Enter title and author to enable AI generation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <FileUpload 
                      label="Cover Image"
                      files={coverFiles}
                      onChange={setCoverFiles}
                      multiple={false}
                   />
                </div>

                <div>
                   <FileUpload 
                      label="Comic Pages"
                      files={pageFiles}
                      onChange={setPageFiles}
                      multiple={true}
                   />
                </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-4">
                 <p className="text-xs text-gray-500 italic">Note: Large files may exceed browser storage limits.</p>
                 <Button type="submit" className="min-w-[120px]" disabled={isSubmitting}>
                     {isSubmitting ? 'Publishing...' : 'Publish Comic'}
                 </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
