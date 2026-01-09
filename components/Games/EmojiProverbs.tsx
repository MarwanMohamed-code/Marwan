
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from '../Icons';
import { EMOJI_PROVERBS, EmojiProverb } from '../../services/emojiProverbsData';
import { useSettings } from '../../contexts/SettingsContext';

interface EmojiProverbsProps {
  onBack: () => void;
}

type GameState = 'menu' | 'map' | 'playing' | 'win_overlay';

export const EmojiProverbs: React.FC<EmojiProverbsProps> = ({ onBack }) => {
  const { showToast } = useSettings();
  
  // --- PERSISTENCE ---
  const [gameState, setGameState] = useState<GameState>('menu');
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [coins, setCoins] = useState(250);
  const [starsData, setStarsData] = useState<Record<number, number>>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // --- PLAY STATE ---
  const [userSegments, setUserSegments] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHintText, setShowHintText] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  
  // New: Specific wrong key tracking for visual feedback
  const [wrongKeyIndex, setWrongKeyIndex] = useState<number | null>(null);

  // Refs for Auto-Scroll
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const currentLevelRef = useRef<HTMLButtonElement>(null);

  const currentProverb = EMOJI_PROVERBS[currentLevelIdx] || EMOJI_PROVERBS[0];
  const totalSegments = currentProverb.segments.length;

  // --- KEYBOARD SETUP ---
  const keyboardPieces = useMemo(() => {
    const distractors = ["ده", "مش", "يا", "في", "على", "كان", "من", "عن", "ما", "ولا"];
    const pieces = [...currentProverb.segments, ...distractors.slice(0, 3)];
    // Add unique IDs to pieces to track them individually for animations
    return pieces.sort(() => Math.random() - 0.5).map((text, idx) => ({ id: idx, text }));
  }, [currentProverb]);

  useEffect(() => {
    const saved = localStorage.getItem('emoji_village_ultimate_v10_dialects');
    if (saved) {
      const data = JSON.parse(saved);
      setUnlockedLevel(data.unlockedLevel || 1);
      setCoins(data.coins ?? 250);
      setStarsData(data.stars || {});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('emoji_village_ultimate_v10_dialects', JSON.stringify({ unlockedLevel, coins, stars: starsData }));
  }, [unlockedLevel, coins, starsData]);

  // --- AUTO SCROLL LOGIC ---
  useEffect(() => {
    if (gameState === 'map' && currentLevelRef.current) {
        setTimeout(() => {
            currentLevelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
  }, [gameState]);

  const startLevel = (idx: number) => {
    setCurrentLevelIdx(idx);
    setGameState('playing');
    setUserSegments([]);
    setIsCorrect(null);
    setShowHintText(false);
    setIsShaking(false);
    setWrongKeyIndex(null);
  };

  // --- INTERACTION LOGIC ---

  const handlePieceClick = (pieceText: string, keyIndex: number) => {
    if (isCorrect || userSegments.length >= totalSegments || isShaking || wrongKeyIndex !== null) return;
    
    // --- STRICT MODE CHECK ---
    // Apply Strict Mode if: Level is 1-5 (Tutorial Phase) OR Difficulty is Hard
    const isStrictMode = currentLevelIdx < 5 || currentProverb.difficulty === 'hard';

    if (isStrictMode) {
        const expectedNextWord = currentProverb.segments[userSegments.length];
        
        // If the clicked word is NOT the correct next word
        if (pieceText !== expectedNextWord) {
            // Trigger Red X Animation on this specific key
            setWrongKeyIndex(keyIndex);
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Error buzz
            
            // Clear error after animation
            setTimeout(() => {
                setWrongKeyIndex(null);
            }, 600);
            return; // STOP execution, do not add the word
        }
    }
    // -------------------------

    // Standard Logic (Allows duplicates only if answer needs them)
    const usedCount = userSegments.filter(s => s === pieceText).length;
    const availCount = currentProverb.segments.filter(s => s === pieceText).length; // Only allow as many as needed in answer
    
    // If strict mode is off, we might allow placing wrong words, but let's stick to the count limit from the answer to prevent spamming
    // Actually, normally games allow picking whatever is on keyboard.
    // Let's rely on keyboardPieces count vs used count.
    const keyboardCount = keyboardPieces.filter(p => p.text === pieceText).length;
    // We already check if button is disabled in UI, so here we just push.

    const newSegments = [...userSegments, pieceText];
    setUserSegments(newSegments);
    if (navigator.vibrate) navigator.vibrate(15);
    
    if (newSegments.length === totalSegments) {
        checkFullAnswer(newSegments);
    }
  };

  const handleRemoveSegment = (index: number) => {
    if (isCorrect || isShaking) return;
    const newSegments = [...userSegments];
    newSegments.splice(index, 1);
    setUserSegments(newSegments);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const checkFullAnswer = (segments: string[]) => {
    const isActuallyCorrect = segments.join('') === currentProverb.segments.join('');
    
    if (isActuallyCorrect) {
      setIsCorrect(true);
      handleWin();
    } else {
      setIsCorrect(false);
      setIsShaking(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      
      setTimeout(() => {
          setUserSegments([]);
          setIsCorrect(null);
          setIsShaking(false);
      }, 1000);
    }
  };

  const handleWin = () => {
    const winStars = showHintText ? 1 : 3;
    setStarsData(prev => ({ ...prev, [currentLevelIdx]: Math.max(prev[currentLevelIdx] || 0, winStars) }));
    setCoins(prev => prev + 50); 
    if (currentLevelIdx + 1 === unlockedLevel) setUnlockedLevel(prev => prev + 1);
    setTimeout(() => setGameState('win_overlay'), 1500);
  };

  const buySmartHint = () => {
    if (coins < 60) { showToast("نقاطك لا تكفي!", "error"); return; }
    setShowHintText(true);
    setCoins(prev => prev - 60);
    showToast("تم تفعيل التلميح!", "info");
  };

  // --- VIEWS ---

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center p-8 text-center font-sans overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent"></div>
        <div className="z-10 animate-pop-in flex flex-col items-center">
           <div className="w-36 h-36 bg-white rounded-[2.5rem] shadow-[0_0_60px_rgba(255,255,255,0.1)] flex items-center justify-center text-7xl mb-8 border-b-[10px] border-orange-100 transform -rotate-3 hover:rotate-0 transition-transform duration-500">🥘</div>
           <h1 className="text-6xl font-black text-white mb-2 font-branding tracking-tighter">أمثال الرقة</h1>
           <p className="text-orange-500 font-black tracking-[0.4em] uppercase text-[10px] mb-12 opacity-80">Egyptian Logic Pro</p>
           
           <button 
             onClick={() => setGameState('map')}
             className="w-72 bg-gradient-to-b from-orange-500 to-orange-700 text-white py-5 rounded-[2.5rem] font-black text-3xl shadow-[0_12px_0_rgb(154,52,18)] active:shadow-none active:translate-y-1 transition-all"
           >
             ابدأ اللعب
           </button>
           
           <button onClick={onBack} className="mt-10 text-white/30 font-bold hover:text-white transition-colors text-xs tracking-widest uppercase">الرجوع للرئيسية</button>
        </div>
      </div>
    );
  }

  if (gameState === 'map') {
    return (
      <div className="min-h-screen bg-[#010103] flex flex-col font-sans overflow-hidden">
          {/* Mobile Safe Area Header */}
          <div className="pt-12 pb-4 px-6 flex justify-between items-center z-50 bg-black/95 backdrop-blur-xl border-b border-white/5 sticky top-0 shadow-2xl">
              <button onClick={() => setGameState('menu')} className="p-2.5 bg-white/5 rounded-2xl text-white active:scale-90 border border-white/5 hover:bg-white/10"><Icons.Back className="w-6 h-6" /></button>
              <div className="flex flex-col items-center">
                  <h2 className="text-white font-black text-lg">خريطة الحكماء</h2>
                  <div className="text-[9px] text-orange-500 font-black uppercase tracking-widest">Level Selection</div>
              </div>
              <div className="bg-orange-600/20 border border-orange-500/30 px-4 py-2 rounded-full flex items-center gap-2">
                  <span className="text-orange-400 font-black text-lg">{coins}</span>
                  <Icons.Sun className="w-5 h-5 text-orange-500 fill-current" />
              </div>
          </div>

          <div ref={mapContainerRef} className="flex-1 overflow-y-auto no-scrollbar py-20 relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
              <div className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-gradient-to-b from-transparent via-white/5 to-transparent -translate-x-1/2"></div>
              <div className="flex flex-col-reverse items-center gap-20 relative z-10 pb-20">
                  {EMOJI_PROVERBS.map((p, i) => {
                      const isUnlocked = (i + 1) <= unlockedLevel;
                      const isCurrent = (i + 1) === unlockedLevel;
                      const stars = starsData[i] || 0;
                      const offset = Math.sin(i * 1.5) * 85;

                      return (
                          <div key={p.id} className="relative group" style={{ transform: `translateX(${offset}px)` }}>
                              <button 
                                ref={isCurrent ? currentLevelRef : null}
                                disabled={!isUnlocked}
                                onClick={() => startLevel(i)}
                                className={`w-24 h-24 rounded-full flex items-center justify-center border-b-[8px] transition-all duration-500 relative z-10
                                    ${isUnlocked 
                                        ? 'bg-red-600 border-red-800 shadow-[0_15px_40px_rgba(220,38,38,0.4)] scale-100 active:scale-95 active:border-b-0' 
                                        : 'bg-gray-800 border-gray-900 opacity-30 grayscale'}`}
                              >
                                  <span className="text-3xl font-black text-white drop-shadow-md">{i + 1}</span>
                                  {isUnlocked && stars > 0 && (
                                      <div className="absolute -top-5 left-0 right-0 flex justify-center gap-1">
                                          {[1, 2, 3].map(s => <Icons.Star key={s} className={`w-5 h-5 ${s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-white/10'}`} />)}
                                      </div>
                                  )}
                                  {isCurrent && <div className="absolute -inset-6 border-4 border-yellow-400/30 rounded-full animate-ping pointer-events-none"></div>}
                                  {!isUnlocked && <Icons.Lock className="w-8 h-8 text-white/10" />}
                              </button>
                              
                              {isUnlocked && (
                                <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-4xl opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                                    {p.thematicIcon}
                                </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] flex flex-col font-sans relative overflow-hidden">
        
        {/* Subtle Background Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20rem] opacity-[0.03] pointer-events-none select-none z-0 dark:text-white transition-all duration-700">
            {currentProverb.thematicIcon}
        </div>

        {/* Compact HUD */}
        <div className="pt-12 pb-4 px-4 flex justify-between items-center z-50 bg-black/80 backdrop-blur-md border-b border-white/5 sticky top-0">
            <button onClick={() => setGameState('map')} className="p-2.5 bg-white/5 rounded-2xl text-white active:scale-90 transition-all hover:bg-white/10"><Icons.Back className="w-5 h-5" /></button>
            <div className="flex gap-2">
                <div className="bg-white/5 px-4 py-1.5 rounded-xl border border-white/10 flex flex-col items-center min-w-[55px]">
                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-wider">Level</span>
                    <span className="text-base font-black text-white">{currentLevelIdx + 1}</span>
                </div>
                <div className="bg-white/5 px-4 py-1.5 rounded-xl border border-white/10 flex flex-col items-center min-w-[55px]">
                    <span className="text-[8px] font-black text-yellow-500 uppercase tracking-wider">Gold</span>
                    <span className="text-base font-black text-white flex items-center gap-1.5">
                        {coins} <Icons.Sun className="w-3.5 h-3.5 fill-current text-yellow-500" />
                    </span>
                </div>
            </div>
            <button 
                onClick={buySmartHint}
                className="bg-gradient-to-tr from-yellow-400 to-orange-600 p-2.5 rounded-xl shadow-lg active:scale-90 transition-all border-b-4 border-yellow-800"
            >
                <Icons.Magic className="w-5 h-5 text-blue-900" />
            </button>
        </div>

        {/* Scrollable Game Area */}
        <div className="flex-1 flex flex-col items-center pt-4 p-4 gap-6 z-10 overflow-y-auto no-scrollbar pb-64">
            
            {/* Thematic Icon */}
            <div className="animate-bounce drop-shadow-2xl filter brightness-110">
                <span className="text-7xl md:text-8xl">{currentProverb.thematicIcon}</span>
            </div>

            {/* Emoji Stage */}
            <div className="w-full max-w-md bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-6 flex items-center justify-center border border-white/10 relative overflow-hidden min-h-[140px]">
                <div className="absolute inset-0 bg-white/5 mix-blend-overlay"></div>
                <span className="text-5xl md:text-7xl drop-shadow-2xl animate-pop-in whitespace-nowrap overflow-x-auto no-scrollbar py-2 select-none relative z-10">
                    {currentProverb.emojis}
                </span>
            </div>

            {/* Answer Slots */}
            <div 
                className={`w-full max-w-md flex flex-wrap justify-center gap-2 p-4 rounded-[2rem] border-2 border-dashed transition-all duration-300 min-h-[100px]
                    ${isShaking ? 'border-red-500 bg-red-500/10 animate-shake' : 'border-white/5 bg-transparent'}`}
            >
                {Array.from({ length: totalSegments }).map((_, i) => (
                    <div 
                        key={i} 
                        onClick={() => userSegments[i] && handleRemoveSegment(i)}
                        className={`min-w-[70px] h-14 px-3 rounded-2xl border-b-[5px] flex items-center justify-center text-lg font-black cursor-pointer transition-all duration-200
                            ${userSegments[i] 
                                ? (isCorrect === true ? 'bg-green-500 border-green-700 text-white animate-bounce' : isCorrect === false ? 'bg-red-600 border-red-900 text-white' : 'bg-white text-black border-orange-200 shadow-md') 
                                : 'bg-white/5 border-white/10 border-dashed hover:bg-white/10'}`}
                    >
                        {userSegments[i]}
                    </div>
                ))}
            </div>

            {showHintText && (
                <div className="bg-yellow-400/10 p-5 rounded-2xl border border-yellow-400/20 text-center animate-slide-up max-w-xs backdrop-blur-md">
                    <p className="text-yellow-400 text-sm font-black leading-relaxed italic">" {currentProverb.hint} "</p>
                </div>
            )}
        </div>

        {/* Keyboard Dock */}
        <div className="bg-[#020205]/95 backdrop-blur-xl rounded-t-[3rem] p-5 pb-10 shadow-[0_-20px_60px_rgba(0,0,0,0.7)] z-40 border-t border-white/10 fixed bottom-0 left-0 right-0">
            <div className="flex justify-center gap-4 mb-5 -mt-12">
                <button onClick={() => !isShaking && setUserSegments([])} className="bg-white dark:bg-gray-800 px-5 py-3 rounded-full shadow-xl border border-white/10 flex items-center gap-2 active:scale-95 transition-all text-xs font-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Icons.Trash className="w-4 h-4 text-red-500" /> مسح
                </button>
                <button onClick={() => { if(coins >= 30) { const expected = currentProverb.segments[userSegments.length]; if(expected) handlePieceClick(expected, -1); setCoins(c => c-30); } }} className="bg-white dark:bg-gray-800 px-5 py-3 rounded-full shadow-xl border border-white/10 flex items-center gap-2 active:scale-95 transition-all text-xs font-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Icons.Zap className="w-4 h-4 text-blue-500" /> كشف (30)
                </button>
            </div>

            <div className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto overflow-y-auto max-h-[200px] no-scrollbar pb-4">
                {keyboardPieces.map((p, i) => {
                    const usedInAnswer = userSegments.filter(s => s === p.text).length;
                    const totalInKeyboard = keyboardPieces.filter(k => k.text === p.text).length;
                    const isFullyUsed = usedInAnswer >= totalInKeyboard;
                    
                    // Specific logic for the "Wrong X" animation
                    const isError = wrongKeyIndex === i;

                    return (
                        <div 
                            key={p.id}
                            onClick={() => !isFullyUsed && handlePieceClick(p.text, i)}
                            className={`px-5 py-3 rounded-2xl border-b-[4px] font-black text-base cursor-pointer select-none transition-all duration-150 active:scale-90 relative
                                ${isFullyUsed 
                                    ? 'bg-transparent border-transparent text-transparent scale-0 pointer-events-none' 
                                    : 'bg-white/10 border-white/10 text-white hover:bg-white/20 shadow-md active:border-b-0 active:translate-y-[4px]'}
                                ${isError ? '!bg-red-600 !border-red-800 !text-white animate-shake' : ''}
                            `}
                        >
                            {p.text}
                            {isError && <div className="absolute inset-0 flex items-center justify-center bg-red-600 rounded-2xl"><Icons.Close className="w-6 h-6 text-white" /></div>}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Win Overlay */}
        {gameState === 'win_overlay' && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-pop-in">
                 <div className="w-48 h-48 bg-gradient-to-tr from-yellow-400 to-red-600 rounded-[3rem] flex items-center justify-center shadow-[0_0_100px_rgba(251,191,36,0.3)] mb-8 border-4 border-white/10 animate-bounce relative">
                    <div className="absolute -top-6 -right-6 text-6xl animate-pulse">✨</div>
                    <Icons.Trophy className="w-28 h-28 text-white drop-shadow-xl" />
                 </div>
                 <h2 className="text-5xl font-black text-white mb-6 tracking-tighter">يا واد يا لعيب!</h2>
                 <div className="flex gap-3 mb-10 scale-[1.3]">
                    {[1, 2, 3].map(s => <Icons.Star key={s} className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-pop-in shadow-lg" style={{ animationDelay: `${s*150}ms` }} />)}
                 </div>
                 <div className="bg-white/10 p-8 rounded-[2rem] border border-white/10 mb-12 max-w-sm">
                    <p className="text-white font-black text-2xl leading-relaxed italic">"{currentProverb.answer}"</p>
                 </div>
                 <button 
                    onClick={() => {
                        if (currentLevelIdx + 1 < EMOJI_PROVERBS.length) startLevel(currentLevelIdx + 1);
                        else setGameState('map');
                    }}
                    className="w-full max-w-xs bg-green-600 text-white py-5 rounded-[2rem] font-black text-2xl shadow-[0_10px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition-all"
                 >
                    الدور اللي بعده &rarr;
                 </button>
            </div>
        )}

        <style>{`
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px) rotate(-2deg); }
                75% { transform: translateX(5px) rotate(2deg); }
            }
            .animate-shake { animation: shake 0.4s ease-in-out infinite; }
        `}</style>
    </div>
  );
};
