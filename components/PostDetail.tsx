
import React, { useState, useEffect } from 'react';
import { Post, User, ReactionType, Comment } from '../types';
import { Icons } from './Icons';
import { useSettings } from '../contexts/SettingsContext';

interface PostDetailProps {
  post: Post;
  author: User;
  currentUser: User | null;
  onClose: () => void;
  onComment: (postId: string, text: string, imageIndex?: number) => void;
  onLike: (postId: string, reaction?: ReactionType, imageIndex?: number) => void;
  onShare: (post: Post) => void; // Added onShare prop
  initialImageIndex?: number;
}

export const PostDetail: React.FC<PostDetailProps> = ({ 
  post, 
  author, 
  currentUser,
  onClose,
  onComment,
  onLike,
  onShare,
  initialImageIndex = 0
}) => {
  const { t } = useSettings();
  const [text, setText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showComments, setShowComments] = useState(false);

  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Normalize images
  const images = post.images && post.images.length > 0 
    ? post.images 
    : (post.imageUrl ? [post.imageUrl] : []);

  // --- Image Specific Data Helpers ---
  const currentImageComments = post.mediaComments?.[currentImageIndex] || [];
  const currentImageReactions = post.mediaReactions?.[currentImageIndex] || [];
  
  // Is this specific image liked by current user?
  const isImageLiked = currentImageReactions.some(r => r.userId === currentUser?.id);
  const imageReactionType = currentImageReactions.find(r => r.userId === currentUser?.id)?.type;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(text.trim()) {
        onComment(post.id, text, currentImageIndex);
        setText('');
    }
  };

  // --- Swipe Logic (Reverse/Gallery Style) ---
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    
    // Logic Reverse for Arabic/Gallery Feel:
    // Swipe Right (End > Start) -> Next
    const isSwipeRight = distance < -minSwipeDistance; 
    const isSwipeLeft = distance > minSwipeDistance;

    if (isSwipeRight && currentImageIndex < images.length - 1) {
        setCurrentImageIndex(prev => prev + 1);
    }
    if (isSwipeLeft && currentImageIndex > 0) {
        setCurrentImageIndex(prev => prev - 1);
    }
  };

  // Toggle Overlay on Tap
  const handleImageTap = () => {
      setShowOverlay(!showOverlay);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-pop-in overflow-hidden">
      
      {/* Top Overlay */}
      <div className={`absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         <button onClick={onClose} className="p-2 bg-black/40 rounded-full hover:bg-black/60 text-white backdrop-blur-sm">
            <Icons.Close className="w-6 h-6" />
         </button>
         <div className="flex items-center gap-2">
             <span className="text-white text-sm font-bold shadow-sm">{author.username}</span>
             <span className="text-white/70 text-xs">{currentImageIndex + 1} / {images.length}</span>
         </div>
         <button onClick={() => setShowComments(!showComments)} className="p-2 text-white">
             <Icons.More className="w-6 h-6" />
         </button>
      </div>

      {/* Main Image Stage */}
      <div 
        className="flex-1 flex items-center justify-center relative touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleImageTap}
      >
        {images.length > 0 ? (
            <img 
                src={images[currentImageIndex]} 
                alt="Detail" 
                className="w-full h-full object-contain select-none transition-transform duration-300"
            />
        ) : (
            <div className="text-white">No Image</div>
        )}
      </div>

      {/* Bottom Overlay (Actions & Specific Interactions) */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${showOverlay ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-6">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onLike(post.id, isImageLiked ? undefined : '❤️', currentImageIndex); }}
                        className="flex flex-col items-center gap-1"
                      >
                          <Icons.Activity className={`w-7 h-7 ${isImageLiked ? 'text-red-500 fill-red-500 animate-emoji-heart' : 'text-white'}`} />
                          <span className="text-xs text-white font-bold">{currentImageReactions.length > 0 ? currentImageReactions.length : 'Like'}</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                        className="flex flex-col items-center gap-1"
                      >
                          <Icons.Comment className="w-7 h-7 text-white" />
                          <span className="text-xs text-white font-bold">{currentImageComments.length > 0 ? currentImageComments.length : 'Comment'}</span>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onShare(post); }} 
                        className="flex flex-col items-center gap-1"
                      >
                          <Icons.Share className="w-7 h-7 text-white" />
                          <span className="text-xs text-white font-bold">Share</span>
                      </button>
                  </div>
              </div>
              
              {/* Image Specific Caption (If we had per-image captions, we'd show them here. For now, show main caption if index 0) */}
              {currentImageIndex === 0 && post.caption && (
                  <p className="text-white text-sm line-clamp-2 leading-relaxed opacity-90 dir-auto px-1">
                      <span className="font-bold mr-2">{author.username}</span>
                      {post.caption}
                  </p>
              )}
          </div>
      </div>

      {/* Comments Sheet Overlay (Specific to Image) */}
      {showComments && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-slide-up">
              <div className="bg-white dark:bg-gray-900 rounded-t-3xl h-[70vh] flex flex-col w-full max-w-md mx-auto">
                  <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
                      <span className="font-bold dark:text-white">تعليقات على الصورة</span>
                      <button onClick={() => setShowComments(false)}>
                          <Icons.Close className="w-6 h-6 dark:text-white" />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {currentImageComments.length === 0 ? (
                          <div className="text-center text-gray-500 py-10">كن أول من يعلق على هذه الصورة</div>
                      ) : (
                          currentImageComments.map(c => (
                              <div key={c.id} className="flex gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                      {c.username[0].toUpperCase()}
                                  </div>
                                  <div className="flex-1">
                                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none">
                                          <span className="font-bold text-sm block dark:text-white">{c.username}</span>
                                          <span className="text-sm dark:text-gray-300">{c.text}</span>
                                      </div>
                                      <span className="text-[10px] text-gray-400 px-2">Now</span>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>

                  <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                      <input 
                        type="text" 
                        value={text} 
                        onChange={(e) => setText(e.target.value)}
                        placeholder="أضف تعليقاً على الصورة..."
                        className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm outline-none dark:text-white"
                        autoFocus
                      />
                      <button type="submit" disabled={!text.trim()} className="text-blue-500 font-bold p-2">نشر</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
