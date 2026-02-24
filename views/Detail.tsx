
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import { getToxicInsult } from '../services/geminiService';
import { getTimeRemaining, formatCountdown, formatCreatedTime } from '../utils';

interface DetailProps {
  task: Task;
  onBack: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

const Detail: React.FC<DetailProps> = ({ task, onBack, onComplete, onDelete }) => {
  const [insult, setInsult] = useState<string>('加载中...');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<string>('--:--');
  const [timeRemaining, setTimeRemaining] = useState<ReturnType<typeof getTimeRemaining>>(null);

  useEffect(() => {
    const fetchInsult = async () => {
      setLoading(true);
      try {
        const res = await getToxicInsult(task.title, `进度: ${task.progress}%, 时间: ${task.startTime}, 截止: ${task.deadline}`);
        setInsult(res);
      } catch {
        setInsult('AI教练暂时离线');
      } finally {
        setLoading(false);
      }
    };
    fetchInsult();
  }, [task]);

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = getTimeRemaining(task.deadline);
      if (remaining) {
        setTimeRemaining(remaining);
        setCountdown(formatCountdown(task.deadline));
      } else {
        setTimeRemaining(null);
        setCountdown('未设置');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [task.deadline]);

  const progressColor = useMemo(() => {
    if (!timeRemaining) return 'bg-blue-500';
    if (timeRemaining.isEmpty) return 'bg-blue-500';
    if (timeRemaining.isExpired) return 'bg-red-500';
    if (timeRemaining.hours < 1) return 'bg-red-500';
    if (timeRemaining.hours < 4) return 'bg-orange-500';
    return 'bg-blue-500';
  }, [timeRemaining]);

  const hasDeadline = task.deadline && task.deadline !== '' && task.deadline !== '未定';

  return (
    <div className="relative flex flex-col flex-1 bg-white/50 dark:bg-zinc-950/50 animate-in slide-in-from-right duration-300">
      {/* 装饰性背景 */}
      <div className="absolute top-0 left-0 right-0 h-48 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <nav className="relative flex items-center justify-between px-4 py-4 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-30 border-b border-zinc-100/50 dark:border-zinc-900/50">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition-colors rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h1 className="text-sm font-medium text-zinc-400">任务详情</h1>
        <button 
          onClick={() => { if(confirm('确定要删除这个任务吗？')) onDelete(); }}
          className="w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <span className="material-icons-round">delete_outline</span>
        </button>
      </nav>

      <main className="relative flex-1 px-6 pb-32">
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
             <span className={`px-3 py-1.5 text-[10px] font-semibold rounded-full ${
                task.status === TaskStatus.COMPLETED 
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-600 dark:text-green-400'
                  : task.status === TaskStatus.EXPIRED
                    ? 'bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-600 dark:text-red-400'
                    : 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400'
              }`}>
                {task.status === TaskStatus.COMPLETED ? '✓ 已完成' : task.status === TaskStatus.EXPIRED ? '⚠ 已过期' : '进行中'}
              </span>
              {task.frequency && task.frequency !== 'ONCE' && (
                <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-600 dark:text-cyan-400">
                  {task.frequency === 'DAILY' ? '每天' : '每周'}
                </span>
              )}
           </div>
           <h2 className="text-2xl font-bold dark:text-white leading-tight">{task.title}</h2>
           <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{task.description || '暂无描述'}</p>
           {task.createdAt && (
             <p className="mt-3 text-xs text-zinc-400 flex items-center gap-1">
               <span className="material-icons-round text-[12px]">schedule</span>
               创建于: {formatCreatedTime(task.createdAt)}
             </p>
           )}
        </div>

        <div className="relative bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 rounded-2xl p-6 border border-zinc-100/50 dark:border-zinc-800/50 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="text-center mb-6 relative">
            <div className={`relative inline-block text-5xl font-mono font-bold dark:text-white ${timeRemaining?.isExpired ? 'text-red-500' : ''}`}>
              {hasDeadline ? countdown : '--:--'}
            </div>
            {hasDeadline && timeRemaining && !timeRemaining.isExpired && timeRemaining.hours > 0 && (
              <p className="text-xs text-zinc-400 mt-2 flex items-center justify-center gap-1">
                <span className="material-icons-round text-[12px]">timer</span>
                剩余 {timeRemaining.hours}小时 {timeRemaining.minutes}分钟
              </p>
            )}
          </div>
          
          <div className="space-y-3 relative">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">完成进度</span>
              <span className="font-bold dark:text-white">{task.progress}%</span>
            </div>
            <div className="h-3 w-full bg-zinc-200/50 dark:bg-zinc-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 rounded-2xl p-5 border-l-4 border-gradient-to-b from-purple-500 to-pink-500 overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex items-center gap-2 mb-3 relative">
              <span className="text-[10px] font-semibold text-purple-500 uppercase tracking-wider">毒舌教练</span>
              <span className="text-zinc-300">·</span>
              <span className="text-xs text-zinc-400">AI 激励</span>
            </div>
            
            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-200"></span>
                </div>
                <span className="text-xs text-zinc-400">AI 正在思考...</span>
              </div>
            ) : (
              <p className="text-sm font-medium dark:text-zinc-200 leading-relaxed relative">
                {insult}
              </p>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-gradient-to-t from-white dark:from-zinc-950 via-white/95 to-transparent z-40">
          {task.status !== TaskStatus.COMPLETED && (
            <button 
              onClick={onComplete}
              className="w-full bg-black dark:bg-white text-white dark:text-black font-medium py-4 rounded-2xl shadow-lg hover:translate-y-[-2px] active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>完成任务</span>
              <span className="material-icons-round text-xl">check</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Detail;
