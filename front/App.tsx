import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { Reader } from './pages/Reader';
import { getCurrentUser, logoutUser, getComics } from './services/storageService';
import { Comic, User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comics, setComics] = useState<Comic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        const [comicsData, userData] = await Promise.all([
          getComics(),
          getCurrentUser(),
        ]);
        setComics(comicsData);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    // Refresh comics after login
    getComics().then(setComics);
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-white">
        <Routes>
          {/* Reader route stands alone without standard header */}
          <Route path="/read/:id" element={<Reader />} />
          
          {/* Default Layout Routes */}
          <Route path="*" element={
            <>
              <Header 
                user={currentUser} 
                onLogout={handleLogout} 
                onSearch={setSearchQuery}
              />
              <main>
                <Routes>
                  <Route path="/" element={<Home comics={comics} searchQuery={searchQuery} />} />
                  <Route path="/admin" element={
                    <Admin 
                      user={currentUser} 
                      onLoginSuccess={handleLoginSuccess} 
                    />
                  } />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </>
          } />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;