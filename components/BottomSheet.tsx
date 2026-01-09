import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setVisible(false), 300); // Wait for animation
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`bg-white dark:bg-gray-900 w-full max-w-md rounded-t-2xl p-4 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
        
        {title && (
          <div className="text-center font-bold mb-4 border-b border-gray-100 dark:border-gray-800 pb-2 dark:text-white">
            {title}
          </div>
        )}
        
        <div className="flex flex-col gap-1">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ActionItemProps {
  icon?: React.ElementType;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

export const ActionItem: React.FC<ActionItemProps> = ({ icon: Icon, label, onClick, destructive }) => (
  <button 
    onClick={onClick}
    className={`w-full text-start p-4 flex items-center gap-3 rounded-xl active:bg-gray-100 dark:active:bg-gray-800 transition-colors ${destructive ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}
  >
    {Icon && <Icon className="w-6 h-6" />}
    <span className="font-medium text-base">{label}</span>
  </button>
);
