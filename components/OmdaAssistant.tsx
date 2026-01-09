
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Icons } from './Icons';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { ViewState, FontSize } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { executeWithRotation } from '../services/geminiService';
import { AppContext } from '../App';

interface OmdaAssistantProps {
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
  currentUser: any;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatSession {
    id: string;
    title: string;
    timestamp: number;
    messages: Message[];
}

// --- System Persona ---
const SYSTEM_INSTRUCTION = `
أنت "العمدة مروان"، العمدة الذكي والمسؤول عن تطبيق "الرقة الغربية".
شخصيتك: مصري أصيل، ابن بلد، جدع، حكيم، دمك خفيف، وخدوم جداً. تتحدث باللهجة المصرية العامية الودودة.
`;

// --- Tool Definitions ---
const navigateTool: FunctionDeclaration = {
  name: 'navigate',
  description: 'Navigate the user to a specific screen.',
  parameters: {
    type: Type.OBJECT,
    properties: { viewName: { type: Type.STRING } },
    required: ['viewName'],
  },
};

const changeSettingsTool: FunctionDeclaration = {
  name: 'changeSettings',
  description: 'Change app settings like language, theme, or font size.',
  parameters: {
    type: Type.OBJECT,
    properties: { 
        settingType: { type: Type.STRING, description: "one of: language, theme, fontSize" }, 
        value: { type: Type.STRING, description: "for fontSize: 'small' (1), 'normal' (2), 'medium' (3), 'large' (4), 'huge' (5). for theme: light, dark. for language: ar, en, fr, de." } 
    },
    required: ['settingType', 'value'],
  },
};

const searchPostsTool: FunctionDeclaration = {
    name: 'searchPosts',
    description: 'Search for posts or users.',
    parameters: {
        type: Type.OBJECT,
        properties: { query: { type: Type.STRING, description: 'The search term' } },
        required: ['query']
    }
};

const draftPostTool: FunctionDeclaration = {
    name: 'draftPost',
    description: 'Draft a new post for the user to review.',
    parameters: {
        type: Type.OBJECT,
        properties: { caption: { type: Type.STRING }, imagePrompt: { type: Type.STRING } },
        required: ['caption']
    }
};

export const OmdaAssistant: React.FC<OmdaAssistantProps> = ({ onNavigate, currentView, currentUser }) => {
  const { omdaEnabled, setOmdaEnabled, showToast, setLanguage, setTheme, setFontSize, omdaResetTrigger } = useSettings();
  const { setSearchQuery, setAiDraft } = useContext(AppContext);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- POSITIONING & DRAGGING STATE ---
  
  // 1. Button Position
  const [btnPos, setBtnPos] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
  const [isBtnDragging, setIsBtnDragging] = useState(false);
  const btnDragStart = useRef({ x: 0, y: 0 }); // Tracks pointer start
  const btnInitialPos = useRef({ x: 0, y: 0 }); // Tracks element start
  const [isOverDropZone, setIsOverDropZone] = useState(false);

  // 2. Window Position
  const [winPos, setWinPos] = useState({ x: 20, y: 100 }); // Default center-ish
  const [isWinDragging, setIsWinDragging] = useState(false);
  const winDragStart = useRef({ x: 0, y: 0 });
  const winInitialPos = useRef({ x: 0, y: 0 });

  // Reset Trigger
  useEffect(() => {
      setBtnPos({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
      setWinPos({ x: window.innerWidth / 2 - 175, y: 100 }); // Center approximate (350px width / 2)
      setIsOpen(true); // Open to show it exists
  }, [omdaResetTrigger]);

  // Load Saved Positions
  useEffect(() => {
      const savedBtn = localStorage.getItem('omda_button_pos');
      if (savedBtn) {
          try { setBtnPos(JSON.parse(savedBtn)); } catch (e) { console.error(e); }
      }
      
      const savedWin = localStorage.getItem('omda_window_pos');
      if (savedWin) {
          try { setWinPos(JSON.parse(savedWin)); } catch (e) { console.error(e); }
      } else {
          // Default Center Logic
          const centerX = (window.innerWidth / 2) - 175; // Half of max-w-sm (~350px)
          const centerY = (window.innerHeight / 2) - 250;
          setWinPos({ x: Math.max(10, centerX), y: Math.max(50, centerY) });
      }
  }, []);

  // Save on Change with protection
  useEffect(() => { 
      try { localStorage.setItem('omda_button_pos', JSON.stringify(btnPos)); } catch(e) { console.warn("Failed to save btnPos", e); }
  }, [btnPos]);
  
  useEffect(() => { 
      try { localStorage.setItem('omda_window_pos', JSON.stringify(winPos)); } catch(e) { console.warn("Failed to save winPos", e); }
  }, [winPos]);

  // Handle Window Resize (Keep button on screen)
  useEffect(() => {
      const handleResize = () => {
          setBtnPos(prev => {
              const maxX = window.innerWidth - 70;
              const maxY = window.innerHeight - 70;
              return {
                  x: Math.min(prev.x, maxX),
                  y: Math.min(prev.y, maxY)
              };
          });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Session Loading ---
  useEffect(() => {
      const savedSessions = localStorage.getItem('omda_sessions_v2');
      if (savedSessions) {
          try {
              const parsed = JSON.parse(savedSessions);
              setSessions(parsed);
              if (parsed.length > 0) {
                  const last = parsed[0];
                  setCurrentSessionId(last.id);
                  setMessages(last.messages);
              } else {
                  startNewSession();
              }
          } catch(e) {
              console.error("Error parsing sessions", e);
              startNewSession();
          }
      } else {
          startNewSession();
      }
  }, []);

  useEffect(() => {
      if (!currentSessionId) return;
      setSessions(prev => {
          const exists = prev.find(s => s.id === currentSessionId);
          let newSessions;
          if (exists) newSessions = prev.map(s => s.id === currentSessionId ? { ...s, messages, timestamp: Date.now() } : s);
          else {
              const title = messages.length > 1 ? messages[1].text.slice(0, 30) : "محادثة جديدة";
              newSessions = [{ id: currentSessionId, title, messages, timestamp: Date.now() }, ...prev];
          }
          const trimmed = newSessions.slice(0, 10);
          try {
              localStorage.setItem('omda_sessions_v2', JSON.stringify(trimmed));
          } catch(e) {
              console.warn("Failed to save sessions", e);
          }
          return trimmed;
      });
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, currentSessionId]);

  const startNewSession = () => {
      const newId = `session_${Date.now()}`;
      const initialMsg: Message = { role: 'model', text: `أهلاً بيك يا غالي في الرقة الغربية! 👋\nأنا العمدة مروان، تحت أمرك.` };
      setCurrentSessionId(newId);
      setMessages([initialMsg]);
      setIsHistoryOpen(false);
  };

  const loadSession = (s: ChatSession) => { setCurrentSessionId(s.id); setMessages(s.messages); setIsHistoryOpen(false); };
  const deleteSession = (e: any, id: string) => {
      e.stopPropagation();
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      if (currentSessionId === id) newSessions.length > 0 ? loadSession(newSessions[0]) : startNewSession();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const resultText = await executeWithRotation(async (ai) => {
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userMsg.text }] }],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION + (currentUser ? `\nالمستخدم: ${currentUser.fullName}` : ''),
                tools: [{ functionDeclarations: [navigateTool, changeSettingsTool, searchPostsTool, draftPostTool] }],
            }
          });
          const fc = response.functionCalls;
          let txt = response.text || "";
          if (fc) {
            for (const call of fc) {
              if (call.name === 'navigate') { onNavigate(call.args['viewName'] as ViewState); txt = "جاري النقل... 🚀"; }
              if (call.name === 'changeSettings') { 
                  const type = call.args['settingType'] as string;
                  const val = call.args['value'] as string;
                  if (type === 'language') setLanguage(val as any);
                  else if (type === 'theme') setTheme(val as any);
                  else if (type === 'fontSize') {
                      // Map AI string output to Numeric Type 1-5
                      const sizeMap: Record<string, FontSize> = {
                          'small': 1, 'tiny': 1,
                          'normal': 2, 'default': 2,
                          'medium': 3,
                          'large': 4,
                          'huge': 5, 'xlarge': 5
                      };
                      // Default to 2 if AI sends something weird, or parse number if it sent "4"
                      const sizeNum = sizeMap[val.toLowerCase()] || parseInt(val) || 2;
                      if(sizeNum >= 1 && sizeNum <= 5) setFontSize(sizeNum as FontSize);
                  }
                  txt = "تم التعديل يا باشا! ✅";
              }
              if (call.name === 'searchPosts') { setSearchQuery(call.args['query'] as string); onNavigate('search'); txt = "جاري البحث..."; }
              if (call.name === 'draftPost') { setAiDraft({ caption: call.args['caption'] as string, imagePrompt: call.args['imagePrompt'] as string }); onNavigate('create'); txt = "جهزتلك البوست! 📝"; }
            }
          }
          return txt || "تم!";
      });
      setMessages(prev => [...prev, { role: 'model', text: resultText }]);
    } catch (error) { setMessages(prev => [...prev, { role: 'model', text: "معلش الشبكة وحشة." }]); } finally { setIsLoading(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // --- DRAG LOGIC (Professional Threshold + Boundaries) ---
  const DRAG_THRESHOLD = 5; // pixels
  const EDGE_MARGIN = 5; // pixels from edge
  const BUTTON_SIZE = 64; // w-16

  // 1. Button Dragging Handlers
  const handleBtnDown = (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      btnDragStart.current = { x: e.clientX, y: e.clientY };
      btnInitialPos.current = { ...btnPos };
      setIsBtnDragging(false); // Assume click initially
  };

  const handleBtnMove = (e: React.PointerEvent) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      
      const dx = e.clientX - btnDragStart.current.x;
      const dy = e.clientY - btnDragStart.current.y;
      
      // Threshold check
      if (!isBtnDragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      
      if (!isBtnDragging) {
          setIsBtnDragging(true); // Start dragging
          if (navigator.vibrate) navigator.vibrate(10);
      }

      let newX = btnInitialPos.current.x + dx;
      let newY = btnInitialPos.current.y + dy;
      
      // --- BOUNDARY CONSTRAINTS (The Fix) ---
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      
      // Clamp X
      if (newX < EDGE_MARGIN) newX = EDGE_MARGIN;
      if (newX > screenW - BUTTON_SIZE - EDGE_MARGIN) newX = screenW - BUTTON_SIZE - EDGE_MARGIN;
      
      // Clamp Y
      if (newY < EDGE_MARGIN) newY = EDGE_MARGIN;
      if (newY > screenH - BUTTON_SIZE - EDGE_MARGIN) newY = screenH - BUTTON_SIZE - EDGE_MARGIN;

      // Drop zone check
      const isOver = Math.hypot((newX + 32) - (screenW / 2), (newY + 32) - (screenH - 50)) < 60;
      setIsOverDropZone(isOver);

      setBtnPos({ x: newX, y: newY });
  };

  const handleBtnUp = (e: React.PointerEvent) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (!isBtnDragging) {
          // It was a click
          setIsOpen(!isOpen);
      } else {
          // End drag
          if (isOverDropZone) {
              setOmdaEnabled(false);
              showToast("تم إخفاء العمدة. أعده من الإعدادات.", "info");
          }
          setIsBtnDragging(false);
          setIsOverDropZone(false);
      }
  };

  // 2. Window Dragging Handlers
  const handleWinDown = (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      winDragStart.current = { x: e.clientX, y: e.clientY };
      winInitialPos.current = { ...winPos };
      setIsWinDragging(false);
  };

  const handleWinMove = (e: React.PointerEvent) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      
      const dx = e.clientX - winDragStart.current.x;
      const dy = e.clientY - winDragStart.current.y;

      if (!isWinDragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!isWinDragging) setIsWinDragging(true);

      let newX = winInitialPos.current.x + dx;
      let newY = winInitialPos.current.y + dy;

      // Window Constraints
      const winW = Math.min(window.innerWidth * 0.9, 384); // max-w-sm is 24rem (384px) or 90vw
      const winH = 60; // Just keep header visible

      if (newX < 0) newX = 0;
      if (newX > window.innerWidth - winW) newX = window.innerWidth - winW;
      
      if (newY < 0) newY = 0;
      if (newY > window.innerHeight - winH) newY = window.innerHeight - winH;

      setWinPos({ x: newX, y: newY });
  };

  const handleWinUp = (e: React.PointerEvent) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsWinDragging(false);
  };

  if (!omdaEnabled) return null;

  return (
    <>
      {/* 1. The Floating Button */}
      <div 
        style={{ 
            position: 'fixed', 
            left: btnPos.x, 
            top: btnPos.y, 
            zIndex: 9999, 
            touchAction: 'none',
            cursor: 'grab'
        }}
        onPointerDown={handleBtnDown}
        onPointerMove={handleBtnMove}
        onPointerUp={handleBtnUp}
      >
          <div className={`w-16 h-16 rounded-full bg-orange-500 border-4 border-white dark:border-gray-800 shadow-[0_10px_20px_rgba(0,0,0,0.3)] flex items-center justify-center transform transition-transform ${isBtnDragging ? 'scale-110 cursor-grabbing' : 'hover:scale-105 active:scale-95'}`}>
            <img src="https://cdn-icons-png.flaticon.com/512/3048/3048122.png" alt="Omda" className="w-full h-full object-cover rounded-full pointer-events-none" />
            {!isOpen && !isBtnDragging && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                </span>
            )}
          </div>
      </div>

      {/* 2. Drop Zone Overlay (Only when button dragging) */}
      {isBtnDragging && (
          <div className="fixed inset-0 z-[9990] pointer-events-none">
              <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-all duration-300 flex flex-col items-center gap-2 ${isOverDropZone ? 'scale-125 opacity-100' : 'scale-100 opacity-60'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-colors ${isOverDropZone ? 'bg-red-600 border-red-400' : 'bg-black/50 border-white/30 backdrop-blur-md'}`}>
                      <Icons.Close className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-white text-xs font-bold shadow-sm bg-black/50 px-2 py-1 rounded-md backdrop-blur-md">إخفاء</span>
              </div>
          </div>
      )}

      {/* 3. The Draggable Chat Window */}
      {isOpen && (
        <div 
            style={{
                position: 'fixed',
                left: winPos.x,
                top: winPos.y,
                zIndex: 10000,
            }}
            className="w-[90vw] max-w-sm h-[60vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.4)] rounded-3xl overflow-hidden animate-pop-in border border-white/10"
        >
            {/* Draggable Header */}
            <div 
                onPointerDown={handleWinDown}
                onPointerMove={handleWinMove}
                onPointerUp={handleWinUp}
                className="bg-orange-500 p-4 flex items-center justify-between text-white cursor-grab active:cursor-grabbing select-none"
            >
                <div className="flex items-center gap-3 pointer-events-none">
                    <div className="w-10 h-10 bg-white rounded-full border-2 border-white/50 overflow-hidden">
                        <img src="https://cdn-icons-png.flaticon.com/512/3048/3048122.png" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-black font-branding text-lg">العمدة مروان</h3>
                        <div className="flex items-center gap-1 text-[9px] opacity-90 font-bold"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>مساعد ذكي</div>
                    </div>
                </div>
                {/* Close Button (No Drag) */}
                <button 
                    onPointerDown={(e) => e.stopPropagation()} 
                    onClick={() => setIsOpen(false)} 
                    className="bg-black/20 p-2 rounded-full hover:bg-black/40 transition-colors"
                >
                    <Icons.Close className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 bg-white dark:bg-gray-900 flex flex-col overflow-hidden relative">
                
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-black/20">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <div className="w-6 h-6 rounded-full bg-orange-100 border border-orange-300 overflow-hidden flex-shrink-0 ml-1 self-end mb-1"><img src="https://cdn-icons-png.flaticon.com/512/3048/3048122.png" className="w-full h-full object-cover"/></div>}
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start items-center gap-2 p-2"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"/><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"/><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"/></div>}
                </div>

                {/* Input */}
                <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full border border-gray-200 dark:border-gray-700 focus-within:border-orange-500 transition-colors">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="اكتب رسالة..." 
                            className="flex-1 bg-transparent px-4 py-2 outline-none text-sm dark:text-white"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={!input.trim() || isLoading} className="p-2.5 bg-orange-500 text-white rounded-full shadow-lg active:scale-90 transition-transform disabled:opacity-50">
                            {isLoading ? <Icons.Loading className="w-5 h-5 animate-spin" /> : <Icons.Send className="w-5 h-5 rtl:rotate-180" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};
