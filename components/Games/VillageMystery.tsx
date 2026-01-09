
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { startVillageMystery } from '../../services/geminiService';

interface VillageMysteryProps {
  onBack: () => void;
}

export const VillageMystery: React.FC<VillageMysteryProps> = ({ onBack }) => {
  const [story, setStory] = useState<string>('');
  const [history, setHistory] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const nextStep = async (action?: string) => {
    setLoading(true);
    const result = await startVillageMystery(action, history);
    setStory(result);
    setHistory(prev => prev + "\n" + (action || 'البداية') + "\n" + result);
    setLoading(false);
  };

  useEffect(() => { nextStep(); }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col font-branding">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 bg-gray-800 rounded-full"><Icons.Back className="w-6 h-6"/></button>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">لغز الرقة الغربية</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 bg-gray-800/50 rounded-3xl p-6 border border-gray-700 shadow-2xl overflow-y-auto mb-6 relative">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Icons.Magic className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="animate-pulse">الراوي يكتب القصة...</p>
            </div>
        ) : (
            <div className="animate-pop-in leading-relaxed text-lg whitespace-pre-wrap text-right" dir="rtl">
                {story}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 mb-8">
        {[1, 2, 3].map(i => (
            <button 
                key={i}
                disabled={loading}
                onClick={() => nextStep(`الخيار ${i}`)}
                className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-2xl border border-gray-600 hover:border-orange-500 transition-all active:scale-95 text-right flex items-center justify-between gap-4"
                dir="rtl"
            >
                <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold">{i}</span>
                <span className="flex-1">اختيار الخيار {i} للمتابعة</span>
            </button>
        ))}
      </div>
      
      <p className="text-center text-gray-500 text-xs opacity-50">هذه القصة يتم تأليفها فورياً بواسطة الذكاء الاصطناعي</p>
    </div>
  );
};
