
import React, { useState } from 'react';
import { Icons } from '../Icons';
import { TicTacToe } from './TicTacToe';
import { AiDrawingGame } from './AiDrawingGame';
import { MemoryGame } from './MemoryGame';
import { MillionaireGame } from './MillionaireGame';
import { EmojiProverbs } from './EmojiProverbs';

interface GameHubProps {
  onBack: () => void;
}

export const GameHub: React.FC<GameHubProps> = ({ onBack }) => {
  const [selectedGame, setSelectedGame] = useState<'tic-tac-toe' | 'ai-drawing' | 'memory' | 'millionaire' | 'emoji-proverbs' | null>(null);

  // --- Render Active Game ---
  if (selectedGame === 'tic-tac-toe') return <TicTacToe onBack={() => setSelectedGame(null)} />;
  if (selectedGame === 'ai-drawing') return <AiDrawingGame onBack={() => setSelectedGame(null)} />;
  if (selectedGame === 'memory') return <MemoryGame onBack={() => setSelectedGame(null)} />;
  if (selectedGame === 'millionaire') return <MillionaireGame onBack={() => setSelectedGame(null)} />;
  if (selectedGame === 'emoji-proverbs') return <EmojiProverbs onBack={() => setSelectedGame(null)} />;

  // --- Masterpiece UI Components ---

  const GameCard = ({ 
    onClick, 
    title, 
    subtitle, 
    icon: Icon, 
    gradient, 
    glowColor, 
    bgPattern,
    size = 'normal',
    badge
  }: any) => (
    <button 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[2.5rem] transition-all duration-500 hover:scale-[1.02] active:scale-95 text-left
        ${size === 'large' ? 'col-span-2 h-72' : 'col-span-1 h-64'}
      `}
    >
      {/* 1. Animated Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 transition-opacity duration-500`}></div>
      
      {/* 2. Pattern Overlay */}
      <div className={`absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/${bgPattern}.png')] mix-blend-overlay`}></div>
      
      {/* 3. Glowing Orb Effect */}
      <div className={`absolute -top-20 -right-20 w-64 h-64 bg-white/20 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700 ease-out`}></div>

      {/* 4. Giant Background Icon (Watermark) */}
      <div className="absolute -bottom-10 -right-10 text-white/10 group-hover:text-white/20 transition-colors duration-500 transform group-hover:rotate-12 group-hover:scale-110">
        <Icon className="w-48 h-48" />
      </div>

      {/* 5. Glass Content Container */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
        
        {/* Top Section */}
        <div className="flex justify-between items-start">
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-lg group-hover:bg-white/30 transition-colors">
            <Icon className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          {badge && (
            <span className="bg-black/30 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest animate-pulse">
              {badge}
            </span>
          )}
        </div>

        {/* Bottom Section */}
        <div>
          <h3 className="text-2xl md:text-4xl font-black text-white mb-1 drop-shadow-lg tracking-tight font-branding leading-tight">
            {title}
          </h3>
          <p className="text-white/80 text-xs md:text-sm font-medium tracking-wide flex items-center gap-2">
            {subtitle} 
            <span className="w-0 group-hover:w-4 transition-all duration-300 overflow-hidden"><Icons.ChevronLeft className="w-4 h-4 rotate-180"/></span>
          </p>
        </div>
      </div>

      {/* 6. Border Glow on Hover */}
      <div className={`absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-[2.5rem] transition-colors duration-500`}></div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden font-sans selection:bg-purple-500 selection:text-white flex flex-col">
      
      {/* --- Cosmic Background Animation --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-orange-900/10 rounded-full blur-[100px] animate-pulse delay-2000"></div>
      </div>

      {/* --- Header --- */}
      <div className="relative z-20 px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <button 
          onClick={onBack} 
          className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white border border-white/5 transition-all active:scale-90"
        >
          <Icons.Back className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 font-branding tracking-wider">
            ساحة الألعاب
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Game Center Pro</p>
        </div>
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* --- Scrollable Grid --- */}
      <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          
          {/* 1. Hero: Millionaire */}
          <GameCard 
            size="large"
            title="من سيربح المليون؟"
            subtitle="اختبر معلوماتك العامة"
            icon={Icons.Trophy}
            gradient="from-yellow-600 via-orange-600 to-red-700"
            bgPattern="cubes"
            badge="الأكثر لعباً 🔥"
            onClick={() => setSelectedGame('millionaire')}
          />

          {/* 2. Emoji Proverbs */}
          <GameCard 
            title="أمثال بالأيموجي"
            subtitle="خمن المثل الشعبي"
            icon={Icons.MessageSquare}
            gradient="from-indigo-600 to-purple-800"
            bgPattern="hexellence"
            onClick={() => setSelectedGame('emoji-proverbs')}
          />

          {/* 3. Memory Game */}
          <GameCard 
            title="ذاكرة القرية"
            subtitle="أنقذ القلوب"
            icon={Icons.Grid}
            gradient="from-emerald-500 to-teal-800"
            bgPattern="carbon-fibre"
            onClick={() => setSelectedGame('memory')}
          />

          {/* 4. XO Online */}
          <GameCard 
            title="XO أونلاين"
            subtitle="تحدى أصحابك"
            icon={Icons.Game}
            gradient="from-blue-600 to-cyan-700"
            bgPattern="diagmonds-light"
            onClick={() => setSelectedGame('tic-tac-toe')}
          />

          {/* 5. AI Drawing */}
          <GameCard 
            title="الرسام السحري"
            subtitle="ارسم والذكاء يخمن"
            icon={Icons.Magic}
            gradient="from-pink-500 to-rose-600"
            bgPattern="stars"
            onClick={() => setSelectedGame('ai-drawing')}
          />

        </div>
        
        <div className="mt-12 text-center opacity-30">
            <Icons.Game className="w-12 h-12 mx-auto mb-2 text-white animate-spin-slow" />
            <p className="text-[10px] text-white font-black uppercase tracking-[0.5em]">Raqqa Gaming Engine v3.0</p>
        </div>
      </div>
    </div>
  );
};
