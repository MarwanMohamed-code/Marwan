import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Icons } from './Icons';

interface StoryViewerProps {
  user: User;
  onClose: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ user, onClose }) => {
  const [progress, setProgress] = useState(0);

  // Auto-close after 5 seconds simulating story duration
  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          onClose();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] bg-black flex flex-col">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 p-2 z-20 flex gap-1">
        <div className="h-1 bg-gray-600 flex-1 rounded-full overflow-hidden">
          <div className="h-full bg-white transition-all duration-75 ease-linear" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 p-4 z-20 flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
           <img src={user.avatarUrl} className="w-8 h-8 rounded-full border border-white" alt="" />
           <span className="text-white font-bold text-sm shadow-sm">{user.username}</span>
           <span className="text-gray-300 text-xs">12h</span>
        </div>
        <button onClick={onClose}>
           <Icons.Close className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Story Content (Mock Image based on user) */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-900">
         <img 
            src={`https://picsum.photos/seed/${user.username}story/600/1000`} 
            className="w-full h-full object-cover opacity-90" 
            alt="Story" 
         />
         <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* Footer Reply */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-20 flex items-center gap-3">
         <input 
           type="text" 
           placeholder="Send message" 
           className="flex-1 bg-transparent border border-white/50 rounded-full px-4 py-2 text-white placeholder-white/70 outline-none focus:border-white"
         />
         <Icons.Activity className="w-6 h-6 text-white" />
         <Icons.Share className="w-6 h-6 text-white" />
      </div>
    </div>
  );
};