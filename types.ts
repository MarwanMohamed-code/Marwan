
export interface User {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  followers: number;
  following: number;
  savedPostIds?: string[];
  isPrivate?: boolean; // New: Private Account Toggle
  followingIds?: string[]; // New: List of IDs this user follows
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  avatarUrl?: string; // Added to store snapshot in Telegraph
}

export type ReactionType = '❤️' | '😂' | '😮' | '😢' | '😡';

export interface Reaction {
  userId: string;
  type: ReactionType;
}

export interface AppNotification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system';
  fromUserId: string; // The person who did the action
  postId?: string;    // Optional: linked post
  text?: string;      // Optional: comment text or system message
  timestamp: number;
  read: boolean;
}

export interface Post {
  id: string;
  userId: string;
  imageUrl?: string; // Deprecated, kept for backward compatibility
  images?: string[]; // Support for multiple images
  caption: string;
  likes: string[]; 
  reactions: Reaction[]; 
  comments: Comment[]; // Keep for backward compat or small preview
  
  // New: Store interactions per image index
  mediaComments?: Record<number, Comment[]>;
  mediaReactions?: Record<number, Reaction[]>;

  // Telegraph Comments Integration
  telegraphPath?: string;       // The path to the Telegraph page (e.g., 'Post-Comments-123')
  telegraphToken?: string;      // The access token to edit this specific page

  timestamp: number;
  location?: string;
  isAiGenerated?: boolean;
}

// --- Game Types ---
export interface GameSession {
  id: string;
  playerX: string; // User ID of host
  playerO: string; // User ID of guest
  board: (string | null)[];
  currentTurn: 'X' | 'O';
  winner: 'X' | 'O' | 'Draw' | null;
  status: 'waiting' | 'active' | 'finished';
  lastMoveTime: number;
}

export type ViewState = 'home' | 'search' | 'create' | 'activity' | 'profile' | 'settings' | 'login' | 'post_detail' | 'edit_profile' | 'village_services' | 'restaurant_detail' | 'product_detail' | 'add_product' | 'ai_editor' | 'notifications';

export type Language = 'ar' | 'en' | 'fr' | 'de';
export type Theme = 'light' | 'dark' | 'auto';
export type FontSize = 1 | 2 | 3 | 4 | 5;

export interface AiDraftData {
    caption: string;
    imagePrompt?: string;
}

export interface AppContextType {
  currentUser: User | null;
  posts: Post[];
  users: User[];
  notifications: AppNotification[]; // New: Notifications List
  unreadNotificationsCount: number; // New: Badge count
  markNotificationsAsRead: () => void; // New: Action
  
  login: (username: string) => void;
  logout: () => void;
  createPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'timestamp' | 'reactions'>) => void;
  deletePost: (postId: string) => void;
  updateUserProfile: (userId: string, data: Partial<User>) => void;
  toggleLike: (postId: string, reaction?: ReactionType, imageIndex?: number) => void;
  addComment: (postId: string, text: string, imageIndex?: number) => void;
  followUser: (userId: string) => void;
  toggleSavePost: (postId: string) => void;
  handleShare: (post: Post) => void;
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  viewedProfileId: string | null;
  setViewedProfileId: (id: string | null) => void;
  viewedPostId: string | null;
  setViewedPostId: (id: string | null) => void;
  // New: Specific Image Viewing
  viewedImageIndex: number;
  setViewedImageIndex: (index: number) => void;

  // Village Specific
  selectedServiceCategory: string | null;
  setSelectedServiceCategory: (category: string | null) => void;
  selectedPlaceId: string | null;
  setSelectedPlaceId: (id: string | null) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  addProduct: (placeId: string, productData: any) => void;
  
  // Omda Capabilities
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  aiDraft: AiDraftData | null;
  setAiDraft: (draft: AiDraftData | null) => void;
}
