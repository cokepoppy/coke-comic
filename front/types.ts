export interface Comic {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  pages: string[]; // Array of image URLs (or base64)
  author: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST'
}