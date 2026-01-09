
import React, { useEffect } from 'react';
import { Icons } from './Icons';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      // Longer duration for errors to allow reading
      const duration = type === 'error' ? 8000 : 3000;
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, type]);

  if (!isVisible) return null;

  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: Icons.Check,
    error: Icons.Info,
    info: Icons.Info
  };

  const Icon = icons[type];

  return (
    <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-[150] w-[90%] max-w-sm pointer-events-none">
      <div className={`${bgColors[type]} text-white px-4 py-3 rounded-2xl shadow-xl shadow-black/20 flex items-center gap-3 animate-pop-in backdrop-blur-sm bg-opacity-95`}>
        <div className="p-1 bg-white/20 rounded-full">
            <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-wide">{message}</span>
      </div>
    </div>
  );
};
