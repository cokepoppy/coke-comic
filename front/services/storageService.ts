import axios from 'axios';
import { Comic, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔗 API Base URL:', API_BASE_URL);

// Token management
const TOKEN_KEY = 'g_comics_token';

const getAuthHeader = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Comics API
export const getComics = async (): Promise<Comic[]> => {
  try {
    console.log('📚 Fetching comics from API...');
    const response = await axios.get(`${API_BASE_URL}/comics`);
    console.log('✅ Comics fetched:', response.data.data.length);
    return response.data.data;
  } catch (error) {
    console.error('❌ Error fetching comics:', error);
    return [];
  }
};

export const saveComic = async (formData: FormData): Promise<Comic> => {
  try {
    console.log('📤 Uploading comic...');
    const response = await axios.post(`${API_BASE_URL}/comics`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('✅ Comic uploaded:', response.data.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error uploading comic:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to upload comic');
  }
};

export const deleteComic = async (id: string): Promise<void> => {
  try {
    console.log('🗑️  Deleting comic:', id);
    await axios.delete(`${API_BASE_URL}/comics/${id}`, {
      headers: getAuthHeader(),
    });
    console.log('✅ Comic deleted');
  } catch (error: any) {
    console.error('❌ Error deleting comic:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to delete comic');
  }
};

// Auth API
export const loginUser = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    console.log('🔐 Logging in:', email);
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    const { token, user } = response.data.data;
    localStorage.setItem(TOKEN_KEY, token);
    console.log('✅ Login successful');
    return { user, token };
  } catch (error: any) {
    console.error('❌ Login error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const registerUser = async (name: string, email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    console.log('📝 Registering user:', email);
    const response = await axios.post(`${API_BASE_URL}/auth/register`, { name, email, password });
    const { token, user } = response.data.data;
    localStorage.setItem(TOKEN_KEY, token);
    console.log('✅ Registration successful');
    return { user, token };
  } catch (error: any) {
    console.error('❌ Registration error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      console.log('ℹ️  No token found, user not logged in');
      return null;
    }

    console.log('👤 Fetching current user...');
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeader(),
    });
    console.log('✅ Current user fetched:', response.data.data.email);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error fetching current user:', error.response?.data || error.message);
    // Clear invalid token
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    console.log('👋 Logging out...');
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: getAuthHeader(),
    });
  } catch (error) {
    console.error('⚠️  Logout API error (continuing anyway):', error);
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    console.log('✅ Logged out');
  }
};

// Keep for backward compatibility (mock login - redirects to real login)
export const loginWithGoogleMock = async (): Promise<User> => {
  throw new Error('Mock login deprecated. Please use loginUser() with email/password.');
};