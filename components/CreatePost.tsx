
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Icons } from './Icons';
import { generateAiImage, generateCaption } from '../services/geminiService';
import { uploadImageToTelegram, base64ToBlob } from '../services/storageService';
import { Post } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { AppContext } from '../App';

interface CreatePostProps {
  onPost: (postData: Omit<Post, 'id' | 'likes' | 'comments' | 'timestamp' | 'reactions'>) => void;
  onCancel: () => void;
  initialImage?: string | null;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPost, onCancel, initialImage }) => {
  const { t } = useSettings();
  const { aiDraft } = useContext(AppContext); // Get Draft from Omda
  
  const [step, setStep] = useState<'media' | 'details'>('media');
  const [mode, setMode] = useState<'upload' | 'ai'>('upload');
  
  // Multi-image state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Initial Image (from AI Editor)
  useEffect(() => {
    if (initialImage) {
        const loadInitialImage = async () => {
            try {
                const blob = await base64ToBlob(initialImage);
                const file = new File([blob], "ai_edited.png", { type: "image/png" });
                setSelectedFiles([file]);
                setPreviewUrls([initialImage]);
                setIsAiGenerated(true); // Treat as AI generated
                setStep('details');
            } catch (e) {
                console.error("Failed to load initial image", e);
            }
        };
        loadInitialImage();
    }
  }, [initialImage]);

  // Handle AI Draft from Omda
  useEffect(() => {
      if (aiDraft) {
          if (aiDraft.caption) setCaption(aiDraft.caption);
          if (aiDraft.imagePrompt) {
              setAiPrompt(aiDraft.imagePrompt);
              setMode('ai');
              // Automatically trigger generation? Maybe too aggressive. Let's just switch mode.
          }
          if (step === 'media' && aiDraft.caption && !aiDraft.imagePrompt) {
              // If only text was provided, maybe user wants to upload an image for it
              // Or maybe we skip to details if we want a text-only post? (App requires image currently)
          }
      }
  }, [aiDraft]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Explicitly type the array from FileList to avoid 'unknown' type inference
      const newFiles: File[] = Array.from(e.target.files);
      const newPreviews = newFiles.map(f => URL.createObjectURL(f));
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviews]);
      setIsAiGenerated(false);
      setStep('details');
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previewUrls];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
    
    if (newFiles.length === 0) setStep('media');
  };

  const handleGenerateImage = async () => {
    if (!aiPrompt.trim()) return;
    setIsLoading(true);
    setStatusMessage(t('dreaming'));
    setError(null);
    try {
      const base64Image = await generateAiImage(aiPrompt);
      const blob = await base64ToBlob(base64Image);
      
      // AI Image is handled as a single file for now
      setPreviewUrls([base64Image]);
      setSelectedFiles([new File([blob], "ai_generated.png", { type: "image/png" })]);
      setIsAiGenerated(true);
      setStep('details');
    } catch (err) {
      setError(t('errorGen'));
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleGenerateCaption = async () => {
    if (previewUrls.length === 0) return;
    setIsLoading(true);
    setStatusMessage(t('analyzing'));
    try {
      const context = isAiGenerated ? (aiPrompt || "AI edited image") : "a collection of uploaded photos";
      const generatedCaption = await generateCaption(context);
      setCaption(generatedCaption);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleShare = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsLoading(true);
    setStatusMessage(t('uploading'));
    setError(null);
    setProgress(10);

    try {
      // Parallel Upload for Speed (Load Balancing)
      const uploadPromises = selectedFiles.map(file => uploadImageToTelegram(file));
      const remoteUrls = await Promise.all(uploadPromises);
      
      setProgress(100);

      // Fix: Removed 'reactions' and 'comments' as they are excluded from onPost's type definition
      onPost({
        userId: '', 
        images: remoteUrls, // Use the new images array
        imageUrl: remoteUrls[0], // Fallback
        caption,
        isAiGenerated
      });
    } catch (err) {
      console.error(err);
      setError(t('errorUpload'));
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  // --- Step 1: Select Media ---
  if (step === 'media') {
    return (
      <div className="bg-white dark:bg-black h-full flex flex-col animate-pop-in">
        <div className="border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center backdrop-blur-md bg-white/80 dark:bg-black/80 sticky top-0 z-10">
          <button id="close-create-btn" onClick={onCancel} className="text-gray-900 dark:text-white font-medium hover:opacity-70 transition-opacity">
              <Icons.Close className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg dark:text-white">{t('newPost')}</span>
          <div className="w-6"></div>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex p-2 gap-2 mx-4 mt-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
             <button 
               className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'upload' ? 'bg-white dark:bg-gray-800 shadow-sm text-black dark:text-white' : 'text-gray-400'}`}
               onClick={() => setMode('upload')}
             >
               {t('uploadPhoto')}
             </button>
             <button 
               id="ai-btn"
               className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'ai' ? 'bg-white dark:bg-gray-800 shadow-sm text-black dark:text-white' : 'text-gray-400'}`}
               onClick={() => setMode('ai')}
             >
               <Icons.Magic className="w-4 h-4" /> {t('aiGenerate')}
             </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6">
            {mode === 'upload' ? (
              <div 
                className="w-full max-w-sm h-80 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-900 transition-all group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icons.Image className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 dark:text-white">{t('dragPhoto')}</h3>
                <p className="text-gray-400 text-sm mb-6 text-center px-8">Supports multiple images (JPG, PNG)</p>
                <button 
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all"
                >
                  {t('selectDevice')}
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                />
              </div>
            ) : (
              <div className="w-full max-w-sm animate-pop-in">
                 <div className="bg-gradient-to-br from-purple-900/10 to-blue-900/10 dark:from-purple-900/40 dark:to-blue-900/40 p-1 rounded-2xl">
                     <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Icons.Magic className="w-4 h-4 text-purple-500" />
                            {t('describeImagination')}
                        </label>
                        <textarea 
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 text-sm h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none mb-4 dark:text-white"
                        placeholder="A futuristic city in the clouds..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        />
                        {error && <p className="text-red-500 text-xs mb-3 font-bold">{error}</p>}
                        <button 
                        onClick={handleGenerateImage}
                        disabled={isLoading || !aiPrompt.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                        >
                        {isLoading ? <Icons.Loading className="w-5 h-5 animate-spin" /> : <Icons.Magic className="w-5 h-5" />}
                        {t('generateImage')}
                        </button>
                    </div>
                 </div>
                 <p className="text-xs text-gray-400 text-center mt-4 opacity-70">
                   Powered by Gemini Flash 2.5 • High Quality
                 </p>
              </div>
            )}
            
            {isLoading && mode === 'ai' && (
              <div className="mt-8 flex flex-col items-center gap-3">
                  <Icons.Loading className="w-8 h-8 text-purple-500 animate-spin" />
                  <div className="text-sm font-medium text-gray-500 animate-pulse">{statusMessage}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Step 2: Details & Caption (Professional) ---
  return (
    <div className="bg-white dark:bg-black h-full flex flex-col animate-slide-up">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center backdrop-blur-md bg-white/90 dark:bg-black/90 sticky top-0 z-20">
        <button onClick={() => setStep('media')} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" disabled={isLoading}>
          <Icons.Back className="w-6 h-6 dark:text-white" />
        </button>
        <span className="font-bold text-base dark:text-white">{t('newPost')}</span>
        <button 
          onClick={handleShare} 
          disabled={isLoading}
          className={`text-blue-500 font-bold text-base px-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors ${isLoading ? 'opacity-50' : ''}`}
        >
          {isLoading ? (
             <span className="flex items-center gap-2"><Icons.Loading className="w-4 h-4 animate-spin"/> {progress}%</span>
          ) : t('share')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 px-4 py-3 text-sm text-center font-bold">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 p-4">
            {/* ... Rest of content unchanged ... */}
            <div className="w-full md:w-1/2">
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {previewUrls.map((url, idx) => (
                        <div key={idx} className={`relative group rounded-xl overflow-hidden shadow-sm aspect-square ${idx === 0 && previewUrls.length % 2 !== 0 ? 'col-span-2' : ''}`}>
                            <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                            <button 
                                onClick={() => removeImage(idx)}
                                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                                <Icons.Close className="w-4 h-4" />
                            </button>
                            {isAiGenerated && (
                                <div className="absolute bottom-2 left-2 bg-purple-600/80 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full flex items-center font-bold">
                                    <Icons.Magic className="w-3 h-3 mr-1" /> AI
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {!isAiGenerated && (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-all"
                        >
                            <Icons.Create className="w-8 h-8 mb-1" />
                            <span className="text-xs font-bold">Add</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="w-full md:w-1/2 space-y-6">
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                        <Icons.User className="w-full h-full p-2 text-gray-400" />
                    </div>
                    <div className="flex-1">
                         <textarea
                            className="w-full min-h-[120px] text-base outline-none resize-none bg-transparent dark:text-white placeholder-gray-400 font-normal leading-relaxed"
                            placeholder={t('writeCaption')}
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                        />
                         <div className="flex justify-end">
                            <button 
                                onClick={handleGenerateCaption}
                                disabled={isLoading}
                                className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:bg-purple-50 dark:hover:bg-purple-900/30 px-3 py-1.5 rounded-full transition-colors border border-purple-100 dark:border-purple-900"
                            >
                                {isLoading && statusMessage.includes("analyzing") ? <Icons.Loading className="w-3 h-3 animate-spin"/> : <Icons.Magic className="w-3 h-3" />}
                                {t('aiWriteCaption')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-[1px] bg-gray-100 dark:bg-gray-800" />

                <div className="space-y-1">
                    <button className="w-full flex justify-between items-center py-4 hover:bg-gray-50 dark:hover:bg-gray-900 px-2 -mx-2 rounded-lg transition-colors">
                        <span className="text-base text-gray-700 dark:text-gray-200">{t('addLocation')}</span>
                        <Icons.MapPin className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="w-full flex justify-between items-center py-4 hover:bg-gray-50 dark:hover:bg-gray-900 px-2 -mx-2 rounded-lg transition-colors border-t border-gray-100 dark:border-gray-800">
                         <span className="text-base text-gray-700 dark:text-gray-200">Advanced Settings</span>
                         <Icons.ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
