
import React, { useState, useEffect, useRef } from 'react';
import { Post, User, Comment } from '../types';
import { Icons } from './Icons';
import { useSettings } from '../contexts/SettingsContext';
import { 
  createTelegraphAccount, 
  createCommentsPage, 
  fetchCommentsFromPage, 
  updateCommentsPage 
} from '../services/telegraphService';
import { updatePostInDb } from '../services/firebase';

interface CommentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  currentUser: User | null;
  onComment: (postId: string, text: string) => Promise<void>; // Kept for optimistic/local updates
  users: User[];
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({ 
  isOpen, 
  onClose, 
  post, 
  currentUser, 
  onComment,
  users
}) => {
  const { t, showToast } = useSettings();
  const [text, setText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Telegraph State
  const [remoteComments, setRemoteComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 300);
      
      // Load comments from Telegraph if path exists
      if (post && post.telegraphPath) {
          loadTelegraphComments(post.telegraphPath);
      } else if (post) {
          // Fallback to local comments if no telegraph page yet
          setRemoteComments(post.comments || []);
      }
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen, post?.id]); // Reload if post ID changes

  const loadTelegraphComments = async (path: string) => {
      setIsLoadingComments(true);
      const comments = await fetchCommentsFromPage(path);
      // Merge with any local comments that might not be synced yet? 
      // For now, assume Telegraph is source of truth.
      // Reverse to show newest first if desired, or keep chronological.
      // Let's keep chronological (oldest top) like typical FB.
      setRemoteComments(comments);
      setIsLoadingComments(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !post || !currentUser) return;
    
    setIsSubmitting(true);

    const newComment: Comment = {
        id: `c_${Date.now()}`,
        userId: currentUser.id,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl, // Store snapshot
        text: text,
        timestamp: Date.now()
    };

    // 1. Optimistic Update (UI)
    const updatedComments = [...remoteComments, newComment];
    setRemoteComments(updatedComments);
    setText('');

    try {
        // 2. Telegraph Logic
        if (post.telegraphPath && post.telegraphToken) {
            // Existing Page: Fetch fresh (to avoid race overwrite) -> Append -> Save
            // Note: For simplicity in this demo, we just append to our local state copy. 
            // In high volume, we should fetch-then-append.
            // Let's do a quick re-fetch to be safer.
            const freshComments = await fetchCommentsFromPage(post.telegraphPath);
            const mergedComments = [...freshComments, newComment];
            
            await updateCommentsPage(
                post.telegraphToken, 
                post.telegraphPath, 
                `Comments: ${post.caption ? post.caption.slice(0, 20) : 'Post'}...`,
                mergedComments
            );
            // Update local state with the authoritative list
            setRemoteComments(mergedComments);

        } else {
            // First time using Telegraph for this post
            // Create Account -> Create Page -> Save to DB
            const token = await createTelegraphAccount(`p_${post.id}`);
            if (token) {
                // Include existing local comments if any
                const initialComments = [...(post.comments || []), newComment];
                const path = await createCommentsPage(token, `Comments: ${post.id}`, initialComments);
                
                if (path) {
                    // Save the connection info to Firebase
                    await updatePostInDb(post.id, {
                        telegraphPath: path,
                        telegraphToken: token,
                        comments: [] // Optional: Clear array in Firestore to save space
                    });
                    
                    // Update current post object in parent (via optimistic means usually, but here we just rely on local state)
                    // We don't have a callback to update 'post' prop deeply, so we rely on setRemoteComments.
                }
            }
        }
        
        // Also trigger the standard onComment for side-effects (like notifications or stats counters)
        // But passing empty text or handling it so it doesn't duplicate in Firestore array if we cleared it.
        // We'll call it to update the comment COUNT in the main DB potentially.
        await onComment(post.id, "Telegraph Sync"); 

    } catch (err) {
        console.error("Failed to save comment to Telegraph", err);
        showToast("فشل الحفظ في السحابة، حاول مجدداً", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  const getAuthor = (comment: Comment) => {
    // If comment has snapshot data, use it (faster), else fallback to user lookup
    if (comment.avatarUrl) {
        return { username: comment.username, avatarUrl: comment.avatarUrl };
    }
    return users.find(u => u.id === comment.userId) || { 
        username: comment.username || 'Unknown', 
        avatarUrl: 'https://ui-avatars.com/api/?name=?', 
    };
  };

  if (!isVisible && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`bg-white dark:bg-gray-900 w-full md:max-w-md md:rounded-2xl rounded-t-3xl h-[75vh] md:h-[80vh] flex flex-col transform transition-transform duration-300 ease-out shadow-2xl ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Handle for dragging */}
        <div className="w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={onClose}>
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3 px-4 flex justify-between items-center">
            <span className="font-bold text-sm dark:text-white">{t('comments')}</span>
            {post?.telegraphPath && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Icons.Cloud className="w-3 h-3" /> Cloud Storage
                </span>
            )}
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 relative">
            {isLoadingComments ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Icons.Loading className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                    <span className="text-xs text-gray-400">جاري جلب التعليقات من السحابة...</span>
                </div>
            ) : post && (
                <>
                    {/* Caption as first item */}
                    {post.caption && (
                        <div className="flex gap-3 mb-6">
                            <img 
                                src={users.find(u => u.id === post.userId)?.avatarUrl || 'https://ui-avatars.com/api/?name=?'} 
                                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex-shrink-0 object-cover" 
                                alt=""
                            />
                            <div className="text-sm dark:text-gray-200">
                                <div className="leading-snug">
                                    <span className="font-bold mr-2 dark:text-white">{users.find(u => u.id === post.userId)?.username}</span>
                                    {post.caption}
                                </div>
                                <div className="text-xs text-gray-400 mt-1 flex gap-3">
                                    <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Separator */}
                    {post.caption && <div className="h-[1px] bg-gray-100 dark:bg-gray-800 mb-4" />}

                    {/* Actual Comments */}
                    {remoteComments.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-10">
                            <div className="text-4xl mb-2">💬</div>
                            كن أول من يعلق!
                        </div>
                    ) : (
                        remoteComments.map((comment, index) => {
                            const author = getAuthor(comment);
                            return (
                                <div key={comment.id || index} className="flex gap-3 animate-pop-in">
                                    <img 
                                        src={author.avatarUrl}
                                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex-shrink-0 object-cover"
                                        alt=""
                                    />
                                    <div className="flex-1 text-sm dark:text-gray-200">
                                        <div className="leading-snug">
                                            <span className="font-bold mr-2 dark:text-white">{author.username}</span>
                                            {comment.text}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1 flex gap-3">
                                            <span>{new Date(comment.timestamp || Date.now()).toLocaleDateString()}</span>
                                            <span className="font-semibold cursor-pointer">Reply</span>
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                       <Icons.Activity className="w-3 h-3 text-gray-400 hover:text-red-500 cursor-pointer" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </>
            )}
        </div>

        {/* Input Area (Fixed at bottom) */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-900 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <img 
                    src={currentUser?.avatarUrl} 
                    className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 object-cover" 
                    alt="Me"
                />
                <div className="flex-1 relative">
                    <input 
                        ref={inputRef}
                        type="text" 
                        className="w-full bg-gray-100 dark:bg-gray-800 text-sm rounded-full py-2.5 pl-4 pr-10 outline-none focus:ring-1 focus:ring-blue-500 dark:text-white transition-all placeholder-gray-500"
                        placeholder={t('addComment')}
                        value={text}
                        onChange={e => setText(e.target.value)}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={!text.trim() || isSubmitting}
                    className="text-blue-500 font-semibold text-sm disabled:opacity-50 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full transition-colors"
                >
                    {isSubmitting ? <Icons.Loading className="w-5 h-5 animate-spin" /> : t('post')}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};
