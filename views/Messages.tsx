
import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../types';

interface MessagesViewProps {
  messages: Message[];
  onMarkRead?: () => void;
  onDelete?: (messageId: string) => void;
}

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'WARNING': return '警告';
    case 'SYSTEM': return '系统';
    case 'INSULT': return '提醒';
    default: return type;
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'WARNING': return 'text-orange-500';
    case 'SYSTEM': return 'text-blue-500';
    case 'INSULT': return 'text-red-500';
    default: return 'text-zinc-400';
  }
};

interface SwipeableMessageProps {
  message: Message;
  onDelete: (id: string) => void;
  children: React.ReactNode;
}

const SwipeableMessage: React.FC<SwipeableMessageProps> = ({ message, onDelete, children }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    startXRef.current = e.type === 'touchstart' 
      ? (e as React.TouchEvent).touches[0].clientX 
      : (e as React.MouseEvent).clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = e.type === 'touchmove' 
      ? (e as React.TouchEvent).touches[0].clientX 
      : (e as React.MouseEvent).clientX;
    const diff = startXRef.current - currentX;
    setOffsetX(Math.max(0, Math.min(diff, 80)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX > 60) {
      onDelete(message.id);
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div 
      ref={itemRef}
      className="relative overflow-hidden"
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center transition-opacity"
        style={{ opacity: offsetX > 10 ? 1 : 0 }}
      >
        <span className="material-icons-round text-white">delete</span>
      </div>
      <div 
        className="transition-transform duration-200"
        style={{ transform: `translateX(-${offsetX}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

const MessagesView: React.FC<MessagesViewProps> = ({ messages, onMarkRead, onDelete }) => {
  useEffect(() => {
    if (onMarkRead) {
      onMarkRead();
    }
  }, []);

  const handleDelete = (messageId: string) => {
    if (onDelete) {
      onDelete(messageId);
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-20 animate-in bg-zinc-50 dark:bg-zinc-950">
      <header className="px-6 pt-12 pb-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight dark:text-white">消息中心</h1>
            <p className="text-xs text-zinc-400 mt-2">Toxic Feed · {messages.length} 条</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300">
              Alerts
            </span>
            <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300">
              Roast
            </span>
          </div>
        </div>
      </header>
      <main className="px-6 space-y-3">
        {messages.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-icons-round text-5xl text-zinc-200 dark:text-zinc-700">notifications_none</span>
            <p className="text-sm text-zinc-400 mt-4">暂无消息</p>
          </div>
        ) : (
          messages.map((msg: Message) => (
            <SwipeableMessage key={msg.id} message={msg} onDelete={handleDelete}>
              <div 
                className={`p-4 rounded-2xl bg-white dark:bg-zinc-900 border ${
                  msg.isRead ? 'border-zinc-100 dark:border-zinc-800' : 'border-blue-200 dark:border-blue-800'
                } shadow-sm`}
              >
                <div className="flex items-center gap-2 mb-2 text-[10px] font-medium uppercase tracking-wider">
                  <span className={getTypeColor(msg.type)}>{getTypeLabel(msg.type)}</span>
                  <span className="text-zinc-300">·</span>
                  <span className="text-zinc-400">{msg.time}</span>
                  {!msg.isRead && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full ml-auto"></span>
                  )}
                </div>
                <h3 className="text-sm font-medium dark:text-white mb-1">{msg.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{msg.content}</p>
              </div>
            </SwipeableMessage>
          ))
        )}
      </main>
    </div>
  );
};

export default MessagesView;
