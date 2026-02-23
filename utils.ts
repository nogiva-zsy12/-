export const formatCreatedTime = (createdAt?: string): string => {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export interface TimeRemaining {
  total: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isEmpty: boolean;
}

export const getTimeRemaining = (targetTime: string): TimeRemaining | null => {
  if (!targetTime || targetTime === '' || targetTime === '未定') {
    return null;
  }
  
  const now = new Date();
  if (isNaN(now.getTime())) return null;
  
  let target: Date;
  
  if (targetTime.includes('-') || targetTime.includes('/')) {
    target = new Date(targetTime);
  } else if (targetTime.includes(':')) {
    const today = new Date();
    const timeParts = targetTime.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    target = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    if (target < now) {
      target.setDate(target.getDate() + 1);
    }
  } else {
    target = new Date(targetTime);
  }
  
  if (isNaN(target.getTime())) return null;
  
  const total = target.getTime() - now.getTime();
  
  if (total <= 0) {
    return { total: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isEmpty: false };
  }
  
  const hours = Math.floor(total / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((total % (1000 * 60)) / 1000);
  
  return { total, hours, minutes, seconds, isExpired: false, isEmpty: false };
};

export const formatCountdown = (targetTime: string): string => {
  const remaining = getTimeRemaining(targetTime);
  
  if (!remaining || remaining.isEmpty) return '--:--';
  if (remaining.isExpired) return '0:00';
  
  const { hours, minutes, seconds } = remaining;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const getCountdown = (deadline: string): string => {
  if (!deadline || deadline === '') return '未设置';
  
  const remaining = getTimeRemaining(deadline);
  if (!remaining || remaining.isEmpty) return '未设置';
  if (remaining.isExpired) return '已过期';
  
  const { hours, minutes } = remaining;
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}天`;
  }
  
  if (hours > 0) {
    return `${hours}小时${minutes}分`;
  }
  
  return `${minutes}分钟`;
};

export const getRelativeTime = (createdAt?: string): string => {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

export const getFrequencyLabel = (frequency?: string): string => {
  if (!frequency || frequency === 'ONCE') return '';
  if (frequency === 'DAILY') return '每天';
  if (frequency === 'WEEKLY') return '每周';
  return '';
};
