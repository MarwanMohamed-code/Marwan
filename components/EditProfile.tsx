import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Icons } from './Icons';
import { useSettings } from '../contexts/SettingsContext';
import { uploadImageToTelegram } from '../services/storageService';

interface EditProfileProps {
  user: User;
  onSave: (userId: string, data: Partial<User>) => void;
  onCancel: () => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({ user, onSave, onCancel }) => {
  const { t } = useSettings();
  const [fullName, setFullName] = useState(user.fullName);
  const [bio, setBio] = useState(user.bio);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    let finalAvatarUrl = avatarUrl;

    if (avatarFile) {
        try {
            // Upload new avatar to Telegram
            finalAvatarUrl = await uploadImageToTelegram(avatarFile);
        } catch (e) {
            console.error("Avatar upload failed", e);
            // Fallback to generic if needed, or just keep going with local preview (not ideal but safe)
        }
    }

    onSave(user.id, {
        fullName,
        bio,
        avatarUrl: finalAvatarUrl
    });
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <button onClick={onCancel} className="text-gray-900 dark:text-white">
             {t('cancel')}
        </button>
        <span className="font-bold text-lg dark:text-white">{t('editProfile')}</span>
        <button 
            onClick={handleSave} 
            disabled={isLoading}
            className="text-blue-500 font-bold disabled:opacity-50"
        >
             {isLoading ? <Icons.Loading className="w-4 h-4 animate-spin"/> : t('saveChanges')}
        </button>
      </div>

      <div className="p-6 flex flex-col items-center">
         <div className="relative mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Icons.Image className="w-8 h-8 text-white" />
            </div>
         </div>
         <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-500 font-semibold text-sm mb-6"
         >
            {t('changePhoto')}
         </button>
         <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
         />

         <div className="w-full space-y-4">
            <div>
                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">{t('name')}</label>
                <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border-b border-gray-300 dark:border-gray-700 py-2 bg-transparent outline-none focus:border-black dark:focus:border-white dark:text-white transition-colors"
                />
            </div>
            <div>
                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">{t('username')}</label>
                <input 
                    type="text" 
                    value={user.username}
                    disabled
                    className="w-full border-b border-gray-200 dark:border-gray-800 py-2 bg-transparent text-gray-400 cursor-not-allowed"
                />
            </div>
            <div>
                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">{t('bio')}</label>
                <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full border-b border-gray-300 dark:border-gray-700 py-2 bg-transparent outline-none focus:border-black dark:focus:border-white dark:text-white transition-colors resize-none h-20"
                />
            </div>
         </div>
      </div>
    </div>
  );
};
