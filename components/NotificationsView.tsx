
import React, { useContext } from 'react';
import { Icons } from './Icons';
import { AppContext } from '../App';
import { formatRelativeTime } from '../utils/dateUtils';
import { useSettings } from '../contexts/SettingsContext';

export const NotificationsView: React.FC = () => {
  const { notifications, users, posts, setCurrentView, setViewedPostId, setViewedProfileId, markNotificationsAsRead } = useContext(AppContext);
  const { t } = useSettings();

  // Mark as read when entering the screen
  React.useEffect(() => {
      markNotificationsAsRead();
  }, []);

  const handleNotificationClick = (notification: any) => {
      if (notification.type === 'follow') {
          setViewedProfileId(notification.fromUserId);
          setCurrentView('profile');
      } else if ((notification.type === 'like' || notification.type === 'comment') && notification.postId) {
          setViewedPostId(notification.postId);
          // Optional: we could navigate to post_detail directly or stay in notification logic
      }
  };

  const getNotificationIcon = (type: string) => {
      switch(type) {
          case 'like': return <div className="bg-red-500 p-1.5 rounded-full"><Icons.Activity className="w-3 h-3 text-white fill-current" /></div>;
          case 'comment': return <div className="bg-blue-500 p-1.5 rounded-full"><Icons.Comment className="w-3 h-3 text-white fill-current" /></div>;
          case 'follow': return <div className="bg-purple-500 p-1.5 rounded-full"><Icons.User className="w-3 h-3 text-white fill-current" /></div>;
          default: return <div className="bg-gray-500 p-1.5 rounded-full"><Icons.Info className="w-3 h-3 text-white" /></div>;
      }
  };

  return (
    <div className="bg-white dark:bg-black min-h-screen pb-20 animate-slide-up">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-10 border-b border-gray-100 dark:border-gray-800 p-4">
          <h1 className="text-xl font-bold dark:text-white flex items-center gap-2">
              <Icons.Bell className="w-6 h-6" />
              {t('notifications')}
          </h1>
      </div>

      <div className="p-4 space-y-4">
          {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <Icons.Bell className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-bold">لا توجد إشعارات جديدة</p>
                  <p className="text-xs text-gray-400">تفاعل مع الآخرين ليلاحظوك!</p>
              </div>
          ) : (
              notifications.map((notif) => {
                  const sender = users.find(u => u.id === notif.fromUserId);
                  const post = notif.postId ? posts.find(p => p.id === notif.postId) : null;
                  
                  // Safe fallback if sender not found (e.g. guest or deleted)
                  const senderName = sender?.username || "مستخدم";
                  const senderAvatar = sender?.avatarUrl || "https://ui-avatars.com/api/?name=User&background=random";

                  return (
                      <div 
                        key={notif.id} 
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex items-start gap-3 p-3 rounded-2xl transition-colors cursor-pointer ${notif.read ? 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900' : 'bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800'}`}
                      >
                          <div className="relative">
                              <img src={senderAvatar} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" alt="" />
                              <div className="absolute -bottom-1 -right-1 border-2 border-white dark:border-black rounded-full">
                                  {getNotificationIcon(notif.type)}
                              </div>
                          </div>
                          
                          <div className="flex-1">
                              <div className="text-sm dark:text-gray-200 leading-relaxed">
                                  <span className="font-bold dark:text-white mr-1">{senderName}</span>
                                  {notif.type === 'like' && "أعجب بمنشورك."}
                                  {notif.type === 'comment' && `علق: "${notif.text}"`}
                                  {notif.type === 'follow' && "بدأ بمتابعتك."}
                                  {notif.type === 'system' && notif.text}
                              </div>
                              <span className="text-[10px] text-gray-400 block mt-1">{formatRelativeTime(notif.timestamp, 'ar')}</span>
                          </div>

                          {post && (notif.type === 'like' || notif.type === 'comment') && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  <img src={post.images?.[0] || post.imageUrl} className="w-full h-full object-cover" alt="Post" />
                              </div>
                          )}
                          
                          {notif.type === 'follow' && (
                              <button className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                                  عرض
                              </button>
                          )}
                      </div>
                  );
              })
          )}
      </div>
    </div>
  );
};
