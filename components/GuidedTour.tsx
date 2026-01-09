
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

interface Step {
  id: string;
  targetId: string;
  title: string;
  content: string;
  action: 'click' | 'read';
}

const STEPS: Step[] = [
  {
    id: 'intro',
    targetId: 'app-header',
    title: 'يا هلا بيك في الرقة!',
    content: 'أنا العمدة "مروان". هاخدك جولة سريعة في تطبيقنا عشان تبقى "برنس" في التعامل معاه. ركز معايا!',
    action: 'read'
  },
  {
    id: 'create_post',
    targetId: 'nav-create',
    title: 'مركز الإبداع',
    content: 'ده زرار "الحكايات". دوس عليه عشان تكتب بوست أو تنزل صورة وتشاركنا لحظاتك.',
    action: 'click'
  },
  {
    id: 'explain_ai',
    targetId: 'ai-btn',
    title: 'الذكاء الاصطناعي',
    content: 'شايف الزرار ده؟ ده "الرسام السحري". بيحول كلامك لصور خيالية في ثواني! تكنولوجيا ولا في الأحلام.',
    action: 'read'
  },
  {
    id: 'close_create',
    targetId: 'close-create-btn',
    title: 'نرجع لمطرحنا',
    content: 'تمام يا بطل. دوس هنا عشان نقفل الصفحة دي ونرجع نكمل لفتنا.',
    action: 'click'
  },
  {
    id: 'open_sidebar',
    targetId: 'nav-services',
    title: 'خدمات القرية',
    content: 'دي بقى أهم حتة. دوس هنا هتلاقي المطاعم والمحلات وكل خدمات الرقة بين ايديك.',
    action: 'click'
  },
  {
    id: 'finish',
    targetId: 'app-header',
    title: 'البيت بيتك!',
    content: 'كده أنت عرفت الأساسيات. عيش براحتك في التطبيق، وأي وقت تحتاجني، أنا موجود.',
    action: 'read'
  }
];

export const GuidedTour: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Target Position State
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isTargetVisible, setIsTargetVisible] = useState(false);

  // Animation Frame Ref for Tracking
  const requestRef = useRef<number>();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('raqqa_omda_tour_v4');
    if (!hasSeenTour) {
      setTimeout(() => setIsVisible(true), 1200);
    }
  }, []);

  const currentStep = STEPS[currentStepIndex];

  // --- Real-time Element Tracking Loop ---
  const updatePosition = () => {
    const element = document.getElementById(currentStep.targetId);
    if (element) {
        const rect = element.getBoundingClientRect();
        
        // Only update if dimensions changed significantly (optimization)
        setTargetRect(prev => {
            if (!prev || 
                Math.abs(prev.top - rect.top) > 2 || 
                Math.abs(prev.left - rect.left) > 2 ||
                Math.abs(prev.width - rect.width) > 2
            ) {
                return rect;
            }
            return prev;
        });
        setIsTargetVisible(true);

        // Auto-scroll if element is out of view (only once per step usually)
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
             element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Attach Click Listener if needed (One-time)
        if (currentStep.action === 'click' && !element.dataset.tourBound) {
             const clickHandler = () => {
                 element.dataset.tourBound = ""; // Clear flag
                 // Small delay to allow UI to react (e.g. open menu) before moving step
                 setTimeout(() => handleNext(), 600);
             };
             element.addEventListener('click', clickHandler, { once: true });
             element.dataset.tourBound = "true";
        }

    } else {
        setIsTargetVisible(false);
    }
    
    // Keep tracking forever until component unmounts or step changes
    requestRef.current = requestAnimationFrame(updatePosition);
  };

  useEffect(() => {
    if (!isVisible) return;
    
    // Start tracking loop
    requestRef.current = requestAnimationFrame(updatePosition);

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [currentStepIndex, isVisible]);

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    localStorage.setItem('raqqa_omda_tour_v4', 'true');
  };

  if (!isVisible) return null;

  // --- Calculations for Layout ---
  const PADDING = 10; // Extra breathing room around the element
  const top = targetRect ? targetRect.top - PADDING : 0;
  const left = targetRect ? targetRect.left - PADDING : 0;
  const width = targetRect ? targetRect.width + (PADDING * 2) : 0;
  const height = targetRect ? targetRect.height + (PADDING * 2) : 0;

  // Determine where to put the character (Top or Bottom of the highlight)
  // Default to bottom, unless space is tight
  const showAbove = targetRect && targetRect.top > window.innerHeight / 2;
  
  // Character Position
  const charTop = showAbove 
      ? top - 220 // Place above the box
      : top + height + 20; // Place below the box
  
  // Ensure character stays within horizontal screen bounds
  let charLeft = left + (width / 2) - 150; // Center align (300px width / 2)
  if (charLeft < 10) charLeft = 10;
  if (charLeft + 300 > window.innerWidth) charLeft = window.innerWidth - 310;

  // Avatar Image (El Omda)
  const avatarUrl = "https://cdn-icons-png.flaticon.com/512/3048/3048122.png"; 

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      
      {/* 1. THE SPOTLIGHT (Box Shadow Trick) */}
      {/* This creates a giant shadow that covers the screen, leaving a clear 'hole' for the target */}
      {isTargetVisible && (
          <div 
            className="absolute rounded-xl transition-all duration-300 ease-out border-2 border-orange-500 box-content shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
            style={{
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: `${height}px`,
            }}
          >
              {/* Pulse Animation Ring */}
              <div className="absolute -inset-1 border-2 border-orange-400 rounded-xl animate-ping opacity-75"></div>
              
              {/* Click Indicator */}
              {currentStep.action === 'click' && (
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-4xl animate-bounce drop-shadow-lg filter">
                      👆
                  </div>
              )}
          </div>
      )}

      {/* 2. The Character & Speech Bubble */}
      <div 
        className="absolute w-[300px] transition-all duration-500 ease-out pointer-events-auto"
        style={{ 
            top: isTargetVisible ? `${charTop}px` : '50%', 
            left: isTargetVisible ? `${charLeft}px` : '50%',
            transform: isTargetVisible ? 'none' : 'translate(-50%, -50%)',
            opacity: isTargetVisible ? 1 : 0
        }}
      >
          <div className="relative">
             {/* Avatar sticking out */}
             <div className={`absolute left-4 w-20 h-20 bg-white rounded-full border-4 border-orange-500 shadow-xl overflow-hidden flex items-center justify-center z-20 transition-all ${showAbove ? '-bottom-10' : '-top-10'}`}>
                  <img src={avatarUrl} alt="El Omda" className="w-full h-full object-cover" />
             </div>

             <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 pt-8 shadow-2xl border-4 border-orange-500 relative z-10">
                  <div className="pl-16">
                      <h3 className="text-lg font-black text-orange-600 dark:text-orange-500 mb-1 font-branding text-right">العمدة مروان</h3>
                      <p className="text-gray-800 dark:text-gray-200 text-sm font-bold leading-relaxed text-right mb-4" dir="rtl">
                          {currentStep.content}
                      </p>
                  </div>

                  <div className="flex gap-3 justify-center mt-2">
                      <button 
                        onClick={completeTour}
                        className="px-4 py-2 text-gray-400 font-bold text-xs hover:text-gray-600 dark:hover:text-gray-200"
                      >
                          إنهاء
                      </button>
                      
                      {currentStep.action === 'read' && (
                          <button 
                            onClick={handleNext}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-black text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2"
                          >
                              {currentStepIndex === STEPS.length - 1 ? 'يلا بينا!' : 'تمام'}
                              <Icons.ChevronLeft className="w-4 h-4 rotate-180" />
                          </button>
                      )}
                  </div>
             </div>
          </div>
      </div>
    </div>
  );
};
