
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
    <div className="relative flex flex-col flex-1 pb-20 animate-in bg-zinc-50/50 dark:bg-zinc-950/50">
      {/* 装饰性背景 */}
      <div className="absolute top-0 left-0 right-0 h-40 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-pink-500/10 to-red-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <header className="relative px-6 pt-12 pb-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight dark:text-white">
              <span className="text-gradient">消息</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-2">共 {messages.length} 条消息</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-600 dark:text-amber-300">
              提醒
            </span>
            <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-600 dark:text-red-300">
              毒舌
            </span>
          </div>
        </div>
      </header>
      <main className="relative px-6 space-y-3">
        {messages.length === 0 ? (
          <div className="py-20 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-full blur-2xl"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center">
                <span className="material-icons-round text-4xl text-zinc-300 dark:text-zinc-600">notifications_none</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-1">暂无消息</p>
            <p className="text-xs text-zinc-300 dark:text-zinc-600">有新消息时会在这里显示</p>
          </div>
        ) : (
          messages.map((msg: Message) => (
            <SwipeableMessage key={msg.id} message={msg} onDelete={handleDelete}>
              <div 
                className={`relative p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border ${
                  msg.isRead ? 'border-zinc-100/50 dark:border-zinc-800/50' : 'border-purple-200/50 dark:border-purple-800/50'
                } shadow-sm group overflow-hidden`}
              >
                {/* 未读时显示渐变边框 */}
                {!msg.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-l-2xl"></div>
                )}
                
                <div className="flex items-center gap-2 mb-2 text-[10px] font-medium uppercase tracking-wider relative">
                  <span className={getTypeColor(msg.type)}>{getTypeLabel(msg.type)}</span>
                  <span className="text-zinc-300">·</span>
                  <span className="text-zinc-400">{msg.time}</span>
                  {!msg.isRead && (
                    <span className="w-2 h-2 bg-purple-500 rounded-full ml-auto animate-pulse"></span>
                  )}
                </div>
                <h3 className="text-sm font-semibold dark:text-white mb-1">{msg.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{msg.content}</p>
              </div>
            </SwipeableMessage>
          ))
        )}
      </main>
    </div>
  );
};

export default MessagesView;
