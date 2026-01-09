
import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';
import { useSettings } from '../contexts/SettingsContext';
import { VILLAGE_SERVICES } from '../services/villageData';

interface VillageSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (serviceId: string) => void;
}

export const VillageSidebar: React.FC<VillageSidebarProps> = ({ isOpen, onClose, onSelectService }) => {
  const { t, isRTL, showToast } = useSettings();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleShareApp = async () => {
    const shareData = {
        title: 'تطبيق الرقة الغربية',
        text: 'حمل تطبيق الرقة الغربية دلوقتي واستمتع بالخدمات والألعاب الذكية! 🚀',
        url: window.location.origin
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            showToast("تم فتح قائمة المشاركة", "success");
        } catch (e) {
            console.error("Sharing failed", e);
        }
    } else {
        navigator.clipboard.writeText(shareData.url);
        showToast("تم نسخ رابط التطبيق", "info");
    }
  };

  if (!isVisible && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Content */}
      <div 
        className={`relative w-[80%] max-w-xs bg-white dark:bg-gray-900 h-full shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : (isRTL ? '-translate-x-full' : 'translate-x-full')}`}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-purple-600 to-blue-600 dark:from-gray-800 dark:to-black text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
                <Icons.Home className="w-32 h-32" />
            </div>
            <h2 className="text-2xl font-bold font-serif mb-1">الرقة الغربية</h2>
            <p className="text-xs opacity-80">القرية الذكية</p>
            <button onClick={onClose} className="absolute top-4 left-4 p-1 hover:bg-white/20 rounded-full">
                <Icons.Close className="w-6 h-6" />
            </button>
        </div>

        {/* Services Grid */}
        <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-gray-500 font-bold text-sm mb-4 uppercase tracking-wider px-2">الخدمات المتاحة</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
                {VILLAGE_SERVICES.map((service) => (
                    <button 
                        key={service.id}
                        onClick={() => { onSelectService(service.id); onClose(); }}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 gap-3 group"
                    >
                        <div className={`w-12 h-12 rounded-full ${service.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            <service.icon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm dark:text-gray-200">{service.name}</span>
                    </button>
                ))}
            </div>

            {/* Share Button (لمبات التطبيق) */}
            <button 
                onClick={handleShareApp}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-blue-500/30 transition-all active:scale-95 mb-6"
            >
                <Icons.Share2 className="w-5 h-5" />
                شارك التطبيق مع أصحابك
            </button>

            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <h4 className="font-bold mb-2 dark:text-white flex items-center gap-2">
                    <Icons.Info className="w-4 h-4 text-blue-500" />
                    عن التطبيق
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                    تم تطوير هذا التطبيق لخدمة أهالي قرية الرقة الغربية، لتسهيل التواصل والوصول للخدمات.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
