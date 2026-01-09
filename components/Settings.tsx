
import React, { useState, useContext } from 'react';
import { Icons } from './Icons';
import { useSettings } from '../contexts/SettingsContext';
import { Language, Theme, FontSize } from '../types';
import { BottomSheet } from './BottomSheet';
import { AppContext } from '../App';

interface SettingsProps {
  onBack: () => void;
  currentUser: any;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, currentUser }) => {
  const { language, setLanguage, theme, setTheme, fontSize, setFontSize, t, isRTL, omdaEnabled, setOmdaEnabled, resetOmdaPosition, showToast } = useSettings();
  const { updateUserProfile } = useContext(AppContext);
  
  // Selection Modals State
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showFontSheet, setShowFontSheet] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Privacy State (Synced with User Profile)
  const isPrivateAccount = currentUser?.isPrivate || false;

  const togglePrivacy = () => {
      const newState = !isPrivateAccount;
      updateUserProfile(currentUser.id, { isPrivate: newState });
      showToast(newState ? "تم تفعيل الحساب الخاص 🔒" : "تم تحويل الحساب لعام 🌍", "success");
  };

  const SettingItem = ({ icon: Icon, label, value, onClick, isSwitch, switchValue, onSwitchChange, destructive }: any) => (
    <div 
      onClick={isSwitch ? undefined : onClick} 
      className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors ${destructive ? 'text-red-500' : ''} last:border-0`}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className={`w-5 h-5 ${destructive ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`} />}
        <span className={`text-base font-medium ${destructive ? 'text-red-500' : 'dark:text-gray-200'}`}>{label}</span>
      </div>
      
      {isSwitch ? (
          <button 
            onClick={() => onSwitchChange(!switchValue)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${switchValue ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${switchValue ? (isRTL ? '-translate-x-6' : 'translate-x-6') : ''}`} />
          </button>
      ) : (
        <div className="flex items-center gap-2 text-gray-400">
            <span className="text-sm font-bold text-blue-500">{value}</span>
            {onClick && (isRTL ? <Icons.ChevronLeft className="w-5 h-5" /> : <Icons.ChevronRight className="w-5 h-5" />)}
        </div>
      )}
    </div>
  );

  const Header = ({ title, backAction }: { title: string, backAction: () => void }) => (
    <div className="sticky top-0 bg-white dark:bg-black z-10 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4">
      <button onClick={backAction}>
        <Icons.Back className="w-6 h-6 dark:text-white" />
      </button>
      <h1 className="text-xl font-bold dark:text-white">{title}</h1>
    </div>
  );

  const SelectionOption = ({ label, selected, onClick, icon: Icon }: any) => (
      <button 
        onClick={onClick}
        className={`w-full p-4 flex items-center justify-between rounded-xl mb-2 transition-colors ${selected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white'}`}
      >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5" />}
            <span className="font-medium">{label}</span>
          </div>
          {selected && <Icons.Check className="w-5 h-5" />}
      </button>
  );

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen pb-10">
      <Header title={t('settings')} backAction={onBack} />

      <div className="p-4 space-y-6">
        
        {/* Section 1: Appearance & Language */}
        <div>
            <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 px-2">العرض واللغة</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
                <SettingItem 
                    icon={Icons.Globe} 
                    label={t('language')} 
                    value={language.toUpperCase()} 
                    onClick={() => setShowLangSheet(true)}
                />
                <SettingItem 
                    icon={theme === 'dark' ? Icons.Moon : Icons.Sun} 
                    label={t('theme')} 
                    value={theme === 'auto' ? t('autoMode') : theme === 'dark' ? t('darkMode') : t('lightMode')} 
                    onClick={() => setShowThemeSheet(true)}
                />
                <SettingItem 
                    icon={Icons.Type} 
                    label={t('fontSize')} 
                    value={`${fontSize} / 5`} 
                    onClick={() => setShowFontSheet(true)}
                />
            </div>
        </div>

        {/* Section 2: AI & Smart Features */}
        <div>
            <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 px-2">{t('smartFeatures')}</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
                <SettingItem 
                    icon={Icons.Magic} 
                    label="المساعد الذكي (العمدة)" 
                    isSwitch={true}
                    switchValue={omdaEnabled}
                    onSwitchChange={setOmdaEnabled}
                />
                <SettingItem 
                    icon={Icons.Trash} 
                    label={t('omdaReset')} 
                    value={t('reset')}
                    onClick={() => { resetOmdaPosition(); showToast('تم إعادة العمدة لمكانه!', 'success'); }}
                />
            </div>
        </div>

        {/* Section 3: General & Privacy */}
        <div>
            <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 px-2">الحساب والخصوصية</h2>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
                <SettingItem 
                    icon={Icons.Lock} 
                    label="حساب خاص (Private)" 
                    isSwitch={true}
                    switchValue={isPrivateAccount}
                    onSwitchChange={togglePrivacy}
                />
                <p className="px-4 py-2 text-[10px] text-gray-400">
                    عند تفعيل الحساب الخاص، لن يتمكن أحد من رؤية منشوراتك إلا متابعوك فقط.
                </p>
                <div className="border-t border-gray-100 dark:border-gray-800"></div>
                <SettingItem 
                    icon={Icons.Bell} 
                    label={t('notifications')} 
                    isSwitch={true}
                    switchValue={notificationsEnabled}
                    onSwitchChange={setNotificationsEnabled}
                />
            </div>
        </div>

        <div className="text-center pt-4">
            <p className="text-gray-400 text-xs font-branding font-bold">الرقة الغربية v3.1 Pro</p>
        </div>

      </div>

      {/* --- Modals --- */}

      {/* Language Sheet */}
      <BottomSheet isOpen={showLangSheet} onClose={() => setShowLangSheet(false)} title={t('language')}>
          <SelectionOption label="العربية" selected={language === 'ar'} onClick={() => { setLanguage('ar'); setShowLangSheet(false); }} />
          <SelectionOption label="English" selected={language === 'en'} onClick={() => { setLanguage('en'); setShowLangSheet(false); }} />
          <SelectionOption label="Français" selected={language === 'fr'} onClick={() => { setLanguage('fr'); setShowLangSheet(false); }} />
          <SelectionOption label="Deutsch" selected={language === 'de'} onClick={() => { setLanguage('de'); setShowLangSheet(false); }} />
      </BottomSheet>

      {/* Theme Sheet */}
      <BottomSheet isOpen={showThemeSheet} onClose={() => setShowThemeSheet(false)} title={t('theme')}>
          <SelectionOption icon={Icons.Sun} label={t('lightMode')} selected={theme === 'light'} onClick={() => { setTheme('light'); setShowThemeSheet(false); }} />
          <SelectionOption icon={Icons.Moon} label={t('darkMode')} selected={theme === 'dark'} onClick={() => { setTheme('dark'); setShowThemeSheet(false); }} />
          <SelectionOption icon={Icons.Settings} label={t('autoMode')} selected={theme === 'auto'} onClick={() => { setTheme('auto'); setShowThemeSheet(false); }} />
      </BottomSheet>

      {/* Font Size Sheet */}
      <BottomSheet isOpen={showFontSheet} onClose={() => setShowFontSheet(false)} title={t('fontSize')}>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-6 text-center transition-all duration-300">
              <p className="text-gray-500 text-xs mb-2">معاينة النص / Preview</p>
              <p className="dark:text-white leading-relaxed">
                  بسم الله الرحمن الرحيم<br/>
                  تطبيق الرقة الغربية يرحب بكم.
              </p>
          </div>

          <div className="flex justify-between items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl mb-4">
              {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => { setFontSize(lvl as FontSize); }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all shadow-sm
                        ${fontSize === lvl 
                            ? 'bg-blue-600 text-white scale-110 shadow-blue-500/30' 
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                  >
                      {lvl}
                  </button>
              ))}
          </div>
          <button onClick={() => setShowFontSheet(false)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
              {t('saveChanges')}
          </button>
      </BottomSheet>
    </div>
  );
};
