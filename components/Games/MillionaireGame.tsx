
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icons } from '../Icons';
import { getSessionQuestions, MillionaireQuestion } from '../../services/millionaireData';
import { useSettings } from '../../contexts/SettingsContext';

interface MillionaireGameProps {
  onBack: () => void;
}

type ViewState = 'menu' | 'playing' | 'history' | 'gameOver';

interface WrongAnswerRecord {
  question: string;
  userChoice: string;
  correctChoice: string;
  timestamp: number;
}

const MONEY_LADDER = [
  "1,000,000", "500,000", "250,000", "125,000", "64,000",
  "32,000", "16,000", "8,000", "4,000", "2,000",
  "1,000", "500", "300", "200", "100"
];

export const MillionaireGame: React.FC<MillionaireGameProps> = ({ onBack }) => {
  const { showToast } = useSettings();
  const [view, setView] = useState<ViewState>('menu');
  const [sessionQuestions, setSessionQuestions] = useState<MillionaireQuestion[]>([]);
  const [wrongHistory, setWrongHistory] = useState<WrongAnswerRecord[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0); 
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lifelines, setLifelines] = useState({ fiftyFifty: true, askAi: true, switch: true });
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    const saved = localStorage.getItem('millionaire_wrong_history_pro_v1');
    if (saved) setWrongHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (record: WrongAnswerRecord) => {
    const updated = [record, ...wrongHistory].slice(0, 100);
    setWrongHistory(updated);
    localStorage.setItem('millionaire_wrong_history_pro_v1', JSON.stringify(updated));
  };

  const startNewGame = () => {
    setSessionQuestions(getSessionQuestions());
    setCurrentLevel(0);
    setLifelines({ fiftyFifty: true, askAi: true, switch: true });
    setTimer(30);
    setSelectedIdx(null);
    setShowResult(false);
    setView('playing');
  };

  const currentQuestion = sessionQuestions[currentLevel];

  useEffect(() => {
    if (view === 'playing' && !showResult && timer > 0) {
      const t = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(t);
    } else if (timer === 0 && view === 'playing' && !showResult) {
      handleOptionClick(-1);
    }
  }, [timer, view, showResult]);

  const handleOptionClick = (idx: number) => {
    if (selectedIdx !== null || !currentQuestion) return;
    setSelectedIdx(idx);
    
    setTimeout(() => {
      setShowResult(true);
      const isCorrect = idx === currentQuestion.correctIndex;
      if (isCorrect) {
        if (navigator.vibrate) navigator.vibrate(50);
        setTimeout(() => {
          if (currentLevel < 14) {
            setCurrentLevel(prev => prev + 1);
            setSelectedIdx(null);
            setShowResult(false);
            setDisabledOptions([]);
            setTimer(30);
          } else { setView('gameOver'); }
        }, 1600);
      } else {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        saveToHistory({
          question: currentQuestion.question,
          userChoice: idx === -1 ? "انتهى الوقت" : currentQuestion.options[idx],
          correctChoice: currentQuestion.options[currentQuestion.correctIndex],
          timestamp: Date.now()
        });
        setTimeout(() => setView('gameOver'), 3500);
      }
    }, 1500);
  };

  const useLifeline = (type: keyof typeof lifelines) => {
    if (!lifelines[type] || showResult || selectedIdx !== null) return;
    setLifelines(prev => ({ ...prev, [type]: false }));
    if (type === 'fiftyFifty') {
      const wrong = [0, 1, 2, 3].filter(i => i !== currentQuestion.correctIndex);
      setDisabledOptions(wrong.sort(() => Math.random() - 0.5).slice(0, 2));
    } else if (type === 'askAi') {
      showToast("الروبوت يهمس: " + currentQuestion.options[currentQuestion.correctIndex], "info");
    } else if (type === 'switch') {
      setSessionQuestions(prev => {
        const next = [...prev];
        next[currentLevel] = getSessionQuestions()[0];
        return next;
      });
    }
  };

  // --- Views ---

  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-[#00001a] flex flex-col p-8 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#00004d_0%,#000000_100%)] opacity-50"></div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
            <div className="w-56 h-56 relative mb-16 animate-pop-in">
                <div className="absolute inset-0 bg-yellow-400/30 blur-[100px] animate-pulse"></div>
                <div className="w-full h-full bg-gradient-to-tr from-yellow-400 via-orange-600 to-yellow-800 rounded-full flex items-center justify-center shadow-[0_0_100px_rgba(251,191,36,0.5)] border-4 border-white/20">
                    <Icons.Trophy className="w-28 h-28 text-white drop-shadow-2xl" />
                </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white text-center mb-4 tracking-tighter leading-none">
                من سيربح <br/> <span className="text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">المليون؟</span>
            </h1>
            <p className="text-blue-400 text-xs font-black uppercase tracking-[0.5em] mb-16 opacity-60">Raqqa El-Gharbiya Pro</p>
            
            <div className="w-full max-w-sm space-y-5">
                <button 
                    onClick={startNewGame}
                    className="w-full bg-white text-black py-6 rounded-[2rem] font-black text-2xl shadow-2xl active:scale-95 transition-all hover:bg-yellow-400"
                >
                    ابدأ التحدي
                </button>
                <div className="grid grid-cols-2 gap-5">
                    <button 
                        onClick={() => setView('history')}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 text-white py-5 rounded-[1.5rem] font-black text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                    >
                        <Icons.Clock className="w-5 h-5 text-blue-400" /> سجل الأخطاء
                    </button>
                    <button onClick={onBack} className="bg-white/5 backdrop-blur-xl border border-white/10 text-white py-5 rounded-[1.5rem] font-black text-sm hover:bg-white/10 transition-all">
                        خروج
                    </button>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (view === 'history') {
    return (
        <div className="min-h-screen bg-[#00000a] flex flex-col p-6 font-sans animate-pop-in">
            <div className="flex items-center gap-5 mb-10">
                <button onClick={() => setView('menu')} className="p-3.5 bg-white/5 border border-white/10 rounded-full text-white active:scale-90 transition-transform"><Icons.Back className="w-6 h-6" /></button>
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-white tracking-tight">خزنة المراجعة</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">The Knowledge Vault</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pb-10">
                {wrongHistory.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 py-40">
                        <Icons.Clock className="w-24 h-24 mb-6" />
                        <p className="text-2xl font-black text-white">السجل فارغ. استمر في التألق!</p>
                    </div>
                ) : (
                    wrongHistory.map((item, i) => (
                        <div key={i} className="bg-gradient-to-br from-gray-900 to-black border border-white/5 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] group-hover:bg-blue-500/20 transition-all"></div>
                            <p className="text-gray-600 text-[9px] mb-3 font-black uppercase tracking-tighter">{new Date(item.timestamp).toLocaleString()}</p>
                            <h3 className="text-white font-bold text-xl mb-6 leading-snug">{item.question}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5">
                                    <div className="text-[9px] text-red-500 font-black mb-2 uppercase tracking-widest flex items-center gap-2">
                                        <Icons.Close className="w-3 h-3" /> خطأك كان
                                    </div>
                                    <div className="text-white font-bold text-lg opacity-80">{item.userChoice}</div>
                                </div>
                                <div className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5">
                                    <div className="text-[9px] text-green-500 font-black mb-2 uppercase tracking-widest flex items-center gap-2">
                                        <Icons.Check className="w-3 h-3" /> الإجابة الصحيحة
                                    </div>
                                    <div className="text-white font-bold text-lg">{item.correctChoice}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {wrongHistory.length > 0 && (
                <button 
                    onClick={() => { setWrongHistory([]); localStorage.removeItem('millionaire_wrong_history_pro_v1'); }}
                    className="mt-6 w-full py-5 text-red-500 font-black text-sm bg-red-500/5 border border-red-500/20 rounded-[1.5rem] active:bg-red-500 active:text-white transition-all shadow-lg"
                >
                    إفراغ الخزنة بالكامل
                </button>
            )}
        </div>
    );
  }

  if (view === 'gameOver') {
    const wonAmount = (selectedIdx === currentQuestion?.correctIndex) ? MONEY_LADDER[14 - currentLevel] : (currentLevel >= 10 ? MONEY_LADDER[9] : (currentLevel >= 5 ? MONEY_LADDER[4] : "0"));
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center animate-pop-in font-sans">
            <div className="w-56 h-56 bg-yellow-400 rounded-full flex items-center justify-center mb-12 shadow-[0_0_150px_rgba(251,191,36,0.4)] animate-bounce border-8 border-white/20">
                <Icons.Trophy className="w-32 h-32 text-blue-950" />
            </div>
            <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">انتهت الرحلة</h2>
            <p className="text-gray-500 text-xl mb-3 font-bold uppercase tracking-widest opacity-50">مبلغ الجائزة</p>
            <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-700 mb-20 drop-shadow-2xl">
                {wonAmount} <span className="text-3xl opacity-50">ج.م</span>
            </div>
            <button 
                onClick={() => setView('menu')}
                className="w-full max-w-sm bg-white text-black py-5 rounded-[2rem] font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
                العودة للرئيسية
            </button>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#00002b] flex flex-col lg:flex-row relative font-sans overflow-hidden select-none">
      
      {/* Dynamic Money Tower Sidebar */}
      <div className="w-full lg:w-80 bg-black/60 backdrop-blur-3xl border-b lg:border-b-0 lg:border-l border-white/10 flex flex-col order-2 lg:order-2 overflow-y-auto no-scrollbar lg:h-screen shadow-2xl">
          <div className="p-8 text-center border-b border-white/5">
              <h3 className="text-yellow-400 text-[10px] font-black tracking-[0.4em] uppercase opacity-80">The Money Tower</h3>
          </div>
          <div className="flex-1 flex flex-col-reverse lg:flex-col py-6 px-5 gap-1.5">
              {MONEY_LADDER.map((amount, i) => {
                  const levelIdx = 14 - i;
                  const isSafe = levelIdx === 4 || levelIdx === 9 || levelIdx === 14;
                  const isActive = levelIdx === currentLevel;
                  const isPassed = levelIdx < currentLevel;

                  return (
                      <div 
                        key={i} 
                        className={`relative flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-700 ${isActive ? 'bg-orange-500 text-white scale-110 shadow-[0_0_40px_rgba(249,115,22,0.6)] z-20' : isPassed ? 'opacity-10 grayscale' : isSafe ? 'bg-white/5 text-white border border-white/10' : 'text-blue-300/30'}`}
                      >
                          <span className={`text-[10px] font-black ${isActive ? 'text-white' : 'opacity-40'}`}>{15 - i}</span>
                          <span className={`text-base font-black tracking-wider ${isActive ? 'text-white' : isSafe ? 'text-yellow-400' : ''}`}>
                              {amount}
                          </span>
                          {isActive && <div className="absolute -left-1.5 w-3 h-full bg-yellow-400 rounded-full animate-pulse blur-sm"></div>}
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Primary Game Stage */}
      <div className="flex-1 flex flex-col relative order-1 lg:order-1 h-[70vh] lg:h-screen overflow-y-auto no-scrollbar">
          {/* Header Controls */}
          <div className="p-6 flex justify-between items-center bg-black/30 backdrop-blur-xl sticky top-0 z-[50] border-b border-white/5">
              <button onClick={() => setView('menu')} className="p-3 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors border border-white/10"><Icons.Back className="w-6 h-6"/></button>
              
              <div className="flex flex-col items-center">
                   <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-2xl ${timer < 10 ? 'border-red-600 bg-red-600/20 text-red-500 animate-pulse' : 'border-blue-600 bg-blue-600/20 text-white'}`}>
                       <span className="text-2xl font-black">{timer}</span>
                   </div>
              </div>

              <div className="flex gap-3">
                  <button 
                    onClick={() => useLifeline('fiftyFifty')}
                    disabled={!lifelines.fiftyFifty || showResult}
                    className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-[10px] font-black transition-all ${lifelines.fiftyFifty ? 'border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/20 bg-yellow-400/5' : 'border-gray-800 text-gray-800 bg-transparent opacity-20'}`}
                  >50:50</button>
                  <button 
                    onClick={() => useLifeline('askAi')}
                    disabled={!lifelines.askAi || showResult}
                    className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${lifelines.askAi ? 'border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/20 bg-yellow-400/5' : 'border-gray-800 text-gray-800 bg-transparent opacity-20'}`}
                  > <Icons.Activity className="w-6 h-6" /> </button>
                  <button 
                    onClick={() => useLifeline('switch')}
                    disabled={!lifelines.switch || showResult}
                    className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${lifelines.switch ? 'border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/20 bg-yellow-400/5' : 'border-gray-800 text-gray-800 bg-transparent opacity-20'}`}
                  > <Icons.Zap className="w-6 h-6" /> </button>
              </div>
          </div>

          <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:p-20 max-w-6xl mx-auto w-full">
              {/* Cinematic Question Box */}
              <div className="mb-20 text-center relative animate-pop-in">
                  <div className="absolute top-[-25px] left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-6 py-1.5 rounded-full uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(37,99,235,0.4)] z-10 border border-white/20">Level {currentLevel + 1}</div>
                  <div className="bg-gradient-to-br from-[#00004d] via-[#000033] to-[#00004d] p-12 md:p-16 rounded-[4rem] border-y-8 border-blue-500 shadow-[0_0_100px_rgba(59,130,246,0.15)] relative">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                      <h2 className="text-2xl md:text-4xl font-black text-white leading-relaxed drop-shadow-lg relative z-10">{currentQuestion?.question}</h2>
                  </div>
              </div>

              {/* Enhanced Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentQuestion?.options.map((opt, i) => {
                      const isCorrect = i === currentQuestion.correctIndex;
                      const isSelected = i === selectedIdx;
                      const isWrong = isSelected && !isCorrect;
                      const isDisabled = disabledOptions.includes(i);

                      let styleClass = "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-blue-400/50";
                      if (isDisabled) styleClass = "opacity-0 pointer-events-none";
                      else if (showResult && isCorrect) styleClass = "bg-green-600 border-green-400 text-white shadow-[0_0_50px_rgba(34,197,94,0.8)] z-30 scale-105 animate-pulse";
                      else if (showResult && isWrong) styleClass = "bg-red-600 border-red-400 text-white grayscale-[0.5]";
                      else if (isSelected) styleClass = "bg-orange-600 border-orange-400 text-white animate-pulse scale-105 shadow-2xl z-20";

                      return (
                          <button
                            key={i}
                            disabled={selectedIdx !== null || isDisabled}
                            onClick={() => handleOptionClick(i)}
                            className={`relative p-8 md:p-10 text-right border-4 rounded-[2.5rem] transition-all duration-500 flex items-center gap-6 group ${styleClass}`}
                          >
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black border-2 transition-all ${isSelected ? 'bg-white text-black border-white' : 'bg-black/40 text-yellow-400 border-white/10 group-hover:border-blue-400'}`}>
                                  {['أ', 'ب', 'ج', 'د'][i]}
                              </div>
                              <span className="text-xl md:text-2xl font-black flex-1 tracking-tight">{opt}</span>
                              
                              {/* Glowing background on hover */}
                              <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-[2.5rem] transition-colors pointer-events-none"></div>
                          </button>
                      );
                  })}
              </div>

              {/* Informational Toast Overlay */}
              {showResult && (
                  <div className="mt-20 flex justify-center animate-slide-up">
                      <div className={`flex items-center gap-5 px-10 py-5 rounded-[2rem] font-black text-xl border-4 shadow-2xl ${selectedIdx === currentQuestion.correctIndex ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
                          {selectedIdx === currentQuestion.correctIndex ? (
                              <> <Icons.Check className="w-8 h-8" /> إجابة أسطورية! جاري التقدم.. </>
                          ) : (
                              <> <Icons.Info className="w-8 h-8" /> الإجابة الصحيحة: {currentQuestion.options[currentQuestion.correctIndex]} </>
                          )}
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
