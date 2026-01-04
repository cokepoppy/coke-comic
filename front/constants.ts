import { Comic } from './types';

export const APP_NAME = "G-Comics";

// Initial Mock Data to populate the store if empty
export const INITIAL_COMICS: Comic[] = [
  {
    id: '1',
    title: 'The Cyberpunk Chronicles',
    description: 'A neon-soaked journey through a futuristic metropolis where technology and humanity collide.',
    author: 'Alex V.',
    coverUrl: 'https://picsum.photos/400/600?random=1',
    pages: [
      'https://picsum.photos/800/1200?random=101',
      'https://picsum.photos/800/1200?random=102',
      'https://picsum.photos/800/1200?random=103',
      'https://picsum.photos/800/1200?random=104'
    ],
    createdAt: Date.now()
  },
  {
    id: '2',
    title: 'Nature\'s Silent Whisper',
    description: 'An anthology of silent comics exploring the beauty of the natural world.',
    author: 'Sarah J.',
    coverUrl: 'https://picsum.photos/400/600?random=2',
    pages: [
      'https://picsum.photos/800/1200?random=201',
      'https://picsum.photos/800/1200?random=202'
    ],
    createdAt: Date.now() - 100000
  },
  {
    id: '3',
    title: 'Space Cadet Zero',
    description: 'Follow the misadventures of the galaxy\'s unluckiest astronaut.',
    author: 'Orbit Team',
    coverUrl: 'https://picsum.photos/400/600?random=3',
    pages: [
      'https://picsum.photos/800/1200?random=301',
      'https://picsum.photos/800/1200?random=302',
      'https://picsum.photos/800/1200?random=303'
    ],
    createdAt: Date.now() - 200000
  }
];
