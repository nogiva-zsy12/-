
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
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 animate-in slide-in-from-right duration-300">
      <nav className="flex items-center justify-between px-4 py-4 sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl z-30 border-b border-zinc-100 dark:border-zinc-900">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h1 className="text-sm font-medium text-zinc-400">任务详情</h1>
        <button 
          onClick={() => { if(confirm('确定要删除这个任务吗？')) onDelete(); }}
          className="w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-red-500 transition-colors"
        >
          <span className="material-icons-round">delete_outline</span>
        </button>
      </nav>

      <main className="flex-1 px-6 pb-32">
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
             <span className={`px-2 py-1 text-[10px] font-medium rounded ${
               task.status === TaskStatus.COMPLETED 
                 ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                 : task.status === TaskStatus.EXPIRED
                   ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                   : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
             }`}>
               {task.status === TaskStatus.COMPLETED ? '已完成' : task.status === TaskStatus.EXPIRED ? '已过期' : '进行中'}
             </span>
          </div>
          <h2 className="text-2xl font-bold dark:text-white leading-tight">{task.title}</h2>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{task.description}</p>
          {task.createdAt && (
            <p className="mt-2 text-xs text-zinc-400">创建于: {formatCreatedTime(task.createdAt)}</p>
          )}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6">
          <div className="text-center mb-6">
            <div className={`text-5xl font-mono font-bold dark:text-white ${timeRemaining?.isExpired ? 'text-red-500' : ''}`}>
              {hasDeadline ? countdown : '未设置'}
            </div>
            {hasDeadline && timeRemaining && !timeRemaining.isExpired && timeRemaining.hours > 0 && (
              <p className="text-xs text-zinc-400 mt-2">
                剩余 {timeRemaining.hours}小时 {timeRemaining.minutes}分钟
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">完成进度</span>
              <span className="font-medium dark:text-white">{task.progress}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 border-l-4 border-blue-500">
            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-zinc-400">思考中...</span>
              </div>
            ) : (
              <p className="text-sm font-medium dark:text-zinc-200 leading-relaxed">
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
