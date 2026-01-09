
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';

// --- Types ---
interface MemoryGameProps {
  onBack: () => void;
}

interface Card {
  id: number;
  iconName: keyof typeof Icons;
  isFlipped: boolean;
  isMatched: boolean;
  color: string;
}

interface UserProgress {
  level: number;
  stars: Record<number, number>; // Level -> Stars count
  coins: number;
  lives: number;
  maxLives: number;
  lastLifeRegen: number; // Timestamp
  powerups: {
    peek: number; // Reveal all
    freeze: number; // Stop timer
  };
}

// --- Constants ---
const MAX_LIVES = 5;
const LIFE_REGEN_MS = 15 * 60 * 1000; // 15 Minutes
const LEVELS_COUNT = 100;

// Icons Pool
const ICON_POOL: (keyof typeof Icons)[] = [
  'Game', 'Magic', 'Zap', 'Ghost', 'Crown', 'Diamond', 'Rocket', 'Star',
  'Heart', 'Sun', 'Moon', 'Cloud', 'Music', 'Camera', 'Video', 'Mic',
  'Anchor', 'Coffee', 'Pizza', 'Burger', 'Apple', 'Leaf', 'Flower', 'Fire',
  'Droplet', 'Key', 'Lock', 'Bell', 'Gift', 'Trophy', 'Medal', 'Flag',
  'Map', 'Compass', 'Globe', 'Truck', 'Car', 'Bike', 'Plane', 'Ship'
];

const COLORS = [
  'from-red-400 to-red-600', 'from-orange-400 to-orange-600', 
  'from-amber-400 to-amber-600', 'from-yellow-400 to-yellow-600', 
  'from-lime-400 to-lime-600', 'from-green-400 to-green-600', 
  'from-emerald-400 to-emerald-600', 'from-teal-400 to-teal-600', 
  'from-cyan-400 to-cyan-600', 'from-sky-400 to-sky-600', 
  'from-blue-400 to-blue-600', 'from-indigo-400 to-indigo-600', 
  'from-violet-400 to-violet-600', 'from-purple-400 to-purple-600', 
  'from-fuchsia-400 to-fuchsia-600', 'from-pink-400 to-pink-600', 
  'from-rose-400 to-rose-600'
];

export const MemoryGame: React.FC<MemoryGameProps> = ({ onBack }) => {
  // --- State ---
  const [view, setView] = useState<'menu' | 'map' | 'game' | 'shop'>('menu');
  const [userData, setUserData] = useState<UserProgress>({
    level: 1,
    stars: {},
    coins: 100, // Starting bonus
    lives: 5,
    maxLives: 5,
    lastLifeRegen: Date.now(),
    powerups: { peek: 1, freeze: 1 }
  });

  // Game Logic State
  const [currentLevel, setCurrentLevel] = useState(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const [gameOverState, setGameOverState] = useState<'win' | 'lose' | null>(null);
  
  // Refs
  const [choiceOne, setChoiceOne] = useState<Card | null>(null);
  const [choiceTwo, setChoiceTwo] = useState<Card | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Persistence & Life Regen ---
  useEffect(() => {
    const saved = localStorage.getItem('village_memory_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Calculate offline regen
      const now = Date.now();
      const timePassed = now - parsed.lastLifeRegen;
      const livesToGive = Math.floor(timePassed / LIFE_REGEN_MS);
      
      if (livesToGive > 0 && parsed.lives < MAX_LIVES) {
          parsed.lives = Math.min(MAX_LIVES, parsed.lives + livesToGive);
          parsed.lastLifeRegen = now;
      }
      setUserData(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('village_memory_v2', JSON.stringify(userData));
  }, [userData]);

  // Life Regen Timer Interval
  useEffect(() => {
      const interval = setInterval(() => {
          if (userData.lives < MAX_LIVES) {
              const now = Date.now();
              if (now - userData.lastLifeRegen >= LIFE_REGEN_MS) {
                  setUserData(prev => ({
                      ...prev,
                      lives: Math.min(MAX_LIVES, prev.lives + 1),
                      lastLifeRegen: now
                  }));
              }
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [userData.lives, userData.lastLifeRegen]);

  // --- Helpers ---
  const getLevelConfig = (lvl: number) => {
      // Difficulty Curve
      const gridSize = lvl <= 3 ? [3, 4] : lvl <= 10 ? [4, 4] : lvl <= 25 ? [4, 5] : lvl <= 50 ? [4, 6] : [5, 6];
      const pairs = (gridSize[0] * gridSize[1]) / 2;
      const baseTime = pairs * 4; // 4 seconds per pair
      const penalty = Math.min(0.5 * lvl, 20); // Reduces time as levels go up
      return { rows: gridSize[0], cols: gridSize[1], time: Math.max(15, baseTime - penalty), pairs };
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getNextLifeTime = () => {
      if (userData.lives >= MAX_LIVES) return null;
      const nextTime = userData.lastLifeRegen + LIFE_REGEN_MS - Date.now();
      return nextTime > 0 ? formatTime(Math.ceil(nextTime / 1000)) : "0:00";
  };

  // --- Core Game Functions ---

  const initGame = (lvl: number) => {
      if (userData.lives <= 0) {
          setView('shop'); // Force shop if no lives
          return;
      }

      const config = getLevelConfig(lvl);
      const levelIcons = [...ICON_POOL].sort(() => Math.random() - 0.5).slice(0, config.pairs);
      
      const deck: Card[] = [];
      levelIcons.forEach((icon, i) => {
          const color = COLORS[i % COLORS.length];
          deck.push({ id: i * 2, iconName: icon, isFlipped: true, isMatched: false, color });
          deck.push({ id: i * 2 + 1, iconName: icon, isFlipped: true, isMatched: false, color });
      });

      setCards(deck.sort(() => Math.random() - 0.5));
      setCurrentLevel(lvl);
      setTimeLeft(config.time);
      setMaxTime(config.time);
      setIsPlaying(false);
      setGameOverState(null);
      setChoiceOne(null);
      setChoiceTwo(null);
      setIsFrozen(false);
      setView('game');

      // Preview Phase
      setTimeout(() => {
          setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
          setIsPlaying(true);
          startTimer();
      }, Math.max(1500, 3000 - (lvl * 20))); // Preview time decreases
  };

  const startTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
          setIsFrozen(frozen => {
              if (frozen) return true; // Don't decrease time if frozen
              setTimeLeft(prev => {
                  if (prev <= 1) {
                      handleLose();
                      return 0;
                  }
                  return prev - 1;
              });
              return false;
          });
      }, 1000);
  };

  const handleCardClick = (card: Card) => {
      if (!isPlaying || isProcessing || card.isFlipped || card.isMatched) return;

      setCards(prev => prev.map(c => c.id === card.id ? { ...c, isFlipped: true } : c));

      if (!choiceOne) {
          setChoiceOne(card);
      } else {
          setChoiceTwo(card);
          setIsProcessing(true);
      }
  };

  useEffect(() => {
      if (choiceOne && choiceTwo) {
          if (choiceOne.iconName === choiceTwo.iconName) {
              setCards(prev => prev.map(c => (c.id === choiceOne.id || c.id === choiceTwo.id) ? { ...c, isMatched: true } : c));
              resetTurn();
          } else {
              setTimeout(() => {
                  setCards(prev => prev.map(c => (c.id === choiceOne.id || c.id === choiceTwo.id) ? { ...c, isFlipped: false } : c));
                  resetTurn();
              }, 800);
          }
      }
  }, [choiceOne, choiceTwo]);

  const resetTurn = () => {
      setChoiceOne(null);
      setChoiceTwo(null);
      setIsProcessing(false);
  };

  // Win/Lose Logic
  useEffect(() => {
      if (isPlaying && cards.length > 0 && cards.every(c => c.isMatched)) {
          handleWin();
      }
  }, [cards, isPlaying]);

  const handleWin = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
      
      const starRating = timeLeft / maxTime > 0.6 ? 3 : timeLeft / maxTime > 0.3 ? 2 : 1;
      const coinsEarned = 10 * starRating + (currentLevel * 2);

      setUserData(prev => ({
          ...prev,
          stars: { ...prev.stars, [currentLevel]: Math.max(prev.stars[currentLevel] || 0, starRating) },
          coins: prev.coins + coinsEarned,
          level: Math.max(prev.level, currentLevel + 1)
      }));
      setGameOverState('win');
  };

  const handleLose = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
      
      setUserData(prev => ({
          ...prev,
          lives: Math.max(0, prev.lives - 1),
          lastLifeRegen: prev.lives === MAX_LIVES ? Date.now() : prev.lastLifeRegen
      }));
      setGameOverState('lose');
  };

  // --- Power Ups ---
  const usePowerUp = (type: 'peek' | 'freeze') => {
      if (userData.powerups[type] > 0) {
          setUserData(prev => ({
              ...prev,
              powerups: { ...prev.powerups, [type]: prev.powerups[type] - 1 }
          }));

          if (type === 'peek') {
              // Reveal unmatched cards temporarily
              setCards(prev => prev.map(c => !c.isMatched ? { ...c, isFlipped: true } : c));
              setIsProcessing(true);
              setTimeout(() => {
                  setCards(prev => prev.map(c => !c.isMatched ? { ...c, isFlipped: false } : c));
                  setIsProcessing(false);
              }, 2000);
          } else if (type === 'freeze') {
              setIsFrozen(true);
              setTimeout(() => setIsFrozen(false), 10000);
          }
      } else {
          // Open quick shop modal? For now just shake or alert
      }
  };

  const buyItem = (item: 'life' | 'peek' | 'freeze', cost: number) => {
      if (userData.coins >= cost) {
          setUserData(prev => ({
              ...prev,
              coins: prev.coins - cost,
              lives: item === 'life' ? Math.min(MAX_LIVES, prev.lives + 5) : prev.lives, // Refill full
              powerups: {
                  ...prev.powerups,
                  peek: item === 'peek' ? prev.powerups.peek + 1 : prev.powerups.peek,
                  freeze: item === 'freeze' ? prev.powerups.freeze + 1 : prev.powerups.freeze
              }
          }));
      }
  };

  // --- Components ---

  const HeaderBar = () => (
      <div className="flex items-center justify-between bg-gray-900/80 backdrop-blur-md p-3 rounded-b-3xl border-b border-white/10 sticky top-0 z-50 shadow-lg">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-red-500/30">
              <Icons.Activity className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
              <span className="font-bold text-white font-mono text-lg">{userData.lives}</span>
              {userData.lives < MAX_LIVES && <span className="text-[10px] text-gray-400 w-8">{getNextLifeTime()}</span>}
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-yellow-500/30 cursor-pointer hover:bg-black/60 transition-colors" onClick={() => setView('shop')}>
              <Icons.Sun className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-white font-mono text-lg">{userData.coins}</span>
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-black text-xs font-bold">+</div>
          </div>
      </div>
  );

  // --- Views ---

  if (view === 'menu') {
      return (
          <div className="min-h-screen bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-purple-900 to-black flex flex-col items-center justify-center relative overflow-hidden">
               {/* Background Elements */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 animate-pulse"></div>
               
               <div className="z-10 text-center animate-pop-in">
                    <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-3xl rotate-12 shadow-[0_0_50px_rgba(250,204,21,0.4)] flex items-center justify-center border-4 border-white/20">
                        <Icons.Grid className="w-16 h-16 text-white" />
                    </div>
                    <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg font-branding">ذاكرة القرية</h1>
                    <p className="text-purple-300 font-medium mb-12 tracking-widest text-sm">PRO EDITION</p>

                    <button 
                        onClick={() => setView('map')}
                        className="w-64 bg-gradient-to-b from-green-400 to-green-600 text-white py-4 rounded-2xl font-black text-2xl shadow-[0_8px_0_rgb(21,128,61)] active:shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                    >
                        <span className="relative z-10">ابدأ اللعب</span>
                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                    </button>

                    <div className="flex gap-4 mt-8 justify-center">
                        <button onClick={() => setView('shop')} className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-[0_6px_0_rgb(29,78,216)] active:translate-y-1 transition-all text-white">
                            <Icons.ShoppingBag className="w-8 h-8" />
                        </button>
                        <button onClick={onBack} className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center shadow-[0_6px_0_rgb(55,65,81)] active:translate-y-1 transition-all text-white">
                            <Icons.Logout className="w-8 h-8" />
                        </button>
                    </div>
               </div>
          </div>
      );
  }

  if (view === 'map') {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col">
              <HeaderBar />
              <div className="flex-1 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative">
                  <div className="flex flex-col-reverse items-center py-20 gap-8 min-h-full">
                      {Array.from({ length: LEVELS_COUNT }, (_, i) => i + 1).map((lvl) => {
                          const unlocked = lvl <= userData.level;
                          const stars = userData.stars[lvl] || 0;
                          const isCurrent = lvl === userData.level;
                          
                          // Snake Path Logic
                          const offset = Math.sin(lvl) * 80; 

                          return (
                              <div key={lvl} className="relative group" style={{ transform: `translateX(${offset}px)` }}>
                                  {lvl < LEVELS_COUNT && <div className="absolute bottom-full left-1/2 w-1 h-8 bg-gray-700 -z-10" />}
                                  
                                  <button
                                      disabled={!unlocked}
                                      onClick={() => initGame(lvl)}
                                      className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-300 relative
                                        ${unlocked 
                                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-100 hover:scale-110' 
                                            : 'bg-gray-800 border-gray-700 grayscale opacity-60'}
                                        ${isCurrent ? 'ring-4 ring-yellow-400 ring-offset-4 ring-offset-gray-900 animate-pulse' : ''}
                                      `}
                                  >
                                      {unlocked ? (
                                          <span className="text-2xl font-black text-white drop-shadow-md">{lvl}</span>
                                      ) : (
                                          <Icons.Lock className="w-8 h-8 text-gray-500" />
                                      )}
                                      
                                      {/* Stars Decoration */}
                                      {stars > 0 && (
                                          <div className="absolute -top-3 w-full flex justify-center">
                                              {Array(3).fill(0).map((_, i) => (
                                                  <Icons.Sun key={i} className={`w-4 h-4 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                              ))}
                                          </div>
                                      )}
                                  </button>
                              </div>
                          );
                      })}
                  </div>
              </div>
              
              <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-center">
                  <button onClick={() => setView('menu')} className="text-gray-400 hover:text-white flex items-center gap-2 font-bold">
                      <Icons.Back className="w-5 h-5" /> القائمة الرئيسية
                  </button>
              </div>
          </div>
      );
  }

  if (view === 'shop') {
      return (
          <div className="min-h-screen bg-gray-900 text-white animate-slide-up">
               <div className="p-4 flex items-center justify-between border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                   <button onClick={() => setView(isPlaying ? 'game' : 'map')} className="p-2 bg-gray-800 rounded-full">
                       <Icons.Close className="w-6 h-6" />
                   </button>
                   <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full border border-yellow-500/30">
                       <Icons.Sun className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                       <span className="font-bold text-xl">{userData.coins}</span>
                   </div>
               </div>

               <div className="p-6 max-w-md mx-auto space-y-8">
                   <div className="text-center">
                       <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">متجر القرية</h1>
                       <p className="text-gray-400">استخدم ذهبك بحكمة!</p>
                   </div>

                   {/* Lives Section */}
                   <div className="bg-gray-800/50 p-4 rounded-3xl border border-gray-700">
                       <h3 className="font-bold mb-4 flex items-center gap-2 text-red-400"><Icons.Activity className="w-5 h-5" /> شحن الطاقة</h3>
                       <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                                    <Icons.Activity className="w-8 h-8 fill-current" />
                                </div>
                                <div>
                                    <div className="font-bold">شحن كامل</div>
                                    <div className="text-xs text-gray-500">5 قلوب فوراً</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => buyItem('life', 100)}
                                disabled={userData.coins < 100 || userData.lives === MAX_LIVES}
                                className="bg-yellow-500 text-black px-6 py-2 rounded-xl font-bold flex items-center gap-1 disabled:opacity-50 disabled:grayscale"
                            >
                                100 <Icons.Sun className="w-4 h-4 fill-black" />
                            </button>
                       </div>
                   </div>

                   {/* Powerups Section */}
                   <div className="space-y-4">
                       <h3 className="font-bold flex items-center gap-2 text-blue-400 px-2"><Icons.Zap className="w-5 h-5" /> مساعدات اللعب</h3>
                       
                       <div className="bg-gray-800 p-4 rounded-3xl border border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                                    <Icons.Eye className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-bold">نظرة خارقة</div>
                                    <div className="text-xs text-gray-500">اكشف الكروت لثانيتين</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => buyItem('peek', 50)}
                                disabled={userData.coins < 50}
                                className="bg-yellow-500 text-black px-6 py-2 rounded-xl font-bold flex items-center gap-1 disabled:opacity-50"
                            >
                                50 <Icons.Sun className="w-4 h-4 fill-black" />
                            </button>
                       </div>

                       <div className="bg-gray-800 p-4 rounded-3xl border border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                                    <Icons.Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-bold">تجميد الوقت</div>
                                    <div className="text-xs text-gray-500">أوقف العداد 10 ثواني</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => buyItem('freeze', 30)}
                                disabled={userData.coins < 30}
                                className="bg-yellow-500 text-black px-6 py-2 rounded-xl font-bold flex items-center gap-1 disabled:opacity-50"
                            >
                                30 <Icons.Sun className="w-4 h-4 fill-black" />
                            </button>
                       </div>
                   </div>
               </div>
          </div>
      );
  }

  // GAME VIEW
  const config = getLevelConfig(currentLevel);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">
        {/* Top HUD */}
        <div className="bg-gray-800/90 backdrop-blur p-2 px-4 flex items-center justify-between z-10 border-b border-gray-700">
             <button onClick={() => setView('map')} className="p-2 bg-gray-700 rounded-full text-white">
                 <Icons.Close className="w-5 h-5" />
             </button>
             <div className="flex flex-col items-center">
                 <span className="text-xs text-gray-400 font-bold tracking-widest uppercase">المستوى</span>
                 <span className="text-xl font-black text-white">{currentLevel}</span>
             </div>
             <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-gray-600">
                 <Icons.Clock className={`w-4 h-4 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
                 <span className={`font-mono font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</span>
             </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-gray-800">
             <div 
                className={`h-full transition-all duration-1000 ease-linear ${isFrozen ? 'bg-blue-400 animate-pulse' : (timeLeft < 10 ? 'bg-red-500' : 'bg-green-500')}`}
                style={{ width: `${(timeLeft / maxTime) * 100}%` }}
             />
        </div>

        {/* Board */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
            <div 
                className="grid gap-3 w-full max-w-md mx-auto"
                style={{ 
                    gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                    aspectRatio: `${config.cols}/${config.rows}` 
                }}
            >
                {cards.map(card => {
                    const Icon = Icons[card.iconName];
                    return (
                        <div 
                            key={card.id}
                            onClick={() => handleCardClick(card)}
                            className="relative cursor-pointer group perspective-1000"
                        >
                            <div 
                                className={`w-full h-full relative preserve-3d transition-transform duration-500 rounded-xl shadow-lg ${card.isFlipped ? 'rotate-y-180' : ''}`}
                                style={{ transformStyle: 'preserve-3d', transform: card.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                            >
                                {/* Back (Cover) */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 rounded-xl flex items-center justify-center backface-hidden shadow-inner" style={{ backfaceVisibility: 'hidden' }}>
                                    <div className="w-8 h-8 opacity-20">
                                        <Icons.Grid className="w-full h-full text-white" />
                                    </div>
                                </div>

                                {/* Front (Face) */}
                                <div 
                                    className={`absolute inset-0 rounded-xl flex items-center justify-center backface-hidden bg-gradient-to-br ${card.color} border-2 border-white/20 shadow-xl ${card.isMatched ? 'opacity-0 scale-0 duration-700' : ''}`}
                                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                >
                                    <Icon className="w-1/2 h-1/2 text-white drop-shadow-md" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Powerups Dock */}
        <div className="bg-gray-800 p-4 pb-8 border-t border-gray-700 flex justify-center gap-6">
             <button 
                onClick={() => usePowerUp('peek')}
                disabled={userData.powerups.peek === 0 || isProcessing}
                className="relative w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
             >
                 <Icons.Eye className="w-8 h-8 text-purple-400" />
                 <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-gray-900">
                     {userData.powerups.peek}
                 </div>
             </button>
             
             <button 
                onClick={() => usePowerUp('freeze')}
                disabled={userData.powerups.freeze === 0 || isFrozen}
                className="relative w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
             >
                 <Icons.Clock className={`w-8 h-8 ${isFrozen ? 'text-blue-300 animate-spin' : 'text-blue-500'}`} />
                 <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-gray-900">
                     {userData.powerups.freeze}
                 </div>
             </button>
        </div>

        {/* Game Over Modal */}
        {gameOverState && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-pop-in">
                <div className="bg-gray-800 rounded-3xl p-8 text-center max-w-sm w-full border border-gray-700 shadow-2xl relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-2 ${gameOverState === 'win' ? 'bg-green-500' : 'bg-red-500'}`} />
                    
                    {gameOverState === 'win' ? (
                        <>
                            <div className="text-6xl mb-4 animate-bounce">🏆</div>
                            <h2 className="text-3xl font-black text-white mb-2">ممتاز!</h2>
                            <p className="text-gray-400 mb-6">لقد تجاوزت المستوى {currentLevel}</p>
                            
                            <div className="bg-gray-900/50 p-4 rounded-xl flex items-center justify-center gap-4 mb-6">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500">الجائزة</span>
                                    <div className="flex items-center gap-1 text-yellow-400 font-bold text-xl">
                                        +{10 + (currentLevel * 2)} <Icons.Sun className="w-5 h-5 fill-current" />
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setView('map')} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-lg mb-3 shadow-lg">
                                المتابعة للخريطة
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="text-6xl mb-4 animate-pulse">💔</div>
                            <h2 className="text-3xl font-black text-white mb-2">خسرت!</h2>
                            <p className="text-gray-400 mb-6">نفذ الوقت. خسرت قلباً واحداً.</p>
                            
                            <div className="flex gap-3">
                                <button onClick={() => setView('map')} className="flex-1 bg-gray-700 text-white py-3 rounded-xl font-bold">
                                    خروج
                                </button>
                                <button onClick={() => initGame(currentLevel)} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold">
                                    محاولة (1 ❤️)
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
