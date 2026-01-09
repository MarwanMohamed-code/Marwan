
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Post, AppContextType, ViewState, ReactionType, AiDraftData, AppNotification } from './types';
import { Icons } from './components/Icons';
import { PostItem } from './components/PostItem';
import { CreatePost } from './components/CreatePost';
import { PostDetail } from './components/PostDetail';
import { Settings } from './components/Settings';
import { EditProfile } from './components/EditProfile';
import { BottomSheet, ActionItem } from './components/BottomSheet';
import { CommentsSheet } from './components/CommentsSheet';
import { StoryViewer } from './components/StoryViewer';
import { VillageSidebar } from './components/VillageSidebar';
import { ServiceListing, PlaceDetail, ProductDetail } from './components/VillageServices';
import { GameHub } from './components/Games/GameHub';
import { NotificationsView } from './components/NotificationsView'; 
import { AddProduct } from './components/AddProduct';
import { AiImageEditor } from './components/AiImageEditor';
import { addProductToPlace, PLACES_DATA, Place, Product } from './services/villageData';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { formatRelativeTime } from './utils/dateUtils';
import { GuidedTour } from './components/GuidedTour'; 
import { OmdaAssistant } from './components/OmdaAssistant'; 
import { 
  registerWithEmail,
  logInWithEmail,
  logInWithGoogle,
  checkGoogleLoginResult, // New Function
  logOut,
  subscribeToAuth, 
  saveUserToDb, 
  getUserFromDb, 
  subscribeToUsers, 
  subscribeToPosts, 
  createPostInDb, 
  updatePostInDb, 
  addCommentToDb, 
  deletePostFromDb,
  subscribeToPlaces,
  updatePlaceInDb,
  addProductToPlaceDb,
  requestNotificationPermission, 
  onMessageListener,
  sendNotificationToUser,
  ensureUserDocument 
} from './services/firebase';

// --- Context Definition ---
export const AppContext = React.createContext<AppContextType>({} as AppContextType);

// --- Onboarding Screen ---
const OnboardingScreen: React.FC = () => {
  const { setLanguage, setTheme, completeOnboarding, t, language, theme } = useSettings();
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col items-center justify-center p-6 transition-colors duration-500">
       <div className="max-w-md w-full text-center space-y-8 animate-pop-in">
          <div className="mb-8">
             <h1 className="text-5xl font-bold font-branding mb-2 bg-gradient-to-r from-purple-600 to-orange-500 text-transparent bg-clip-text pb-2">{t('appName')}</h1>
             <p className="text-gray-500 text-lg">القرية الذكية بين يديك</p>
          </div>

          {step === 0 && (
            <div className="space-y-4">
               <h2 className="text-2xl font-bold dark:text-white mb-6">Choose Language / اختر اللغة</h2>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setLanguage('ar')} className={`p-4 rounded-xl border-2 ${language === 'ar' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800'} dark:text-white font-bold`}>العربية</button>
                  <button onClick={() => setLanguage('en')} className={`p-4 rounded-xl border-2 ${language === 'en' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800'} dark:text-white font-bold`}>English</button>
               </div>
               <button onClick={() => setStep(1)} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold mt-8 shadow-lg active:scale-95 transition-transform">{t('next')}</button>
            </div>
          )}

          {step === 1 && (
             <div className="space-y-4">
                <h2 className="text-2xl font-bold dark:text-white mb-6">{t('theme')}</h2>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setTheme('light')} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 ${theme === 'light' ? 'border-blue-500 bg-gray-50' : 'border-gray-200'}`}>
                      <Icons.Sun className="w-10 h-10 text-orange-500" />
                      <span className="font-bold text-black">{t('lightMode')}</span>
                   </button>
                   <button onClick={() => setTheme('dark')} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 ${theme === 'dark' ? 'border-blue-500 bg-gray-800' : 'border-gray-800 bg-gray-900'}`}>
                      <Icons.Moon className="w-10 h-10 text-purple-400" />
                      <span className="font-bold text-white">{t('darkMode')}</span>
                   </button>
                </div>
                <button onClick={completeOnboarding} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold mt-8 shadow-lg shadow-blue-500/30 active:scale-95 transition-transform">
                  {t('loginButton')} &rarr;
                </button>
             </div>
          )}
       </div>
    </div>
  );
};

// --- Auth Component ---
const AuthScreen: React.FC<{ onGuestLogin: () => void }> = ({ onGuestLogin }) => {
  const { t, showToast } = useSettings();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check for Redirect Result on Mount (For Error Handling)
  useEffect(() => {
      checkGoogleLoginResult().then((user) => {
          if (user) {
              // Success handled by onAuthStateChanged, we just want to know if it finished.
              console.log("Redirect success");
          }
      }).catch((err) => {
          console.error("Redirect Error Catch:", err);
          const msg = getErrorMessage(err.code || err.message);
          showToast(msg, "error");
          setLoading(false);
      });
  }, []);

  // ترجمة رسائل أخطاء فايربيس للعربية
  const getErrorMessage = (code: string) => {
      if (typeof code !== 'string') return "حدث خطأ غير معروف";
      if (code.includes('auth/invalid-email')) return "البريد الإلكتروني غير صحيح";
      if (code.includes('auth/user-disabled')) return "تم تعطيل هذا الحساب";
      if (code.includes('auth/user-not-found')) return "الحساب غير موجود";
      if (code.includes('auth/wrong-password')) return "كلمة المرور خاطئة";
      if (code.includes('auth/invalid-credential')) return "البيانات غير صحيحة";
      if (code.includes('auth/email-already-in-use')) return "البريد الإلكتروني مسجل بالفعل";
      if (code.includes('auth/weak-password')) return "كلمة المرور ضعيفة";
      if (code.includes('auth/network-request-failed')) return "مشكلة في الاتصال بالإنترنت";
      // Explicitly show the hostname for unauthorized domain errors
      if (code.includes('auth/unauthorized-domain')) {
          return `⚠️ الدومين (${window.location.hostname}) غير مصرح به! قم بإضافته في إعدادات Firebase -> Authentication -> Authorized Domains`;
      }
      if (code.includes('auth/api-key-not-valid')) return "مفتاح API غير صحيح.";
      if (code.includes('auth/popup-closed-by-user')) return "تم إغلاق النافذة قبل اكتمال الدخول.";
      return "حدث خطأ: " + code;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanEmail = email.trim();
    
    try {
      if (isLogin) {
        await logInWithEmail(cleanEmail, password);
      } else {
        if (!username.trim()) { showToast("اسم المستخدم مطلوب", "error"); setLoading(false); return; }
        const userCred = await registerWithEmail(cleanEmail, password);
        const newUser: User = { 
            id: userCred.user.uid, 
            username: username.replace(/\s+/g, '_').toLowerCase(), 
            fullName: username, 
            avatarUrl: `https://ui-avatars.com/api/?name=${username}&background=random`, 
            bio: 'مشترك جديد في الرقة ✨', 
            followers: 0, 
            following: 0, 
            savedPostIds: [], 
            isPrivate: false, 
            followingIds: [] 
        };
        await saveUserToDb(newUser);
        showToast("تم إنشاء الحساب بنجاح", "success");
      }
    } catch (err: any) {
      const msg = getErrorMessage(err.code || err.message);
      showToast(msg, "error");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // This will redirect the page, so no code runs after this line immediately
      await logInWithGoogle();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      let msg = getErrorMessage(err.code || err.message);
      showToast(msg, "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-black px-4 transition-colors">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl w-full max-w-sm animate-pop-in mt-10">
        <h1 className="text-4xl font-bold font-branding text-center mb-2 dark:text-white tracking-tighter">{t('appName')}</h1>
        <p className="text-center text-gray-500 text-sm mb-8">{isLogin ? "مرحباً بك في مجتمعك الرقمي" : "انضم لمجتمع القرية الذكي"}</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <Icons.Profile className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input type="text" placeholder={t('username')} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none dark:text-white" value={username} onChange={(e) => setUsername(e.target.value)} required={!isLogin} />
            </div>
          )}
          <div className="relative">
            <Icons.Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input type="email" placeholder="البريد الإلكتروني" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none dark:text-white" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="relative">
             <Icons.Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
             <input type={showPassword ? "text" : "password"} placeholder={t('password')} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none dark:text-white" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">{showPassword ? <Icons.EyeOff className="w-5 h-5"/> : <Icons.Eye className="w-5 h-5"/>}</button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 flex justify-center items-center">{loading ? <Icons.Loading className="w-5 h-5 animate-spin"/> : (isLogin ? t('loginButton') : "إنشاء حساب")}</button>
        </form>
        
        <div className="flex items-center gap-4 my-6"><div className="h-[1px] bg-gray-200 dark:bg-gray-800 flex-1"></div><span className="text-xs text-gray-400 font-medium">أو</span><div className="h-[1px] bg-gray-200 dark:bg-gray-800 flex-1"></div></div>
        
        <button onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 mb-3">
            {loading ? <Icons.Loading className="w-5 h-5 animate-spin" /> : <Icons.Google className="w-5 h-5" />} 
            تسجيل الدخول بـ Google
        </button>
        <button onClick={onGuestLogin} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-2">دخول كزائر (بدون حساب)</button>
        
        <div className="mt-8 text-center text-sm"><span className="text-gray-500">{isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}</span><button onClick={() => setIsLogin(!isLogin)} className="ml-2 font-semibold text-blue-600 hover:underline">{isLogin ? "تسجيل جديد" : "دخول"}</button></div>
      </div>
    </div>
  );
};

// --- Layout & Sidebar ---
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentView, setCurrentView, currentUser, setViewedProfileId, unreadNotificationsCount } = React.useContext(AppContext);
  const { t } = useSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { setSelectedServiceCategory } = React.useContext(AppContext);

  const navItems: { id: ViewState; icon: any; label: string; badge?: number }[] = [
    { id: 'home', icon: Icons.Home, label: 'home' },
    { id: 'search', icon: Icons.Search, label: 'search' },
    { id: 'create', icon: Icons.Create, label: 'create' },
    { id: 'notifications', icon: Icons.Bell, label: 'notifications', badge: unreadNotificationsCount },
    { id: 'profile', icon: Icons.Profile, label: 'profile' },
  ];

  const handleNav = (id: string) => {
    if (id === 'profile' && currentUser) {
      setViewedProfileId(currentUser.id);
    }
    setCurrentView(id as ViewState);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-full bg-gray-50 dark:bg-black transition-colors duration-300">
      <VillageSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onSelectService={(serviceId) => {
            setSelectedServiceCategory(serviceId);
            setCurrentView('village_services');
        }}
      />

      <div className="hidden md:flex flex-col w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 px-4 py-8">
        <h1 id="app-header" className="text-2xl font-bold font-branding mb-8 px-2 cursor-pointer dark:text-white bg-gradient-to-r from-purple-500 to-orange-500 bg-clip-text text-transparent w-fit" onClick={() => setCurrentView('home')}>{t('appName')}</h1>
        <nav className="flex-1 space-y-2">
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`flex items-center gap-4 p-3 rounded-full w-full transition-all duration-300 
                ${currentView === item.id 
                    ? 'bg-blue-500/10 text-blue-500 font-bold dark:bg-blue-500/20' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400'}`}
            >
              <div className="relative">
                  <item.icon className={`w-6 h-6 ${currentView === item.id ? 'stroke-[2.5px]' : ''}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{item.badge}</span>
                  )}
              </div>
              <span className="text-base">{t(item.label)}</span>
            </button>
          ))}
          <button 
             onClick={() => setIsSidebarOpen(true)}
             className={`flex items-center gap-4 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 w-full transition-colors dark:text-white mt-4 font-bold text-blue-500`}
          >
             <Icons.Menu className="w-6 h-6" />
             <span className="text-base">خدمات القرية</span>
          </button>
          <button 
             onClick={() => setCurrentView('settings')}
             className={`flex items-center gap-4 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 w-full transition-colors dark:text-white mt-auto ${currentView === 'settings' ? 'bg-blue-500/10 text-blue-500 font-bold' : ''}`}
          >
             <Icons.Settings className="w-6 h-6" />
             <span className="text-base">{t('settings')}</span>
          </button>
        </nav>
      </div>

      <main className="flex-1 w-full max-w-screen-md mx-auto md:py-8 min-h-full">
        {currentView === 'home' && (
             <div className="md:hidden flex items-center justify-between px-4 py-2 sticky top-0 z-10 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <h1 id="app-header" className="text-xl font-bold font-branding dark:text-white bg-gradient-to-r from-purple-500 to-orange-500 bg-clip-text text-transparent cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  {t('appName')}
                </h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarOpen(true)} id="nav-services">
                        <Icons.Menu className="w-7 h-7 dark:text-white" />
                    </button>
                    <button onClick={() => {
                        const shareData = { title: 'الرقة الغربية', text: 'انضم لمجتمعنا الرقمي!', url: window.location.href };
                        if (navigator.share) navigator.share(shareData).catch(() => {});
                        else { navigator.clipboard.writeText(window.location.href); alert("تم نسخ الرابط"); }
                    }}>
                        <Icons.Share className="w-6 h-6 dark:text-white" />
                    </button>
                </div>
             </div>
        )}
        {children}
      </main>

      {currentView !== 'restaurant_detail' && currentView !== 'product_detail' && currentView !== 'add_product' && currentView !== 'ai_editor' && currentView !== 'village_services' && (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 flex justify-around items-start pt-2 z-50 px-2 dark:text-white h-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] backdrop-blur-md bg-white/95 dark:bg-black/95">
         {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`p-2 active:scale-90 transition-all rounded-xl relative ${currentView === item.id ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 dark:text-gray-400'}`}
              id={item.id === 'create' ? 'nav-create' : item.id === 'profile' ? 'nav-profile' : ''}
            >
              <item.icon className={`w-6 h-6 ${currentView === item.id ? 'stroke-[2.5px]' : ''}`} />
              {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full font-bold">{item.badge}</span>
              )}
            </button>
          ))}
          <button onClick={() => setCurrentView('settings')} className={`p-2 active:scale-90 transition-all rounded-xl ${currentView === 'settings' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 dark:text-gray-400'}`}>
              <Icons.Settings className={`w-6 h-6 ${currentView === 'settings' ? 'stroke-[2.5px]' : ''}`} />
          </button>
      </div>
      )}
      <GuidedTour />
      <OmdaAssistant onNavigate={(v) => setCurrentView(v)} currentView={currentView} currentUser={currentUser} />
    </div>
  );
};

// --- ProfileView Component ---
// (No changes needed here, assuming existing ProfileView is imported or defined similarly)
const ProfileView: React.FC<{ userId: string }> = ({ userId }) => {
  const { users, posts, currentUser, followUser, setCurrentView, setViewedPostId } = React.useContext(AppContext);
  const { t } = useSettings();
  
  const user = users.find(u => u.id === userId) || (currentUser?.id === userId ? currentUser : null);
  const userPosts = posts.filter(p => p.userId === userId);
  const isOwnProfile = currentUser?.id === userId;
  const isFollowing = currentUser?.followingIds?.includes(userId) || false;
  const isPrivate = user?.isPrivate || false;
  const canSeeContent = isOwnProfile || !isPrivate || isFollowing;

  if (!user) return <div className="p-4 text-center">User not found</div>;

  return (
    <div className="bg-white dark:bg-black min-h-screen pb-20 animate-slide-up">
      <div className="relative">
         <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500"></div>
         <div className="px-4 pb-4">
            <div className="relative flex justify-between items-end -mt-12 mb-4">
               <div className="w-24 h-24 rounded-full border-4 border-white dark:border-black overflow-hidden bg-gray-200">
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
               </div>
               {isOwnProfile ? (
                 <button onClick={() => setCurrentView('edit_profile')} className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-4 py-1.5 rounded-lg font-bold text-sm border border-gray-300 dark:border-gray-700">
                   {t('editProfile')}
                 </button>
               ) : (
                 <button onClick={() => followUser(userId)} className={`${isFollowing ? 'bg-gray-200 text-gray-800' : 'bg-blue-500 text-white'} px-6 py-1.5 rounded-lg font-bold text-sm transition-colors`}>
                   {isFollowing ? 'أتابعه' : t('follow')}
                 </button>
               )}
            </div>
            
            <div className="mb-6">
               <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">{user.fullName}{isPrivate && <Icons.Lock className="w-4 h-4 text-gray-500" />}</h2>
               <p className="text-gray-500 text-sm">@{user.username}</p>
               <p className="text-gray-800 dark:text-gray-300 mt-2 text-sm whitespace-pre-wrap">{user.bio}</p>
            </div>

            <div className="flex justify-around border-y border-gray-100 dark:border-gray-800 py-3 mb-4">
               <div className="text-center"><div className="font-bold text-lg dark:text-white">{userPosts.length}</div><div className="text-xs text-gray-500">{t('posts')}</div></div>
               <div className="text-center"><div className="font-bold text-lg dark:text-white">{user.followers}</div><div className="text-xs text-gray-500">{t('followers')}</div></div>
               <div className="text-center"><div className="font-bold text-lg dark:text-white">{user.following}</div><div className="text-xs text-gray-500">{t('following')}</div></div>
            </div>

            {!canSeeContent ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-gray-200 dark:border-gray-800 rounded-2xl mx-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center mb-4"><Icons.Lock className="w-8 h-8 text-gray-400" /></div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">الحساب خاص</h3>
                    <p className="text-sm">تابع هذا الحساب لرؤية صوره وفيديوهاته.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-1">
                {userPosts.map(post => (
                    <div key={post.id} onClick={() => setViewedPostId(post.id)} className="aspect-square bg-gray-100 dark:bg-gray-900 relative cursor-pointer group">
                        <img src={post.images?.[0] || post.imageUrl} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                    </div>
                ))}
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---
const MainApp: React.FC = () => {
  const { t, hasCompletedOnboarding, showToast } = useSettings();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [posts, setPosts] = useState<Post[]>(() => {
      try { return JSON.parse(localStorage.getItem('cached_posts_v1') || '[]'); } catch { return []; }
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [viewedProfileId, setViewedProfileId] = useState<string | null>(null);
  const [viewedPostId, setViewedPostId] = useState<string | null>(null);
  const [viewedImageIndex, setViewedImageIndex] = useState<number>(0); 
  const [isGuest, setIsGuest] = useState(false);
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // States for Omda Integration
  const [searchQuery, setSearchQuery] = useState('');
  const [aiDraft, setAiDraft] = useState<AiDraftData | null>(null);
  
  const [places, setPlaces] = useState<Place[]>(PLACES_DATA);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [storyUser, setStoryUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);

  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);

  useEffect(() => {
      const handleOnline = () => setIsOfflineMode(false);
      const handleOffline = () => { setIsOfflineMode(true); showToast("لا يوجد إنترنت. أنت تتصفح نسخة محفوظة.", "info"); };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
      onMessageListener().then((payload: any) => {
          console.log("Received foreground message: ", payload);
          showToast(`🔔 ${payload.notification?.title}: ${payload.notification?.body}`, "info");
      }).catch(err => console.log('failed: ', err));
  }, []);

  // --- Auth & Data Subscriptions ---
  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribePosts: (() => void) | undefined;
    let unsubscribePlaces: (() => void) | undefined;

    // Handle Guest Mode immediately
    if (isGuest) {
      const storedPosts = localStorage.getItem('guest_posts');
      if (storedPosts) setPosts(JSON.parse(storedPosts));
      setIsFirebaseReady(true);
      return;
    }

    const unsubscribeAuth = subscribeToAuth(async (authUser) => {
      if (authUser) {
          try {
            const dbUser = await ensureUserDocument(authUser);
            setCurrentUser(dbUser);
            setCurrentView('home');
            
            requestNotificationPermission(dbUser.id);
            if (!isOfflineMode) {
                unsubscribeUsers = subscribeToUsers(setUsers);
                unsubscribePosts = subscribeToPosts(setPosts);
                unsubscribePlaces = subscribeToPlaces((updatedPlacesMap) => {
                    setPlaces(prev => prev.map(p => updatedPlacesMap[p.id] ? { ...p, ...updatedPlacesMap[p.id] } : p));
                });
            }
          } catch(err) {
            console.error("Critical Auth Error:", err);
            showToast("حدث خطأ في تحميل بياناتك", "error");
            setCurrentUser(null);
          }
      } else {
          setCurrentUser(null);
          setCurrentView('login');
      }
      setIsFirebaseReady(true); 
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribePosts) unsubscribePosts();
      if (unsubscribePlaces) unsubscribePlaces();
    };
  }, [isGuest, isOfflineMode]);

  const handleGuestLogin = () => {
     setIsGuest(true);
     const guestUser: User = { id: 'guest_user', username: 'guest', fullName: 'زائر', avatarUrl: 'https://ui-avatars.com/api/?name=Guest&background=random', bio: 'زائر', followers: 0, following: 0, savedPostIds: [], isPrivate: false, followingIds: [] };
     setCurrentUser(guestUser);
     setCurrentView('home');
     showToast("مرحباً بك كزائر", "info");
  };

  const logout = async () => {
    if (isGuest) { setIsGuest(false); setCurrentUser(null); setCurrentView('login'); }
    else { await logOut(); setCurrentUser(null); setCurrentView('login'); }
    showToast("تم تسجيل الخروج", "info");
  };

  const createPost = async (postData: Omit<Post, 'id' | 'likes' | 'comments' | 'timestamp' | 'reactions'>) => {
    if (!currentUser) return;
    const newPost: Post = { ...postData, id: isGuest ? `local_${Date.now()}` : '', userId: currentUser.id, likes: [], reactions: [], comments: [], timestamp: Date.now() };
    if (isGuest || isOfflineMode) setPosts(prev => [newPost, ...prev]);
    if (!isGuest && !isOfflineMode) await createPostInDb(newPost);
    setCurrentView('home');
    setAiGeneratedImage(null);
    setAiDraft(null);
    showToast("تم النشر بنجاح!", "success");
  };

  const deletePost = async (postId: string) => {
      if (isGuest || isOfflineMode) setPosts(prev => prev.filter(p => p.id !== postId));
      if (!isGuest && !isOfflineMode) await deletePostFromDb(postId);
      setActiveMenuPostId(null);
      if (viewedPostId === postId) setViewedPostId(null);
      showToast("تم الحذف", "info");
  };

  const updateUserProfile = async (userId: string, data: Partial<User>) => {
     if (isGuest || isOfflineMode) { if (currentUser?.id === userId) { setCurrentUser(prev => prev ? ({ ...prev, ...data }) : null); } } 
     if (!isGuest && !isOfflineMode) { await saveUserToDb({ ...currentUser!, ...data }); if (currentUser?.id === userId) setCurrentUser({ ...currentUser, ...data }); }
  };

  const toggleLike = async (postId: string, reactionType?: ReactionType, imageIndex?: number) => {
    if (!currentUser) return;
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const post = posts[postIndex];
    let updatedPost = { ...post };

    if (imageIndex !== undefined) {
        const mediaReactions = post.mediaReactions ? { ...post.mediaReactions } : {};
        const currentReactions = mediaReactions[imageIndex] || [];
        const existingIdx = currentReactions.findIndex(r => r.userId === currentUser.id);
        if (existingIdx > -1) {
             if (!reactionType || currentReactions[existingIdx].type === reactionType) currentReactions.splice(existingIdx, 1);
             else currentReactions[existingIdx].type = reactionType;
        } else if (reactionType) {
             currentReactions.push({ userId: currentUser!.id, type: reactionType });
             if(!isGuest && !isOfflineMode) sendNotificationToUser(post.userId, "إعجاب جديد ❤️", `قام ${currentUser.username} بالإعجاب بصورتك`);
        }
        mediaReactions[imageIndex] = currentReactions;
        updatedPost.mediaReactions = mediaReactions;
    } else {
        let newReactions = post.reactions ? [...post.reactions] : [];
        let newLikes = post.likes ? [...post.likes] : [];
        const existIdx = newReactions.findIndex(r => r.userId === currentUser.id);
        if (existIdx > -1) {
            if (!reactionType || newReactions[existIdx].type === reactionType) {
                newReactions.splice(existIdx, 1);
                newLikes = newLikes.filter(id => id !== currentUser.id);
            } else newReactions[existIdx].type = reactionType;
        } else if (reactionType) {
            newReactions.push({ userId: currentUser.id, type: reactionType });
            if (!newLikes.includes(currentUser.id)) newLikes.push(currentUser.id);
            if(!isGuest && !isOfflineMode) sendNotificationToUser(post.userId, "إعجاب جديد ❤️", `قام ${currentUser.username} بالإعجاب بمنشورك`);
        }
        updatedPost.reactions = newReactions;
        updatedPost.likes = newLikes;
    }
    setPosts(prev => { const n = [...prev]; n[postIndex] = updatedPost; return n; });
    if (!isGuest && !isOfflineMode) await updatePostInDb(postId, imageIndex !== undefined ? { mediaReactions: updatedPost.mediaReactions } : { reactions: updatedPost.reactions, likes: updatedPost.likes });
  };

  const addComment = async (postId: string, text: string, imageIndex?: number) => {
    if (!currentUser) return;
    const newComment = { id: `c_${Date.now()}`, userId: currentUser.id, username: currentUser.username, text, timestamp: Date.now() };
    setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        if (imageIndex !== undefined) {
            const mc = p.mediaComments ? { ...p.mediaComments } : {};
            mc[imageIndex] = [...(mc[imageIndex] || []), newComment];
            return { ...p, mediaComments: mc };
        }
        return { ...p, comments: [...p.comments, newComment] };
    }));
    if (!isGuest && !isOfflineMode) {
        await addCommentToDb(postId, newComment, imageIndex);
        const postOwner = posts.find(p => p.id === postId)?.userId;
        if (postOwner) sendNotificationToUser(postOwner, "تعليق جديد 💬", `علق ${currentUser.username}: ${text}`);
    }
  };

  const followUser = async (targetId: string) => {
      if (!currentUser) return;
      const currentFollowing = currentUser.followingIds || [];
      if (currentFollowing.includes(targetId)) {
          const newFollowing = currentFollowing.filter(id => id !== targetId);
          await updateUserProfile(currentUser.id, { following: Math.max(0, (currentUser.following || 0) - 1), followingIds: newFollowing });
      } else {
          const newFollowing = [...currentFollowing, targetId];
          await updateUserProfile(currentUser.id, { following: (currentUser.following || 0) + 1, followingIds: newFollowing });
          if(!isGuest && !isOfflineMode) sendNotificationToUser(targetId, "متابع جديد 👤", `بدأ ${currentUser.username} بمتابعتك`);
      }
  };

  const sortedAndFilteredPosts = useMemo(() => {
    let result = posts;
    if (searchQuery) result = result.filter(p => p.caption.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!currentUser) return result;
    result = result.filter(post => {
        const author = users.find(u => u.id === post.userId);
        if (!author || author.id === currentUser.id) return true;
        return !author.isPrivate || currentUser.followingIds?.includes(author.id);
    });
    return result.sort((a, b) => b.timestamp - a.timestamp); 
  }, [posts, searchQuery, currentUser, users]);

  const contextValue: AppContextType = {
    currentUser, posts, users, notifications, unreadNotificationsCount, markNotificationsAsRead: () => setNotifications(prev => prev.map(n => ({...n, read: true}))),
    login: async () => {}, logout, createPost, deletePost, updateUserProfile, toggleLike, addComment, followUser, 
    toggleSavePost: async (id) => { if (currentUser) { const s = currentUser.savedPostIds?.includes(id) ? currentUser.savedPostIds.filter(i=>i!==id) : [...(currentUser.savedPostIds||[]), id]; updateUserProfile(currentUser.id, {savedPostIds: s}); showToast("تم الحفظ", "info"); } }, 
    handleShare: async (p) => { if(navigator.share) navigator.share({title:'الرقة', text: p.caption, url: window.location.href}); else showToast("تم نسخ الرابط","success"); }, 
    currentView, setCurrentView, viewedProfileId, setViewedProfileId, viewedPostId, setViewedPostId, selectedServiceCategory, setSelectedServiceCategory, selectedPlaceId, setSelectedPlaceId, selectedProductId, setSelectedProductId, 
    addProduct: (pid, pdata) => { setPlaces(prev => prev.map(p => p.id === pid ? {...p, products: [{...pdata, id:`p_${Date.now()}`}, ...p.products]} : p)); addProductToPlaceDb(pid, {...pdata, id:`p_${Date.now()}`}); },
    searchQuery, setSearchQuery, aiDraft, setAiDraft, viewedImageIndex, setViewedImageIndex
  };

  if (!hasCompletedOnboarding) return <OnboardingScreen />;
  if (!isFirebaseReady) return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center">
            <Icons.Loading className="animate-spin w-10 h-10 mb-4 text-blue-500"/>
            <p className="font-bold">جاري تحميل التطبيق...</p>
        </div>
    </div>
  );
  if (!currentUser) return <AppContext.Provider value={contextValue}><AuthScreen onGuestLogin={handleGuestLogin} /></AppContext.Provider>;

  const viewedPost = viewedPostId ? posts.find(p => p.id === viewedPostId) : null;
  const viewedPostAuthor = viewedPost ? (users.find(u => u.id === viewedPost.userId) || currentUser) : null;

  return (
    <AppContext.Provider value={contextValue}>
      <Layout>
        {currentView === 'home' && (
           <div className="flex flex-col gap-4 pb-24 md:pb-0 relative">
             {isOfflineMode && <div className="bg-orange-500 text-white text-xs font-bold text-center py-1 -mt-4 mb-2 animate-pulse">أنت تتصفح نسخة محفوظة (بدون إنترنت)</div>}
             <div className="bg-white dark:bg-black p-4 border-b border-gray-200 dark:border-gray-800 md:border md:rounded-lg overflow-x-auto no-scrollbar flex space-x-4">
                <div className="flex flex-col items-center space-y-1 min-w-[64px] cursor-pointer" onClick={() => setCurrentView('create')}>
                     <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center relative">
                        <img src={currentUser.avatarUrl} className="w-full h-full rounded-full opacity-50 object-cover" alt="" />
                        <Icons.Create className="w-6 h-6 absolute text-black dark:text-white" />
                     </div>
                     <span className="text-xs truncate w-16 text-center dark:text-white">قصتي</span>
                </div>
                {[currentUser, ...users].filter(u => u.id !== currentUser?.id).slice(0, 8).map((u, i) => (
                   <div key={i} className="flex flex-col items-center space-y-1 min-w-[64px] cursor-pointer" onClick={() => setStoryUser(u)}>
                      <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
                        <div className="w-full h-full rounded-full border-2 border-white dark:border-black overflow-hidden bg-gray-200">
                           <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <span className="text-xs truncate w-16 text-center dark:text-white">{u.username}</span>
                   </div>
                ))}
             </div>
             <div className="flex flex-col gap-0 md:gap-4">
               {sortedAndFilteredPosts.length === 0 ? (
                 <div className="text-center py-20 text-gray-500">
                    <Icons.Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{isOfflineMode ? 'لا يوجد محتوى محفوظ' : t('noPosts')}</p>
                    {!isOfflineMode && <button onClick={() => setCurrentView('create')} className="text-blue-500 font-bold mt-2">أنشئ أول منشور لك</button>}
                 </div>
               ) : (
                 sortedAndFilteredPosts.map(post => (
                     <div key={post.id} className="relative">
                        <PostItem 
                            post={post} 
                            author={users.find(u => u.id === post.userId) || currentUser} 
                            currentUser={currentUser} 
                            onLike={toggleLike} 
                            onComment={(id) => setActiveCommentPostId(id)} 
                            onUserClick={(id) => { setViewedProfileId(id); setCurrentView('profile'); }} 
                            onPostClick={(id, idx) => { setViewedPostId(id); setViewedImageIndex(idx || 0); }} 
                            onMoreOptions={(id) => setActiveMenuPostId(id)} 
                            onShare={(p) => contextValue.handleShare(p)} 
                            onSave={contextValue.toggleSavePost} 
                            isSaved={currentUser.savedPostIds?.includes(post.id) || false} 
                        />
                     </div>
                 ))
               )}
             </div>
          </div>
        )}

        {currentView === 'search' && (
          <div className="p-4 pb-24 md:pb-4 min-h-screen">
             <div className="sticky top-0 bg-gray-50 dark:bg-black z-10 pb-4 space-y-3">
                 <div className="bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center p-2.5">
                     <Icons.Search className="w-5 h-5 text-gray-500" />
                     <input type="text" placeholder={t('search')} className="bg-transparent border-none outline-none ml-2 w-full dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
                 </div>
             </div>
             <div className="grid grid-cols-3 gap-1">{sortedAndFilteredPosts.map(post => (<div key={post.id} onClick={() => { setViewedPostId(post.id); setViewedImageIndex(0); }} className="aspect-square bg-gray-200 relative cursor-pointer"><img src={post.images?.[0] || post.imageUrl} className="w-full h-full object-cover" alt="" /></div>))}</div>
          </div>
        )}

        {currentView === 'create' && <CreatePost onPost={createPost} onCancel={() => { setCurrentView('home'); setAiDraft(null); }} initialImage={aiGeneratedImage} />}
        {currentView === 'activity' && <div className="p-4 bg-white dark:bg-black min-h-screen pb-24"><h2 className="font-bold text-2xl mb-6 dark:text-white">{t('activity')}</h2></div>}
        {currentView === 'notifications' && <NotificationsView />}
        {currentView === 'profile' && viewedProfileId && <ProfileView userId={viewedProfileId} />}
        {currentView === 'edit_profile' && <EditProfile user={currentUser} onCancel={() => setCurrentView('profile')} onSave={(id, data) => { updateUserProfile(id, data); setCurrentView('profile'); }} />}
        {currentView === 'settings' && <Settings onBack={() => setCurrentView('home')} currentUser={currentUser} />}

        {currentView === 'village_services' && selectedServiceCategory && (
            selectedServiceCategory === 'games' ? <GameHub onBack={() => setCurrentView('home')} /> : <ServiceListing category={selectedServiceCategory} places={places} onSelectPlace={(placeId) => { setSelectedPlaceId(placeId); setCurrentView('restaurant_detail'); }} onBack={() => setCurrentView('home')} />
        )}

        {currentView === 'restaurant_detail' && selectedPlaceId && <PlaceDetail placeId={selectedPlaceId} places={places} onBack={() => setCurrentView('village_services')} onSelectProduct={(productId) => { setSelectedProductId(productId); setCurrentView('product_detail'); }} onAddProductClick={() => setCurrentView('add_product')} onUpdatePlace={(id, data) => { setPlaces(prev => prev.map(p => p.id === id ? { ...p, ...data } : p)); updatePlaceInDb(id, data); }} />}
        {currentView === 'product_detail' && selectedProductId && <ProductDetail productId={selectedProductId} places={places} onBack={() => setCurrentView('restaurant_detail')} />}
        {currentView === 'add_product' && selectedPlaceId && <AddProduct onAdd={(product) => contextValue.addProduct(selectedPlaceId, product)} onCancel={() => setCurrentView('restaurant_detail')} />}
        {currentView === 'ai_editor' && <AiImageEditor onCancel={() => setCurrentView('profile')} onPost={(image) => { setAiGeneratedImage(image); setCurrentView('create'); }} onSetProfile={(image) => { if (currentUser) { updateUserProfile(currentUser.id, { avatarUrl: image }); setCurrentView('profile'); } }} />}

        {viewedPost && viewedPostAuthor && (
            <PostDetail 
                post={viewedPost} 
                author={viewedPostAuthor} 
                currentUser={currentUser} 
                onClose={() => setViewedPostId(null)} 
                onComment={addComment} 
                onLike={toggleLike}
                onShare={contextValue.handleShare}
                initialImageIndex={viewedImageIndex}
            />
        )}
        
        {storyUser && <StoryViewer user={storyUser} onClose={() => setStoryUser(null)} />}
        <CommentsSheet isOpen={!!activeCommentPostId} onClose={() => setActiveCommentPostId(null)} post={posts.find(p => p.id === activeCommentPostId) || null} currentUser={currentUser} onComment={(id, txt) => addComment(id, txt)} users={[currentUser, ...users]} />
        <BottomSheet isOpen={!!activeMenuPostId} onClose={() => setActiveMenuPostId(null)} title={t('options')}>
           {activeMenuPostId && posts.find(p => p.id === activeMenuPostId)?.userId === currentUser.id ? (<ActionItem icon={Icons.Close} label={t('deletePost')} destructive onClick={() => activeMenuPostId && deletePost(activeMenuPostId)} />) : (<ActionItem icon={Icons.Info} label={t('report')} destructive onClick={() => { setActiveMenuPostId(null); showToast("Reported", "info"); }} />)}
           <ActionItem icon={Icons.Share} label={t('copyLink')} onClick={() => { if (activeMenuPostId) { const post = posts.find(p => p.id === activeMenuPostId); if (post) contextValue.handleShare(post); } setActiveMenuPostId(null); }} />
           <ActionItem label={t('cancel')} onClick={() => setActiveMenuPostId(null)} />
        </BottomSheet>
      </Layout>
    </AppContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <MainApp />
    </SettingsProvider>
  );
};

export default App;
