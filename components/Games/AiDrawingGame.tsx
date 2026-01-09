
import React, { useRef, useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { guessDrawing } from '../../services/geminiService';

interface AiDrawingGameProps {
  onBack: () => void;
}

const COLORS = ['#000000', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
const BRUSH_TYPES = [
    { id: 'pen', icon: Icons.Create, label: 'قلم' },
    { id: 'neon', icon: Icons.Zap, label: 'نيون' },
    { id: 'spray', icon: Icons.Droplet, label: 'بخاخ' },
    { id: 'eraser', icon: Icons.Trash, label: 'ممحاة' }
];

export const AiDrawingGame: React.FC<AiDrawingGameProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushType, setBrushType] = useState('pen');
  const [brushSize, setBrushSize] = useState(5);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [aiGuess, setAiGuess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTools, setShowTools] = useState(true);

  useEffect(() => {
    const initCanvas = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, rect.width, rect.height);
            if (historyStep === -1) saveState();
        }
    };
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, []);

  const saveState = () => {
      const canvas = canvasRef.current;
      if (canvas) {
          const data = canvas.toDataURL();
          setHistory(prev => [...prev.slice(0, historyStep + 1), data].slice(-20));
          setHistoryStep(prev => Math.min(prev + 1, 19));
      }
  };

  const undo = () => {
      if (historyStep > 0) {
          const newStep = historyStep - 1;
          const img = new Image();
          img.src = history[newStep];
          img.onload = () => {
              const ctx = canvasRef.current?.getContext('2d');
              const rect = containerRef.current?.getBoundingClientRect();
              if (ctx && rect) {
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
                  ctx.drawImage(img, 0, 0, rect.width, rect.height);
                  setHistoryStep(newStep);
              }
          };
      }
  };

  const getPos = (e: any) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e: any) => {
    setIsDrawing(true);
    setShowTools(false);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        if (brushType === 'neon') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.strokeStyle = brushType === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = brushSize;
    }
  };

  const move = (e: any) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
        if (brushType === 'spray') {
            for (let i = 0; i < 10; i++) {
                const offsetX = (Math.random() - 0.5) * brushSize * 2;
                const offsetY = (Math.random() - 0.5) * brushSize * 2;
                ctx.fillStyle = color;
                ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
            }
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }
  };

  const stop = () => {
    if (isDrawing) {
        setIsDrawing(false);
        saveState();
        setShowTools(true);
    }
  };

  const handleGuess = async () => {
    if (!canvasRef.current) return;
    setIsLoading(true);
    try {
        const guess = await guessDrawing(canvasRef.current.toDataURL());
        setAiGuess(guess);
        if (navigator.vibrate) navigator.vibrate(100);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="bg-white dark:bg-black h-[100dvh] flex flex-col relative overflow-hidden touch-none">
      <div ref={containerRef} className="flex-1 bg-white relative">
        <canvas ref={canvasRef} onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={move} onTouchEnd={stop} className="w-full h-full block cursor-crosshair" />
      </div>

      {/* Floating Controls */}
      <div className={`absolute top-4 left-4 right-4 flex justify-between items-start z-20 transition-opacity ${showTools ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex gap-2">
            <button onClick={onBack} className="p-3 bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl border border-gray-200"><Icons.Back className="w-6 h-6 dark:text-white"/></button>
            <button onClick={undo} className="p-3 bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl border border-gray-200"><Icons.Back className="w-6 h-6 rotate-180 transform scale-x-[-1] dark:text-white"/></button>
          </div>
          <button onClick={() => { const ctx = canvasRef.current?.getContext('2d'); if(ctx) { ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,5000,5000); saveState(); setAiGuess(null); } }} className="p-3 bg-red-500 text-white rounded-2xl shadow-xl"><Icons.Trash className="w-6 h-6"/></button>
      </div>

      {/* Brush Dock */}
      <div className={`absolute bottom-6 left-4 right-4 z-20 transition-all ${showTools ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-4 max-w-lg mx-auto border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                    {BRUSH_TYPES.map(t => (
                        <button key={t.id} onClick={() => setBrushType(t.id)} className={`p-2.5 rounded-xl transition-all ${brushType === t.id ? 'bg-white dark:bg-gray-700 shadow-md text-blue-500' : 'text-gray-400'}`}>
                            <t.icon className="w-5 h-5"/>
                        </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                      {[5, 12, 25].map(s => (
                          <button key={s} onClick={() => setBrushSize(s)} className={`w-8 h-8 rounded-full flex items-center justify-center ${brushSize === s ? 'bg-black dark:bg-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                              <div style={{width: s/2, height: s/2}} className={`rounded-full ${brushSize === s ? 'bg-white dark:bg-black' : 'bg-gray-400'}`}/>
                          </button>
                      ))}
                  </div>
                  <button onClick={handleGuess} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-2xl font-black shadow-lg shadow-purple-500/30 active:scale-95 transition-all">خمن!</button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={`w-9 h-9 rounded-full flex-shrink-0 border-2 transition-transform ${color === c ? 'border-gray-900 dark:border-white scale-110 shadow-lg' : 'border-transparent'}`} style={{backgroundColor: c}}/>)}
              </div>
          </div>
      </div>

      {/* AI Result */}
      {(isLoading || aiGuess) && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-30 flex items-center justify-center p-6 pointer-events-none">
              <div className="bg-white/95 dark:bg-gray-900/95 p-8 rounded-[3rem] shadow-2xl border-2 border-yellow-400 text-center animate-pop-in pointer-events-auto max-w-sm w-full">
                  {isLoading ? <div className="flex flex-col items-center"><Icons.Loading className="w-12 h-12 text-purple-500 animate-spin mb-4"/><p className="font-bold dark:text-white">بفكر...</p></div> : 
                  <>
                    <p className="text-gray-500 text-xs mb-2 uppercase tracking-widest">التخمين السحري</p>
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500 mb-6">{aiGuess}</h2>
                    <button onClick={() => setAiGuess(null)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold">عاش! كمل</button>
                  </>}
              </div>
          </div>
      )}
    </div>
  );
};
