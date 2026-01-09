
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Theme, FontSize } from '../types';
import { translations } from '../services/translations';
import { Toast, ToastType } from '../components/Toast';

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  t: (key: string) => string;
  isRTL: boolean;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  showToast: (message: string, type?: ToastType) => void;
  omdaEnabled: boolean;
  setOmdaEnabled: (enabled: boolean) => void;
  omdaResetTrigger: number;
  resetOmdaPosition: () => void;
}

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Defaults
  const [language, setLanguageState] = useState<Language>('ar');
  const [theme, setThemeState] = useState<Theme>('dark');
  const [fontSize, setFontSizeState] = useState<FontSize>(2); // Default is 2
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [omdaEnabled, setOmdaEnabledState] = useState(true); // Default to true
  const [omdaResetTrigger, setOmdaResetTrigger] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  // Load from local storage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('instagen_lang') as Language;
    // Validate language exists in translations, otherwise default to 'ar'
    if (savedLang && translations[savedLang]) {
        setLanguageState(savedLang);
    } else {
        setLanguageState('ar');
    }
    
    const savedTheme = localStorage.getItem('instagen_theme') as Theme;
    if (savedTheme) setThemeState(savedTheme);

    const savedFontSize = parseInt(localStorage.getItem('instagen_fontsize') || '2') as FontSize;
    if (savedFontSize >= 1 && savedFontSize <= 5) setFontSizeState(savedFontSize);

    const onboardStatus = localStorage.getItem('instagen_onboarded');
    setHasCompletedOnboarding(onboardStatus === 'true');

    const omdaStatus = localStorage.getItem('instagen_omda_enabled');
    if (omdaStatus !== null) {
        setOmdaEnabledState(omdaStatus === 'true');
    }
    
    setIsLoaded(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('instagen_lang', lang);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('instagen_theme', t);
  };

  const setFontSize = (size: FontSize) => {
      setFontSizeState(size);
      localStorage.setItem('instagen_fontsize', size.toString());
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem('instagen_onboarded', 'true');
  };

  const setOmdaEnabled = (enabled: boolean) => {
      setOmdaEnabledState(enabled);
      localStorage.setItem('instagen_omda_enabled', String(enabled));
  };

  const resetOmdaPosition = () => {
      setOmdaResetTrigger(prev => prev + 1);
      setOmdaEnabledState(true); // Re-enable if it was hidden
      localStorage.removeItem('omda_button_pos');
      localStorage.removeItem('omda_window_pos');
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
    // Haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Apply Theme to Body
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Apply Font Size Logic (Text Only, Keep Layout Stable)
  useEffect(() => {
      // 1. Reset Root Font Size (so REM units for padding/margin stay at default ~16px)
      // This fixes the issue of buttons getting huge.
      document.documentElement.style.fontSize = '';

      // 2. Define scaling deltas for text classes
      // We add to the base REM value for *text classes* only.
      // Default Tailwind map: xs=0.75, sm=0.875, base=1, lg=1.125, xl=1.25
      const scales: Record<FontSize, number> = {
          1: -0.15, // Tiny 
          2: 0,     // Normal (Default)
          3: 0.15,  // Medium
          4: 0.35,  // Large
          5: 0.6    // Huge
      };
      
      const delta = scales[fontSize] || 0;
      
      // We inject a style tag to override Tailwind classes globally based on the setting
      const styleId = 'dynamic-text-sizing';
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) existingStyle.remove();

      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        /* Scale base font for elements without class */
        html, body { font-size: ${1 + delta}rem; }
        
        /* Override Tailwind Utility Classes to scale TEXT ONLY */
        .text-xs { font-size: ${0.75 + delta}rem !important; line-height: 1.4 !important; }
        .text-sm { font-size: ${0.875 + delta}rem !important; line-height: 1.5 !important; }
        .text-base { font-size: ${1 + delta}rem !important; line-height: 1.6 !important; }
        .text-lg { font-size: ${1.125 + delta}rem !important; line-height: 1.6 !important; }
        .text-xl { font-size: ${1.25 + delta}rem !important; line-height: 1.6 !important; }
        .text-2xl { font-size: ${1.5 + delta}rem !important; line-height: 1.5 !important; }
        .text-3xl { font-size: ${1.875 + delta}rem !important; line-height: 1.4 !important; }
        .text-4xl { font-size: ${2.25 + delta}rem !important; line-height: 1.3 !important; }
      `;
      document.head.appendChild(style);

  }, [fontSize]);

  // Apply RTL Direction to Body
  const isRTL = language === 'ar';
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [isRTL, language]);

  const t = (key: string) => {
    // Safe translation lookup
    const langDict = translations[language];
    if (langDict && langDict[key]) {
        return langDict[key];
    }
    // Fallback to Arabic if key missing
    if (translations['ar'] && translations['ar'][key]) {
        return translations['ar'][key];
    }
    // Fallback to key itself
    return key;
  };

  if (!isLoaded) return null;

  return (
    <SettingsContext.Provider value={{ language, setLanguage, theme, setTheme, fontSize, setFontSize, t, isRTL, hasCompletedOnboarding, completeOnboarding, showToast, omdaEnabled, setOmdaEnabled, omdaResetTrigger, resetOmdaPosition }}>
      {children}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.visible} 
        onClose={hideToast} 
      />
    </SettingsContext.Provider>
  );
};
