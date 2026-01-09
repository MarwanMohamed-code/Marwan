import { User, Post } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'alex_adventures',
    fullName: 'Alex Explorer',
    avatarUrl: 'https://picsum.photos/seed/alex/150/150',
    bio: 'Traveling the world 🌍 | Photographer 📸',
    followers: 1240,
    following: 350
  },
  {
    id: 'u2',
    username: 'creative_sarah',
    fullName: 'Sarah Art',
    avatarUrl: 'https://picsum.photos/seed/sarah/150/150',
    bio: 'Digital Artist 🎨 | AI Enthusiast 🤖',
    followers: 8900,
    following: 120
  },
  {
    id: 'u3',
    username: 'tech_guru',
    fullName: 'Tech Insider',
    avatarUrl: 'https://picsum.photos/seed/tech/150/150',
    bio: 'Latest gadgets and code 💻',
    followers: 5400,
    following: 500
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    imageUrl: 'https://picsum.photos/seed/mountain/600/600',
    caption: 'The view from the top is always worth the climb! 🏔️ #hiking #nature',
    likes: ['u2', 'u3'],
    reactions: [],
    comments: [
      { id: 'c1', userId: 'u2', username: 'creative_sarah', text: 'Stunning shot! 😍', timestamp: Date.now() - 100000 }
    ],
    timestamp: Date.now() - 3600000,
    location: 'Swiss Alps'
  },
  {
    id: 'p2',
    userId: 'u2',
    imageUrl: 'https://picsum.photos/seed/cyberpunk/600/600',
    caption: 'Cyberpunk vibes generated with AI. What do you think? 🌃 #aiart #cyberpunk',
    likes: ['u1'],
    reactions: [],
    comments: [],
    timestamp: Date.now() - 7200000,
    isAiGenerated: true
  }
];