
import React, { useState, useRef, useEffect } from 'react';
import { Post, User, ReactionType } from '../types';
import { Icons } from './Icons';
import { useSettings } from '../contexts/SettingsContext';

interface PostItemProps {
  post: Post;
  author: User;
  currentUser: User | null;
  onLike: (id: string, reaction?: ReactionType) => void;
  onComment: (id: string, text?: string) => void;
  onUserClick: (id: string) => void;
  onPostClick: (id: string, index?: number) => void;
  onMoreOptions?: (postId: string) => void;
  onShare: (post: Post) => void;
  onSave: (postId: string) => void;
  isSaved: boolean;
}

export const PostItem: React.FC<PostItemProps> = ({ 
  post, 
  author, 
  currentUser, 
  onLike, 
  onComment, 
  onUserClick,
  onPostClick,
  onMoreOptions,
  onShare,
  onSave,
  isSaved
}) => {
  const { t, isRTL } = useSettings();
  
  // Interaction State
  const [showReactions, setShowReactions] = useState(false);
  const [flyingEmoji, setFlyingEmoji] = useState<{ type: ReactionType, id: number } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Logic for Long Press
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const lastTap = useRef<number>(0);

  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Read More Logic
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_CAPTION_LENGTH = 150;
  const shouldTruncate = post.caption.length > MAX_CAPTION_LENGTH;
  const displayCaption = isExpanded || !shouldTruncate 
      ? post.caption 
      : post.caption.slice(0, MAX_CAPTION_LENGTH).trim() + "...";

  // Normalize images
  const images = post.images && post.images.length > 0 
    ? post.images 
    : (post.imageUrl ? [post.imageUrl] : []);

  // Determine current reaction
  const userReaction = currentUser 
    ? post.reactions?.find(r => r.userId === currentUser.id) 
    : null;
    
  const isLiked = userReaction || (currentUser && post.likes?.includes(currentUser.id));
  const currentEmoji = userReaction?.type || (isLiked ? '❤️' : null);

  // Check for viral status (simple heuristic for UI badge)
  const isViral = (post.likes.length + post.comments.length) > 5;

  // --- Like & Reaction Logic (Fixed) ---

  const startPress = (e: React.TouchEvent | React.MouseEvent) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowReactions(true);
      if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
    }, 500); // 500ms for long press
  };

  const endPress = (e: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // If it was a long press, do nothing (the menu is already open)
    if (isLongPress.current) {
        return; 
    }
    
    // Normal Tap Logic
    if (showReactions) {
        setShowReactions(false);
    } else {
        if (currentEmoji) {
            onLike(post.id); // Remove like
        } else {
            triggerFlyAnimation('❤️');
            onLike(post.id, '❤️'); // Default like
        }
    }
  };

  const triggerFlyAnimation = (emoji: ReactionType) => {
      setFlyingEmoji({ type: emoji, id: Date.now() });
      setTimeout(() => setFlyingEmoji(null), 800);
  };

  const handleReactionSelect = (emoji: ReactionType) => {
    triggerFlyAnimation(emoji);
    onLike(post.id, emoji);
    setShowReactions(false);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  // Handle Double Tap (Like) on Image
  const handleImageClick = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      triggerFlyAnimation('❤️');
      onLike(post.id, '❤️');
    } else {
      setTimeout(() => {
          if (Date.now() - lastTap.current > DOUBLE_TAP_DELAY) {
              onPostClick(post.id, currentImageIndex);
          }
      }, DOUBLE_TAP_DELAY);
    }
    lastTap.current = now;
  };

  // --- Swipe Logic (Inverted for RTL Feel) ---
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
    // Swipe Right (touchEnd > touchStart) -> Go to Next Image (pulling content from left)
    // Swipe Left (touchStart > touchEnd) -> Go to Previous Image
    
    const isSwipeRight = distance < -minSwipeDistance; // End is bigger than start (finger moved right)
    const isSwipeLeft = distance > minSwipeDistance;   // Start is bigger than end (finger moved left)

    if (isSwipeRight && currentImageIndex < images.length - 1) {
        setCurrentImageIndex(prev => prev + 1); // Next
    }
    if (isSwipeLeft && currentImageIndex > 0) {
        setCurrentImageIndex(prev => prev - 1); // Prev
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setShowReactions(false);
    if(showReactions) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showReactions]);

  const REACTION_EMOJIS: { type: ReactionType, animClass: string }[] = [
      { type: '❤️', animClass: 'animate-emoji-heart' },
      { type: '😂', animClass: 'animate-emoji-laugh' },
      { type: '😮', animClass: 'animate-emoji-wow' },
      { type: '😢', animClass: 'animate-emoji-sad' },
      { type: '😡', animClass: 'animate-emoji-angry' },
  ];

  const getReactionColor = (type: ReactionType | null) => {
      switch(type) {
          case '❤️': return 'text-red-500';
          case '😂': return 'text-yellow-500';
          case '😮': return 'text-yellow-600';
          case '😢': return 'text-blue-500';
          case '😡': return 'text-red-600';
          default: return 'text-gray-900 dark:text-white';
      }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sm:border sm:rounded-xl sm:mb-6 transition-all duration-200 shadow-sm hover:shadow-md relative z-0">
      
      {/* Flying Emoji Animation Overlay */}
      {flyingEmoji && (
          <div className="absolute bottom-16 left-8 z-50 pointer-events-none text-6xl animate-fly-up filter drop-shadow-lg">
              {flyingEmoji.type}
          </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer" onClick={() => onUserClick(author.id)}>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 ring-2 ring-gray-100 dark:ring-gray-800 p-0.5">
            <img src={author.avatarUrl} alt={author.username} className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <span className="font-bold text-sm dark:text-gray-100">{author.username}</span>
                {post.isAiGenerated && (
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center shadow-sm">
                    <Icons.Magic className="w-2 h-2 me-1" /> AI
                </span>
                )}
                {isViral && (
                    <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center shadow-sm animate-pulse">
                        <Icons.Fire className="w-2 h-2 me-1" /> Trending
                    </span>
                )}
            </div>
            {post.location && <span className="text-xs text-gray-500">{post.location}</span>}
          </div>
        </div>
        <button 
          onClick={() => onMoreOptions && onMoreOptions(post.id)}
          className="text-gray-500 dark:text-gray-400 p-2 -mr-2 active:opacity-50 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Icons.More className="w-5 h-5" />
        </button>
      </div>

      {/* Caption with Read More */}
      <div className="px-3 pb-3 pt-0">
        <div className="text-sm dark:text-gray-200 leading-relaxed" dir="auto">
          <span className="break-words whitespace-pre-wrap">{displayCaption}</span>
          {shouldTruncate && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-500 dark:text-gray-400 text-xs font-bold ml-1 hover:underline"
              >
                  {isExpanded ? t('showLess') : t('readMore')}
              </button>
          )}
        </div>
      </div>

      {/* Image Carousel */}
      <div 
        className="w-full bg-gray-100 dark:bg-gray-900 relative group touch-pan-y"
        style={{ aspectRatio: '4/5', maxHeight: '550px' }} 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
           className="w-full h-full overflow-hidden relative cursor-pointer"
           onClick={handleImageClick}
        >
            {images.length > 0 ? (
                <img 
                    src={images[currentImageIndex]} 
                    alt="Post" 
                    className="w-full h-full object-cover select-none transition-transform duration-300" 
                    draggable={false} 
                    loading="lazy" 
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
        </div>
        
        {/* Double Tap Heart */}
        {flyingEmoji?.type === '❤️' && (
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none`}>
                <Icons.Activity className="w-24 h-24 text-white fill-white drop-shadow-2xl animate-pop-in opacity-80" />
            </div>
        )}

        {/* Carousel Controls */}
        {images.length > 1 && (
            <>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                    {images.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`} 
                        />
                    ))}
                </div>
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full font-medium pointer-events-none">
                    {currentImageIndex + 1}/{images.length}
                </div>
            </>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 pb-1 relative z-10">
        
        {/* Reaction Popover (Facebook Style) */}
        {showReactions && (
          <div 
            className="absolute -top-14 left-0 z-50 pointer-events-auto animate-pop-in"
            onMouseLeave={() => setShowReactions(false)}
          >
              <div className="reaction-pill bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-100 dark:border-gray-700 px-3 py-2 flex items-center gap-2 h-14 backdrop-blur-xl bg-opacity-95">
                {REACTION_EMOJIS.map((emojiObj, index) => (
                <button 
                    key={emojiObj.type}
                    onClick={(e) => { e.stopPropagation(); handleReactionSelect(emojiObj.type); }}
                    className="reaction-item w-10 h-10 flex items-center justify-center text-4xl transition-all duration-200 cursor-pointer origin-bottom hover:scale-125 animate-reaction-appear opacity-0 fill-mode-forwards"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <span className={`emoji-icon ${emojiObj.animClass}`}>{emojiObj.type}</span>
                </button>
                ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4 rtl:space-x-reverse relative">
            
            {/* Like Button with Robust Long Press */}
            <div 
              className="relative select-none"
              onMouseDown={startPress}
              onMouseUp={endPress}
              onMouseLeave={endPress}
              onTouchStart={startPress}
              onTouchEnd={endPress}
              onTouchCancel={endPress}
              onContextMenu={(e) => e.preventDefault()} // Crucial: Prevents right-click menu on mobile
            >
              <button 
                onClick={handleClick}
                className={`transition-all active:scale-90 flex items-center gap-2 ${getReactionColor(currentEmoji)} hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 -ml-2 rounded-lg`}
              >
                {currentEmoji && currentEmoji !== '❤️' ? (
                   <span className="text-2xl leading-none animate-pop-in">{currentEmoji}</span>
                ) : (
                   <Icons.Activity className={`w-7 h-7 ${currentEmoji === '❤️' ? 'fill-red-500 text-red-500 animate-emoji-heart' : ''}`} />
                )}
              </button>
            </div>
            
            <button 
              onClick={() => onComment(post.id)}
              className="text-gray-900 dark:text-white transition-opacity active:opacity-50 hover:text-gray-600"
            >
              <Icons.Comment className="w-7 h-7" />
            </button>
            
            <button 
              onClick={() => onShare(post)}
              className="text-gray-900 dark:text-white transition-all active:scale-90 hover:text-blue-500"
            >
              <Icons.Share className="w-7 h-7" />
            </button>
          </div>

          <button 
             onClick={() => onSave(post.id)}
             className={`transition-transform active:scale-90 ${isSaved ? 'text-black dark:text-white' : 'text-gray-900 dark:text-white'}`}
          >
            <Icons.Save className={`w-7 h-7 ${isSaved ? 'fill-black dark:fill-white' : ''}`} />
          </button>
        </div>
        
        {/* Likes Count */}
        {(post.reactions?.length || post.likes?.length) > 0 && (
          <div className="font-bold text-sm mb-1 dark:text-gray-100 flex items-center gap-1 cursor-pointer hover:underline">
             <div className="flex -space-x-1 rtl:space-x-reverse">
                {/* Mini icons for who reacted */}
                {post.reactions?.slice(0, 3).map((r, i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px] border border-white dark:border-gray-900 z-10">
                        {r.type}
                    </div>
                )) || <div className="w-4 h-4 bg-red-500 rounded-full p-0.5"><Icons.Activity className="w-full h-full text-white fill-white"/></div>}
             </div>
             <span className="ml-1">
                {(post.reactions?.length || post.likes?.length || 0)} {t('likes')}
             </span>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">
          {new Date(post.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  );
};
