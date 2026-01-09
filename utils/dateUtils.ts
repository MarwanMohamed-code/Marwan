export const formatRelativeTime = (timestamp: number, lang: string = 'en'): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const isAr = lang === 'ar';

  if (seconds < 60) return isAr ? 'الآن' : 'Just now';
  if (minutes < 60) return isAr ? `منذ ${minutes} د` : `${minutes}m ago`;
  if (hours < 24) return isAr ? `منذ ${hours} س` : `${hours}h ago`;
  if (days < 7) return isAr ? `منذ ${days} ي` : `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString(isAr ? 'ar-EG' : 'en-US');
};