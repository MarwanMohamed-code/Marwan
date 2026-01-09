import React, { useState, useRef } from 'react';
import { Icons } from './Icons';
import { useSettings } from '../contexts/SettingsContext';
import { editAiImage } from '../services/geminiService';

interface AiImageEditorProps {
  onCancel: () => void;
  onPost: (image: string) => void;
  onSetProfile: (image: string) => void;
}

export const AiImageEditor: React.FC<AiImageEditorProps> = ({ onCancel, onPost, onSetProfile }) => {
  const { t } = useSettings();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!originalImage || !prompt.trim()) return;
    
    setLoading(true);
    try {
      const result = await editAiImage(originalImage, prompt);
      setGeneratedImage(result);
    } catch (error) {
      alert("حدث خطأ أثناء التعديل، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen flex flex-col animate-slide-up">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-4 shadow-sm border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <Icons.Close className="w-6 h-6 dark:text-white" />
        </button>
        <h1 className="text-lg font-bold font-branding dark:text-white flex items-center gap-2">
            <Icons.Magic className="w-5 h-5 text-purple-500" />
            استوديو الذكاء الاصطناعي
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        
        {/* Image Area */}
        <div className="flex flex-col gap-4">
            {!originalImage ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[4/3] border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all"
                >
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg mb-4">
                        <Icons.Camera className="w-8 h-8 text-purple-500" />
                    </div>
                    <p className="font-bold text-purple-700 dark:text-purple-300">اضغط لرفع صورتك</p>
                    <p className="text-xs text-purple-500 mt-1">JPG, PNG</p>
                </div>
            ) : (
                <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-black">
                    <img 
                        src={generatedImage || originalImage} 
                        alt="Preview" 
                        className="w-full h-auto object-contain max-h-[50vh]" 
                    />
                    {loading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                            <Icons.Loading className="w-10 h-10 animate-spin mb-3 text-purple-400" />
                            <p className="font-bold animate-pulse">جارٍ المعالجة الذكية...</p>
                        </div>
                    )}
                    {generatedImage && (
                        <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs px-2 py-1 rounded-md font-bold shadow-lg">
                            AI Edited ✨
                        </div>
                    )}
                    {/* Reset Button */}
                    {!loading && generatedImage && (
                        <button 
                            onClick={() => setGeneratedImage(null)}
                            className="absolute top-4 left-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/70"
                        >
                            <Icons.Back className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            {!generatedImage ? (
                <>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        ماذا تريد أن تفعل بالصورة؟
                    </label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="مثال: اجعل الخلفية في الفضاء، حولني إلى رسمة زيتية، أضف نظارة شمسية..."
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-4 text-sm h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none mb-4 dark:text-white"
                        dir="auto"
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !originalImage || !prompt.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                    >
                        <Icons.Magic className="w-5 h-5" />
                        تعديل سحري
                    </button>
                </>
            ) : (
                <div className="space-y-3">
                    <p className="text-center font-bold text-green-500 mb-2">تم التعديل بنجاح! ماذا تريد الآن؟</p>
                    
                    <button 
                        onClick={() => onPost(generatedImage)}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        <Icons.Create className="w-5 h-5" />
                        نشر كمنشور جديد
                    </button>

                    <button 
                        onClick={() => onSetProfile(generatedImage)}
                        className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
                    >
                        <Icons.Profile className="w-5 h-5" />
                        تعيين كصورة شخصية
                    </button>

                    <button 
                        onClick={() => setGeneratedImage(null)}
                        className="w-full text-gray-500 py-2 text-sm hover:underline"
                    >
                        تعديل الوصف وإعادة المحاولة
                    </button>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};